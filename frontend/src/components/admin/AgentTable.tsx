import { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Power,
  UserCheck,
  Layers,
} from "lucide-react";
import type { AdminAgentItem } from "../../types/admin";

interface AgentTableProps {
  agents: AdminAgentItem[];
  loading?: boolean;
  onToggleStatus: (agentId: string, currentStatus: boolean) => Promise<void>;
  onSelectAgent?: (agent: AdminAgentItem) => void;
}

export default function AgentTable({
  agents,
  loading = false,
  onToggleStatus,
  onSelectAgent,
}: AgentTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [fokontanyFilter, setFokontanyFilter] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const uniqueFokontany = useMemo(() => {
    const set = new Set<string>();
    agents.forEach((a) => {
      if (a.fokontany_nom) set.add(a.fokontany_nom);
    });
    return Array.from(set).sort();
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        agent.matricule.toLowerCase().includes(q) ||
        agent.nom.toLowerCase().includes(q) ||
        agent.prenoms.toLowerCase().includes(q) ||
        agent.telephone.toLowerCase().includes(q) ||
        (agent.fokontany_nom && agent.fokontany_nom.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && agent.is_active) ||
        (statusFilter === "INACTIVE" && !agent.is_active);

      const matchesFokontany =
        fokontanyFilter === "ALL" || agent.fokontany_nom === fokontanyFilter;

      return matchesSearch && matchesStatus && matchesFokontany;
    });
  }, [agents, search, statusFilter, fokontanyFilter]);

  const handleToggle = async (agent: AdminAgentItem) => {
    try {
      setProcessingId(agent.id);
      await onToggleStatus(agent.id, agent.is_active);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre de filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            placeholder="Rechercher par matricule, nom, téléphone, Fokontany..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtre statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="select select-bordered text-xs"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs uniquement</option>
            <option value="INACTIVE">Inactifs uniquement</option>
          </select>

          {/* Filtre Fokontany */}
          <select
            value={fokontanyFilter}
            onChange={(e) => setFokontanyFilter(e.target.value)}
            className="select select-bordered text-xs"
          >
            <option value="ALL">Tous les Fokontany</option>
            {uniqueFokontany.map((fkt) => (
              <option key={fkt} value={fkt}>
                {fkt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                <th>Agent</th>
                <th>Matricule</th>
                <th>Fokontany assigné</th>
                <th>Contact</th>
                <th>Fiches</th>
                <th>Statut</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="mt-2 text-xs text-base-content/50">
                      Chargement des agents...
                    </p>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <UserCheck
                      size={36}
                      className="mx-auto text-base-content/30"
                    />
                    <p className="mt-2 font-medium text-base-content/70">
                      Aucun agent trouvé
                    </p>
                    <p className="text-xs text-base-content/40">
                      Modifiez vos critères de recherche ou ajoutez un agent.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => {
                  const isBusy = processingId === agent.id;
                  return (
                    <tr
                      key={agent.id}
                      className="border-b border-base-200/60 transition hover:bg-base-200/30"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary text-xs">
                            {agent.nom.charAt(0)}
                            {agent.prenoms.charAt(0)}
                          </div>
                          <div>
                            <p
                              onClick={() => onSelectAgent?.(agent)}
                              className="font-semibold text-sm cursor-pointer hover:text-primary transition"
                            >
                              {agent.nom} {agent.prenoms}
                            </p>
                            {agent.derniere_activite && (
                              <p className="text-xs text-base-content/40">
                                {agent.derniere_activite}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-sm badge-neutral font-mono font-medium">
                          {agent.matricule}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-base-content/80">
                          <MapPin size={13} className="text-primary shrink-0" />
                          <span>{agent.fokontany_nom || "Non assigné"}</span>
                        </div>
                        {agent.commune && (
                          <p className="text-[11px] text-base-content/40 pl-4">
                            {agent.commune}
                          </p>
                        )}
                      </td>

                      <td>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-base-content/70">
                            <Phone size={12} className="text-base-content/40 shrink-0" />
                            <span>{agent.telephone}</span>
                          </div>
                          {agent.email && (
                            <div className="flex items-center gap-1.5 text-base-content/50 text-[11px]">
                              <Mail size={12} className="text-base-content/40 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {agent.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5">
                          <Layers size={13} className="text-base-content/40" />
                          <span className="font-semibold text-xs">
                            {agent.total_recensements ?? 0}
                          </span>
                        </div>
                      </td>

                      <td>
                        {agent.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                            <CheckCircle2 size={12} />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600">
                            <XCircle size={12} />
                            Suspendu
                          </span>
                        )}
                      </td>

                      <td className="text-right">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggle(agent)}
                          title={agent.is_active ? "Désactiver l'agent" : "Activer l'agent"}
                          className={`btn btn-xs ${
                            agent.is_active
                              ? "btn-ghost text-rose-600 hover:bg-rose-50"
                              : "btn-ghost text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {isBusy ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <>
                              <Power size={13} />
                              <span>{agent.is_active ? "Désactiver" : "Activer"}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-base-200 px-4 py-3 text-xs text-base-content/50">
          <span>{filteredAgents.length} agents affichés</span>
          <span>
            {agents.filter((a) => a.is_active).length} actifs sur {agents.length} au total
          </span>
        </div>
      </div>
    </div>
  );
}
