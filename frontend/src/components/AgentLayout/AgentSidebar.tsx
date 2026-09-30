import {
  LayoutDashboard,
  FilePlus2,
  History,
  LogOut,
  MapPin,
  UserRound,
  X,
  ScanLine,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import type { Agent } from "../../types/agent";

interface AgentSidebarProps {
  agent: Agent;
  sidebarOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function AgentSidebar({
  agent,
  sidebarOpen,
  onClose,
  onLogout,
}: AgentSidebarProps) {
  const menuItems = [
    {
      to: "/agent/dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
    },
    {
      to: "/agent/nouveau",
      label: "Nouveau recensement",
      icon: FilePlus2,
    },
    {
      to: "/agent/historique",
      label: "Historique des fiches",
      icon: History,
    },
  ];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col
        border-r border-slate-200/90 bg-white
        shadow-xl shadow-slate-200/50
        transform transition-transform duration-300
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/90 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2457c5] text-white shadow-md shadow-blue-700/20">
            <ScanLine size={22} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                ESPACE AGENT
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Collecte Terrain & OCR
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-slate-900 lg:hidden"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Profil de l'agent */}
      <div className="border-b border-slate-200/90 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100 font-bold text-xs">
            <UserRound size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">
              {agent.prenoms} {agent.nom}
            </p>
            <p className="truncate font-mono text-[10px] text-blue-700">
              {agent.matricule}
            </p>
          </div>
        </div>
      </div>

      {/* Fokontany d'affectation */}
      <div className="p-4 pb-2">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="mt-0.5 shrink-0 text-blue-700" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                  Fokontany assigné
                </span>
                <span className="font-mono text-[10px] text-blue-600">
                  {agent.fokontany?.code ?? "—"}
                </span>
              </div>
              <p className="truncate text-xs font-bold text-slate-900 mt-1">
                {agent.fokontany?.nom ?? "Non renseigné"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Opérations
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === "/agent/dashboard"}
              className={({ isActive }) =>
                `
                  group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150
                  ${
                    isActive
                      ? "bg-[#2457c5] text-white shadow-md shadow-blue-900/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `
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

      {/* Footer sécurité et déconnexion */}
      <div className="shrink-0 border-t border-slate-200/90 p-4 space-y-2">
        <div className="flex items-center gap-1.5 px-2 text-[10px] text-slate-500">
          <ShieldCheck size={12} className="text-blue-700" />
          <span>Session chiffrée</span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut size={16} />
          <span>Fermer la session</span>
        </button>
      </div>
    </aside>
  );
}
