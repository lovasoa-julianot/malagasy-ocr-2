import { useState } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  BarChart3,
  MapPin,
  Sparkles,
} from "lucide-react";
import AdminStatsCard from "../../components/admin/AdminStatsCard";

export default function AdminStatistiques() {
  const [period, setPeriod] = useState<"WEEK" | "MONTH" | "GLOBAL">("MONTH");

  const regionalData = [
    { region: "Haute Matsiatra", recensees: 4520, objectif: 5000, pct: 90 },
    { region: "Analamanga", recensees: 3840, objectif: 4500, pct: 85 },
    { region: "Boeny", recensees: 2150, objectif: 3000, pct: 72 },
    { region: "Atsinanana", recensees: 1948, objectif: 2800, pct: 70 },
  ];

  const dailyTrend = [
    { day: "Lun", count: 280 },
    { day: "Mar", count: 342 },
    { day: "Mer", count: 395 },
    { day: "Jeu", count: 310 },
    { day: "Ven", count: 420 },
    { day: "Sam", count: 260 },
    { day: "Dim", count: 140 },
  ];

  const maxDaily = Math.max(...dailyTrend.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Analyse décisionnelle</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Statistiques & Rapports
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Progression de la campagne de recensement, démographie et performance OCR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="join">
            <button
              type="button"
              onClick={() => setPeriod("WEEK")}
              className={`join-item btn btn-sm ${
                period === "WEEK" ? "btn-primary" : "btn-ghost"
              }`}
            >
              7 jours
            </button>
            <button
              type="button"
              onClick={() => setPeriod("MONTH")}
              className={`join-item btn btn-sm ${
                period === "MONTH" ? "btn-primary" : "btn-ghost"
              }`}
            >
              Ce mois
            </button>
            <button
              type="button"
              onClick={() => setPeriod("GLOBAL")}
              className={`join-item btn btn-sm ${
                period === "GLOBAL" ? "btn-primary" : "btn-ghost"
              }`}
            >
              Total
            </button>
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Total recensés"
          value="12 458"
          description="Personnes répertoriées"
          icon={Users}
          trend={{ value: "14%", positive: true }}
          variant="primary"
        />
        <AdminStatsCard
          title="Taux de validation"
          value="98.6 %"
          description="Fiches conformes"
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatsCard
          title="Précision moyenne OCR"
          value="95.4 %"
          description="Lecture automatique CIN"
          icon={Sparkles}
          variant="info"
        />
        <AdminStatsCard
          title="Rythme quotidien"
          value="342 fiches"
          description="Moyenne sur 7 jours"
          icon={TrendingUp}
          trend={{ value: "8%", positive: true }}
          variant="warning"
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progression par région */}
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">Couverture par Région</h2>
              <p className="text-xs text-base-content/50">
                Avancement par rapport aux objectifs de population
              </p>
            </div>
            <MapPin size={18} className="text-primary" />
          </div>

          <div className="mt-6 space-y-4">
            {regionalData.map((reg) => (
              <div key={reg.region} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-base-content/80">
                    {reg.region}
                  </span>
                  <span className="text-base-content/60">
                    {reg.recensees.toLocaleString("fr-FR")} /{" "}
                    {reg.objectif.toLocaleString("fr-FR")} ({reg.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-base-200">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${reg.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rythme d'enregistrement hebdomadaire */}
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base">Activité quotidienne</h2>
              <p className="text-xs text-base-content/50">
                Fiches saisies sur les 7 derniers jours
              </p>
            </div>
            <BarChart3 size={18} className="text-emerald-500" />
          </div>

          <div className="mt-8 flex h-44 items-end justify-between gap-3 px-2">
            {dailyTrend.map((d) => {
              const heightPct = Math.round((d.count / maxDaily) * 100);
              return (
                <div
                  key={d.day}
                  className="flex flex-1 flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-[11px] font-semibold text-base-content/70">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-emerald-500/80 hover:bg-emerald-500 transition"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-xs text-base-content/50">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Démographie */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
          <h2 className="font-bold text-base">Répartition par sexe</h2>
          <p className="text-xs text-base-content/50 mb-4">Parité de l'échantillon</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Femmes (51.2%)</span>
                <span className="font-semibold">6 378</span>
              </div>
              <progress className="progress progress-secondary w-full" value={51} max={100} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Hommes (48.8%)</span>
                <span className="font-semibold">6 080</span>
              </div>
              <progress className="progress progress-primary w-full" value={49} max={100} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
          <h2 className="font-bold text-base">Tranches d'âge</h2>
          <p className="text-xs text-base-content/50 mb-4">Distribution citoyenne</p>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-base-200">
              <span className="text-base-content/60">18 - 25 ans</span>
              <span className="font-semibold">32 %</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-200">
              <span className="text-base-content/60">26 - 40 ans</span>
              <span className="font-semibold">38 %</span>
            </div>
            <div className="flex justify-between py-1 border-b border-base-200">
              <span className="text-base-content/60">41 - 60 ans</span>
              <span className="font-semibold">20 %</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-base-content/60">+ de 60 ans</span>
              <span className="font-semibold">10 %</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
          <h2 className="font-bold text-base">État des fiches</h2>
          <p className="text-xs text-base-content/50 mb-4">Qualité des enregistrements</p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-base-200">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 size={13} /> Validées directement
              </span>
              <span className="font-bold">96.4 %</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-base-200">
              <span className="flex items-center gap-1.5 text-amber-600">
                Correction manuelle
              </span>
              <span className="font-bold">2.8 %</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-rose-600">
                Rejetées / Anomalies
              </span>
              <span className="font-bold">0.8 %</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
