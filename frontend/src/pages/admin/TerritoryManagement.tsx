import { useEffect, useMemo, useState } from "react";
import { MapPinned, Search, RefreshCw } from "lucide-react";
import type { Fokontany } from "../../types/fokontany";
import { getFokontany } from "../../services/fokontanyService";

export default function TerritoryManagement() {
  const [items, setItems] = useState<Fokontany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try { setItems(await getFokontany()); }
    catch (err) { setError(err instanceof Error ? err.message : "Impossible de charger les Fokontany."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => !query || [item.code, item.nom, item.commune, item.district, item.region].some((value) => value?.toLowerCase().includes(query)));
  }, [items, search]);
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3"><MapPinned className="text-primary" size={28}/><div><h1 className="text-2xl font-bold">Territoires</h1><p className="text-sm text-base-content/60">Les Fokontany sont ajoutés lors de la validation d’une demande Chef.</p></div></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="btn btn-ghost btn-sm"><RefreshCw size={15} className={loading?"animate-spin":""}/>Actualiser</button>
    </header>
    {error && <div role="alert" className="alert alert-error">{error}</div>}
    <div className="rounded-xl border border-base-300 bg-base-100 p-4"><label className="input input-bordered flex items-center gap-2 sm:max-w-md"><Search size={17}/><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Rechercher code, Fokontany, commune…"/></label></div>
    <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
      <table className="table"><thead><tr><th>Code</th><th>Fokontany</th><th>Commune</th><th>District</th><th>Région</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={5} className="py-12 text-center"><span className="loading loading-spinner loading-md"/></td></tr> : filtered.length ? filtered.map((item)=><tr key={item.id}><td className="font-mono">{item.code}</td><td className="font-semibold">{item.nom}</td><td>{item.commune}</td><td>{item.district}</td><td>{item.region}</td></tr>) : <tr><td colSpan={5} className="py-12 text-center text-base-content/60">{search?"Aucun résultat.":"Aucun Fokontany enregistré pour le moment. Ils apparaîtront après approbation d’une demande Chef."}</td></tr>}
      </tbody></table>
    </div>
    <p className="text-sm text-base-content/50">{filtered.length} Fokontany affiché{filtered.length===1?"":"s"}</p>
  </div>;
}
