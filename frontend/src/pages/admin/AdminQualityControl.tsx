import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Check,
  RefreshCw,
} from "lucide-react";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import {
  getAdminQualityAlerts,
  resolveQualityAlert,
} from "../../services/adminService";
import type { QualityAlertItem } from "../../types/admin";

export default function AdminQualityControl() {
  const [alerts, setAlerts] = useState<QualityAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await getAdminQualityAlerts();
      setAlerts(data);
    } finally {
      setLoading(false);
    }
  }

  const handleResolve = async (id: string) => {
    await resolveQualityAlert(id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolu: true } : a)),
    );
    setNotification("Alerte marquée comme résolue.");
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = alerts.filter((a) => {
    if (filterSeverity === "ALL") return true;
    return a.severity === filterSeverity;
  });

  const highCount = alerts.filter((a) => a.severity === "HIGH" && !a.resolu).length;
  const mediumCount = alerts.filter((a) => a.severity === "MEDIUM" && !a.resolu).length;
  const resolvedCount = alerts.filter((a) => a.resolu).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Intégrité des données</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Contrôle & Qualité OCR
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Détection automatique des doublons CIN, scores de confiance faibles et incohérences.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
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

      {/* Cartes stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Alertes critiques"
          value={highCount}
          description="Doublons CIN majeurs"
          icon={AlertTriangle}
          variant="error"
        />
        <AdminStatsCard
          title="Alertes moyennes"
          value={mediumCount}
          description="Confiance OCR < 75%"
          icon={Clock3}
          variant="warning"
        />
        <AdminStatsCard
          title="Alertes résolues"
          value={resolvedCount}
          description="Vérifiées par l'équipe"
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatsCard
          title="Intégrité globale"
          value="99.2 %"
          description="Conformité des fiches"
          icon={ShieldAlert}
          variant="primary"
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilterSeverity("ALL")}
          className={`btn btn-sm ${
            filterSeverity === "ALL" ? "btn-primary" : "btn-ghost"
          }`}
        >
          Toutes ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterSeverity("HIGH")}
          className={`btn btn-sm gap-1.5 ${
            filterSeverity === "HIGH" ? "btn-error" : "btn-ghost"
          }`}
        >
          Haute sévérité
        </button>
        <button
          type="button"
          onClick={() => setFilterSeverity("MEDIUM")}
          className={`btn btn-sm gap-1.5 ${
            filterSeverity === "MEDIUM" ? "btn-warning" : "btn-ghost"
          }`}
        >
          Moyenne
        </button>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-base-content/50">
            <span className="loading loading-spinner loading-md text-primary" />
            <p className="mt-2">Analyse de la qualité en cours...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-base-200 bg-base-100 p-8 text-center text-xs text-base-content/50">
            Aucune alerte qualité trouvée.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 transition ${
                item.resolu
                  ? "border-base-200 bg-base-100 opacity-60"
                  : item.severity === "HIGH"
                  ? "border-rose-200 bg-rose-50/30"
                  : "border-amber-200 bg-amber-50/30"
              }`}
            >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge badge-sm font-semibold ${
                      item.severity === "HIGH"
                        ? "badge-error"
                        : item.severity === "MEDIUM"
                        ? "badge-warning"
                        : "badge-ghost"
                    }`}
                  >
                    {item.type}
                  </span>
                  <span className="font-bold text-sm">{item.title}</span>
                  {item.resolu && (
                    <span className="badge badge-xs badge-success">Résolu</span>
                  )}
                </div>

                <p className="text-xs text-base-content/70">
                  {item.description}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-base-content/50 pt-1">
                  <span>Territoire : {item.fokontany}</span>
                  <span>Agent : {item.agent}</span>
                  <span>Date : {item.date}</span>
                </div>
              </div>

              {!item.resolu && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResolve(item.id)}
                    className="btn btn-sm btn-ghost gap-1 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Check size={14} />
                    Résoudre
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
}
