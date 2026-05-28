export default function AnalyticsCards({ totalClients, activeClients, totalProjects, totalResources, totalBilling }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-black border border-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="text-3xl font-bold text-red-800">{totalClients}</div>
        <div className="text-gray-300 mt-1">Total Clients</div>
        <div className="text-green-400 mt-2 text-sm">{activeClients} Active</div>
      </div>
      <div className="bg-black border border-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="text-3xl font-bold text-red-800">{totalProjects}</div>
        <div className="text-gray-300 mt-1">Total Projects</div>
        <div className="text-yellow-400 mt-2 text-sm">Billing: ₹{totalBilling.toLocaleString()}</div>
      </div>
      <div className="bg-black border border-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="text-3xl font-bold text-red-800">{totalResources}</div>
        <div className="text-gray-300 mt-1">Total Resources</div>
      </div>
    </div>
  );
}