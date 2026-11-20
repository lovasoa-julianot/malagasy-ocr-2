import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  getAdminAuditLogMeta,
  getAdminAuditLogs,
} from "../../services/adminService";
import type {
  AdminAuditFilterOption,
  AdminAuditLogMeta,
  AdminAuditLogPage,
} from "../../types/admin";

const PAGE_SIZE = 25;

const EMPTY_PAGE: AdminAuditLogPage = {
  items: [],
  total: 0,
  limit: PAGE_SIZE,
  offset: 0,
  page: 1,
  pages: 0,
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "badge-primary",
  CHEF_FOKONTANY: "badge-secondary",
  AGENT: "badge-neutral",
  SYSTEM: "badge-ghost",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  CHEF_FOKONTANY: "Chef Fokontany",
  AGENT: "Agent",
  SYSTEM: "Système",
};

const OUTCOME_STYLES: Record<string, string> = {
  SUCCESS: "text-emerald-600",
  FAILURE: "text-rose-600",
};

interface Filtres {
  search: string;
  action: string;
  resource_type: string;
  user_type: string;
  outcome: string;
  fokontany_id: string;
  date_debut: string;
  date_fin: string;
}

const FILTRES_VIDES: Filtres = {
  search: "",
  action: "",
  resource_type: "",
  user_type: "",
  outcome: "",
  fokontany_id: "",
  date_debut: "",
  date_fin: "",
};

function filtresActifs(filtres: Filtres) {
  return Object.entries(filtres).filter(
    ([cle, valeur]) => valeur !== "" && cle !== "search",
  ).length;
}

/**
 * Le journal vit sur plusieurs jours : la borne haute est
 * unease à 23:59:59 pour inclure la journée entière.
 */
function dateFinExhaustive(date: string) {
  return date ? `${date}T23:59:59` : "";
}

