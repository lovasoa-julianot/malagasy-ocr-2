import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { admin, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div data-theme="light" className="min-h-screen bg-slate-50/90 text-slate-900 font-sans antialiased">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <AdminSidebar
        sidebarOpen={sidebarOpen}
        onClose={closeSidebar}
        onLogout={logout}
      />

      <main className="lg:pl-72">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="workspace-content p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
