"use client";
import Link from "next/link";
import { useState } from "react";
import { FaChartBar, FaUsers, FaProjectDiagram, FaUserTie, FaBars, FaTimes } from "react-icons/fa";
import "./globals.css";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body className="bg-black text-gray-200 min-h-screen">
        <div className="flex flex-col md:flex-row">
          {/* Mobile Sidebar Toggle */}
          <button
            className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black text-white rounded-lg hover:bg-red-600 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Sidebar */}
          <aside
            className={`fixed top-0 left-0 h-full w-64 bg-black transform ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 transition-transform duration-300 ease-in-out z-40 shadow-lg`}
          >
            <div className="p-6">
              
              <nav className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 text-gray-200 hover:text-red-500 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaChartBar size={20} />
                  Dashboard
                </Link>
                <Link
                  href="/clients"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 text-gray-200 hover:text-red-500 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaUsers size={20} />
                  Clients
                </Link>
                <Link
                  href="/projects"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 text-gray-200 hover:text-red-500 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaProjectDiagram size={20} />
                  Projects
                </Link>
                <Link
                  href="/resources"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 text-gray-200 hover:text-red-500 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <FaUserTie size={20} />
                  Resources
                </Link>
              </nav>
            </div>
          </aside>

          {/* Overlay for mobile when sidebar is open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 md:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 md:ml-64 mt-16 md:mt-0">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}