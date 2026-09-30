import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  Search,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getRecensementHistory,
  type RecensementHistoryItem,
  type RecensementDetail,
  getRecensementDetail,
} from "../services/recensementService";

import RecensementDetailModal from "../components/Recensement/RecensementDetailModal";

type RecensementStatus =
  | "SCANNE"
  | "OCR_EN_COURS"
  | "A_VERIFIER"
  | "MODIFIE"
  | "VALIDE"
  | "REJETE";

export default function Historique() {
  const { agent } = useAuth();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<"TOUS" | RecensementStatus>(
    "TOUS",
  );

  const [recensements, setRecensements] = useState<RecensementHistoryItem[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRecensement, setSelectedRecensement] =
    useState<RecensementDetail | null>(null);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const data = await getRecensementHistory();

        if (!cancelled) {
          setRecensements(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Impossible de charger l'historique.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecensements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recensements.filter((item) => {
      const matchesSearch =
        !query ||
        item.numeroFiche.toLowerCase().includes(query) ||
        item.numeroCin?.toLowerCase().includes(query) ||
        item.nom.toLowerCase().includes(query) ||
        item.prenoms.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "TOUS" || item.statut === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [recensements, search, statusFilter]);

  const total = recensements.length;

  const validated = recensements.filter(
    (item) => item.statut === "VALIDE",
  ).length;

  const pending = recensements.filter(
    (item) => item.statut === "A_VERIFIER",
  ).length;

  async function handleViewRecensement(id: string) {
    try {
      setLoadingDetail(true);
      setDetailError(null);

      const data = await getRecensementDetail(id);

      setSelectedRecensement(data);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "Impossible de charger les détails de la fiche.",
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Recensement</span>
          <span>/</span>
          <span className="text-slate-300">Historique</span>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Historique des recensements
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Consultez les fiches enregistrées dans votre périmètre de
            recensement.
          </p>
        </div>
      </section>

      {/* Context */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <UserRound size={19} />
          </div>

          <div>
            <p className="text-xs text-slate-500">Agent connecté</p>

            <p className="text-sm font-semibold text-slate-200">
              {agent.nom} {agent.prenoms}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {agent.fokontany?.nom}
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-3">
        <MiniStat icon={<FileText size={18} />} label="Total" value={total} />

        <MiniStat
          icon={<CheckCircle2 size={18} />}
          label="Validés"
          value={validated}
          positive
        />

        <MiniStat
          icon={<Clock3 size={18} />}
          label="À vérifier"
          value={pending}
          warning
        />
      </section>

      {/* Search */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom, CIN ou numéro de fiche..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden text-slate-600 sm:block">
              <Filter size={17} />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "TOUS" | RecensementStatus,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500 sm:w-52"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="VALIDE">Validés</option>
              <option value="A_VERIFIER">À vérifier</option>
            </select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">Recensements</h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredRecensements.length} résultat
              {filteredRecensements.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
            <CalendarDays size={14} />
            Année 2026
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-75 items-center justify-center">
            <div className="text-center">
              <span className="loading loading-spinner loading-md text-blue-400" />

              <p className="mt-3 text-sm text-slate-500">
                Chargement de l'historique...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-75 items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-medium text-red-400">
                Impossible de charger l'historique
              </p>

              <p className="mt-2 text-xs text-slate-500">{error}</p>
            </div>
          </div>
        ) : filteredRecensements.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-slate-500">
                      N° fiche
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-slate-500">
                      Personne
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-slate-500">
                      N° CIN
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3 text-xs font-medium text-slate-500">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredRecensements.map((item) => (
                    <TableRow
                      key={item.id}
                      item={item}
                      onView={handleViewRecensement}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-800 md:hidden">
              {filteredRecensements.map((item) => (
                <MobileRow
                  key={item.id}
                  item={item}
                  onView={handleViewRecensement}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <RecensementDetailModal
        data={selectedRecensement}
        loading={loadingDetail}
        error={detailError}
        onClose={() => {
          setSelectedRecensement(null);
          setDetailError(null);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function MiniStat({
  icon,
  label,
  value,
  positive = false,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  positive?: boolean;
  warning?: boolean;
}) {
  const iconClass = positive
    ? "bg-emerald-500/10 text-emerald-400"
    : warning
      ? "bg-amber-500/10 text-amber-400"
      : "bg-blue-500/10 text-blue-400";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>

        <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function TableRow({
  item,
  onView,
}: {
  item: RecensementHistoryItem;
  onView: (id: string) => void;
}) {
  return (
    <tr className="transition hover:bg-slate-800/30">
      <td className="whitespace-nowrap px-5 py-4">
        <span className="font-mono text-sm font-medium text-slate-300">
          {item.numeroFiche}
        </span>
      </td>

      <td className="px-5 py-4">
        <div>
          <p className="text-sm font-medium text-slate-200">{item.nom}</p>

          <p className="mt-0.5 text-xs text-slate-500">{item.prenoms}</p>
        </div>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <span className="font-mono text-xs text-slate-400">
          {item.numeroCin}
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <p className="text-xs text-slate-400">{item.date}</p>

        <p className="mt-0.5 text-[11px] text-slate-600">{item.heure}</p>
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <StatusBadge status={item.statut} />
      </td>

      <td className="px-5 py-4 text-right">
        <button
          onClick={() => onView(item.id)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <Eye size={14} />
          Consulter
        </button>
      </td>
    </tr>
  );
}

function MobileRow({
  item,
  onView,
}: {
  item: RecensementHistoryItem;
  onView: (id: string) => void;
}) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-blue-400">
            Fiche {item.numeroFiche}
          </p>

          <h3 className="mt-2 text-sm font-semibold text-slate-200">
            {item.nom}
          </h3>

          <p className="mt-1 text-xs text-slate-500">{item.prenoms}</p>
        </div>

        <StatusBadge status={item.statut} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-950 p-3">
        <div>
          <p className="text-[11px] text-slate-600">N° CIN</p>

          <p className="mt-1 font-mono text-xs text-slate-400">
            {item.numeroCin}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-600">Date</p>

          <p className="mt-1 text-xs text-slate-400">
            {item.date} · {item.heure}
          </p>
        </div>
      </div>

      <button
        onClick={() => onView(item.id)}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
      >
        <Eye size={14} />
        Consulter la fiche
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: RecensementHistoryItem["statut"] }) {
  if (status === "VALIDE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <CheckCircle2 size={13} />
        Validé
      </span>
    );
  }

  if (status === "A_VERIFIER") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
        <Clock3 size={13} />À vérifier
      </span>
    );
  }

  if (status === "REJETE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
        Rejeté
      </span>
    );
  }

  if (status === "MODIFIE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
        Modifié
      </span>
    );
  }

  if (status === "OCR_EN_COURS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-400">
        OCR en cours
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-400">
      Scanné
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-600">
        <Search size={24} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-300">
        Aucun résultat
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
        Aucun recensement ne correspond aux critères de recherche sélectionnés.
      </p>
    </div>
  );
}
