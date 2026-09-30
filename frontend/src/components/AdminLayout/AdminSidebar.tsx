import type { ElementType } from "react";
import {
  LayoutDashboard,
  MapPinned,
  Users,
  UserCheck,
  ClipboardList,
  BarChart3,
  ShieldAlert,
  ShieldCheck,
  FileSearch,
  UserCircle,
  Settings,
  LogOut,
  X,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface MenuItem {
  to: string;
  label: string;
  icon: ElementType;
  badge?: string;
}

export default function AdminSidebar({
  sidebarOpen,
  onClose,
  onLogout,
}: AdminSidebarProps) {
  const dashboardItem: MenuItem = {
    to: "/admin/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  };

  const managementItems: MenuItem[] = [
    {
      to: "/admin/territoires",
      label: "Découpage territorial",
      icon: MapPinned,
    },
    {
      to: "/admin/demandes-chef",
      label: "Demandes Chefs Fokontany",
      icon: UserCheck,
    },
    {
      to: "/admin/agents",
      label: "Gestion des agents",
      icon: Users,
    },
    {
      to: "/admin/recensements",
      label: "Fiches de recensement",
      icon: ClipboardList,
    },
    {
      to: "/admin/statistiques",
      label: "Statistiques & KPIs",
      icon: BarChart3,
    },
    {
      to: "/admin/controle",
      label: "Contrôle qualité & OCR",
      icon: ShieldAlert,
    },
  ];

  const systemItems: MenuItem[] = [
    {
      to: "/admin/audit",
      label: "Journal d'audit",
      icon: FileSearch,
    },
    {
      to: "/admin/profil",
      label: "Profil administrateur",
      icon: UserCircle,
    },
    {
      to: "/admin/parametres",
      label: "Paramètres globaux",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex w-72 flex-col
        border-r border-slate-200/90
        bg-white
        shadow-xl shadow-slate-200/50
        transition-transform duration-300
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/90 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-700/20">
            <ShieldCheck size={22} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                RECENSEMENT
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Administration Centrale
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-slate-700 lg:hidden"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Profil rapide de l'administrateur */}
      <div className="border-b border-slate-200/70 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
            AD
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-bold text-slate-900">
                Admin DGAT
              </p>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            </div>
            <p className="truncate text-[10px] font-medium text-slate-500">
              Ministère de l'Intérieur
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
        {/* Vue principale */}
        <div>
          <NavLink
            to={dashboardItem.to}
            onClick={onClose}
            end
            className={({ isActive }) =>
              `
              group flex w-full items-center justify-between
              rounded-xl px-3.5 py-2.5
              text-xs font-semibold
              transition-all duration-150
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-700/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }
            `
            }
          >
            <div className="flex items-center gap-3">
              <dashboardItem.icon size={17} />
              <span>{dashboardItem.label}</span>
            </div>
            <ChevronRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        </div>

        {/* Section Gestion */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Gouvernance & Opérations
          </p>

          <div className="space-y-1">
            {managementItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  end
                  className={({ isActive }) =>
                    `
                      group flex w-full items-center justify-between
                      rounded-xl px-3.5 py-2.5
                      text-xs font-semibold
                      transition-all duration-150
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Section Système */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Système & Sécurité
          </p>

          <div className="space-y-1">
            {systemItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  end
                  className={({ isActive }) =>
                    `
                      group flex w-full items-center justify-between
                      rounded-xl px-3.5 py-2.5
                      text-xs font-semibold
                      transition-all duration-150
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-800 border border-blue-200/80 shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Déconnexion */}
      <div className="shrink-0 border-t border-slate-200/80 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut size={16} />
          <span>Déconnexion sécurisée</span>
        </button>
      </div>
    </aside>
  );
}
