import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, KeyRound, MapPinned, UserRound, UserPlus } from "lucide-react";
import { SearchableSelect } from "../../components/forms/SearchableSelect";
import { registerChefFokontany, type ChefFokontanyRegisterData, type ChefFokontanyRegisterResponse } from "../../services/ChefFokontanyService";
import territorialRecordsJson from "../../data/madagascar_provinces_regions_districts.json";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { MadagascarEmblem } from "./MadagascarEmblem";

type TerritorialRecord = {
  province: string;
  region: string;
  numero_district: number;
  district: string;
};

type RegistrationStep = 1 | 2 | 3;

const territorialRecords = territorialRecordsJson as TerritorialRecord[];

const initialForm: ChefFokontanyRegisterData = {
  code_fokontany: "",
  nom_fokontany: "",
  commune: "",
  district: "",
  code_district: 0,
  region: "",
  province: "",
  nom: "",
  prenoms: "",
  telephone: "",
  email: "",
  password: "",
};

const stepInfo = [
  { number: 1, title: "Fokontany", description: "Localisation et identification", icon: MapPinned },
  { number: 2, title: "Responsable", description: "Informations personnelles", icon: UserRound },
  { number: 3, title: "Connexion", description: "Identifiants du compte", icon: KeyRound },
] as const;

