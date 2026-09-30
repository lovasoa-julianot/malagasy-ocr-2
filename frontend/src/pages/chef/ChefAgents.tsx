import { useEffect, useState } from "react";
import { UserRound, Phone, Mail, MapPin, Power, RefreshCw, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { getChefAgents, toggleAgentByChef } from "../../services/chefPortalService";
import type { ChefAgentItem } from "../../types/chefFokontany";

export default function ChefAgents() {
  const [agents, setAgents] = useState<ChefAgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  async function loadAgents() {
    setLoading(true); setError("");
    try { setAgents(await getChefAgents()); }
    catch (err) { setError(err instanceof Error ? err.message : "Impossible de charger les agents."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadAgents(); }, []);
  async function toggle(agent: ChefAgentItem) {
    setBusyId(agent.id); setError(""); setNotice("");
    try {
      await toggleAgentByChef(agent.id, !agent.is_active);
      setAgents((items) => items.map((item) => item.id === agent.id ? { ...item, is_active: !agent.is_active } : item));
      setNotice(`Le compte de ${agent.nom} ${agent.prenoms} a été ${agent.is_active ? "suspendu" : "activé"}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible de modifier le compte agent."); }
    finally { setBusyId(null); }
  }
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-emerald-600">Agents territoriaux</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Agents recenseurs du Fokontany</h1><p className="mt-1 max-w-2xl text-sm text-base-content/60">Les agents créent eux-mêmes leur compte lors de leur première utilisation avec le code d’accès du Fokontany. Cette page sert à consulter et gérer les comptes existants.</p></div><button type="button" onClick={() => void loadAgents()} disabled={loading} className="btn btn-ghost btn-sm"><RefreshCw size={14} className={loading?"animate-spin":""}/>Actualiser</button></header>
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><UserPlus size={18} className="mt-0.5 shrink-0"/><p>Pour inscrire un nouvel agent, partagez le code d’accès depuis <Link className="font-semibold underline" to="/chef-fokontany/code-acces">Code d’accès & QR</Link>. L’agent choisira « Première utilisation » sur la page de connexion et recevra son matricule après inscription.</p></div>
    {error && <div role="alert" className="alert alert-error">{error}</div>}{notice && <div role="status" className="alert alert-success">{notice}</div>}
    <div className="grid gap-4 sm:grid-cols-3"><Stat label="Total agents" value={agents.length}/><Stat label="Comptes actifs" value={agents.filter((agent)=>agent.is_active).length}/><Stat label="Fiches collectées" value={agents.reduce((sum,agent)=>sum+agent.total_recensements,0)}/></div>
    {loading ? <div className="py-12 text-center"><span className="loading loading-spinner loading-md text-emerald-600"/><p className="mt-2 text-sm text-base-content/60">Chargement des agents…</p></div> : agents.length === 0 ? <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center"><UserRound className="mx-auto text-base-content/30" size={34}/><h2 className="mt-3 font-semibold">Aucun agent inscrit</h2><p className="mx-auto mt-1 max-w-lg text-sm text-base-content/60">Un agent apparaîtra ici après avoir validé le Fokontany et créé son compte pour la première fois.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{agents.map((agent)=><article key={agent.id} className="space-y-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-700">{agent.nom.charAt(0)}{agent.prenoms.charAt(0)}</div><div><h2 className="font-bold text-slate-800">{agent.nom} {agent.prenoms}</h2><p className="mt-1 font-mono text-xs text-emerald-700">{agent.matricule}</p></div></div><span className={`badge badge-sm ${agent.is_active?"badge-success":"badge-error"}`}>{agent.is_active?"Actif":"Suspendu"}</span></div><div className="space-y-2 rounded-xl bg-base-200/50 p-3 text-xs text-base-content/70"><p className="flex items-center gap-2"><Phone size={13}/>{agent.telephone}</p>{agent.email&&<p className="flex items-center gap-2"><Mail size={13}/>{agent.email}</p>}{agent.adresse&&<p className="flex items-center gap-2"><MapPin size={13}/>{agent.adresse}</p>}</div><div className="flex items-center justify-between border-t border-base-200 pt-3"><span className="text-xs font-semibold">{agent.total_recensements} fiches réalisées</span><button type="button" disabled={busyId===agent.id} onClick={()=>void toggle(agent)} className={`btn btn-xs ${agent.is_active?"btn-ghost text-rose-600":"btn-ghost text-emerald-600"}`}><Power size={12}/>{busyId===agent.id?"Mise à jour…":agent.is_active?"Suspendre":"Activer"}</button></div></article>)}</div>}
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-base-300 bg-base-100 p-5"><p className="text-xs font-semibold uppercase text-base-content/50">{label}</p><p className="mt-2 text-3xl font-black text-slate-800">{value}</p></div>; }
