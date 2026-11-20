import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  UserPlus,
} from "lucide-react";

import { agentAccessRequest } from "../services/authService";

import AgentLogin from "./AgentLogin";
import AgentRegistration from "./AgentRegistration";

interface AgentAccessProps {
  onBack: () => void;
}

type AccessStep = "access" | "choice" | "login" | "registration";

export default function AgentAccess({ onBack }: AgentAccessProps) {
  const [step, setStep] = useState<AccessStep>("access");
  const [code, setCode] = useState("");
  const [codeAcces, setCodeAcces] = useState("");
  const [fokontanyId, setFokontanyId] = useState("");
  const [fokontanyNom, setFokontanyNom] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [registrationRequired, setRegistrationRequired] = useState(false);
  const [registeredMatricule, setRegisteredMatricule] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await agentAccessRequest(code.trim(), codeAcces.trim());

      if (!result.access_granted) {
        throw new Error("Le serveur a refusé l'accès à ce Fokontany.");
      }

      setFokontanyId(result.fokontany_id);
      setFokontanyNom(result.fokontany_nom);
      setRegistrationRequired(result.registration_required);
      setRegistrationToken(result.registration_token ?? "");
      setRegisteredMatricule("");
      setStep("choice");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de valider l'accès au Fokontany.",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleFillDemo = () => {
    setCode("FKT-001");
    setCodeAcces("1234");
    setError("");
  };

  if (step === "choice") {
    return (
      <div className="auth-page flex min-h-screen items-center justify-center bg-[#090D16] px-4 py-10 text-white">
        <section className="auth-card w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
          <button
            type="button"
            onClick={() => setStep("access")}
            className="mb-5 text-sm text-slate-400 hover:text-white"
          >
            ← Changer de Fokontany
          </button>
          <h1 className="text-xl font-bold">Accès validé</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            {fokontanyNom}. Choisissez votre situation.
          </p>
          <button
            type="button"
            onClick={() => setStep("login")}
            className="mb-3 flex w-full items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-left hover:bg-blue-500/15"
          >
            <UserRound className="text-blue-400" />
            <span>
              <strong className="block">J’ai déjà un compte Agent</strong>
              <small className="text-slate-400">
                Me connecter avec mon matricule
              </small>
            </span>
          </button>
          {registrationRequired && registrationToken && (
            <button
              type="button"
              onClick={() => setStep("registration")}
              className="flex w-full items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left hover:bg-emerald-500/15"
            >
              <UserPlus className="text-emerald-400" />
              <span>
                <strong className="block">Première utilisation</strong>
                <small className="text-slate-400">
                  Créer mon compte Agent et obtenir un matricule
                </small>
              </span>
            </button>
          )}
          {!registrationRequired && (
            <p className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
              Un agent est déjà enregistré pour ce Fokontany. L'inscription est
              fermée.
            </p>
          )}
        </section>
      </div>
    );
  }

  if (step === "login") {
    return (
      <AgentLogin
        fokontanyId={fokontanyId}
        fokontanyNom={fokontanyNom}
        initialMatricule={registeredMatricule}
        onBack={() => setStep("choice")}
      />
    );
  }

  if (step === "registration") {
    return (
      <AgentRegistration
        registrationToken={registrationToken}
        fokontanyId={fokontanyId}
        fokontanyNom={fokontanyNom}
        onBack={() => setStep("access")}
        onRegistered={(matricule) => {
          setRegisteredMatricule(matricule);
          setStep("login");
        }}
      />
    );
  }

  return (
    <div className="auth-page relative min-h-screen overflow-hidden bg-[#090D16] text-slate-100 flex flex-col justify-center px-4 py-10 selection:bg-blue-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-15%] h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-600/5 blur-[120px]" />
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

        {/* Emblème */}
        {/* <div className="mb-6">
          <MadagascarEmblem variant="light" />
        </div> */}

        {/* Carte principale */}
        <div className="auth-card rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Header de la carte */}
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <MapPin size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                <span>Rattachement Territorial</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Accès Agent Recenseur
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Identification du Fokontany d'affectation
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
            {/* Code Fokontany */}
            <div>
              <label
                htmlFor="fokontany-code"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Code officiel du Fokontany
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <MapPin size={16} />
                </div>
                <input
                  id="fokontany-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: FKT-001"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 font-mono text-sm tracking-wider text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 uppercase"
                />
              </div>
            </div>

            {/* Code d'accès */}
            <div>
              <label
                htmlFor="access-code"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Code d'accès sécurisé du Fokontany
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <KeyRound size={16} />
                </div>
                <input
                  id="access-code"
                  type="password"
                  required
                  value={codeAcces}
                  onChange={(e) => setCodeAcces(e.target.value)}
                  placeholder="Fourni par le Chef Fokontany"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 font-mono text-sm tracking-wider text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Explication discrète */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 flex items-start gap-3">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-blue-400"
              />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Ces codes vous sont communiqués ou scannés via le QR Code
                affiché par votre Chef Fokontany.
              </p>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs text-white" />
                  <span>Vérification de l'affectation...</span>
                </>
              ) : (
                <>
                  <span>Valider l'affectation</span>
                  <ArrowRight size={16} />
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
                Fokontany de démonstration
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                FKT-001 (Andrainjato Atsimo)
              </span>
            </button>
          </div>
        </div>

        {/* Note sécurité */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Accès crypté et géolocalisé pour le recensement national</span>
        </div>
      </div>
    </div>
  );
}
