"use client";
import { useEffect, useState } from "react";
import EntityTable from "../components/EntityTable";
import { FaUsers, FaProjectDiagram, FaChartBar } from "react-icons/fa";

const API = "/api";

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/resources`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setResources(data);
        else if (Array.isArray(data.resources)) setResources(data.resources);
        else setResources([]);
      })
      .catch(() => setResources([]));

    fetch(`${API}/projects`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
        else if (Array.isArray(data.projects)) setProjects(data.projects);
        else setProjects([]);
      })
      .catch(() => setProjects([]));
  }, []);

  // Statistics
  const totalResources = resources.length;
  const activeResources = resources.filter(r => r.status === "active").length;
  const totalProjects = projects.length;
  const totalSalary = resources.reduce((sum, r) => sum + (r.salary || 0), 0);

  // Helper: Get projects matching tech stack
  function getMatchedProjectNames(tech_stack, projects) {
    return projects
      .filter(p =>
        Array.isArray(p.required_resources) &&
        Array.isArray(tech_stack) &&
        p.required_resources.some(req =>
          tech_stack.map(ts => ts.toLowerCase()).includes(req.toLowerCase())
        )
      )
      .map(p => p.project_name);
  }

  async function handleAddResource(e) {
    e.preventDefault();
    const form = e.target;
    const tech_stack = form.tech_stack.value.split(",").map(s => s.trim());
    const project_names = getMatchedProjectNames(tech_stack, projects);

    const resource = {
      name: form.name.value,
      tech_stack,
      department: form.department.value,
      designation: form.designation.value,
      salary: Number(form.salary.value),
      experience: form.experience.value,
      status: form.status.value,
      project_names,
    };
    const res = await fetch(`${API}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resource),
    });
    const data = await res.json();
    setResources(prev => [...prev, data.resource]);
    form.reset();
    setShowAddForm(false);
  }

  async function handleEditResource(e) {
    e.preventDefault();
    const form = e.target;
    const id = editing._id;
    const tech_stack = form.tech_stack.value.split(",").map(s => s.trim());
    const project_names = getMatchedProjectNames(tech_stack, projects);

    const resource = {
      name: form.name.value,
      tech_stack,
      department: form.department.value,
      designation: form.designation.value,
      salary: Number(form.salary.value),
      experience: form.experience.value,
      status: form.status.value,
      project_names,
    };
    const res = await fetch(`${API}/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resource),
    });
    const data = await res.json();
    setResources(prev => prev.map(r => (r._id === id ? data.resource : r)));
    setEditing(null);
  }

  async function handleDeleteResource(id) {
    await fetch(`${API}/resources/${id}`, { method: "DELETE" });
    setResources(prev => prev.filter(r => r._id !== id));
  }

  const resourcesWithProjectNames = resources.map(r => {
    const matchedProjects = projects.filter(p =>
      Array.isArray(p.required_resources) &&
      Array.isArray(r.tech_stack) &&
      p.required_resources.some(req =>
        r.tech_stack.map(ts => ts.toLowerCase()).includes(req.toLowerCase())
      )
    );
    const projectNames = matchedProjects.map(p => p.project_name).join(", ");

    return {
      ...r,
      tech_stack: Array.isArray(r.tech_stack) ? r.tech_stack.join(", ") : "",
      project_names: projectNames,
      experience: r.experience,
      status: r.status === "active"
        ? <span className="inline-block px-2 py-1 rounded text-green-300 text-xs font-semibold">Active</span>
        : <span className="inline-block px-2 py-1 rounded text-gray-300 text-xs font-semibold">Inactive</span>
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Statistics */}
      <div className="flex flex-wrap gap-6 mb-10">
        <StatCard icon={<FaUsers className="text-red-800" />} label="Total Resources" value={totalResources} />
        <StatCard icon={<FaUsers className="text-green-700" />} label="Active Resources" value={activeResources} />
        <StatCard icon={<FaProjectDiagram className="text-cyan-600" />} label="Projects" value={totalProjects} />
        <StatCard icon={<FaChartBar className="text-yellow-500" />} label="Total Salary" value={`₹${totalSalary.toLocaleString()}`} />
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-red-800 tracking-tight">Resources</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-5 py-2 rounded-lg bg-black border border-red-800 hover:bg-red-800 text-white font-semibold shadow transition"
        >
          Add Resource
        </button>
      </div>
      {/* Add Resource Popup */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddForm(false)}>
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
              onSubmit={handleAddResource}
              className="flex flex-col gap-5"
            >
              <h2 className="text-xl font-semibold text-red-800 mb-2">Add Resource</h2>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Name</label>
                <input
                  name="name"
                  placeholder="Name"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Tech Stack</label>
                <input
                  name="tech_stack"
                  placeholder="Tech Stack (comma separated)"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Department</label>
                <input
                  name="department"
                  placeholder="Department"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Designation</label>
                <input
                  name="designation"
                  placeholder="Designation"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Experience (years)</label>
                <input
                  name="experience"
                  placeholder="Experience"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Salary</label>
                <input
                  name="salary"
                  placeholder="Salary"
                  type="number"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Status</label>
                <select
                  name="status"
                  defaultValue="active"
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold shadow transition"
                >
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="bg-white/5 rounded-xl shadow-lg p-4 border border-red-100 overflow-x-auto">
        <div className="w-full">
          <EntityTable
            data={resourcesWithProjectNames}
            columns={[
              { key: "name", label: "Name", align: "left" },
              { key: "tech_stack", label: "Tech Stack", align: "left" },
              { key: "department", label: "Department", align: "left" },
              { key: "designation", label: "Designation", align: "left" },
              { key: "experience", label: "Experience (years)", align: "center" },
              { key: "salary", label: "Salary", align: "right" },
              { key: "project_names", label: "Projects", align: "left" },
              { key: "status", label: "Status", align: "center" }
            ]}
            onEdit={row => setEditing(row)}
            onDelete={handleDeleteResource}
            striped
            highlightOnHover
            className="min-w-full"
            headerClassName="text-xs font-bold uppercase text-gray-400 bg-black"
            cellClassName="align-middle py-2 px-3"
          />
        </div>
      </div>
      {editing && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
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
            <form onSubmit={handleEditResource} className="flex flex-col gap-5">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Edit Resource</h2>
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
                <label className="text-sm text-gray-300 font-medium">Tech Stack</label>
                <input
                  name="tech_stack"
                  defaultValue={Array.isArray(editing.tech_stack) ? editing.tech_stack.join(", ") : editing.tech_stack}
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Department</label>
                <input
                  name="department"
                  defaultValue={editing.department}
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Designation</label>
                <input
                  name="designation"
                  defaultValue={editing.designation}
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Experience (years)</label>
                <input
                  name="experience"
                  defaultValue={editing.experience}
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  className="bg-black border border-gray-600 text-gray-200 p-2 rounded-lg focus:border-red-500 focus:ring focus:ring-red-500/20 transition"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300 font-medium">Salary</label>
                <input
                  name="salary"
                  defaultValue={editing.salary}
                  type="number"
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
