import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import {
  getAdminStatistiques,
  getAdminStatistiquesAudit,
} from "../../services/adminService";
import type {
  AdminAuditStats,
  AdminKpi,
  AdminStatistiques,
  StatistiquesPeriode,
} from "../../types/admin";

type Periode = StatistiquesPeriode;

const PERIODES: { value: Periode; label: string }[] = [
  { value: "WEEK", label: "7 jours" },
  { value: "MONTH", label: "30 jours" },
  { value: "GLOBAL", label: "Total" },
];

const EMPTY_STATISTIQUES: AdminStatistiques = {
  periode: "MONTH",
  periode_libelle: "",
  date_debut: "",
  date_fin: "",
  genere_le: "",
  kpis: {},
  couverture_regions: [],
  activite_quotidienne: [],
  demographie: {
    total: 0,
    hommes: 0,
    femmes: 0,
    autres: 0,
    pourcentage_hommes: 0,
    pourcentage_femmes: 0,
    tranches_age: [],
  },
  repartition_statuts: [],
  top_agents: [],
  fokontany: [],
};

function formatNombre(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits });
}

function formatPourcentage(value: number) {
  return `${formatNombre(value, 1)} %`;
}

/**
 * Traduit une variation renvoyée par l'API en carte KPI.
 * Une variation absente (période de référence vide) masque
 * la comparaison plutôt que d'afficher un « +0 % » trompeur.
 */
function buildTrend(kpi: AdminKpi | undefined) {
  if (!kpi || kpi.variation === null || kpi.variation === undefined) {
    return undefined;
  }

  return {
    value: formatNombre(Math.abs(kpi.variation), 1),
    positive: kpi.variation >= 0,
    label: kpi.comparaison || undefined,
  };
}

