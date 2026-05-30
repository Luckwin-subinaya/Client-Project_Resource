"use client";
import { useEffect, useState } from "react";
import EntityTable from "../components/EntityTable";
import { FaChartBar, FaUsers, FaProjectDiagram } from "react-icons/fa";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = "/api";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/clients`).then(res => res.json()).then(setClients);
    fetch(`${API}/projects`).then(res => res.json()).then(setProjects);
  }, []);

  async function handleAddClient(e) {
    e.preventDefault();
    const form = e.target;
    const res = await fetch(`${API}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.value,
        location: form.location.value,
        type: form.type.value,
      }),
    });
    const data = await res.json();
    setClients(prev => [...prev, data.client]);
    form.reset();
    setShowAddForm(false);
  }

  async function handleEditClient(e) {
    e.preventDefault();
    const form = e.target;
    const id = editing._id;
    const res = await fetch(`${API}/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.value,
        location: form.location.value,
        type: form.type.value,
        status: form.status.value,
      }),
    });
    const data = await res.json();
    setClients(prev => prev.map(c => (c._id === id ? data.client : c)));
    setEditing(null);
  }

  async function handleDeleteClient(id) {
    await fetch(`${API}/clients/${id}`, { method: "DELETE" });
    setClients(prev => prev.filter(c => c._id !== id));
  }

  // Enhanced: Add project names and formatted date
  const clientsWithProjects = clients.map(client => {
    const clientProjects = projects.filter(p => p.client_id === client._id);
    return {
      ...client,
      num_projects: clientProjects.length,
      project_names: clientProjects.map(p => p.project_name).join(", "),
      created_at: client.created_at
        ? new Date(client.created_at).toLocaleDateString()
        : "",
      status: client.status === "active"
        ? <span className="inline-block px-2 py-1 rounded  text-green-300 text-xs font-semibold">Active</span>
        : <span className="inline-block px-2 py-1 rounded  text-gray-300 text-xs font-semibold">Inactive</span>
    };
  });

  // Statistics
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const totalProjects = projects.length;

  // Chart data: clients added per month (last 6 months)
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Statistics */}
      <div className="flex flex-wrap gap-6 mb-10">
        <StatCard icon={<FaUsers className="text-red-800" />} label="Total Clients" value={totalClients} />
        <StatCard icon={<FaUsers className="text-green-700" />} label="Active Clients" value={activeClients} />
        <StatCard icon={<FaProjectDiagram className="text-cyan-600" />} label="Total Projects" value={totalProjects} />
      </div>
      {/* Growth Chart */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2 mb-4">
          <FaChartBar /> Clients Growth
        </h2>
        <div className="bg-black rounded-xl shadow p-4">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={getMonthlyCounts(clients)} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorClients)"
                fillOpacity={0.7}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-xs text-gray-400 mt-2">Clients added (last 6 months)</div>
        </div>
      </section>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-red-800 tracking-tight">
          Clients
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2 rounded-lg bg-black border border-red-800 hover:bg-red-800 text-white font-semibold shadow transition"
        >
          Add Client
        </button>
      </div>
      {/* Add Client Popup */}
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
              onSubmit={handleAddClient}
              className="flex flex-col gap-5"
            >
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Add Client
              </h2>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Name</label>
                <input
                  name="name"
                  placeholder="Client Name"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Location</label>
                <input
                  name="location"
                  placeholder="Location"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Type</label>
                <input
                  name="type"
                  placeholder="Type"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold shadow transition"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white/5 rounded-xl shadow-lg p-4 border border-red-100 overflow-x-auto">
        <EntityTable
          data={clientsWithProjects}
          columns={[
            { key: "name", label: "Name" },
            { key: "location", label: "Location" },
            { key: "type", label: "Type" },
            { key: "project_names", label: "Projects" },
            { key: "num_projects", label: "No. of Projects" },
            { key: "status", label: "Status" },
            { key: "created_at", label: "Created At" }
          ]}
          onEdit={row => setEditing(row)}
          onDelete={handleDeleteClient}
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
            <form onSubmit={handleEditClient} className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Edit Client
              </h2>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Name</label>
                <input
                  name="name"
                  defaultValue={editing.name}
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Location</label>
                <input
                  name="location"
                  defaultValue={editing.location}
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Type</label>
                <input
                  name="type"
                  defaultValue={editing.type}
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Status</label>
                <select
                  name="status"
                  defaultValue={editing.status}
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-red-700 text-white font-semibold shadow transition"
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
