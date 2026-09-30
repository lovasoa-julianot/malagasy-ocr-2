import { useState, useEffect } from "react";
import { Users, UserPlus, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, X, Check } from "lucide-react";
import AdminStatsCard from "../../components/admin/AdminStatsCard";
import AgentTable from "../../components/admin/AgentTable";
import {
  getAdminAgents,
  toggleAgentStatus,
  createAgentAdmin,
} from "../../services/adminService";
import { getFokontany } from "../../services/fokontanyService";
import type { AdminAgentItem } from "../../types/admin";
import type { Fokontany } from "../../types/fokontany";

export default function AgentsManagement() {
  const [agents, setAgents] = useState<AdminAgentItem[]>([]);
  const [fokontanyList, setFokontanyList] = useState<Fokontany[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal création agent
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenoms: "",
    telephone: "",
    email: "",
    adresse: "",
    fokontany_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [agentsData, fktData] = await Promise.all([
        getAdminAgents(),
        getFokontany().catch(() => []),
      ]);
      setAgents(agentsData);
      setFokontanyList(fktData);
      if (fktData.length > 0 && !form.fokontany_id) {
        setForm((prev) => ({ ...prev, fokontany_id: fktData[0].id }));
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les données des agents.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleToggleStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      await toggleAgentStatus(agentId, !currentStatus);
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, is_active: !currentStatus } : a)),
      );
      setNotification(
        !currentStatus
          ? "Agent activé avec succès."
          : "Agent suspendu temporairement.",
      );
      setTimeout(() => setNotification(null), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur de modification de statut.",
      );
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.prenoms.trim() || !form.telephone.trim()) {
      setError("Veuillez remplir les champs obligatoires (*)");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const assignedFkt = fokontanyList.find((f) => f.id === form.fokontany_id);
      const newAgent = await createAgentAdmin({
        nom: form.nom.trim(),
        prenoms: form.prenoms.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim() || undefined,
        adresse: form.adresse.trim() || undefined,
        fokontany_id: form.fokontany_id,
        fokontany_nom: assignedFkt?.nom || "Fokontany",
      });

      setAgents((prev) => [newAgent, ...prev]);
      setModalOpen(false);
      setForm({
        nom: "",
        prenoms: "",
        telephone: "",
        email: "",
        adresse: "",
        fokontany_id: fokontanyList[0]?.id || "",
      });
      setNotification(`Agent ${newAgent.nom} ${newAgent.prenoms} créé avec succès (Matricule: ${newAgent.matricule})`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Impossible de créer l'agent.",
      );
    } finally {
      setSaving(false);
    }
  };

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.is_active).length;
  const totalFiches = agents.reduce((acc, a) => acc + (a.total_recensements || 0), 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Gestion des effectifs</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Agents recenseurs
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Suivi des agents de terrain, déploiement par Fokontany et gestion des accès.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <UserPlus size={15} />
            Ajouter un agent
          </button>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {notification}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Cartes statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Agents totaux"
          value={totalAgents}
          description="Inscrits dans le système"
          icon={Users}
          variant="primary"
        />
        <AdminStatsCard
          title="Agents actifs"
          value={activeAgents}
          description="En mission sur le terrain"
          icon={ShieldCheck}
          variant="success"
        />
        <AdminStatsCard
          title="Fiches enregistrées"
          value={totalFiches.toLocaleString("fr-FR")}
          description="Total recensé par les agents"
          icon={CheckCircle2}
          variant="info"
        />
        <AdminStatsCard
          title="Taux d'activité"
          value={totalAgents > 0 ? `${Math.round((activeAgents / totalAgents) * 100)} %` : "100 %"}
          description="Agents opérationnels"
          icon={Users}
          variant="warning"
        />
      </div>

      {/* Table des agents */}
      <AgentTable
        agents={agents}
        loading={loading}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modal Ajout Agent */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Inscrire un nouvel agent</h3>
                  <p className="text-xs text-base-content/50">
                    Génère automatiquement un matricule officiel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-base-content/70">
                    Nom de famille *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex. RAKOTO"
                    value={form.nom}
                    onChange={(e) =>
                      setForm({ ...form, nom: e.target.value.toUpperCase() })
                    }
                    className="input input-bordered input-sm mt-1 w-full text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-base-content/70">
                    Prénoms *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Jean Marc"
                    value={form.prenoms}
                    onChange={(e) => setForm({ ...form, prenoms: e.target.value })}
                    className="input input-bordered input-sm mt-1 w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-base-content/70">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+261 34 00 000 00"
                    value={form.telephone}
                    onChange={(e) =>
                      setForm({ ...form, telephone: e.target.value })
                    }
                    className="input input-bordered input-sm mt-1 w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-base-content/70">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="agent@recensement.mg"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input input-bordered input-sm mt-1 w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70">
                  Fokontany d'affectation *
                </label>
                <select
                  value={form.fokontany_id}
                  onChange={(e) =>
                    setForm({ ...form, fokontany_id: e.target.value })
                  }
                  required
                  className="select select-bordered select-sm mt-1 w-full text-xs"
                >
                  {fokontanyList.map((fkt) => (
                    <option key={fkt.id} value={fkt.id}>
                      {fkt.nom} ({fkt.code}) - {fkt.commune}
                    </option>
                  ))}
                  {fokontanyList.length === 0 && (
                    <option value="fk-default">ANDRAINJATO ATSIMO (FK-FIA-001)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70">
                  Adresse de résidence
                </label>
                <input
                  type="text"
                  placeholder="ex. Lot IV B 24 Andrainjato"
                  value={form.adresse}
                  onChange={(e) =>
                    setForm({ ...form, adresse: e.target.value })
                  }
                  className="input input-bordered input-sm mt-1 w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="btn btn-ghost btn-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-sm gap-1.5"
                >
                  {saving ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Check size={15} />
                  )}
                  Valider l'inscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