export default function AdminStatistiques() {
  const [periode, setPeriode] = useState<Periode>("MONTH");
  const [stats, setStats] = useState<AdminStatistiques>(EMPTY_STATISTIQUES);
  const [auditStats, setAuditStats] = useState<AdminAuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [donnees, audit] = await Promise.all([
        getAdminStatistiques(periode),
        getAdminStatistiquesAudit(periode),
      ]);

      setStats(donnees);
      setAuditStats(audit);
      setSyncedAt(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les statistiques.",
      );
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const kpis = stats.kpis;

  const maxActivite = useMemo(
    () =>
      Math.max(
        1,
        ...stats.activite_quotidienne.map((jour) => jour.total),
      ),
    [stats.activite_quotidienne],
  );

  // Sur une série longue, l'axe temporel deviendrait illisible :
  // seul un libellé de jour sur N est affiché.
  const pasLibelle = Math.max(
    1,
    Math.ceil(stats.activite_quotidienne.length / 10),
  );

  const maxAudit = useMemo(
    () =>
      Math.max(
        1,
        ...(auditStats?.activite_journaliere.map((jour) => jour.total) ?? [0]),
      ),
    [auditStats],
  );

  const precisionOcr = kpis.precision_ocr;
  const precisionIndisponible = !precisionOcr || precisionOcr.observations === 0;

  const totalStatuts = useMemo(
    () =>
      stats.repartition_statuts.reduce(
        (total, item) => total + item.effectif,
        0,
      ),
    [stats.repartition_statuts],
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            Analyse décisionnelle
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Statistiques & KPIs
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            {stats.periode_libelle
              ? `Progression de la campagne sur la période « ${stats.periode_libelle} ».`
              : "Progression de la campagne de recensement, démographie et performance OCR."}
          </p>
          {syncedAt && (
            <p className="mt-1 text-xs text-base-content/40">
              Données arrêtées au {syncedAt.toLocaleString("fr-FR")} ·
              Extraction du {stats.date_fin || "—"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="join">
            {PERIODES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriode(item.value)}
                className={`join-item btn btn-sm ${
                  periode === item.value ? "btn-primary" : "btn-ghost"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadStats()}
            className="btn btn-ghost btn-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error">
          <ShieldAlert size={18} />
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void loadStats()}
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-base-300 bg-base-100 py-24">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-3 text-sm text-base-content/60">
            Calcul des indicateurs...
          </p>
        </div>
      ) : (
        <>
          {/* Cartes KPI */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatsCard
              title="Fiches enregistrées"
              value={formatNombre(kpis.fiches_enregistrees?.valeur ?? 0)}
              description={`${formatNombre(
                kpis.personnes_recensees?.valeur ?? 0,
              )} personnes répertoriées au total`}
              icon={Users}
              trend={buildTrend(kpis.fiches_enregistrees)}
              variant="primary"
            />
            <AdminStatsCard
              title="Taux de validation"
              value={formatPourcentage(kpis.taux_validation?.valeur ?? 0)}
              description={`${formatNombre(
                kpis.en_attente_verification?.valeur ?? 0,
              )} fiche(s) en attente de vérification`}
              icon={CheckCircle2}
              trend={buildTrend(kpis.taux_validation)}
              variant="success"
            />
            <AdminStatsCard
              title="Précision moyenne OCR"
              value={
                precisionIndisponible
                  ? "Non mesurée"
                  : formatPourcentage(precisionOcr?.valeur ?? 0)
              }
              description={
                precisionIndisponible
                  ? "Aucune fiche enregistrée avec une mesure de relecture"
                  : `Moyenne sur ${formatNombre(
                      precisionOcr?.observations ?? 0,
                    )} fiche(s) relue(s) par l'agent`
              }
              icon={Sparkles}
              trend={precisionIndisponible ? undefined : buildTrend(precisionOcr)}
              variant="info"
            />
            <AdminStatsCard
              title="Rythme quotidien"
              value={`${formatNombre(
                kpis.rythme_quotidien?.valeur ?? 0,
                1,
              )} fiches`}
              description={
                kpis.rythme_quotidien?.observations
                  ? `Moyenne sur ${formatNombre(
                      stats.activite_quotidienne.length,
                    )} derniers jours`
                  : "Aucune fiche sur la période"
              }
              icon={TrendingUp}
              variant="warning"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <AdminStatsCard
              title="Agents en activité"
              value={formatNombre(kpis.agents_actifs?.valeur ?? 0)}
              description={`sur ${formatNombre(
                kpis.agents_actifs?.observations ?? 0,
              )} agents enregistrés`}
              icon={Users}
              variant="primary"
            />
            <AdminStatsCard
              title="Fokontany actifs"
              value={formatNombre(kpis.fokontany_actifs?.valeur ?? 0)}
              description={`sur ${formatNombre(
                kpis.fokontany_actifs?.observations ?? 0,
              )} territoires configurés`}
              icon={MapPin}
              variant="info"
            />
            <AdminStatsCard
              title="Couverture du territoire"
              value={formatPourcentage(
                kpis.couverture_territoire?.valeur ?? 0,
              )}
              description={`${formatNombre(
                kpis.couverture_territoire?.observations ?? 0,
              )} habitants ciblés sur l'ensemble des Fokontany`}
              icon={BarChart3}
              variant="success"
            />
          </div>

          {/* Couverture par région + activité quotidienne */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base">
                    Couverture par Région
                  </h2>
                  <p className="text-xs text-base-content/50">
                    Fiches enregistrées face aux objectifs de population
                  </p>
                </div>
                <MapPin size={18} className="text-primary" />
              </div>

              <div className="mt-6 space-y-4">
                {stats.couverture_regions.length === 0 ? (
                  <p className="py-8 text-center text-xs text-base-content/50">
                    Aucun Fokontany actif à analyser.
                  </p>
                ) : (
                  stats.couverture_regions.map((region) => (
                    <div key={region.region} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-base-content/80">
                          {region.region}
                          <span className="ml-2 font-normal text-base-content/40">
                            {region.fokontany} Fokontany
                          </span>
                        </span>
                        <span className="text-base-content/60">
                          {formatNombre(region.recensees)}
                          {region.objectif > 0 && (
                            <>
                              {" / "}
                              {formatNombre(region.objectif)} (
                              {formatNombre(region.taux, 1)} %)
                            </>
                          )}
                          {region.objectif === 0 && (
                            <span className="ml-1 text-amber-600">
                              objectif non défini
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-base-200">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${Math.min(Math.max(region.taux, 0), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base">
                    Activité quotidienne
                  </h2>
                  <p className="text-xs text-base-content/50">
                    Fiches enregistrées · validées · rejetées
                  </p>
                </div>
                <BarChart3 size={18} className="text-emerald-500" />
              </div>

              <div className="mt-8 flex h-44 items-end justify-between gap-1 overflow-x-auto px-2">
                {stats.activite_quotidienne.length === 0 ? (
                  <p className="w-full py-10 text-center text-xs text-base-content/50">
                    Aucune donnée sur la période.
                  </p>
                ) : (
                  stats.activite_quotidienne.map((jour, index) => (
                    <div
                      key={jour.date}
                      className="flex h-full min-w-[18px] flex-1 flex-col items-center justify-end gap-1"
                      title={`${jour.libelle} : ${jour.total} fiche(s), ${jour.valides} validée(s), ${jour.rejets} rejetée(s)`}
                    >
                      <span className="text-[10px] font-semibold text-base-content/70">
                        {jour.total > 0 ? jour.total : ""}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-emerald-500/80 transition-all hover:bg-emerald-500"
                        style={{
                          height: `${Math.max(
                            (jour.total / maxActivite) * 100,
                            jour.total > 0 ? 6 : 1,
                          )}%`,
                        }}
                      />
                      <span className="text-[9px] text-base-content/50">
                        {index % pasLibelle === 0
                          ? jour.libelle.slice(0, 2)
                          : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Démographie / statuts / journal */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
              <h2 className="font-bold text-base">Répartition par sexe</h2>
              <p className="text-xs text-base-content/50 mb-4">
                {formatNombre(stats.demographie.total)} personne(s) analysée(s)
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>
                      Femmes (
                      {formatNombre(stats.demographie.pourcentage_femmes, 1)} %)
                    </span>
                    <span className="font-semibold">
                      {formatNombre(stats.demographie.femmes)}
                    </span>
                  </div>
                  <progress
                    className="progress progress-secondary w-full"
                    value={stats.demographie.pourcentage_femmes}
                    max={100}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>
                      Hommes (
                      {formatNombre(
                        stats.demographie.pourcentage_hommes,
                        1,
                      )}
                      %)
                    </span>
                    <span className="font-semibold">
                      {formatNombre(stats.demographie.hommes)}
                    </span>
                  </div>
                  <progress
                    className="progress progress-primary w-full"
                    value={stats.demographie.pourcentage_hommes}
                    max={100}
                  />
                </div>
                {stats.demographie.autres > 0 && (
                  <p className="text-[11px] text-base-content/40">
                    {formatNombre(stats.demographie.autres)} personne(s) dont le
                    sexe n'est pas renseigné de façon exploitable.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
              <h2 className="font-bold text-base">Tranches d'âge</h2>
              <p className="text-xs text-base-content/50 mb-4">
                Distribution citoyenne
              </p>

              <div className="space-y-2 text-xs">
                {stats.demographie.tranches_age.map((tranche) => (
                  <div
                    key={tranche.libelle}
                    className="flex justify-between border-b border-base-200 py-1 last:border-b-0"
                  >
                    <span className="text-base-content/60">
                      {tranche.libelle}
                    </span>
                    <span className="font-semibold">
                      {formatNombre(tranche.effectif)} (
                      {formatNombre(tranche.pourcentage, 1)} %)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
              <h2 className="font-bold text-base">État des fiches</h2>
              <p className="text-xs text-base-content/50 mb-4">
                {formatNombre(totalStatuts)} fiche(s) sur la période
              </p>

              <div className="space-y-2 text-xs">
                {stats.repartition_statuts.length === 0 ? (
                  <p className="py-6 text-center text-base-content/50">
                    Aucune fiche enregistrée.
                  </p>
                ) : (
                  stats.repartition_statuts.map((item) => (
                    <div
                      key={item.statut}
                      className="flex items-center justify-between border-b border-base-200 py-1 last:border-b-0"
                    >
                      <span className="text-base-content/60">
                        {item.libelle}
                      </span>
                      <span className="font-bold">
                        {formatNombre(item.effectif)} (
                        {formatNombre(item.pourcentage, 1)} %)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Performance des agents */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
              <div className="border-b border-base-200 px-6 py-4">
                <h2 className="font-bold text-base">
                  Agents les plus productifs
                </h2>
                <p className="text-xs text-base-content/50">
                  Classement calculé sur les fiches de la période
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                      <th>Agent</th>
                      <th>Fokontany</th>
                      <th className="text-right">Fiches</th>
                      <th className="text-right">Validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_agents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-10 text-center text-xs text-base-content/50"
                        >
                          Aucune fiche enregistrée sur la période.
                        </td>
                      </tr>
                    ) : (
                      stats.top_agents.map((agent) => (
                        <tr
                          key={agent.matricule}
                          className="border-b border-base-200/60 text-xs hover:bg-base-200/30 transition"
                        >
                          <td>
                            <p className="font-semibold">
                              {agent.nom} {agent.prenoms}
                            </p>
                            <p className="font-mono text-[11px] text-base-content/40">
                              {agent.matricule}
                            </p>
                          </td>
                          <td className="text-base-content/60">
                            {agent.fokontany}
                            <p className="text-[11px] text-base-content/40">
                              {agent.region}
                            </p>
                          </td>
                          <td className="text-right font-semibold">
                            {formatNombre(agent.fiches)}
                          </td>
                          <td className="text-right">
                            <span
                              className={`font-semibold ${
                                agent.taux_validation >= 80
                                  ? "text-emerald-600"
                                  : agent.taux_validation >= 50
                                    ? "text-amber-600"
                                    : "text-rose-600"
                              }`}
                            >
                              {formatNombre(agent.taux_validation, 1)} %
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agrégats du journal d'audit */}
            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base">
                    Traçabilité des opérations
                  </h2>
                  <p className="text-xs text-base-content/50">
                    Événements enregistrés dans le journal d'audit
                  </p>
                </div>
                <ShieldAlert size={18} className="text-primary" />
              </div>

              {!auditStats || auditStats.total_evenements === 0 ? (
                <p className="py-12 text-center text-xs text-base-content/50">
                  Aucun événement enregistré sur la période.
                </p>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                    <div className="rounded-xl bg-base-200/60 p-3">
                      <p className="text-xl font-bold">
                        {formatNombre(auditStats.total_evenements)}
                      </p>
                      <p className="text-[11px] text-base-content/50">
                        Événements
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 p-3">
                      <p className="text-xl font-bold text-emerald-600">
                        {formatNombre(auditStats.succes)}
                      </p>
                      <p className="text-[11px] text-base-content/50">
                        Réussis
                      </p>
                    </div>
                    <div className="rounded-xl bg-rose-500/10 p-3">
                      <p className="text-xl font-bold text-rose-600">
                        {formatNombre(auditStats.echecs)}
                      </p>
                      <p className="text-[11px] text-base-content/50">
                        Échecs (
                        {formatNombre(auditStats.taux_echec, 1)} %)
                      </p>
                    </div>
                    <div className="rounded-xl bg-base-200/60 p-3">
                      <p className="text-xl font-bold text-base-content/60">
                        {formatNombre(auditStats.sans_resultat)}
                      </p>
                      <p
                        className="text-[11px] text-base-content/50"
                        title="Entrées enregistrées avant le suivi du résultat d'opération"
                      >
                        Sans résultat
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex h-24 items-end gap-1">
                    {auditStats.activite_journaliere.map((jour) => (
                      <div
                        key={jour.date}
                        className="group relative flex h-full min-w-[10px] flex-1 items-end"
                        title={`${jour.libelle} : ${jour.total} événement(s), ${jour.echecs} échec(s)`}
                      >
                        <div
                          className="w-full rounded-t bg-primary/70 transition-all group-hover:bg-primary"
                          style={{
                            height: `${Math.max(
                              (jour.total / maxAudit) * 100,
                              jour.total > 0 ? 8 : 2,
                            )}%`,
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-1.5 text-xs">
                    {auditStats.par_role.map((role) => (
                      <div
                        key={role.cle}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-base-content/60">
                          {role.libelle}
                        </span>
                        <span className="font-semibold">
                          {formatNombre(role.effectif)} (
                          {formatNombre(role.pourcentage, 1)} %)
                        </span>
                      </div>
                    ))}
                  </div>

                  {auditStats.top_acteurs.length > 0 && (
                    <div className="mt-5 border-t border-base-200 pt-4">
                      <p className="text-xs font-semibold text-base-content/70">
                        Acteurs les plus actifs
                      </p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {auditStats.top_acteurs
                          .slice(0, 5)
                          .map((acteur, index) => (
                            <li
                              key={`${acteur.role}-${acteur.libelle}-${index}`}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="truncate text-base-content/60">
                                {acteur.libelle}
                              </span>
                              <span className="font-mono text-base-content/50">
                                {formatNombre(acteur.evenements)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Couverture par Fokontany */}
          {stats.fokontany.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
              <div className="border-b border-base-200 px-6 py-4">
                <h2 className="font-bold text-base">
                  Avancement par Fokontany
                </h2>
                <p className="text-xs text-base-content/50">
                  Fiches validées rapportées à l'objectif de population du
                  territoire
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                      <th>Fokontany</th>
                      <th>Région</th>
                      <th className="text-right">Fiches</th>
                      <th className="text-right">Objectif</th>
                      <th className="w-48">Avancement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.fokontany.map((fokontany) => (
                      <tr
                        key={fokontany.id}
                        className="border-b border-base-200/60 text-xs hover:bg-base-200/30 transition"
                      >
                        <td>
                          <p className="font-semibold">{fokontany.nom}</p>
                          <p className="font-mono text-[11px] text-base-content/40">
                            {fokontany.code}
                          </p>
                        </td>
                        <td className="text-base-content/60">
                          {fokontany.region}
                        </td>
                        <td className="text-right font-semibold">
                          {formatNombre(fokontany.fiches)}
                        </td>
                        <td className="text-right text-base-content/60">
                          {fokontany.objectif > 0
                            ? formatNombre(fokontany.objectif)
                            : "—"}
                        </td>
                        <td>
                          {fokontany.objectif > 0 ? (
                            <div className="flex items-center gap-2">
                              <progress
                                className="progress progress-primary w-full"
                                value={Math.min(fokontany.taux, 100)}
                                max={100}
                              />
                              <span className="w-12 shrink-0 text-right font-semibold">
                                {formatNombre(fokontany.taux, 1)} %
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600">
                              Objectif non renseigné
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}