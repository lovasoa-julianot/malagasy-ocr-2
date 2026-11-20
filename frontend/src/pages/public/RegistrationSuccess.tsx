import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Printer,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Building,
  UserCheck,
  FileText,
  Check,
} from "lucide-react";
import type { ChefFokontanyRegisterResponse } from "../../services/ChefFokontanyService";
import { MadagascarEmblem } from "./MadagascarEmblem";

interface RegistrationSuccessProps {
  response: ChefFokontanyRegisterResponse;
  onReset: () => void;
  onGoToLogin?: () => void;
}

export function RegistrationSuccess({
  response,
  onReset,
  onGoToLogin,
}: RegistrationSuccessProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(response.code_fokontany);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const dateDepot = new Date(response.created_at).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* En-tête officiel */}
        <div className="mb-6">
          <MadagascarEmblem />
        </div>

        {/* Carte de Récépissé */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 overflow-hidden">
          {/* Bannière de confirmation */}
          <div className="bg-emerald-50 border-b border-emerald-100 p-6 sm:p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4 animate-in zoom-in duration-300">
              <CheckCircle2 size={32} />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 mb-2">
              <ShieldCheck size={14} /> Dossier officiel enregistré
            </span>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Demande d'Accès Chef Fokontany Transmise
            </h1>

            <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2 leading-relaxed">
              {response.message}
            </p>
          </div>

          {/* Corps du récépissé */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Boîte Référence Officielle */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Code du Fokontany attribué
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-slate-900">
                  {response.code_fokontany}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Norme FKT-(lettre du district)-(numéro) ·{" "}
                  {response.nom_fokontany}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-xs"
                >
                  {copiedCode ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copier le code
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition shadow-xs print:hidden"
                >
                  <Printer size={14} />
                  Imprimer
                </button>
              </div>
            </div>

            {/* Récapitulatif des données */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <Building size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-400 font-medium">
                    Fokontany & Circonscription
                  </div>
                  <div className="text-slate-800 font-semibold mt-0.5 break-words">
                    {response.nom_fokontany}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 break-words">
                    {response.commune} · District de {response.district}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 break-words">
                    Région {response.region} · Province {response.province}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <UserCheck size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-400 font-medium">
                    Chef Déclarant
                  </div>
                  <div className="text-slate-800 font-semibold mt-0.5 break-words">
                    {response.nom} {response.prenoms}
                  </div>
                </div>
              </div>
            </div>

            {/* Calendrier / Procédure de validation administrative */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-600" />
                Procédure de validation par la tutelle
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Enregistrement initial (Terminé)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Horodaté le {dateDepot}. Code{" "}
                      <span className="font-mono">
                        {response.code_fokontany}
                      </span>{" "}
                      attribué.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Vérification par le District et la Commune (En cours)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Contrôle de l'acte de nomination ou d'élection de Chef
                      Fokontany. Délai indicatif : 24h à 72h.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      Activation du compte & Remise des identifiants
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Vous recevrez un SMS et un courriel dès que l'accès au
                      registre de recensement sera opérationnel.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note informative */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
              <FileText size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold">Note administrative :</span>{" "}
                Conservez précieusement le code de votre Fokontany{" "}
                <span className="font-mono font-medium">
                  {response.code_fokontany}
                </span>{" "}
                ainsi que le numéro de récépissé{" "}
                <span className="font-mono font-medium">
                  {response.request_id.slice(0, 8)}
                </span>{" "}
                pour tout échange avec la Préfecture ou le Chef de District.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onReset}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Nouvelle inscription
              </button>

              <button
                type="button"
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                Retour à l'écran de connexion
              </button>
            </div>
          </div>
        </div>

        {/* Pied de page institutionnel */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          Système National de Gestion Territoriale et d'Enrôlement des Fokontany
          — République de Madagascar
        </p>
      </div>
    </div>
  );
}
