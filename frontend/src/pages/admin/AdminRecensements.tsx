import { useEffect, useState, useMemo } from "react";
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  Clock3,
  XCircle,
  Eye,
  Download,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import {
  getAdminRecensements,
  updateRecensementStatusAdmin,
} from "../../services/adminService";
import type { AdminRecensementItem } from "../../types/admin";

export default function AdminRecensements() {
  const [recensements, setRecensements] = useState<AdminRecensementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<AdminRecensementItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadRecensements();
  }, []);

  async function loadRecensements() {
    try {
      setLoading(true);
      const data = await getAdminRecensements();
      setRecensements(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return recensements.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        r.numero_fiche.toLowerCase().includes(q) ||
        r.numero_cin.toLowerCase().includes(q) ||
        r.nom.toLowerCase().includes(q) ||
        r.prenoms.toLowerCase().includes(q) ||
        r.fokontany_nom.toLowerCase().includes(q) ||
        r.agent_nom.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "ALL" || r.statut === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [recensements, search, statusFilter]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: "VALIDE" | "REJETE" | "A_VERIFIER",
  ) => {
    try {
      await updateRecensementStatusAdmin(id, newStatus);
      setRecensements((prev) =>
        prev.map((r) => (r.id === id ? { ...r, statut: newStatus } : r)),
      );
      if (selectedItem?.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, statut: newStatus } : null));
      }
      setNotification(`Statut mis à jour : ${newStatus}`);
      setTimeout(() => setNotification(null), 3000);
    } catch {
      // offline error handling
    }
  };

  const exportCSV = () => {
    const headers = [
      "Numéro Fiche",
      "Numéro CIN",
      "Nom",
      "Prénoms",
      "Fokontany",
      "Commune",
      "Agent",
      "Statut",
      "Date",
    ];
    const rows = filtered.map((r) => [
      r.numero_fiche,
      r.numero_cin,
      `"${r.nom}"`,
      `"${r.prenoms}"`,
      `"${r.fokontany_nom}"`,
      `"${r.commune}"`,
      `"${r.agent_nom}"`,
      r.statut,
      r.created_at,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `recensements_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = recensements.length;
  const validesCount = recensements.filter((r) => r.statut === "VALIDE").length;
  const aVerifierCount = recensements.filter((r) => r.statut === "A_VERIFIER").length;
  const rejetsCount = recensements.filter((r) => r.statut === "REJETE").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Base de données nationale</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Registre des recensements
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Consultez, filtrez et validez les fiches individuelles de recensement scannées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadRecensements}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="btn btn-bordered btn-sm gap-1.5"
          >
            <Download size={14} />
            Exporter CSV
          </button>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {notification}
        </div>
      )}

      {/* Cartes stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total Fiches"
          value={totalCount}
          description="Enregistrements saisis"
          icon={FileCheck2}
          variant="primary"
        />
        <AdminStatsCard
          title="Validées"
          value={validesCount}
          description="Vérifiées et conformes"
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatsCard
          title="À vérifier"
          value={aVerifierCount}
          description="Contrôle manuel requis"
          icon={Clock3}
          variant="warning"
        />
        <AdminStatsCard
          title="Rejetées"
          value={rejetsCount}
          description="Anomalies ou doublons"
          icon={XCircle}
          variant="error"
        />
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            placeholder="Rechercher par CIN, nom, fiche, agent, Fokontany..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-base-content/40 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered text-xs"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="VALIDE">Validé</option>
            <option value="A_VERIFIER">À vérifier</option>
            <option value="REJETE">Rejeté</option>
            <option value="SCANNE">Scanné</option>
          </select>
        </div>
      </div>

      {/* Tableau des recensements */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                <th>Citoyen</th>
                <th>Numéro CIN</th>
                <th>Numéro Fiche</th>
                <th>Fokontany</th>
                <th>Agent</th>
                <th>Confiance OCR</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="mt-2 text-xs text-base-content/50">
                      Chargement des fiches...
                    </p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-base-content/50">
                    Aucun recensement correspondant.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-base-200/60 hover:bg-base-200/30 transition"
                  >
                    <td>
                      <div>
                        <p className="font-semibold text-sm">
                          {item.nom} {item.prenoms}
                        </p>
                        {item.date_naissance && (
                          <p className="text-xs text-base-content/40">
                            Né(e) le {item.date_naissance}
                          </p>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="font-mono text-xs font-semibold text-primary">
                        {item.numero_cin}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-sm badge-neutral font-mono text-[11px]">
                        {item.numero_fiche}
                      </span>
                    </td>

                    <td>
                      <div className="text-xs">
                        <p className="font-medium text-base-content/80">
                          {item.fokontany_nom}
                        </p>
                        <p className="text-[11px] text-base-content/40">
                          {item.commune}
                        </p>
                      </div>
                    </td>

                    <td>
                      <div className="text-xs">
                        <p className="font-medium">{item.agent_nom}</p>
                        <p className="text-[11px] text-base-content/40 font-mono">
                          {item.agent_matricule}
                        </p>
                      </div>
                    </td>

                    <td>
                      {item.ocr_confidence ? (
                        <span
                          className={`badge badge-sm ${
                            item.ocr_confidence > 90
                              ? "badge-success"
                              : item.ocr_confidence > 75
                              ? "badge-warning"
                              : "badge-error"
                          }`}
                        >
                          {item.ocr_confidence}%
                        </span>
                      ) : (
                        <span className="text-xs text-base-content/40">-</span>
                      )}
                    </td>

                    <td>
                      {item.statut === "VALIDE" && (
                        <span className="badge badge-xs badge-success gap-1 py-2 font-medium">
                          <CheckCircle2 size={12} />
                          Validé
                        </span>
                      )}
                      {item.statut === "A_VERIFIER" && (
                        <span className="badge badge-xs badge-warning gap-1 py-2 font-medium">
                          <Clock3 size={12} />
                          À vérifier
                        </span>
                      )}
                      {item.statut === "REJETE" && (
                        <span className="badge badge-xs badge-error gap-1 py-2 font-medium">
                          <XCircle size={12} />
                          Rejeté
                        </span>
                      )}
                      {item.statut === "SCANNE" && (
                        <span className="badge badge-xs badge-info gap-1 py-2 font-medium">
                          Scanné
                        </span>
                      )}
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="btn btn-ghost btn-xs gap-1 text-primary"
                      >
                        <Eye size={13} />
                        Voir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détail Recensement */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Fiche de recensement</h3>
                  <p className="text-xs font-mono text-base-content/50">
                    {selectedItem.numero_fiche}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="rounded-xl border border-base-200 bg-base-200/40 p-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                  Identité du citoyen
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-base-content/50">Nom complet :</span>
                    <p className="font-semibold text-sm">
                      {selectedItem.nom} {selectedItem.prenoms}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/50">Numéro CIN :</span>
                    <p className="font-mono font-bold text-primary">
                      {selectedItem.numero_cin}
                    </p>
                  </div>
                  {selectedItem.sexe && (
                    <div>
                      <span className="text-base-content/50">Sexe :</span>
                      <p className="font-medium">{selectedItem.sexe}</p>
                    </div>
                  )}
                  {selectedItem.date_naissance && (
                    <div>
                      <span className="text-base-content/50">Date de naissance :</span>
                      <p className="font-medium">{selectedItem.date_naissance}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-base-200 p-3">
                  <p className="text-base-content/50 mb-1">Localisation</p>
                  <p className="font-semibold">{selectedItem.fokontany_nom}</p>
                  <p className="text-base-content/60">{selectedItem.commune}</p>
                  <p className="text-base-content/40">{selectedItem.district} - {selectedItem.region}</p>
                </div>

                <div className="rounded-xl border border-base-200 p-3">
                  <p className="text-base-content/50 mb-1">Agent déclarant</p>
                  <p className="font-semibold">{selectedItem.agent_nom}</p>
                  <p className="font-mono text-base-content/60">{selectedItem.agent_matricule}</p>
                  <p className="text-base-content/40 mt-1">Enregistré le {selectedItem.created_at?.slice(0, 10)}</p>
                </div>
              </div>

              {selectedItem.ocr_confidence && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs flex items-center justify-between">
                  <span className="text-base-content/70">Précision de reconnaissance OCR :</span>
                  <span className="font-bold text-primary">{selectedItem.ocr_confidence}%</span>
                </div>
              )}

              {/* Action de validation / rejet */}
              <div className="rounded-xl border border-base-300 p-4 bg-base-100">
                <p className="text-xs font-semibold mb-2">Décision administrative</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedItem.id, "VALIDE")}
                    className={`btn btn-sm flex-1 gap-1.5 ${
                      selectedItem.statut === "VALIDE"
                        ? "btn-success"
                        : "btn-outline btn-success"
                    }`}
                  >
                    <Check size={14} />
                    Valider la fiche
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedItem.id, "REJETE")}
                    className={`btn btn-sm flex-1 gap-1.5 ${
                      selectedItem.statut === "REJETE"
                        ? "btn-error"
                        : "btn-outline btn-error"
                    }`}
                  >
                    <X size={14} />
                    Rejeter
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedItem.id, "A_VERIFIER")}
                    className={`btn btn-sm gap-1.5 ${
                      selectedItem.statut === "A_VERIFIER"
                        ? "btn-warning"
                        : "btn-outline btn-warning"
                    }`}
                  >
                    <Clock3 size={14} />
                    À vérifier
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-base-200 px-6 py-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="btn btn-sm btn-ghost"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
