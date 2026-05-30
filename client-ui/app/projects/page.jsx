"use client";
import { useEffect, useState } from "react";
import EntityTable from "../components/EntityTable";
import { FaChartBar, FaProjectDiagram, FaUsers } from "react-icons/fa";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = "/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [clients, setClients] = useState([]);
  const [resources, setResources] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/projects`).then(res => res.json()).then(setProjects);
    fetch(`${API}/clients`).then(res => res.json()).then(setClients);
    fetch(`${API}/resources`).then(res => res.json()).then(data => {
      if (Array.isArray(data)) setResources(data);
      else if (Array.isArray(data.resources)) setResources(data.resources);
      else setResources([]);
    });
  }, []);

  async function handleAddProject(e) {
    e.preventDefault();
    const form = e.target;
    const clientName = form.client_name.value;
    const client = clients.find(c => c.name === clientName);
    const client_id = client ? client._id : null;
    const tech_stack = form.tech_stack.value.split(",").map(s => s.trim());
    const res = await fetch(`${API}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id,
        project_name: form.project_name.value,
        estimated_billing: Number(form.estimated_billing.value),
        required_resources: tech_stack,
      }),
    });
    const data = await res.json();
    setProjects(prev => [...prev, data.project]);
    form.reset();
    setShowAddForm(false);
  }

  async function handleEditProject(e) {
    e.preventDefault();
    const form = e.target;
    const id = editing._id;
    const clientName = form.client_name.value;
    const client = clients.find(c => c.name === clientName);
    const client_id = client ? client._id : null;
    const tech_stack = form.tech_stack.value.split(",").map(s => s.trim());
    const res = await fetch(`${API}/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: form.project_name.value,
        client_id,
        estimated_billing: Number(form.estimated_billing.value),
        required_resources: tech_stack,
      }),
    });
    const data = await res.json();
    setProjects(prev => prev.map(p => (p._id === id ? data.project : p)));
    setEditing(null);
  }

  async function handleDeleteProject(id) {
    await fetch(`${API}/projects/${id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p._id !== id));
  }

  // Enhanced: Add client name, resource names, formatted date
  const projectsWithClientAndResources = projects.map(p => {
    const client = clients.find(c => c._id === p.client_id);

    let matchedResources = [];
    if (Array.isArray(p.resource_ids) && p.resource_ids.length > 0) {
      matchedResources = resources.filter(r => p.resource_ids.includes(r._id));
    } else {
      matchedResources = resources.filter(r =>
        Array.isArray(p.required_resources) &&
        Array.isArray(r.tech_stack) &&
        p.required_resources.some(req =>
          r.tech_stack.map(ts => ts.toLowerCase()).includes(req.toLowerCase())
        )
      );
    }

    return {
      ...p,
      client_name: client ? client.name : "Unknown",
      required_resources: Array.isArray(p.required_resources) ? p.required_resources.join(", ") : "",
      resource_names: matchedResources.map(r => r.name).join(", "),
      estimated_billing: p.estimated_billing ? `₹${p.estimated_billing.toLocaleString()}` : "",
      created_at: p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
    };
  });

  // Statistics
  const totalProjects = projects.length;
  const totalClients = clients.length;
  const totalResources = resources.length;
  const totalBilling = projects.reduce((sum, p) => sum + (p.estimated_billing || 0), 0);

  // Chart data: projects added per month (last 6 months)
  function getMonthlyCounts(items) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const count = items.filter(item => {
        if (!item.created_at) return false;
        const created = new Date(item.created_at);
        return created.getMonth() === d.getMonth() && created.getFullYear() === year;
      }).length;
      data.push({ month: `${month} ${year}`, count });
    }
    return data;
  }

  // Chart data: billing per month (last 6 months)
  function getMonthlyBilling(items) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const billing = items
        .filter(item => {
          if (!item.created_at) return false;
          const created = new Date(item.created_at);
          return created.getMonth() === d.getMonth() && created.getFullYear() === year;
        })
        .reduce((sum, p) => sum + (p.estimated_billing || 0), 0);
      data.push({ month: `${month} ${year}`, billing });
    }
    return data;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Statistics */}
      <div className="flex flex-wrap gap-6 mb-10">
        <StatCard icon={<FaProjectDiagram className="text-red-800" />} label="Total Projects" value={totalProjects} />
        <StatCard icon={<FaUsers className="text-cyan-700" />} label="Clients" value={totalClients} />
        <StatCard icon={<FaUsers className="text-green-700" />} label="Resources" value={totalResources} />
        <StatCard icon={<FaChartBar className="text-yellow-500" />} label="Total Billing" value={`₹${totalBilling.toLocaleString()}`} />
      </div>
      {/* Growth & Billing Charts */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2 mb-4">
          <FaChartBar /> Projects Growth & Billing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black rounded-xl shadow p-4">
            <div className="font-semibold mb-2 text-gray-200">Projects Growth</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={getMonthlyCounts(projects)} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis width={40} tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#ef4444"
                  fill="url(#colorProjects)"
                  fillOpacity={0.7}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-400 mt-2">Projects added (last 6 months)</div>
          </div>
          <div className="bg-black rounded-xl shadow p-4">
            <div className="font-semibold mb-2 text-gray-200">Billing Trend</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={getMonthlyBilling(projects)} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis
                  width={60}
                  tickFormatter={v => `₹${v.toLocaleString()}`}
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: "Money (₹)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#aaa",
                    fontSize: 12,
                    dx: -10
                  }}
                />
                <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                <Area
                  type="monotone"
                  dataKey="billing"
                  stroke="#fbbf24"
                  fill="url(#colorBilling)"
                  fillOpacity={0.7}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-400 mt-2">Billing (last 6 months)</div>
          </div>
        </div>
      </section>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-red-800 tracking-tight">Projects</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2 rounded-lg bg-black border border-red-800 hover:bg-red-800 text-white font-semibold shadow transition"
        >
          Add Project
        </button>
      </div>
      {/* Add Project Popup */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowAddForm(false)}>
          <div
            className="relative bg-white/10 p-8 rounded-xl shadow-lg max-w-xl w-full border border-red-100"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl"
              aria-label="Close"
            >
              &times;
            </button>
            <form
              onSubmit={handleAddProject}
              className="flex flex-col gap-5"
            >
              <h2 className="text-xl font-semibold text-red-800 mb-2">Add Project</h2>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Project Name</label>
                <input
                  name="project_name"
                  placeholder="Project Name"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Client</label>
                <select
                  name="client_name"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Estimated Billing</label>
                <input
                  name="estimated_billing"
                  placeholder="Estimated Billing"
                  type="number"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Required Tech Stack</label>
                <input
                  name="tech_stack"
                  placeholder="Required Resources (comma separated)"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold shadow transition"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white/5 rounded-xl shadow-lg p-4 border border-red-100 overflow-x-auto">
        <EntityTable
          data={projectsWithClientAndResources}
          columns={[
            { key: "project_name", label: "Project Name" },
            { key: "client_name", label: "Client Name" },
            { key: "estimated_billing", label: "Estimated Billing (Total Salary)" },
            { key: "required_resources", label: "Required Tech Stack" },
            { key: "resource_names", label: "Resources Assigned" },
            { key: "created_at", label: "Created At" }
          ]}
          onEdit={row => setEditing(row)}
          onDelete={handleDeleteProject}
          striped
          highlightOnHover
          className="min-w-full"
        />
      </div>
      {editing && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setEditing(null)}
        >
          <div
            className="relative bg-white/10 p-8 rounded-xl shadow-lg max-w-xl w-full border border-red-100"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setEditing(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl"
              aria-label="Close"
            >
              &times;
            </button>
            <form onSubmit={handleEditProject} className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Edit Project</h2>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Project Name</label>
                <input
                  name="project_name"
                  defaultValue={editing.project_name}
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Client</label>
                <select
                  name="client_name"
                  defaultValue={
                    clients.find(c => c._id === editing.client_id)?.name || ""
                  }
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Estimated Billing</label>
                <input
                  name="estimated_billing"
                  defaultValue={editing.estimated_billing}
                  type="number"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Required Tech Stack</label>
                <input
                  name="tech_stack"
                  defaultValue={
                    Array.isArray(editing.required_resources)
                      ? editing.required_resources.join(", ")
                      : editing.required_resources
                  }
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg  text-green-400 font-semibold shadow transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg  hover:text-red-700 text-gray-200 font-semibold shadow transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// StatCard component for statistics
function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-lg border border-gray-900 text-white font-semibold shadow min-w-[160px]">
      <span className="text-2xl">{icon}</span>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xl font-bold">{value}</span>
      </div>
    </div>
  );
}
