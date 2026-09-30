import { useState } from "react";
import { User, CheckCircle2, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ChefProfile() {
  const { chef } = useAuth();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    nom: chef?.nom || "RAZAFINDRABE",
    prenoms: chef?.prenoms || "Hery",
    telephone: chef?.telephone || "+261 34 12 345 67",
    email: chef?.email || "chef.andrainjato@gmail.com",
    adresseBureau: "Bureau du Fokontany, Bâtiment Communal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div>
        <p className="text-sm font-medium text-emerald-600">
          Administration territoriale
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Mon Fokontany & Profil
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          Coordonnées de l'autorité locale et informations officielles du territoire.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-700">
          <CheckCircle2 size={16} />
          Coordonnées mises à jour avec succès.
        </div>
      )}

      {/* Informations officielles du Fokontany */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-base-200">
          <Building2 size={20} className="text-emerald-600" />
          <h2 className="font-bold text-base">Territoire administratif</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl bg-base-200/50 p-3">
            <span className="text-base-content/50">Code Fokontany :</span>
            <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
              {chef?.code_fokontany || chef?.fokontany_code || "—"}
            </p>
          </div>

          <div className="rounded-xl bg-base-200/50 p-3">
            <span className="text-base-content/50">Nom du Fokontany :</span>
            <p className="font-bold text-sm text-slate-800 mt-0.5">
              {chef?.nom_fokontany || chef?.fokontany_nom || "Fokontany"}
            </p>
          </div>

          <div className="rounded-xl bg-base-200/50 p-3">
            <span className="text-base-content/50">Commune :</span>
            <p className="font-semibold text-sm mt-0.5">
              {chef?.commune || "—"}
            </p>
          </div>

          <div className="rounded-xl bg-base-200/50 p-3">
            <span className="text-base-content/50">Région :</span>
            <p className="font-semibold text-sm mt-0.5">
              {chef?.region || "Haute Matsiatra"}
            </p>
          </div>
        </div>
      </div>

      {/* Coordonnées du Chef Fokontany */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-base-200">
          <User size={20} className="text-emerald-600" />
          <h2 className="font-bold text-base">Coordonnées de l'autorité locale</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-base-content/70">Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="input input-bordered input-sm mt-1 w-full text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-base-content/70">Prénoms</label>
              <input
                type="text"
                value={form.prenoms}
                onChange={(e) => setForm({ ...form, prenoms: e.target.value })}
                className="input input-bordered input-sm mt-1 w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-base-content/70">Téléphone</label>
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="input input-bordered input-sm mt-1 w-full text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-base-content/70">Email officiel</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input input-bordered input-sm mt-1 w-full text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-base-content/70">
              Adresse physique du bureau
            </label>
            <input
              type="text"
              value={form.adresseBureau}
              onChange={(e) => setForm({ ...form, adresseBureau: e.target.value })}
              className="input input-bordered input-sm mt-1 w-full text-xs"
            />
          </div>

          <button
            type="submit"
            className="btn btn-success text-white btn-sm mt-2"
          >
            Enregistrer les coordonnées
          </button>
        </form>
      </div>
    </div>
  );
}
