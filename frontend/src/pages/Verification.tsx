import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { verifyRecensement, type VerificationResult } from "../services/verificationService";
import { MadagascarEmblem } from "./public/MadagascarEmblem";

export default function Verification() {
  const { token = "" } = useParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; verifyRecensement(token).then((data) => { if (active) setResult(data); }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Vérification impossible."); }); return () => { active = false; }; }, [token]);
  return <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900"><div className="mx-auto max-w-xl"><MadagascarEmblem /><section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className={`p-6 text-center ${result ? "bg-emerald-50" : error ? "bg-rose-50" : "bg-slate-50"}`}>{result ? <CheckCircle2 className="mx-auto text-emerald-600" size={42} /> : error ? <CircleAlert className="mx-auto text-rose-600" size={42} /> : <LoaderCircle className="mx-auto animate-spin text-blue-600" size={42} />}<h1 className="mt-3 text-xl font-bold">{result ? "Fiche vérifiée" : error ? "Vérification impossible" : "Vérification en cours…"}</h1><p className="mt-2 text-sm text-slate-600">{result?.message || error}</p></div>{result && <div className="space-y-4 p-6"><div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><ShieldCheck size={18} /> Enregistrement certifié</div><dl className="grid grid-cols-2 gap-4 text-sm">{[["Numéro de fiche", result.numero_fiche], ["Nom", `${result.nom} ${result.prenoms}`], ["CIN", result.numero_cin || "Non renseigné"], ["Statut", result.statut], ["Fokontany", result.fokontany], ["Commune", result.commune], ["Agent", result.agent_matricule], ["Date", result.date_inscription ? new Date(result.date_inscription).toLocaleDateString("fr-FR") : "—"]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl></div>}<div className="border-t border-slate-100 p-4 text-center"><Link to="/login" className="text-sm font-semibold text-emerald-700 hover:underline">Accueil</Link></div></section></div></main>;
}