export default function ChefFokontanyRegister() {
  const [form, setForm] = useState(initialForm);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [step, setStep] = useState<RegistrationStep>(1);
  const [response, setResponse] = useState<ChefFokontanyRegisterResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const stepPanelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const provinces = useMemo(
    () => [...new Set(territorialRecords.map((record) => record.province))].sort(),
    [],
  );
  const regions = useMemo(
    () => [...new Set(territorialRecords
      .filter((record) => record.province === form.province)
      .map((record) => record.region))].sort(),
    [form.province],
  );
  const districts = useMemo(
    () => territorialRecords
      .filter((record) => record.province === form.province && record.region === form.region)
      .map((record) => record.district)
      .sort(),
    [form.province, form.region],
  );

  function updateForm<K extends keyof ChefFokontanyRegisterData>(key: K, value: ChefFokontanyRegisterData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function selectProvince(province: string) {
    setForm((current) => ({
      ...current,
      province,
      region: "",
      district: "",
      code_district: 0,
    }));
    setError("");
  }

  function selectRegion(region: string) {
    setForm((current) => ({ ...current, region, district: "", code_district: 0 }));
    setError("");
  }

  function selectDistrict(district: string) {
    const selected = territorialRecords.find((record) =>
      record.province === form.province && record.region === form.region && record.district === district,
    );
    setForm((current) => ({
      ...current,
      district,
      code_district: selected?.numero_district ?? 0,
    }));
    setError("");
  }

  function validateCurrentStep() {
    const inputs = stepPanelRef.current?.querySelectorAll<HTMLInputElement>("input:not([readonly]):not(:disabled)") ?? [];
    for (const input of inputs) {
      if (!input.reportValidity()) return false;
    }

    if (step === 1 && (!form.province || !form.region || !form.district || form.code_district < 1)) {
      setError("Sélectionnez une province, une région et un district dans les listes proposées.");
      return false;
    }

    if (step === 3 && form.password !== passwordConfirmation) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return false;
    }

    setError("");
    return true;
  }

  function goToNextStep() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(3, current + 1) as RegistrationStep);
  }

  function goToPreviousStep() {
    setError("");
    setStep((current) => Math.max(1, current - 1) as RegistrationStep);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    setLoading(true);
    setError("");
    try {
      const result = await registerChefFokontany({
        ...form,
        code_district: Number(form.code_district),
      });
      setResponse(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Demande impossible à envoyer.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setResponse(null);
    setForm(initialForm);
    setPasswordConfirmation("");
    setStep(1);
    setError("");
  }

  if (response) {
    return (
      <RegistrationSuccess
        response={response}
        onReset={resetForm}
        onGoToLogin={() => navigate("/leader/login")}
      />
    );
  }

  return (
    <main className="auth-page min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/login" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-700">
          <ArrowLeft size={16} />Retour à la connexion
        </Link>
        <MadagascarEmblem variant="light" />

        <section className="auth-card mt-5 rounded-2xl border p-5 sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserPlus size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Demande d’accès</p>
              <h1 className="mt-1 text-xl font-bold">Chef Fokontany</h1>
              <p className="mt-1 text-sm text-slate-500">Votre dossier sera examiné par l’administration.</p>
            </div>
          </div>

          <ol aria-label="Étapes du formulaire" className="mb-7 grid grid-cols-3 gap-2">
            {stepInfo.map(({ number, title, description, icon: Icon }) => {
              const isComplete = step > number;
              const isCurrent = step === number;
              return (
                <li key={number} aria-current={isCurrent ? "step" : undefined} className="min-w-0">
                  <div className={`flex h-full items-start gap-2 rounded-xl border p-2.5 sm:gap-3 sm:p-3 ${isCurrent ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCurrent || isComplete ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {isComplete ? <Check size={16} /> : <Icon size={16} />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-xs font-semibold ${isCurrent ? "text-blue-800" : "text-slate-700"}`}>{number}. {title}</span>
                      <span className="mt-0.5 hidden text-[10px] leading-4 text-slate-500 sm:block">{description}</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          {error && (
            <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <form onSubmit={submit}>
            <div ref={stepPanelRef}>
              {step === 1 && (
                <fieldset className="grid gap-4 sm:grid-cols-2">
                  <legend className="mb-4 text-base font-semibold text-slate-900">Informations du Fokontany</legend>
                  <TextField label="Code du Fokontany" value={form.code_fokontany} onChange={(value) => updateForm("code_fokontany", value)} required />
                  <TextField label="Nom du Fokontany" value={form.nom_fokontany} onChange={(value) => updateForm("nom_fokontany", value)} required />
                  <TextField label="Commune" value={form.commune} onChange={(value) => updateForm("commune", value)} required />

                  <SearchableSelect
                    label="Province"
                    value={form.province}
                    options={provinces}
                    placeholder="Rechercher une province..."
                    onChange={selectProvince}
                  />
                  <SearchableSelect
                    label="Région"
                    value={form.region}
                    options={regions}
                    placeholder={form.province ? "Rechercher une région..." : "Choisissez d’abord une province"}
                    disabled={!form.province}
                    onChange={selectRegion}
                  />
                  <SearchableSelect
                    label="District"
                    value={form.district}
                    options={districts}
                    placeholder={form.region ? "Rechercher un district..." : "Choisissez d’abord une région"}
                    disabled={!form.region}
                    onChange={selectDistrict}
                  />
                  <label className="text-sm font-medium text-slate-700">
                    Numéro du district
                    <input
                      aria-readonly="true"
                      readOnly
                      value={form.code_district || ""}
                      placeholder="Renseigné après le choix du district"
                      className="input input-bordered mt-1 w-full bg-slate-50 text-slate-600"
                    />
                  </label>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset className="grid gap-4 sm:grid-cols-2">
                  <legend className="mb-4 text-base font-semibold text-slate-900">Informations personnelles du Chef</legend>
                  <TextField label="Nom" value={form.nom} onChange={(value) => updateForm("nom", value)} required autoComplete="family-name" />
                  <TextField label="Prénoms" value={form.prenoms} onChange={(value) => updateForm("prenoms", value)} required autoComplete="given-name" />
                  <TextField label="Téléphone" value={form.telephone} onChange={(value) => updateForm("telephone", value)} required type="tel" autoComplete="tel" />
                </fieldset>
              )}

              {step === 3 && (
                <fieldset className="grid gap-4">
                  <legend className="mb-4 text-base font-semibold text-slate-900">Informations de connexion</legend>
                  <TextField label="Adresse e-mail" value={form.email} onChange={(value) => updateForm("email", value)} required type="email" autoComplete="email" />
                  <TextField label="Mot de passe" value={form.password} onChange={(value) => updateForm("password", value)} required type="password" autoComplete="new-password" />
                  <TextField label="Confirmer le mot de passe" value={passwordConfirmation} onChange={setPasswordConfirmation} required type="password" autoComplete="new-password" />
                  <p className="text-xs leading-5 text-slate-500">L’administration vérifiera les informations territoriales et personnelles avant l’activation du compte.</p>
                </fieldset>
              )}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
              {step > 1 ? (
                <button type="button" onClick={goToPreviousStep} disabled={loading} className="btn btn-ghost gap-2">
                  <ArrowLeft size={16} />Étape précédente
                </button>
              ) : <span />}

              {step < 3 ? (
                <button type="button" onClick={goToNextStep} className="btn btn-primary gap-2 sm:min-w-44">
                  Étape suivante<ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn btn-primary gap-2 sm:min-w-52">
                  {loading ? "Envoi de la demande…" : "Envoyer la demande"}
                  {!loading && <ArrowRight size={16} />}
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        required={required}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input input-bordered mt-1 w-full"
      />
    </label>
  );
}
