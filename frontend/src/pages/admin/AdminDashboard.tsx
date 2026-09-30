import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  MapPin,
  TrendingUp,
  UserCheck,
  Users,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminDashboardStats,
  getAdminFokontanyStats,
  getAdminRecensements,
} from "../../services/adminService";
import type {
  AdminDashboardStats,
  AdminFokontanyStatItem,
  AdminRecensementItem,
} from "../../types/admin";

const EMPTY_STATS: AdminDashboardStats = {
  fokontany: 0,
  agentsActifs: 0,
  agentsTotal: 0,
  personnesRecensees: 0,
  recensementsAujourdhui: 0,
  aVerifier: 0,
  valides: 0,
  rejets: 0,
  demandesChefEnAttente: 0,
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";

  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `Il y a ${hours} h`;

  return new Date(iso).toLocaleDateString("fr-FR");
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass = "bg-primary/10 text-primary",
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  iconClass?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-base-300 bg-base-100 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-base-content/60">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>

          <p className="mt-2 text-xs text-base-content/50">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
        Voir les détails
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats>(EMPTY_STATS);
  const [fokontanyStats, setFokontanyStats] = useState<AdminFokontanyStatItem[]>([]);
  const [recensements, setRecensements] = useState<AdminRecensementItem[]>([]);
  const [error, setError] = useState("");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError("");

        const [s, f, r] = await Promise.all([
          getAdminDashboardStats(),
          getAdminFokontanyStats(),
          getAdminRecensements(),
        ]);

        setStats(s);
        setFokontanyStats(f);
        setRecensements(r.slice(0, 6));
        setSyncedAt(new Date());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger le tableau de bord.",
        );
      }
    }

    void load();
  }, []);

  const totalFiches = stats.valides + stats.aVerifier + stats.rejets;
  const tauxValidation = totalFiches
    ? Math.round((stats.valides / totalFiches) * 100)
    : 0;

  const recentActivities = recensements.map((item) => ({
    key: item.id,
    agent: item.agent_nom,
    matricule: item.agent_matricule,
    action: `Fiche ${item.numero_fiche} — ${item.nom} ${item.prenoms}`,
    fokontany: item.fokontany_nom,
    time: formatRelative(item.created_at),
    type: item.statut === "REJETE" ? "warning" : "success",
  }));

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}

      {/* En-tête */}
      <div>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              Supervision du système
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Tableau de bord
            </h1>

            <p className="mt-2 text-sm text-base-content/60">
              Vue globale de l'activité du recensement.
            </p>
          </div>

          <div className="rounded-xl border border-base-300 bg-base-100 px-4 py-3">
            <p className="text-xs text-base-content/50">
              Dernière synchronisation
            </p>

            <p className="mt-1 text-sm font-semibold">
              {syncedAt
                ? syncedAt.toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">
            Vue générale
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Fokontany"
            value={stats.fokontany}
            description="Territoires configurés"
            icon={MapPin}
            onClick={() => navigate("/admin/territoires")}
          />

          <StatCard
            title="Agents actifs"
            value={`${stats.agentsActifs}/${stats.agentsTotal}`}
            description="Agents actuellement actifs"
            icon={Users}
            iconClass="bg-success/10 text-success"
            onClick={() => navigate("/admin/agents")}
          />

          <StatCard
            title="Personnes recensées"
            value={stats.personnesRecensees.toLocaleString("fr-FR")}
            description="Total des personnes enregistrées"
            icon={UserCheck}
            iconClass="bg-info/10 text-info"
            onClick={() => navigate("/admin/recensements")}
          />

          <StatCard
            title="Aujourd'hui"
            value={stats.recensementsAujourdhui}
            description="Recensements réalisés aujourd'hui"
            icon={Activity}
            iconClass="bg-warning/10 text-warning"
            onClick={() => navigate("/admin/recensements")}
          />
        </div>
      </section>

      {/* Deuxième ligne */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <p className="text-xs text-base-content/50">Fiches validées</p>
              <p className="text-xl font-bold">
                {stats.valides.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <progress
              className="progress progress-success w-full"
              value={tauxValidation}
              max={100}
            />
            <p className="mt-2 text-xs text-base-content/50">
              {tauxValidation} % des fiches sont validées
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/recensements")}
          className="rounded-2xl border border-warning/20 bg-base-100 p-5 text-left shadow-sm transition hover:border-warning/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Clock3 size={20} />
            </div>

            <div>
              <p className="text-xs text-base-content/50">À vérifier</p>

              <p className="text-xl font-bold">{stats.aVerifier}</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-warning">
            Nécessite une vérification manuelle
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/controle")}
          className="rounded-2xl border border-error/20 bg-base-100 p-5 text-left shadow-sm transition hover:border-error/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error">
              <AlertTriangle size={20} />
            </div>

            <div>
              <p className="text-xs text-base-content/50">Alertes qualité</p>

              <p className="text-xl font-bold">{stats.rejets}</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-error">
            Doublons ou anomalies détectés
          </p>
        </button>
      </section>

      {/* Fokontany + activité */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Fokontany */}
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-base-300 p-5">
            <div>
              <h2 className="font-bold">Recensements par Fokontany</h2>

              <p className="mt-1 text-xs text-base-content/50">
                Suivi de la progression territoriale
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/statistiques")}
              className="btn btn-ghost btn-sm text-primary"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-base-300">
            {fokontanyStats.map((fokontany) => (
              <div key={fokontany.nom} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {fokontany.nom}
                    </p>

                    <p className="mt-1 truncate text-xs text-base-content/50">
                      {fokontany.commune}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-bold">
                    {fokontany.total.toLocaleString("fr-FR")}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <progress
                    className="progress progress-primary h-2 flex-1"
                    value={fokontany.progression}
                    max={100}
                  />

                  <span className="w-10 text-right text-xs font-medium text-base-content/50">
                    {fokontany.progression}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activité */}
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="flex items-center justify-between border-b border-base-300 p-5">
            <div>
              <h2 className="font-bold">Activité récente</h2>

              <p className="mt-1 text-xs text-base-content/50">
                Dernières opérations des agents
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/audit")}
              className="btn btn-ghost btn-sm text-primary"
            >
              Historique
            </button>
          </div>

          <div className="divide-y divide-base-300">
            {recentActivities.map((activity) => (
              <div key={activity.key} className="flex gap-4 p-5">
                <div
                  className={`
                    mt-1 flex h-9 w-9 shrink-0
                    items-center justify-center rounded-full
                    ${
                      activity.type === "success"
                        ? "bg-success/10 text-success"
                        : activity.type === "warning"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                    }
                  `}
                >
                  {activity.type === "warning" ? (
                    <AlertTriangle size={17} />
                  ) : (
                    <FileCheck2 size={17} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{activity.agent}</p>

                  <p className="mt-1 text-xs text-base-content/60">
                    {activity.action}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-base-content/40">
                    <span>{activity.matricule}</span>
                    <span>•</span>
                    <span>{activity.fokontany}</span>
                  </div>
                </div>

                <span className="shrink-0 text-[11px] text-base-content/40">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau système */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp size={20} />
            </div>

            <div>
              <h3 className="font-semibold">
                Système de recensement opérationnel
              </h3>

              <p className="mt-1 text-sm text-base-content/60">
                Les agents peuvent actuellement effectuer les opérations de
                recensement et de validation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/statistiques")}
            className="btn btn-primary btn-sm"
          >
            Consulter les statistiques
          </button>
        </div>
      </section>
    </div>
  );
}