function exportCsv(rows: AdminAuditLogPage["items"], nomFichier: string) {
  if (rows.length === 0) return;

  const entetes = [
    "Horodatage",
    "Acteur",
    "Profil",
    "Action",
    "Ressource",
    "Ressource (id)",
    "Fokontany",
    "Région",
    "Adresse IP",
    "Résultat",
    "Durée (ms)",
    "Détails",
  ];

  const echapper = (valeur: string | number | null | undefined) =>
    `"${String(valeur ?? "")
      .replace(/"/g, '""')
      .replace(/\r?\n/g, " ")}"`;

  const lignes = rows.map((log) =>
    [
      new Date(log.timestamp).toLocaleString("fr-FR"),
      log.user_name,
      log.user_type,
      log.action,
      log.resource_type,
      log.resource_id ?? "",
      log.fokontany_nom ?? "",
      log.region ?? "",
      log.ip_address ?? "",
      log.outcome ?? "",
      log.duration_ms ?? "",
      log.details,
    ]
      .map(echapper)
      .join(";"),
  );

  // Le BOM garantit l'ouverture correcte dans Excel.
  const contenu = `\uFEFF${entetes.map(echapper).join(";")}\n${lignes.join("\n")}`;

  const blob = new Blob([contenu], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");

  lien.href = url;
  lien.download = nomFichier;
  lien.click();

  URL.revokeObjectURL(url);
}

export default function AdminAuditLogs() {
  const [page, setPage] = useState<AdminAuditLogPage>(EMPTY_PAGE);
  const [meta, setMeta] = useState<AdminAuditLogMeta | null>(null);
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [recherche, setRecherche] = useState("");
  const [rechercheAppliquee, setRechercheAppliquee] = useState("");
  const [offset, setOffset] = useState(0);
  const [showFiltres, setShowFiltres] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);

  const majFiltre = useCallback(
    (cle: keyof Filtres, valeur: string) => {
      setFiltres((precedent) => ({ ...precedent, [cle]: valeur }));
      setOffset(0);
    },
    [],
  );

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAdminAuditLogs({
        action: filtres.action || undefined,
        resource_type: filtres.resource_type || undefined,
        user_type: filtres.user_type || undefined,
        outcome: filtres.outcome || undefined,
        fokontany_id: filtres.fokontany_id || undefined,
        search: rechercheAppliquee.trim() || undefined,
        date_debut: filtres.date_debut
          ? `${filtres.date_debut}T00:00:00`
          : undefined,
        date_fin: dateFinExhaustive(filtres.date_fin) || undefined,
        limit: PAGE_SIZE,
        offset,
      });

      setPage(data);
      setSyncedAt(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger le journal d’audit.",
      );
      setPage(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [filtres, rechercheAppliquee, offset]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    let annule = false;

    async function loadMeta() {
      try {
        const data = await getAdminAuditLogMeta();

        if (!annule) setMeta(data);
      } catch {
        // Les filtres restent utilisables même sans métadonnées :
        // l'échec est silencieux pour ne pas masquer le journal.
      }
    }

    void loadMeta();

    return () => {
      annule = true;
    };
  }, []);

  // La recherche est différée pour ne pas interroger l'API
  // à chaque frappe clavier.
  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRechercheAppliquee(recherche);
      setOffset(0);
    }, 350);

    return () => clearTimeout(minuteur);
  }, [recherche]);

  const nbFiltres = useMemo(() => filtresActifs(filtres), [filtres]);

  const reinitialiser = () => {
    setFiltres(FILTRES_VIDES);
    setRecherche("");
    setOffset(0);
  };

  const optionsFokontany: AdminAuditFilterOption[] =
    meta?.fokontany ?? [];

  const pageCourante = page.pages > 0 ? page.page : 0;
  const premiereLigne = page.total === 0 ? 0 : offset + 1;
  const derniereLigne = Math.min(offset + PAGE_SIZE, page.total);

  async function handleExport() {
    setExporting(true);

    try {
      // L'export porte sur l'intégralité du résultat filtré,
      // pas sur la seule page affichée.
      const data = await getAdminAuditLogs({
        action: filtres.action || undefined,
        resource_type: filtres.resource_type || undefined,
        user_type: filtres.user_type || undefined,
        outcome: filtres.outcome || undefined,
        fokontany_id: filtres.fokontany_id || undefined,
        search: rechercheAppliquee.trim() || undefined,
        date_debut: filtres.date_debut
          ? `${filtres.date_debut}T00:00:00`
          : undefined,
        date_fin: dateFinExhaustive(filtres.date_fin) || undefined,
        limit: 200,
      });

      exportCsv(data.items, "journal-audit.csv");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’exporter le journal d’audit.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">
            Traçabilité & Sécurité
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Journal d'audit
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Historique des actions effectuées par les administrateurs, les chefs
            Fokontany et les agents de terrain.
          </p>
          {meta && (
            <p className="mt-1 text-xs text-base-content/40">
              {meta.total_evenements.toLocaleString("fr-FR")} événements
              enregistrés
              {meta.premiere_trace &&
                ` · depuis le ${new Date(
                  meta.premiere_trace,
                ).toLocaleDateString("fr-FR")}`}
              {syncedAt &&
                ` · consultation du ${syncedAt.toLocaleString("fr-FR")}`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            className="btn btn-ghost btn-sm"
            disabled={exporting || page.total === 0}
          >
            {exporting ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Download size={14} />
            )}
            Exporter
          </button>

          <button
            type="button"
            onClick={() => void loadLogs()}
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
            onClick={() => void loadLogs()}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Recherche et filtres */}
      <div className="space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
            />
            <input
              type="text"
              placeholder="Rechercher dans les détails, la ressource ou l'adresse IP..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="input input-bordered w-full pl-10 text-sm"
            />
          </div>

          <select
            value={filtres.user_type}
            onChange={(e) => majFiltre("user_type", e.target.value)}
            className="select select-bordered text-xs"
            aria-label="Filtrer par profil"
          >
            <option value="">Tous les profils</option>
            {(meta?.user_types ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowFiltres((value) => !value)}
            className={`btn btn-sm ${showFiltres ? "btn-primary" : "btn-ghost"}`}
          >
            <Filter size={14} />
            Filtres
            {nbFiltres > 0 && (
              <span className="badge badge-xs badge-primary">
                {nbFiltres}
              </span>
            )}
          </button>

          {(nbFiltres > 0 || recherche) && (
            <button
              type="button"
              onClick={reinitialiser}
              className="btn btn-ghost btn-sm"
            >
              <X size={14} />
              Réinitialiser
            </button>
          )}
        </div>

        {showFiltres && (
          <div className="grid gap-3 border-t border-base-200 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="form-control">
              <span className="mb-1 text-[11px] font-medium text-base-content/60">
                Action
              </span>
              <select
                value={filtres.action}
                onChange={(e) => majFiltre("action", e.target.value)}
                className="select select-bordered select-sm text-xs"
              >
                <option value="">Toutes les actions</option>
                {(meta?.actions ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="mb-1 text-[11px] font-medium text-base-content/60">
                Ressource
              </span>
              <select
                value={filtres.resource_type}
                onChange={(e) =>
                  majFiltre("resource_type", e.target.value)
                }
                className="select select-bordered select-sm text-xs"
              >
                <option value="">Toutes les ressources</option>
                {(meta?.resource_types ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="mb-1 text-[11px] font-medium text-base-content/60">
                Résultat
              </span>
              <select
                value={filtres.outcome}
                onChange={(e) => majFiltre("outcome", e.target.value)}
                className="select select-bordered select-sm text-xs"
              >
                <option value="">Tous les résultats</option>
                <option value="SUCCESS">Réussis</option>
                <option value="FAILURE">Échecs</option>
              </select>
            </label>

            <label className="form-control">
              <span className="mb-1 text-[11px] font-medium text-base-content/60">
                Fokontany
              </span>
              <select
                value={filtres.fokontany_id}
                onChange={(e) =>
                  majFiltre("fokontany_id", e.target.value)
                }
                className="select select-bordered select-sm text-xs"
              >
                <option value="">Tous les territoires</option>
                {optionsFokontany.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="mb-1 text-[11px] font-medium text-base-content/60">
                Du
              </span>
              <input
                type="date"
                value={filtres.date_debut}
                onChange={(e) =>
                  majFiltre("date_debut", e.target.value)
                }
                className="input input-bordered input-sm text-xs"
              />
            </label>

            <label className="form-control">
              <span className="mb-1 text-[11px] font-medium text-base-content/60">
                Au
              </span>
              <input
                type="date"
                value={filtres.date_fin}
                onChange={(e) => majFiltre("date_fin", e.target.value)}
                className="input input-bordered input-sm text-xs"
              />
            </label>
          </div>
        )}
      </div>

      {/* Tableau des logs */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                <th>Date / Heure</th>
                <th>Utilisateur</th>
                <th>Profil</th>
                <th>Action</th>
                <th>Ressource</th>
                <th>Détails de l'opération</th>
                <th>Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-xs text-base-content/50"
                  >
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="mt-2">Chargement du journal...</p>
                  </td>
                </tr>
              ) : page.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-xs text-base-content/50"
                  >
                    {nbFiltres > 0 || recherche
                      ? "Aucun événement ne correspond à ces critères."
                      : "Le journal d'audit est vide."}
                  </td>
                </tr>
              ) : (
                page.items.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-base-200/60 text-xs transition hover:bg-base-200/30"
                  >
                    <td className="whitespace-nowrap font-mono text-[11px] text-base-content/60">
                      {new Date(log.timestamp).toLocaleString("fr-FR")}
                    </td>

                    <td>
                      <span
                        className={`font-semibold ${
                          OUTCOME_STYLES[log.outcome ?? ""] ?? ""
                        }`}
                      >
                        {log.user_name}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge badge-xs font-semibold ${
                          ROLE_STYLES[log.user_type] ?? "badge-ghost"
                        }`}
                      >
                        {ROLE_LABELS[log.user_type] ?? log.user_type}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-sm badge-outline font-mono">
                        {log.action_label}
                      </span>
                      {log.outcome === "FAILURE" && (
                        <span className="ml-1 badge badge-xs badge-error font-semibold">
                          échec
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap text-base-content/60">
                      {log.resource_type_label}
                      {log.duration_ms !== null &&
                        log.duration_ms !== undefined && (
                          <p className="text-[11px] text-base-content/40">
                            {log.duration_ms} ms
                          </p>
                        )}
                    </td>

                    <td className="max-w-md">
                      <p className="text-base-content/80">{log.details}</p>
                      {log.fokontany_nom && (
                        <p className="mt-0.5 text-[11px] text-base-content/40">
                          Fokontany : {log.fokontany_nom}
                          {log.region ? ` (${log.region})` : ""}
                        </p>
                      )}
                    </td>

                    <td className="font-mono text-[11px] text-base-content/50">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {page.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-base-200 px-4 py-3 text-xs text-base-content/60 sm:flex-row">
            <span>
              {premiereLigne.toLocaleString("fr-FR")} –{" "}
              {derniereLigne.toLocaleString("fr-FR")} sur{" "}
              {page.total.toLocaleString("fr-FR")} événements
            </span>

            <div className="join">
              <button
                type="button"
                className="btn btn-xs join-item"
                disabled={pageCourante <= 1 || loading}
                onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}
              >
                <ChevronLeft size={14} />
                Précédent
              </button>
              <span className="btn btn-xs join-item pointer-events-none no-animation">
                Page {pageCourante} / {page.pages}
              </span>
              <button
                type="button"
                className="btn btn-xs join-item"
                disabled={pageCourante >= page.pages || loading}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Suivant
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}