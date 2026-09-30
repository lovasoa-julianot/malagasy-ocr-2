import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  Clock3,
  Copy,
  Check,
  QrCode,
  MapPin,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../../context/AuthContext";
import {
  getChefDashboardStats,
  getChefRecensements,
  getChefAgents,
  getFokontanyAccessCodeDetails,
  updateRecensementChef,
} from "../../services/chefPortalService";
import type {
  ChefDashboardStats,
  ChefRecensementItem,
  ChefAgentItem,
  FokontanyAccessCodeDetails,
} from "../../types/chefFokontany";

export default function ChefFokontanyDashboard() {
  const { chef } = useAuth();

  const [stats, setStats] = useState<ChefDashboardStats | null>(null);
  const [recensements, setRecensements] = useState<ChefRecensementItem[]>([]);
  const [agents, setAgents] = useState<ChefAgentItem[]>([]);
  const [accessCodeInfo, setAccessCodeInfo] = useState<FokontanyAccessCodeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [sData, rData, aData, cData] = await Promise.all([
        getChefDashboardStats(),
        getChefRecensements(),
        getChefAgents(),
        getFokontanyAccessCodeDetails(),
      ]);
      setStats(sData);
      setRecensements(rData);
      setAgents(aData);
      setAccessCodeInfo(cData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les données du Fokontany.",
      );
    } finally {
      setLoading(false);
    }
  }

  const copyAccessCode = () => {
    if (!accessCodeInfo?.code_acces) return;
    navigator.clipboard.writeText(accessCodeInfo.code_acces);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = async (id: string) => {
    await updateRecensementChef(id, "VALIDE");
    setRecensements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, statut: "VALIDE" } : r)),
    );
  };

  const fktCode =
    accessCodeInfo?.code_fokontany ||
    chef?.code_fokontany ||
    chef?.fokontany_code ||
    "—";
  const fktNom =
    accessCodeInfo?.nom_fokontany ||
    chef?.nom_fokontany ||
    chef?.fokontany_nom ||
    "Fokontany";
  const commune = accessCodeInfo?.commune || chef?.commune || "";
  const codeAcces = accessCodeInfo?.code_acces || "—";

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="alert alert-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-4 text-center text-xs text-base-content/50">
          <span className="loading loading-spinner loading-sm text-emerald-600 mr-2" />
          Actualisation des données en temps réel...
        </div>
      )}

      {/* Bannière Fokontany & Code d'accès rapide */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-800 via-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/30 px-3 py-1 text-xs font-semibold backdrop-blur-xs text-blue-100 border border-blue-400/30">
              <MapPin size={13} />
              <span>{commune}{chef?.region ? ` • Région ${chef.region}` : ""}</span>
            </div>

            <h1 className="text-2xl font-black sm:text-3xl tracking-tight">
              Fokontany {fktNom}
            </h1>

            <p className="max-w-xl text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Bienvenue dans votre espace d'administration territoriale. Suivez les opérations de recensement de vos agents, validez les fiches de vos résidents et tenez votre registre à jour.
            </p>
          </div>

          {/* Widget code d'accès pour les agents */}
          <div className="shrink-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 text-center min-w-[260px]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
              Code d'accès Agents
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white">
                {codeAcces}
              </span>
              <button
                type="button"
                onClick={copyAccessCode}
                title="Copier le code"
                className="btn btn-ghost btn-circle btn-xs text-white hover:bg-white/20"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="btn btn-xs bg-white text-emerald-800 hover:bg-emerald-50 border-none font-semibold gap-1"
              >
                <QrCode size={13} />
                Afficher QR Code
              </button>
              <Link
                to="/chef-fokontany/code-acces"
                className="btn btn-xs btn-ghost text-white hover:bg-white/10 text-[11px]"
              >
                Gérer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Résidents recensés
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-600">
                {stats?.totalRecensements ?? 0}
              </p>
              <p className="mt-1 text-xs text-base-content/60">
                Objectif estimé : {stats?.objectifHabitants || "—"} hab.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Users size={24} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1 text-base-content/60">
              <span>Progression territoriale</span>
              <span className="font-bold text-emerald-700">
                {stats?.progressionPourcentage ?? 0} %
              </span>
            </div>
            <progress
              className="progress progress-success w-full"
              value={stats?.progressionPourcentage ?? 0}
              max={100}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Fiches validées
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {stats?.valides ?? 0}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> Prêtes pour le registre
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="mt-5 text-[11px] text-base-content/50">
            Signées par les agents de terrain
          </p>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                À vérifier
              </p>
              <p className="mt-2 text-3xl font-black text-amber-600">
                {stats?.aVerifier ?? 0}
              </p>
              <p className="mt-1 text-xs text-amber-600 font-medium flex items-center gap-1">
                <Clock3 size={12} /> Contrôle requis
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Clock3 size={24} />
            </div>
          </div>
          <p className="mt-5 text-[11px] text-base-content/50">
            Scores OCR faibles ou corrections manuelles
          </p>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Agents en mission
              </p>
              <p className="mt-2 text-3xl font-black text-slate-800">
                {stats?.agentsActifs ?? 0} / {stats?.agentsTotal ?? 0}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <UserCheck size={12} /> {stats?.aujourdhui ?? 0} fiches aujourd'hui
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCheck size={24} />
            </div>
          </div>
          <p className="mt-5 text-[11px] text-base-content/50">
            Affectés au Fokontany {fktNom}
          </p>
        </div>
      </div>

      {/* Grille : Fiches récentes & Mes agents */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dernières fiches de recensement */}
        <div className="lg:col-span-2 rounded-2xl border border-base-300 bg-base-100 shadow-xs">
          <div className="flex items-center justify-between border-b border-base-200 p-5">
            <div>
              <h2 className="font-bold text-base">Dernières fiches enregistrées</h2>
              <p className="text-xs text-base-content/50">
                Transmises par vos agents recenseurs
              </p>
            </div>

            <Link
              to="/chef-fokontany/recensements"
              className="btn btn-ghost btn-sm text-emerald-600 gap-1 text-xs font-semibold"
            >
              <span>Voir tout</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-base-200">
            {recensements.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-base-200/30 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {rec.nom} {rec.prenoms}
                    </span>
                    <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                      CIN {rec.numero_cin}
                    </span>
                    {rec.statut === "VALIDE" && (
                      <span className="badge badge-success badge-xs gap-1 font-medium">
                        Validé
                      </span>
                    )}
                    {rec.statut === "A_VERIFIER" && (
                      <span className="badge badge-warning badge-xs gap-1 font-medium">
                        À vérifier
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-base-content/60">
                    {rec.adresse}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-base-content/40">
                    <span>Agent : {rec.agent_nom}</span>
                    <span>•</span>
                    <span>{rec.date_formatted} à {rec.heure_formatted}</span>
                    <span>•</span>
                    <span className="font-mono">{rec.numero_fiche}</span>
                  </div>
                </div>

                {rec.statut === "A_VERIFIER" && (
                  <button
                    type="button"
                    onClick={() => handleValidate(rec.id)}
                    className="btn btn-xs btn-success text-white gap-1 shrink-0"
                  >
                    <Check size={12} />
                    Valider
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mes agents sur le terrain */}
        <div className="rounded-2xl border border-base-300 bg-base-100 shadow-xs">
          <div className="flex items-center justify-between border-b border-base-200 p-5">
            <div>
              <h2 className="font-bold text-base">Agents du Fokontany</h2>
              <p className="text-xs text-base-content/50">
                Effectif mobilisé
              </p>
            </div>

            <Link
              to="/chef-fokontany/agents"
              className="btn btn-ghost btn-sm text-emerald-600 gap-1 text-xs font-semibold"
            >
              <span>Gérer</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-base-200 p-2">
            {agents.map((agent) => (
              <div key={agent.id} className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">
                    {agent.nom} {agent.prenoms}
                  </span>
                  <span className="badge badge-sm badge-success text-[10px]">
                    Actif
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-base-content/50">
                  <span className="font-mono">{agent.matricule}</span>
                  <span className="font-semibold text-emerald-700">
                    {agent.total_recensements} fiches
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-base-200 p-4">
            <Link
              to="/chef-fokontany/code-acces"
              className="btn btn-outline btn-success btn-sm w-full gap-1.5"
            >
              <Users size={14} />
              Partager le code d’accès Agent
            </Link>
          </div>
        </div>
      </div>

      {/* Accès rapide au Registre */}
      <div className="rounded-2xl border border-emerald-500/20 bg-linear-to-r from-emerald-500/10 to-teal-500/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-emerald-950">
            Carnet de Fokontany numérique
          </h3>
          <p className="mt-1 text-xs text-emerald-800/80">
            Consultez le registre exhaustif de tous les citoyens résidant dans le Fokontany {fktNom}, effectuez des recherches par CIN ou exportez les données.
          </p>
        </div>

        <Link
          to="/chef-fokontany/citoyens"
          className="btn btn-success text-white btn-sm gap-1.5 shrink-0"
        >
          <Users size={14} />
          Accéder au registre des résidents
        </Link>
      </div>

      {/* Modal QR Code Fokontany */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-6 shadow-2xl text-center">
            <div className="flex justify-between items-center mb-3">
              <span className="badge badge-success font-mono text-xs">{fktCode}</span>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>

            <h3 className="font-bold text-lg">{fktNom}</h3>
            <p className="text-xs text-base-content/60 mb-5">
              Code de connexion pour les agents recenseurs
            </p>

            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl bg-white p-4 shadow-inner border border-slate-200">
              <QRCodeSVG
                value={
                  accessCodeInfo?.qr_value ||
                  JSON.stringify({
                    code_fokontany: fktCode,
                    nom_fokontany: fktNom,
                    code_acces: codeAcces,
                  })
                }
                size={200}
                level="H"
              />
            </div>

            <div className="mt-4 rounded-xl bg-slate-100 p-3 font-mono text-xl font-black text-slate-800 tracking-widest">
              {codeAcces}
            </div>

            <p className="mt-2 text-[11px] text-base-content/50">
              L'agent peut scanner ce QR Code avec son application pour se rattacher immédiatement au Fokontany.
            </p>

            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="btn btn-sm btn-primary w-full mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
