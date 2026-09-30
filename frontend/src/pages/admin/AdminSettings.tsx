import { useState } from "react";
import { Sliders, Save, Shield, CheckCircle2 } from "lucide-react";

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    campaignName: "Campagne Nationale de Recensement 2026",
    ocrConfidenceThreshold: 80,
    allowManualOverride: true,
    requirePhotoValidation: false,
    accessCodeValidityDays: 180,
    maintenanceMode: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Configuration système</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Paramètres généraux
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Ajustez les règles de validation OCR, les politiques de sécurité et les variables de campagne.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary btn-sm gap-1.5"
        >
          <Save size={15} />
          Enregistrer les modifications
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-700">
          <CheckCircle2 size={16} />
          Paramètres enregistrés avec succès.
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Paramètres de campagne */}
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-base-200">
            <Sliders size={18} className="text-primary" />
            <h2 className="font-bold text-base">Campagne de recensement</h2>
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70">
              Intitulé officiel de la campagne
            </label>
            <input
              type="text"
              value={settings.campaignName}
              onChange={(e) =>
                setSettings({ ...settings, campaignName: e.target.value })
              }
              className="input input-bordered input-sm mt-1 w-full text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70">
              Seuil d'alerte confiance OCR (%)
            </label>
            <div className="flex items-center gap-4 mt-1">
              <input
                type="range"
                min="50"
                max="95"
                value={settings.ocrConfidenceThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ocrConfidenceThreshold: Number(e.target.value),
                  })
                }
                className="range range-primary range-sm max-w-xs"
              />
              <span className="font-mono text-xs font-bold text-primary">
                {settings.ocrConfidenceThreshold} %
              </span>
            </div>
            <p className="text-[11px] text-base-content/40 mt-1">
              Les fiches avec un score OCR inférieur à ce seuil seront marquées "À vérifier".
            </p>
          </div>
        </div>

        {/* Règles de validation */}
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-base-200">
            <Shield size={18} className="text-emerald-500" />
            <h2 className="font-bold text-base">Contrôles de sécurité & Accès</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowManualOverride}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowManualOverride: e.target.checked,
                  })
                }
                className="checkbox checkbox-primary checkbox-sm"
              />
              <div>
                <span className="font-semibold">
                  Autoriser la correction manuelle par les agents
                </span>
                <p className="text-base-content/50 text-[11px]">
                  Permet à l'agent de corriger les champs mal interprétés par l'OCR.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requirePhotoValidation}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    requirePhotoValidation: e.target.checked,
                  })
                }
                className="checkbox checkbox-primary checkbox-sm"
              />
              <div>
                <span className="font-semibold">
                  Exiger la capture recto/verso obligatoire de la CIN
                </span>
                <p className="text-base-content/50 text-[11px]">
                  Bloque la validation si les deux faces ne sont pas présentes.
                </p>
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
