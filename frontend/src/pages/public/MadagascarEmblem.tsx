import { Landmark } from "lucide-react";

interface MadagascarEmblemProps {
  variant?: "dark" | "light";
  compact?: boolean;
}

export function MadagascarEmblem({ variant = "light", compact = false }: MadagascarEmblemProps) {
  const isDark = variant === "dark";

  return (
    <div className="flex flex-col items-center text-center">
      {/* Ruban tricolore officiel de la République de Madagascar */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 mb-2.5 rounded-full border shadow-xs backdrop-blur-xs transition ${
          isDark
            ? "bg-slate-900/80 border-slate-700/70 text-slate-200"
            : "bg-white/90 border-slate-200/90 text-slate-700"
        }`}
      >
        <div className="flex items-center h-2.5 w-6 rounded-xs overflow-hidden shadow-xs ring-1 ring-black/10">
          <div className="w-2 h-full bg-white border-r border-slate-200" />
          <div className="w-2 h-full bg-[#D83933]" />
          <div className="w-2 h-full bg-[#007E3A]" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
          Repoblikan'i Madagasikara
        </span>
      </div>

      {/* Sceau & Titre institutionnel */}
      {!compact && (
        <>
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isDark
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-emerald-700/10 text-emerald-800 border-emerald-700/20"
              }`}
            >
              <Landmark size={18} />
            </div>
            <div className="text-left">
              <div
                className={`text-[11px] font-extrabold tracking-tight uppercase leading-none ${
                  isDark ? "text-slate-100" : "text-slate-800"
                }`}
              >
                Ministère de l'Intérieur
              </div>
              <div
                className={`text-[10px] font-medium leading-tight mt-0.5 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Direction Générale de l'Administration Territoriale
              </div>
            </div>
          </div>

          <p
            className={`text-[11px] italic font-medium mt-1 ${
              isDark ? "text-slate-400" : "text-slate-400"
            }`}
          >
            « Fitiavana — Tanindrazana — Fandrosoana »
          </p>
        </>
      )}
    </div>
  );
}
