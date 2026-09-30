import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  MapPin,
  UserPlus,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MadagascarEmblem } from "./MadagascarEmblem";

interface ChefFokontanyLoginProps {
  onBack?: () => void;
}

export default function ChefFokontanyLogin({ onBack }: ChefFokontanyLoginProps) {
  const navigate = useNavigate();
  const { chefLogin } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/login");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      setError(
        "Veuillez renseigner votre email ou code Fokontany ainsi que votre mot de passe.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await chefLogin(identifier.trim(), password);

      navigate("/chef-fokontany/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de vous connecter. Vérifiez vos identifiants.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIdentifier("chef.andrainjato@fokontany.mg");
    setPassword("secret123");
    setError("");
  };

  return (
    <div className="auth-page relative min-h-screen overflow-hidden bg-[#090D16] text-slate-100 flex flex-col justify-center px-4 py-10 selection:bg-emerald-500 selection:text-white">
      {/* Background radial glows & grid */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-15%] h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[400px] w-[400px] rounded-full bg-teal-600/5 blur-[120px]" />
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
          onClick={handleBack}
          className="group mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:text-white"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 transition group-hover:border-slate-700">
            <ArrowLeft size={14} />
          </div>
          Retour à l'accueil
        </button>

        {/* Emblème */}
        <div className="mb-6">
          <MadagascarEmblem variant="light" />
        </div>

        {/* Carte principale */}
        <div className="auth-card rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Header de la carte */}
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <MapPin size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                <span>Autorité Territoriale</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Espace Chef Fokontany
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Validation locale et registre des résidents
              </p>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs leading-5 text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifiant */}
            <div>
              <label
                htmlFor="chef-identifier"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Email ou Code Fokontany
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <MapPin size={16} />
                </div>
                <input
                  id="chef-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="chef@fokontany.mg ou FKT-001"
                  autoComplete="username"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="chef-password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Mot de passe
                </label>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <LockKeyhole size={16} />
                </div>
                <input
                  id="chef-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-11 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 font-mono tracking-wide"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs text-white" />
                  <span>Vérification de l'autorité...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Accéder à l'Espace Fokontany</span>
                </>
              )}
            </button>
          </form>

          {/* Raccourci Démo */}
          <div className="mt-5 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={handleFillDemo}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-400 transition hover:border-emerald-500/40 hover:bg-slate-950/80 hover:text-slate-200"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" />
                Identifiants de démonstration
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                chef.andrainjato@fokontany.mg
              </span>
            </button>
          </div>

          {/* Adhésion nouveau Fokontany */}
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <UserPlus size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200">
                  Nouveau Chef Fokontany ?
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                  Transmettez votre demande d'adhésion officielle pour rattacher votre Fokontany.
                </p>
                <Link
                  to="/leader/subscription"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                >
                  Déposer une demande de rattachement
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Note sécurité */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Registre administratif certifié • Ministère de l'Intérieur</span>
        </div>
      </div>
    </div>
  );
}
