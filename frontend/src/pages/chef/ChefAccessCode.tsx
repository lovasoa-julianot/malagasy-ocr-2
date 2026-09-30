import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  RefreshCw,
  Printer,
  Info,
  CheckCircle2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  getFokontanyAccessCodeDetails,
  regenerateAccessCodeChef,
} from "../../services/chefPortalService";
import type { FokontanyAccessCodeDetails } from "../../types/chefFokontany";

export default function ChefAccessCode() {
  const [details, setDetails] = useState<FokontanyAccessCodeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDetails();
  }, []);

  async function loadDetails() {
    try {
      setLoading(true);
      setError("");
      const data = await getFokontanyAccessCodeDetails();
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger le code d’accès.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = () => {
    if (!details?.code_acces) return;
    navigator.clipboard.writeText(details.code_acces);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir générer un nouveau code ? Les agents devront utiliser le nouveau code pour se reconnecter.")) {
      return;
    }
    try {
      setRegenerating(true);
      setError("");
      const updated = await regenerateAccessCodeChef();
      setDetails(updated);
      setNotification("Le nouveau code d'accès a été généré avec succès.");
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de régénérer le code d’accès.");
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Sécurité & Authentification des agents
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Code d'accès & QR du Fokontany
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Partagez ce code avec les agents. Un agent qui utilise le système pour la première fois s’inscrit lui-même avec ces informations.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-outline btn-sm gap-1.5"
        >
          <Printer size={15} />
          Imprimer l'affiche QR
        </button>
      </div>

      {error && <div role="alert" className="alert alert-error">{error}</div>}

      {error && <div role="alert" className="alert alert-error">{error}</div>}

      {notification && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {notification}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-xs text-base-content/50">
          <span className="loading loading-spinner loading-md text-emerald-600" />
          <p className="mt-2">Chargement des paramètres de sécurité...</p>
        </div>
      )}

      {/* Carte Centrale QR & Code */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Affichage du code */}
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="badge badge-success font-mono text-xs text-white">
                {details?.code_fokontany || "—"}
              </span>
              <span className="text-xs text-base-content/50">
                Fokontany {details?.nom_fokontany}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Code d'accès alphanumérique
              </p>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-emerald-800">
                  {details?.code_acces || "—"}
                </span>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-emerald btn-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-base-200/50 p-4 text-xs space-y-2">
              <div className="flex items-start gap-2 text-base-content/70">
                <Info size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Ce code autorise uniquement les opérations sur le Fokontany{" "}
                  <strong>{details?.nom_fokontany}</strong>.
                </p>
              </div>
              <p className="text-[11px] text-base-content/50 pl-6">
                Dernière modification : {details?.last_updated ? new Date(details.last_updated).toLocaleDateString("fr-FR") : "Récent"}
              </p>
            </div>
          </div>

          <div className="border-t border-base-200 pt-4">
            <button
              type="button"
              disabled={regenerating || !details}
              onClick={handleRegenerate}
              className="btn btn-outline btn-warning btn-sm w-full gap-1.5"
            >
              <RefreshCw size={13} className={regenerating ? "animate-spin" : ""} />
              Régénérer un nouveau code d'accès
            </button>
          </div>
        </div>

        {/* QR Code haute définition */}
        <div className="rounded-3xl border border-base-300 bg-base-100 p-6 sm:p-8 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
            Scan direct par l'agent
          </p>

          <div className="rounded-2xl border-4 border-emerald-600/20 bg-white p-5 shadow-md">
            {details ? <QRCodeSVG value={details.qr_value} size={220} level="H" /> : <div className="flex h-[220px] w-[220px] items-center justify-center text-sm text-slate-500">QR indisponible</div>}
          </div>

          <p className="text-xs text-base-content/60 max-w-xs">
            L’agent utilise le code Fokontany et ce code d’accès, puis choisit s’il se connecte ou s’inscrit pour la première fois.
          </p>
        </div>
      </div>

      {/* Guide d'utilisation pour le bureau */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-800">
          Instructions pour le déploiement sur le terrain
        </h3>

        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl bg-base-200/50 p-4 space-y-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
              1
            </span>
            <p className="font-semibold text-slate-800 pt-1">
              Affichage au bureau
            </p>
            <p className="text-base-content/60">
              Imprimez le QR code et affichez-le dans le bureau du Fokontany pour les agents qui débutent leur journée.
            </p>
          </div>

          <div className="rounded-xl bg-base-200/50 p-4 space-y-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
              2
            </span>
            <p className="font-semibold text-slate-800 pt-1">
              Connexion des agents
            </p>
            <p className="text-base-content/60">
              Un nouvel agent remplit lui-même son inscription et reçoit un matricule. Les agents déjà inscrits utilisent leur matricule pour se connecter.
            </p>
          </div>

          <div className="rounded-xl bg-base-200/50 p-4 space-y-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
              3
            </span>
            <p className="font-semibold text-slate-800 pt-1">
              En cas de perte ou fuite
            </p>
            <p className="text-base-content/60">
              Cliquez sur "Régénérer" immédiatement pour invalider l'ancien code et sécuriser votre registre territorial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
