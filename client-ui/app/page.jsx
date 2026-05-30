"use client";
import { useEffect, useState } from "react";
import AnalyticsCards from "./components/AnalyticsCards";
import {
  FaChartBar,
  FaUsers,
  FaProjectDiagram,
  FaUserTie,
  FaMoneyBillWave,
  FaClock,
} from "react-icons/fa";
import { AreaChart, Area, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, YAxis } from "recharts";

const API = "/api";

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetch(`${API}/clients`).then(res => res.json()).then(setClients);
    fetch(`${API}/projects`).then(res => res.json()).then(setProjects);
    fetch(`${API}/resources`).then(res => res.json()).then(setResources);
  }, []);

  const activeClients = clients.filter(c => c.status === "active").length;
  const totalBilling = projects.reduce((sum, p) => sum + (p.estimated_billing || 0), 0);

  // Get recent activities (last 5 of each, sorted by created_at)
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(c => ({
      type: "Client",
      name: c.name,
      date: c.created_at,
      extra: c.location,
    }));

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(p => ({
      type: "Project",
      name: p.project_name,
      date: p.created_at,
      extra: `Billing: ₹${p.estimated_billing}`,
    }));

  const recentResources = [...resources]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
    .map(r => ({
      type: "Resource",
      name: r.name,
      date: r.created_at,
      extra: r.designation,
    }));

  // Combine and sort all activities
  const recentActivities = [...recentClients, ...recentProjects, ...recentResources]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  // Helper to get monthly counts for a given array of items with a `created_at` field
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

  // Billing trend for chart
  function getMonthlyBilling(projects) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const billing = projects
        .filter(p => {
          if (!p.created_at) return false;
          const created = new Date(p.created_at);
          return created.getMonth() === d.getMonth() && created.getFullYear() === year;
        })
        .reduce((sum, p) => sum + (p.estimated_billing || 0), 0);
      data.push({ month: `${month} ${year}`, billing });
    }
    return data;
  }

  return (
    <div className="max-w-6xl mx-auto px-2">
      <header className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-4">
          <FaChartBar className="text-5xl text-red-800" />
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
             Client-Project-Resource
            </h1>
            
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <StatCard icon={<FaUsers className="text-red-900" />} label="Clients" value={clients.length} />
          <StatCard icon={<FaProjectDiagram className="text-red-800" />} label="Projects" value={projects.length} />
          <StatCard icon={<FaUserTie className="text-red-800" />} label="Resources" value={resources.length} />
          <StatCard icon={<FaMoneyBillWave className="text-red-800" />} label="Billing" value={`₹${totalBilling.toLocaleString()}`} />
        </div>
      </header>
      <section className="mb-10">
        <AnalyticsCards
          totalClients={clients.length}
          activeClients={activeClients}
          totalProjects={projects.length}
          totalResources={resources.length}
          totalBilling={totalBilling}
        />
      </section>
      {/* Growth Overview Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2 mb-4">
          <FaChartBar /> Growth Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <GrowthAreaChart
            title="Clients Growth"
            data={getMonthlyCounts(clients)}
            color="#ef4444"
            yLabel="Clients"
          />
          <GrowthAreaChart
            title="Projects Growth"
            data={getMonthlyCounts(projects)}
            color="#22d3ee"
            yLabel="Projects"
          />
          <BillingAreaChart
            title="Billing "
            data={getMonthlyBilling(projects)}
            color="#fbbf24"
            yLabel="Billing"
          />
        </div>
      </section>
      {/* Recent Activities Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-red-700 flex items-center gap-2 mb-4">
          <FaClock /> Recent Activities
        </h2>
        <div className="bg-black rounded-xl shadow p-4">
          {recentActivities.length === 0 && (
            <div className="text-gray-400">No recent activities.</div>
          )}
          <ul className="divide-y divide-gray-800">
            {recentActivities.map((activity, idx) => (
              <li key={idx} className="py-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-100 flex items-center gap-2">
                    {activity.name}
                  </div>
                  <div className="text-gray-400 text-sm">{activity.extra}</div>
                </div>
                <span className="text-gray-500 text-xs ml-4 whitespace-nowrap">
                  {activity.date ? new Date(activity.date).toLocaleString() : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

// StatCard for header stats
function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black border border-gray-800 text-white font-semibold shadow min-w-[120px]">
      {icon}
      <div className="flex flex-col">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-lg font-bold">{value}</span>
      </div>
    </div>
  );
}

// GrowthAreaChart for clients/projects
function GrowthAreaChart({ title, data, color, yLabel }) {
  return (
    <div className="bg-black rounded-xl shadow p-4 flex-1 min-w-[220px]">
      <div className="font-semibold mb-2 text-gray-200">{title}</div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id={`color${title}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.85} />
              <stop offset="60%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#888", fontSize: 12 }} />
          <YAxis width={30} tick={{ fill: "#888", fontSize: 12 }} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            fill={`url(#color${title})`}
            fillOpacity={1}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-400 mt-2">{yLabel} (last 6 months)</div>
    </div>
  );
}

// BillingAreaChart for billing trend
function BillingAreaChart({ title, data, color, yLabel }) {
  return (
    <div className="bg-black rounded-xl shadow p-4 flex-1 min-w-[220px]">
      <div className="font-semibold mb-2 text-gray-200">{title}</div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id={`color${title}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.85} />
              <stop offset="60%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#888", fontSize: 12 }} />
          <YAxis
            width={60}
            tickFormatter={v => ` ₹${v.toLocaleString()}`}
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
            stroke={color}
            fill={`url(#color${title})`}
            fillOpacity={1}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-400 mt-2">{yLabel} (last 6 months)</div>
    </div>
  );
}
