import { useState, useMemo } from "react";
import { Search, MapPin, RefreshCw, CheckCircle2, ChevronRight } from "lucide-react";
import type { Fokontany } from "../../types/fokontany";

interface FokontanyTableProps {
  fokontany: Fokontany[];
  loading?: boolean;
  onRefresh: () => void;
  onSelect?: (item: Fokontany) => void;
}

export default function FokontanyTable({
  fokontany,
  loading = false,
  onRefresh,
  onSelect,
}: FokontanyTableProps) {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");

  const regions = useMemo(() => {
    const set = new Set<string>();
    fokontany.forEach((f) => {
      if (f.region) set.add(f.region);
    });
    return Array.from(set).sort();
  }, [fokontany]);

  const filtered = useMemo(() => {
    return fokontany.filter((f) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        f.nom.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.commune.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q);

      const matchesRegion =
        selectedRegion === "ALL" || f.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [fokontany, search, selectedRegion]);

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            placeholder="Rechercher un Fokontany par nom, code, commune..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="select select-bordered text-xs"
          >
            <option value="ALL">Toutes les Régions</option>
            {regions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            title="Rafraîchir"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                <th>Fokontany</th>
                <th>Code</th>
                <th>Commune</th>
                <th>District & Région</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="mt-2 text-xs text-base-content/50">
                      Chargement des Fokontany...
                    </p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <MapPin size={36} className="mx-auto text-base-content/30" />
                    <p className="mt-2 font-medium text-base-content/70">
                      Aucun Fokontany trouvé
                    </p>
                    <p className="text-xs text-base-content/40">
                      Ajoutez un nouveau Fokontany ou ajustez les filtres.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelect?.(item)}
                    className="border-b border-base-200/60 cursor-pointer transition hover:bg-base-200/30"
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <MapPin size={15} />
                        </div>
                        <span className="font-semibold text-sm">{item.nom}</span>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-sm badge-neutral font-mono font-medium">
                        {item.code}
                      </span>
                    </td>

                    <td className="text-xs text-base-content/80 font-medium">
                      {item.commune}
                    </td>

                    <td>
                      <div className="text-xs">
                        <p className="text-base-content/80">{item.district}</p>
                        <p className="text-[11px] text-base-content/40">
                          {item.region}
                        </p>
                      </div>
                    </td>

                    <td>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        <CheckCircle2 size={12} />
                        Actif
                      </span>
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-primary gap-1"
                      >
                        <span>Gérer</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-base-200 px-4 py-3 text-xs text-base-content/50">
          <span>{filtered.length} Fokontany répertoriés</span>
          <span>{regions.length} Régions couvertes</span>
        </div>
      </div>
    </div>
  );
}
