import { Menu, Bell, UserRound, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { Agent } from "../../types/agent";

interface AgentHeaderProps {
  agent: Agent;
  onMenuClick: () => void;
}

export default function AgentHeader({ agent, onMenuClick }: AgentHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Mobile menu & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="btn btn-ghost btn-sm btn-square text-slate-600 hover:text-slate-900 lg:hidden"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Agent Recenseur Actif
            </p>
          </div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">
            Collecte et Enregistrement Mobile
          </h2>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Quick action button: Nouveau recensement */}
        <Link
          to="/agent/nouveau"
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[#2457c5] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-900/20 transition hover:bg-[#1d46a2] active:scale-[0.99]"
        >
          <Plus size={15} />
          <span>Nouveau recensement</span>
        </Link>

        {/* Notifications */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
        </button>

        <div className="hidden h-7 w-px bg-slate-200 sm:block" />

        {/* Agent Badge */}
        <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2457c5] text-white font-bold text-xs shadow-xs">
            <UserRound size={16} />
          </div>

          <div className="text-left text-xs">
            <p className="font-bold text-slate-900 leading-tight">
              {agent.prenoms} {agent.nom}
            </p>
            <p className="font-mono text-[10px] text-blue-700">{agent.matricule}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
