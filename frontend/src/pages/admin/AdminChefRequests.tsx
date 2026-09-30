import { useState, useEffect } from "react";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock3,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  X,
  Copy,
  Key,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import {
  getChefFokontanyRequests,
  approveChefFokontanyRequest,
  rejectChefFokontanyRequest,
} from "../../services/adminService";
import type { ChefFokontanyRequestItem } from "../../types/admin";

export default function AdminChefRequests() {
  const [requests, setRequests] = useState<ChefFokontanyRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "EN_ATTENTE" | "APPROUVE" | "REJETE">("ALL");

  // Approval modal state
  const [approvedCode, setApprovedCode] = useState<{
    code: string;
    chefName: string;
    fokontany: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reject modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMotif, setRejectMotif] = useState("");
  const [rejectingLoading, setRejectingLoading] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getChefFokontanyRequests();
      setRequests(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
  };

  const handleApprove = async (req: ChefFokontanyRequestItem) => {
    try {
      const result = await approveChefFokontanyRequest(req.id);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, statut: "APPROUVE", reviewed_at: new Date().toISOString() }
            : r,
        ),
      );
      setApprovedCode({
        code: result.access_code,
        chefName: `${req.nom} ${req.prenoms}`,
        fokontany: req.nom_fokontany,
      });
      setNotification(result.message || `Demande approuvée pour ${req.nom_fokontany}.`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification(err instanceof Error ? err.message : "Impossible d’approuver la demande.");
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectingId(id);
    setRejectMotif("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    try {
      setRejectingLoading(true);
      await rejectChefFokontanyRequest(
        rejectingId,
        rejectMotif.trim() || "Documents non conformes",
      );
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectingId
            ? {
                ...r,
                statut: "REJETE",
                motif_rejet: rejectMotif.trim() || "Documents non conformes",
                reviewed_at: new Date().toISOString(),
              }
            : r,
        ),
      );
      setRejectingId(null);
      setNotification("Demande rejetée.");
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setRejectingLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.statut === statusFilter;
  });

  const pendingCount = requests.filter((r) => r.statut === "EN_ATTENTE").length;
  const approvedCount = requests.filter((r) => r.statut === "APPROUVE").length;
  const rejectedCount = requests.filter((r) => r.statut === "REJETE").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Inscriptions & agréments</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Demandes Chefs Fokontany
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Validez les demandes d'ouverture d'espace et d'attribution de codes d'accès Fokontany.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-ghost btn-sm"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Actualiser
        </button>
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
          title="Total demandes"
          value={requests.length}
          description="Inscriptions reçues"
          icon={UserCheck}
          variant="primary"
        />
        <AdminStatsCard
          title="En attente"
          value={pendingCount}
          description="Requiert votre validation"
          icon={Clock3}
          variant="warning"
        />
        <AdminStatsCard
          title="Approuvées"
          value={approvedCount}
          description="Comptes et Fokontany créés"
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatsCard
          title="Rejetées"
          value={rejectedCount}
          description="Dossiers non conformes"
          icon={XCircle}
          variant="error"
        />
      </div>

      {/* Filtres d'onglets */}
      <div className="flex gap-2 border-b border-base-200 pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`btn btn-sm ${
            statusFilter === "ALL" ? "btn-primary" : "btn-ghost"
          }`}
        >
          Toutes ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("EN_ATTENTE")}
          className={`btn btn-sm gap-1.5 ${
            statusFilter === "EN_ATTENTE" ? "btn-warning" : "btn-ghost"
          }`}
        >
          <Clock3 size={13} />
          En attente ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("APPROUVE")}
          className={`btn btn-sm gap-1.5 ${
            statusFilter === "APPROUVE" ? "btn-success" : "btn-ghost"
          }`}
        >
          <CheckCircle2 size={13} />
          Approuvées ({approvedCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("REJETE")}
          className={`btn btn-sm gap-1.5 ${
            statusFilter === "REJETE" ? "btn-error" : "btn-ghost"
          }`}
        >
          <XCircle size={13} />
          Rejetées ({rejectedCount})
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="mt-2 text-xs text-base-content/50">
              Chargement des demandes...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 p-12 text-center">
            <ShieldCheck size={40} className="mx-auto text-base-content/30" />
            <p className="mt-3 font-semibold text-base">Aucune demande trouvée</p>
            <p className="text-xs text-base-content/40">
              Toutes les demandes ont été traitées.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xs transition hover:border-primary/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary font-mono text-xs font-semibold">
                      {req.code_fokontany}
                    </span>
                    <span className="font-bold text-base">{req.nom_fokontany}</span>
                    <span className="text-xs text-base-content/40">•</span>
                    <span className="text-xs text-base-content/60">{req.commune}</span>

                    {req.statut === "EN_ATTENTE" && (
                      <span className="badge badge-warning badge-sm gap-1 ml-2">
                        <Clock3 size={11} /> En attente
                      </span>
                    )}
                    {req.statut === "APPROUVE" && (
                      <span className="badge badge-success badge-sm gap-1 ml-2">
                        <CheckCircle2 size={11} /> Approuvé
                      </span>
                    )}
                    {req.statut === "REJETE" && (
                      <span className="badge badge-error badge-sm gap-1 ml-2">
                        <XCircle size={11} /> Rejeté
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-base-content/70">
                    <div className="flex items-center gap-1 font-medium text-base-content">
                      <span className="text-base-content/40">Candidat :</span>
                      {req.nom} {req.prenoms}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone size={12} className="text-base-content/40" />
                      {req.telephone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail size={12} className="text-base-content/40" />
                      {req.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-base-content/40" />
                      {req.district} ({req.region})
                    </div>
                  </div>

                  {req.motif_rejet && (
                    <p className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
                      <strong>Motif du rejet :</strong> {req.motif_rejet}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {req.statut === "EN_ATTENTE" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenReject(req.id)}
                      className="btn btn-sm btn-ghost text-error gap-1"
                    >
                      <X size={14} />
                      Rejeter
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(req)}
                      className="btn btn-sm btn-success gap-1.5 text-white"
                    >
                      <Check size={14} />
                      Approuver & Créer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Code d'accès généré suite à approbation */}
      {approvedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/20 bg-base-100 p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Key size={28} />
              </div>
              <h3 className="mt-3 text-lg font-bold">Demande approuvée avec succès</h3>
              <p className="mt-1 text-xs text-base-content/60">
                Le compte Chef Fokontany a été activé pour {approvedCode.chefName}.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Code d'accès pour les agents recenseurs
              </p>
              <p className="mt-2 text-3xl font-mono font-black tracking-widest text-emerald-600">
                {approvedCode.code}
              </p>
              <p className="mt-2 text-[11px] text-base-content/50">
                Transmettez ce code au Chef Fokontany pour qu'il puisse connecter ses agents.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(approvedCode.code)}
                className="btn btn-sm btn-primary flex-1 gap-1.5"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copié !" : "Copier le code"}
              </button>
              <button
                type="button"
                onClick={() => setApprovedCode(null)}
                className="btn btn-sm btn-ghost"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Motif de rejet */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl">
            <h3 className="font-bold text-base flex items-center gap-2 text-error">
              <AlertCircle size={18} />
              Rejeter la demande d'inscription
            </h3>
            <p className="mt-1 text-xs text-base-content/60">
              Veuillez indiquer le motif du rejet qui sera notifié au demandeur.
            </p>

            <textarea
              rows={3}
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              placeholder="ex. Les pièces justificatives du Fokontany sont illisibles ou incomplètes..."
              className="textarea textarea-bordered mt-4 w-full text-xs"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="btn btn-sm btn-ghost"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={rejectingLoading}
                onClick={handleConfirmReject}
                className="btn btn-sm btn-error text-white"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
