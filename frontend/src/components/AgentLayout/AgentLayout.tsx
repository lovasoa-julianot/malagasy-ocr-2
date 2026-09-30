import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import AgentSidebar from "./AgentSidebar";
import AgentHeader from "./AgentHeader";
import { useAuth } from "../../context/AuthContext";

export default function AgentLayout() {
  const { agent, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!agent) {
    return <Navigate to="/login" replace />;
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div data-theme="light" className="min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <AgentSidebar
        agent={agent}
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        onLogout={logout}
      />

      <main className="lg:pl-72 flex flex-col min-h-screen">
        <AgentHeader agent={agent} onMenuClick={() => setSidebarOpen(true)} />

        <div className="workspace-content flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
