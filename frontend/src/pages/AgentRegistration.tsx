import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { registerAgentRequest } from "../services/authService";
import type { AgentRegistrationData } from "../services/authService";

interface Props {
  registrationToken: string;
  fokontanyId: string;
  fokontanyNom: string;
  onBack: () => void;
  onRegistered: (matricule: string) => void;
}
const emptyForm: AgentRegistrationData = {
  nom: "",
  prenoms: "",
  telephone: "",
  email: "",
  adresse: "",
};

export default function AgentRegistration({
  registrationToken,
  fokontanyId,
  fokontanyNom,
  onBack,
  onRegistered,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matricule, setMatricule] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const agent = await registerAgentRequest(registrationToken, form);
      setMatricule(agent.matricule);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* <MadagascarEmblem /> */}
        <section className="auth-card mt-5 rounded-2xl border p-6 sm:p-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          {matricule ? (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <UserPlus size={22} />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Inscription terminée
              </p>
              <h1 className="mt-1 text-2xl font-semibold">
                Votre compte Agent est prêt
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Fokontany {fokontanyNom}{" "}
                <span className="font-mono">({fokontanyId})</span>
              </p>
              <div className="my-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <p className="text-xs text-emerald-800">Votre matricule</p>
                <p className="mt-1 font-mono text-xl font-bold tracking-wide text-emerald-900">
                  {matricule}
                </p>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Gardez ce matricule. Il vous sera demandé pour les prochaines
                connexions.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-5 w-full"
                onClick={() => onRegistered(matricule)}
              >
                Continuer vers la connexion
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <UserPlus size={21} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Première utilisation
                  </p>
                  <h1 className="mt-1 text-xl font-semibold">
                    Créer mon compte Agent
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {fokontanyNom} • {fokontanyId}
                  </p>
                </div>
              </div>
              <p className="mb-5 text-sm leading-6 text-slate-500">
                Renseignez vos coordonnées. Un matricule personnel sera créé à
                la fin de l’inscription.
              </p>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                  {error}
                </div>
              )}
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["nom", "Nom", "text"],
                    ["prenoms", "Prénoms", "text"],
                    ["telephone", "Téléphone", "tel"],
                    ["email", "Courriel", "email"],
                    ["adresse", "Adresse", "text"],
                  ] as const
                ).map(([key, label, type]) => (
                  <label
                    key={key}
                    className={`text-sm font-medium text-slate-700 ${key === "adresse" ? "sm:col-span-2" : ""}`}
                    htmlFor={`agent-${key}`}
                  >
                    {label}
                    <input
                      id={`agent-${key}`}
                      required
                      type={type}
                      autoComplete={
                        key === "email"
                          ? "email"
                          : key === "telephone"
                            ? "tel"
                            : "off"
                      }
                      value={form[key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="input input-bordered mt-1.5 w-full"
                      disabled={loading}
                    />
                  </label>
                ))}
                <button
                  disabled={loading}
                  className="btn btn-primary sm:col-span-2"
                >
                  {loading ? "Création du compte…" : "Créer mon compte"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
