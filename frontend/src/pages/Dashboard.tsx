import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FilePlus2,
  MapPin,
  ScanLine,
  TrendingUp,
  Users,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getAgentDashboard } from "../services/AgentDashboardService";
import type { AgentDashboardData } from "../services/AgentDashboardService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, description, icon }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500/20">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <TrendingUp size={14} className="text-emerald-400" />
        {description}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "VALIDE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <CheckCircle2 size={13} />
        Validé
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
      <Clock3 size={13} />À vérifier
    </span>
  );
}

export default function Dashboard() {
  const { agent } = useAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<AgentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAgentDashboard();

        if (!cancelled) {
          setDashboard(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger le tableau de bord.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!agent) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page heading */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
            <span>Tableau de bord</span>
            <span>/</span>
            <span className="text-slate-400">{formattedDate}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bonjour, {agent.nom}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Consultez votre activité de recensement, suivez les fiches
            enregistrées et effectuez de nouveaux recensements dans votre
            Fokontany.
          </p>
        </div>

        <button
          onClick={() => navigate("/agent/nouveau")}
          className="
            inline-flex items-center justify-center gap-2
            rounded-xl bg-blue-600 px-5 py-3
            text-sm font-semibold text-white
            shadow-lg shadow-blue-600/20
            transition hover:bg-blue-500
            active:scale-[0.98]
          "
        >
          <FilePlus2 size={18} />
          Nouveau recensement
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Fokontany information */}
      <section className="rounded-2xl border border-blue-500/10 bg-linear-to-r from-blue-600/10 via-slate-900 to-slate-900 p-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <MapPin size={22} />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Fokontany affecté
              </p>

              <h2 className="mt-1 text-lg font-bold text-white">
                {agent.fokontany?.nom}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {agent.fokontany?.commune} · {agent.fokontany?.district}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-slate-800 pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div>
              <p className="text-xs text-slate-500">Code</p>
              <p className="mt-1 font-semibold text-slate-200">
                {agent.fokontany?.code}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Région</p>
              <p className="mt-1 font-semibold text-slate-200">
                {agent.fokontany?.region}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Scans aujourd'hui"
          value={loading ? "..." : (dashboard?.stats.scannedToday ?? 0)}
          description="Documents traités aujourd'hui"
          icon={<ScanLine size={21} />}
        />

        <StatCard
          label="Recensements validés"
          value={loading ? "..." : (dashboard?.stats.registeredToday ?? 0)}
          description="Enregistrements terminés"
          icon={<FileCheck2 size={21} />}
        />

        <StatCard
          label="Total recensé"
          value={loading ? "..." : (dashboard?.stats.total ?? 0)}
          description="Personnes enregistrées"
          icon={<Users size={21} />}
        />
      </section>

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Recent activity */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h2 className="font-semibold text-white">Activité récente</h2>

              <p className="mt-1 text-xs text-slate-500">
                Derniers recensements enregistrés
              </p>
            </div>

            <button
              onClick={() => {
                // Navigation vers Historique à connecter plus tard.
              }}
              className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Chargement de l'activité...
              </div>
            ) : error ? (
              <div className="px-5 py-8 text-center text-sm text-red-400">
                {error}
              </div>
            ) : dashboard?.recentActivity.length ? (
              dashboard.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-blue-400">
                      <FileCheck2 size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        CIN : {item.cin}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-13 sm:pl-0">
                    <span className="text-xs text-slate-500">{item.time}</span>

                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Aucun recensement enregistré.
              </div>
            )}
          </div>
        </div>

        {/* Agent card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Users size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Agent de recensement
                </h2>

                <p className="text-xs text-slate-500">
                  Informations de session
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <InfoRow
                label="Nom complet"
                value={`${agent.nom} ${agent.prenoms}`}
              />

              <InfoRow label="Matricule" value={agent.matricule} />

              <InfoRow
                label="Téléphone"
                value={agent.telephone ?? "—"}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-500">{label}</span>

      <span className="truncate text-right text-sm font-medium text-slate-300">
        {value}
      </span>
    </div>
  );
}
