import { useEffect, useMemo, useState } from "react";
import { MapPin, RefreshCw, Building2, Map, Layers } from "lucide-react";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import FokontanyTable from "../../components/admin/FokontanyTable";
import { getFokontany } from "../../services/fokontanyService";
import type { Fokontany } from "../../types/fokontany";

export default function FokontanyManagement() {
  const [items, setItems] = useState<Fokontany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true); setError("");
    try { setItems(await getFokontany()); }
    catch (err) { setError(err instanceof Error ? err.message : "Impossible de charger les Fokontany."); }
    finally { setLoading(false); }
  }
  const stats = useMemo(() => ({
    total: items.length,
    communes: new Set(items.map((item) => item.commune)).size,
    districts: new Set(items.map((item) => item.district)).size,
    regions: new Set(items.map((item) => item.region)).size,
  }), [items]);
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Découpage administratif</p><h1 className="mt-1 text-2xl font-bold">Gestion des Fokontany</h1><p className="mt-1 text-sm text-base-content/60">Un Fokontany est enregistré lors de l’approbation d’une demande Chef, s’il n’existe pas déjà.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="btn btn-ghost btn-sm"><RefreshCw size={14} className={loading?"animate-spin":""}/>Actualiser</button></header>
    {error && <div role="alert" className="alert alert-error">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><AdminStatsCard title="Fokontany répertoriés" value={stats.total} description="Territoires enregistrés" icon={MapPin} variant="primary"/><AdminStatsCard title="Communes" value={stats.communes} description="Communes représentées" icon={Building2} variant="success"/><AdminStatsCard title="Districts" value={stats.districts} description="Districts représentés" icon={Map} variant="info"/><AdminStatsCard title="Régions" value={stats.regions} description="Régions couvertes" icon={Layers} variant="warning"/></div>
    <FokontanyTable fokontany={items} loading={loading} onRefresh={() => void load()} />
  </div>;
}
