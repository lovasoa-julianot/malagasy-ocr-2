import { useState } from "react";
import type { FormEvent } from "react";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  LockKeyhole,
  Mail,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AdminLoginProps {
  onBack: () => void;
}

export default function AdminLogin({ onBack }: AdminLoginProps) {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError(
        "Veuillez renseigner votre adresse email et votre mot de passe.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await adminLogin(email.trim(), password);

      navigate("/admin/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Impossible de vous connecter. Vérifiez vos identifiants.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@ocr-cin.mg");
    setPassword("Admin@2026");
    setError("");
  };

  return (
    <div className="auth-page relative min-h-screen overflow-hidden bg-[#090D16] text-slate-100 flex flex-col justify-center px-4 py-10 selection:bg-emerald-500 selection:text-white">
      {/* Background radial glows & grid */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-20%] h-150 w-150 -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-100 w-100 rounded-full bg-blue-600/5 blur-[120px]" />
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
          Retour à l'accueil
        </button>

        {/* Emblème national officiel */}
        {/* <div className="mb-6">
          <MadagascarEmblem variant="light" />
        </div> */}

        {/* Carte principale */}
        <div className="auth-card rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Header de la carte */}
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                <span>Espace Central Sécurisé</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Portail Administrateur
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Supervision nationale et contrôle qualité
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
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Adresse email professionnelle
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ocr-cin.mg"
                  autoComplete="email"
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="admin-password"
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
                  id="admin-password"
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

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs text-white" />
                  <span>Vérification des privilèges...</span>
                </>
              ) : (
                <>
                  <LockKeyhole size={16} />
                  <span>Accéder à l'Administration</span>
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
                Remplir avec identifiants de test
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                admin@ocr-cin.mg
              </span>
            </button>
          </div>
        </div>

        {/* Note de sécurité basse */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>Connexion chiffrée SSL / TLS • DGAT Madagascar</span>
        </div>
      </div>
    </div>
  );
}
