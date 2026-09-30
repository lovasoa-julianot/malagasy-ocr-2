import { useState } from "react";
import { KeyRound, Check, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminProfile() {
  const { admin } = useAuth();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSuccessMsg("Mot de passe mis à jour avec succès.");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div>
        <p className="text-sm font-medium text-primary">Compte & Sécurité</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Profil Administrateur
        </h1>
        <p className="mt-1 text-sm text-base-content/60">
          Gérez vos informations de compte et paramètres d'accès au panneau de supervision.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-700">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Carte identité */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
            {admin?.nom?.charAt(0) || "A"}
            {admin?.prenoms?.charAt(0) || "D"}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {admin?.nom || "Administrateur"} {admin?.prenoms || "Système"}
            </h2>
            <p className="text-xs text-base-content/60">{admin?.email || "admin@recensement.gov.mg"}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="badge badge-primary badge-sm font-semibold">
                SUPER ADMIN
              </span>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Check size={12} /> Compte actif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire mot de passe */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-base-200">
          <KeyRound size={18} className="text-primary" />
          <h2 className="font-bold text-base">Modifier le mot de passe</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-base-content/70">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="input input-bordered input-sm mt-1 w-full text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              className="input input-bordered input-sm mt-1 w-full text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-base-content/70">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className="input input-bordered input-sm mt-1 w-full text-xs"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm mt-2">
            Mettre à jour le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}
