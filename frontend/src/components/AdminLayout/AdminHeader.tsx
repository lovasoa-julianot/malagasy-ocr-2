import { Menu, ShieldCheck, Bell, ChevronDown, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { logout } = useAuth();

  const todayStr = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md md:px-8">
      {/* Partie gauche */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="btn btn-ghost btn-sm btn-square text-slate-600 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Système Central DGAT
            </p>
          </div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">
            Console d'Administration Territoriale
          </h2>
        </div>
      </div>

      {/* Partie droite */}
      <div className="flex items-center gap-3">
        {/* Date du jour */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 text-xs font-medium text-slate-600">
          <Calendar size={14} className="text-slate-400" />
          <span className="capitalize">{todayStr}</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white" />
        </button>

        {/* Profil dropdown */}
        <div className="dropdown dropdown-end">
          <button
            type="button"
            tabIndex={0}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-1.5 pr-3 text-left transition hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              <ShieldCheck size={16} />
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">Admin DGAT</p>
              <p className="text-[10px] text-slate-500">Superviseur National</p>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          <ul
            tabIndex={0}
            className="dropdown-content menu z-50 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 text-xs font-medium text-slate-700"
          >
            <li className="menu-title text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
              Compte Administrateur
            </li>
            <li>
              <a href="/admin/profil" className="rounded-lg py-2 hover:bg-slate-50">
                Mon profil
              </a>
            </li>
            <li>
              <a href="/admin/parametres" className="rounded-lg py-2 hover:bg-slate-50">
                Paramètres du système
              </a>
            </li>
            <div className="my-1 border-t border-slate-100" />
            <li>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg py-2 text-rose-600 hover:bg-rose-50"
              >
                Déconnexion
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
