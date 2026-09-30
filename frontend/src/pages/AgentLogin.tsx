import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowLeft,
  LogIn,
  MapPin,
  UserRound,
  Sparkles,
  ShieldCheck,
  Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MadagascarEmblem } from "./public/MadagascarEmblem";

interface AgentLoginProps {
  fokontanyId: string;
  fokontanyNom: string;
  onBack: () => void;
  initialMatricule?: string;
}

export default function AgentLogin({
  fokontanyId,
  fokontanyNom,
  onBack,
  initialMatricule = "",
}: AgentLoginProps) {
  const navigate = useNavigate();
  const { agentLogin } = useAuth();

  const [matricule, setMatricule] = useState(initialMatricule);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!matricule.trim()) {
      setError("Veuillez renseigner votre matricule agent.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await agentLogin(fokontanyId, matricule.trim().toUpperCase());

      navigate("/agent/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de vous connecter. Vérifiez votre matricule.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setMatricule("AGT-2026-000127");
    setError("");
  };

  return (
    <div className="auth-page relative min-h-screen overflow-hidden bg-[#090D16] text-slate-100 flex flex-col justify-center px-4 py-10 selection:bg-blue-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-15%] h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute left-[-10%] bottom-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-600/5 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Bouton retour */}
        <button
          type="button"
          onClick={onBack}
          className="group mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:text-white"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 transition group-hover:border-slate-700">
            <ArrowLeft size={14} />
          </div>
          Changer de Fokontany
        </button>

        {/* Emblème */}
        <div className="mb-6">
          <MadagascarEmblem variant="light" />
        </div>

        {/* Carte principale */}
        <div className="auth-card rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Header de la carte */}
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <UserRound size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                <span>Collecte de Terrain</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Espace Agent Recenseur
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Authentification par matricule officiel
              </p>
            </div>
          </div>

          {/* Badge Fokontany sélectionné */}
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <MapPin size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                  Fokontany assigné
                </p>
                <p className="truncate text-sm font-bold text-white">
                  {fokontanyNom}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-emerald-500/20 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
              {fokontanyId}
            </span>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs leading-5 text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="agent-matricule"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Votre matricule d'agent recenseur
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Hash size={16} />
                </div>
                <input
                  id="agent-matricule"
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                  placeholder="EX: AG-FIA-001"
                  autoComplete="off"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 font-mono text-sm tracking-wider text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 uppercase"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Attribué par votre Chef Fokontany lors de votre inscription.
              </p>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs text-white" />
                  <span>Vérification de l'agent...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Ouvrir l'Espace Recenseur</span>
                </>
              )}
            </button>
          </form>

          {/* Raccourci Démo */}
          <div className="mt-5 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={handleFillDemo}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-400 transition hover:border-blue-500/40 hover:bg-slate-950/80 hover:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                Matricule de démonstration
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                AG-FIA-001
              </span>
            </button>
          </div>
        </div>

        {/* Note sécurité */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Session locale sécurisée et synchronisée</span>
        </div>
      </div>
    </div>
  );
}
