import { useState, useEffect, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  Clock3,
  XCircle,
  Eye,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import {
  getChefRecensements,
  updateRecensementChef,
} from "../../services/chefPortalService";
import type { ChefRecensementItem } from "../../types/chefFokontany";

export default function ChefRecensements() {
  const [recensements, setRecensements] = useState<ChefRecensementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<ChefRecensementItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getChefRecensements();
      setRecensements(data);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: "VALIDE" | "REJETE") => {
    await updateRecensementChef(id, newStatus);
    setRecensements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, statut: newStatus } : r)),
    );
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, statut: newStatus } : null));
    }
    setNotification(
      newStatus === "VALIDE"
        ? "Fiche validée et ajoutée au registre officiel."
        : "Fiche rejetée pour réexamen.",
    );
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = useMemo(() => {
    return recensements.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.nom.toLowerCase().includes(q) ||
        r.prenoms.toLowerCase().includes(q) ||
        r.numero_cin.toLowerCase().includes(q) ||
        r.numero_fiche.toLowerCase().includes(q) ||
        r.agent_nom.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || r.statut === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [recensements, search, statusFilter]);

  const validesCount = recensements.filter((r) => r.statut === "VALIDE").length;
  const aVerifierCount = recensements.filter((r) => r.statut === "A_VERIFIER").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Contrôle & Validation
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Fiches de recensement
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Examinez et validez les fiches transmises par les agents recenseurs de votre Fokontany.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="btn btn-ghost btn-sm"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {notification && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {notification}
        </div>
      )}

      {/* Filtres & Recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            placeholder="Rechercher par CIN, nom, agent, fiche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-10 text-sm focus:border-emerald-500"
          />
        </div>

        <div className="join">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`join-item btn btn-sm ${
              statusFilter === "ALL" ? "btn-success text-white" : "btn-ghost"
            }`}
          >
            Toutes ({recensements.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("VALIDE")}
            className={`join-item btn btn-sm ${
              statusFilter === "VALIDE" ? "btn-success text-white" : "btn-ghost"
            }`}
          >
            Validées ({validesCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("A_VERIFIER")}
            className={`join-item btn btn-sm ${
              statusFilter === "A_VERIFIER" ? "btn-warning text-white" : "btn-ghost"
            }`}
          >
            À vérifier ({aVerifierCount})
          </button>
        </div>
      </div>

      {/* Tableau des fiches */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                <th>Citoyen</th>
                <th>Numéro CIN</th>
                <th>Fiche</th>
                <th>Agent</th>
                <th>Confiance OCR</th>
                <th>Statut</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <span className="loading loading-spinner loading-md text-emerald-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-base-content/50">
                    Aucune fiche ne correspond à votre filtre.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-base-200/60 hover:bg-base-200/30 transition text-xs"
                  >
                    <td>
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {item.nom} {item.prenoms}
                        </p>
                        <p className="text-[11px] text-base-content/50">
                          {item.adresse}
                        </p>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                        {item.numero_cin}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-sm badge-neutral font-mono text-[11px]">
                        {item.numero_fiche}
                      </span>
                    </td>

                    <td>
                      <p className="font-medium">{item.agent_nom}</p>
                      <p className="text-[11px] text-base-content/40 font-mono">
                        {item.agent_matricule}
                      </p>
                    </td>

                    <td>
                      {item.ocr_confidence ? (
                        <span
                          className={`badge badge-sm font-semibold ${
                            item.ocr_confidence > 90
                              ? "badge-success text-white"
                              : "badge-warning text-white"
                          }`}
                        >
                          {item.ocr_confidence} %
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {item.statut === "VALIDE" && (
                        <span className="badge badge-success badge-xs font-medium text-white gap-1 py-2">
                          <CheckCircle2 size={11} /> Validé
                        </span>
                      )}
                      {item.statut === "A_VERIFIER" && (
                        <span className="badge badge-warning badge-xs font-medium text-white gap-1 py-2">
                          <Clock3 size={11} /> À vérifier
                        </span>
                      )}
                      {item.statut === "REJETE" && (
                        <span className="badge badge-error badge-xs font-medium text-white gap-1 py-2">
                          <XCircle size={11} /> Rejeté
                        </span>
                      )}
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="btn btn-ghost btn-xs text-primary gap-1"
                        >
                          <Eye size={12} />
                          Détails
                        </button>
                        {item.statut === "A_VERIFIER" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, "VALIDE")}
                            className="btn btn-success btn-xs text-white gap-1"
                          >
                            <Check size={12} />
                            Valider
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détail */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-base-200 pb-4">
              <div>
                <span className="badge badge-success font-mono text-xs text-white mb-1">
                  {selectedItem.numero_fiche}
                </span>
                <h3 className="font-bold text-lg text-slate-800">
                  {selectedItem.nom} {selectedItem.prenoms}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-base-200/50 p-3">
                  <span className="text-base-content/50">Numéro CIN :</span>
                  <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                    {selectedItem.numero_cin}
                  </p>
                </div>
                <div className="rounded-xl bg-base-200/50 p-3">
                  <span className="text-base-content/50">Date de naissance :</span>
                  <p className="font-bold text-sm mt-0.5">{selectedItem.date_naissance}</p>
                </div>
              </div>

              <div className="rounded-xl bg-base-200/50 p-3">
                <span className="text-base-content/50">Adresse de résidence :</span>
                <p className="font-semibold text-sm mt-0.5">{selectedItem.adresse}</p>
              </div>

              <div className="rounded-xl bg-base-200/50 p-3">
                <span className="text-base-content/50">Agent déclarant :</span>
                <p className="font-semibold text-sm mt-0.5">
                  {selectedItem.agent_nom} ({selectedItem.agent_matricule})
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedItem.id, "VALIDE")}
                  className="btn btn-sm btn-success text-white flex-1 gap-1.5"
                >
                  <Check size={14} />
                  Valider la fiche
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedItem.id, "REJETE")}
                  className="btn btn-sm btn-error text-white flex-1 gap-1.5"
                >
                  <X size={14} />
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
