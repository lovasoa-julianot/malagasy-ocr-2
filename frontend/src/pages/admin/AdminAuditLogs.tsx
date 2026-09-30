import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
} from "lucide-react";
import { getAdminAuditLogs } from "../../services/adminService";
import type { AdminAuditLogItem } from "../../types/admin";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await getAdminAuditLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = logs.filter((log) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      log.user_name.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);

    const matchesRole = roleFilter === "ALL" || log.user_type === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Traçabilité & Sécurité</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Journal d'audit
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Historique complet des actions effectuées par les administrateurs, agents et chefs Fokontany.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="btn btn-ghost btn-sm"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
          />
          <input
            type="text"
            placeholder="Rechercher par utilisateur, action ou détail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-10 text-sm"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="select select-bordered text-xs"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="ADMIN">Administrateurs</option>
          <option value="CHEF_FOKONTANY">Chefs Fokontany</option>
          <option value="AGENT">Agents recenseurs</option>
        </select>
      </div>

      {/* Tableau des logs */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                <th>Date / Heure</th>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Action</th>
                <th>Détails de l'opération</th>
                <th>Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-base-content/50">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="mt-2">Chargement du journal...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-base-content/50">
                    Aucun événement trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-base-200/60 hover:bg-base-200/30 transition text-xs"
                  >
                    <td className="whitespace-nowrap font-mono text-[11px] text-base-content/60">
                      {new Date(log.timestamp).toLocaleString("fr-FR")}
                    </td>

                    <td>
                      <span className="font-semibold">{log.user_name}</span>
                    </td>

                    <td>
                      <span
                        className={`badge badge-xs font-semibold ${
                          log.user_type === "ADMIN"
                            ? "badge-primary"
                            : log.user_type === "CHEF_FOKONTANY"
                            ? "badge-secondary"
                            : "badge-neutral"
                        }`}
                      >
                        {log.user_type}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-sm badge-outline font-mono">
                        {log.action}
                      </span>
                    </td>

                    <td className="max-w-md">
                      <p className="text-base-content/80">{log.details}</p>
                      {log.fokontany_nom && (
                        <p className="text-[11px] text-base-content/40 mt-0.5">
                          Fokontany : {log.fokontany_nom}
                        </p>
                      )}
                    </td>

                    <td className="font-mono text-[11px] text-base-content/50">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
