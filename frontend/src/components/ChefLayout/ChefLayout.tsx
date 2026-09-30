import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Key,
  BookOpen,
  LogOut,
  Menu,
  X,
  MapPin,
  Shield,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ChefLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { chef, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      to: "/chef-fokontany/dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
    },
    {
      to: "/chef-fokontany/citoyens",
      label: "Registre des résidents",
      icon: BookOpen,
    },
    {
      to: "/chef-fokontany/recensements",
      label: "Fiches de recensement",
      icon: FileCheck2,
    },
    {
      to: "/chef-fokontany/agents",
      label: "Mes agents recenseurs",
      icon: Users,
    },
    {
      to: "/chef-fokontany/code-acces",
      label: "Code d'accès & QR",
      icon: Key,
    },
    {
      to: "/chef-fokontany/profil",
      label: "Mon Fokontany & Profil",
      icon: Shield,
    },
  ];

  const todayStr = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const fokontanyCode = chef?.code_fokontany || chef?.fokontany_code || "—";
  const fokontanyNom = chef?.nom_fokontany || chef?.fokontany_nom || "Fokontany";

  return (
    <div data-theme="light" className="min-h-screen bg-slate-50/90 text-slate-900 flex font-sans antialiased">
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Chef Fokontany */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header de la sidebar */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/90 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-700/20">
              <MapPin size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900">
                  CHEF FOKONTANY
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Autorité Territoriale
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-slate-700 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Badge Fokontany Actuel */}
        <div className="border-b border-slate-200/80 p-4">
          <div className="rounded-2xl bg-blue-50/70 border border-blue-200/80 p-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-blue-800 text-[11px] bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-300/40">
                {fokontanyCode}
              </span>
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                Fokontany Officiel
              </span>
            </div>
            <p className="mt-2 font-bold text-sm text-slate-900 truncate">
              {fokontanyNom}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {chef?.commune || "Fianarantsoa"} • {chef?.region || "Haute Matsiatra"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                end={item.to === "/chef-fokontany/dashboard"}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-700/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className="shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" />
              </NavLink>
            );
          })}
        </nav>

        {/* Profil du chef & Déconnexion */}
        <div className="shrink-0 border-t border-slate-200/80 p-4 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200">
              {chef?.nom?.charAt(0) || "C"}
              {chef?.prenoms?.charAt(0) || "F"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">
                {chef?.nom || "Chef"} {chef?.prenoms || "Fokontany"}
              </p>
              <p className="truncate text-[10px] text-slate-500">
                {chef?.email || "chef.fokontany@mg.gov"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Zone Principale */}
      <div className="flex flex-1 flex-col lg:pl-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="btn btn-ghost btn-sm btn-square text-slate-600 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Fokontany {fokontanyNom}
                </p>
              </div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                Registre Communal & Recensement
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date du jour */}
            <div className="hidden md:flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-600">
              <Calendar size={14} className="text-slate-400" />
              <span className="capitalize">{todayStr}</span>
            </div>

            <NavLink
              to="/chef-fokontany/code-acces"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              <Key size={14} className="text-blue-600" />
              <span>Codes d'accès Agents</span>
            </NavLink>

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                {chef?.nom?.charAt(0) || "C"}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-bold text-slate-900 leading-tight">
                  {chef?.nom || "Chef Fokontany"}
                </p>
                <p className="font-mono text-[10px] text-slate-500">{fokontanyCode}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="workspace-content flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
