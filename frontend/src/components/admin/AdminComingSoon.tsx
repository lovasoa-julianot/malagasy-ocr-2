import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/admin/fokontany": "Gestion des Fokontany",
  "/admin/communes": "Gestion des communes",
  "/admin/districts": "Gestion des districts",
  "/admin/regions": "Gestion des régions",

  "/admin/agents": "Gestion des agents",
  "/admin/agents/actifs": "Agents actifs",
  "/admin/agents/attente": "Agents en attente",

  "/admin/recensements": "Tous les recensements",
  "/admin/recensements/valides": "Recensements validés",
  "/admin/recensements/verification": "Recensements à vérifier",
  "/admin/recensements/rejetes": "Recensements rejetés",

  "/admin/statistiques": "Statistiques générales",
  "/admin/statistiques/fokontany": "Statistiques par Fokontany",
  "/admin/statistiques/agents": "Activité des agents",

  "/admin/doublons": "Doublons CIN",
  "/admin/anomalies": "Anomalies",
  "/admin/historique": "Historique",

  "/admin/audit": "Journal d'audit",
  "/admin/profil": "Mon profil",
  "/admin/parametres": "Paramètres",
};

export default function AdminComingSoon() {
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? "Page d'administration";

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-8 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-primary" />

        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Administration
        </span>
      </div>

      <h2 className="text-2xl font-bold text-base-content">{title}</h2>

      <p className="mt-2 text-base-content/60">
        Cette fonctionnalité est en cours de développement.
      </p>

      <div className="mt-6 rounded-lg bg-base-200 p-4">
        <p className="text-sm text-base-content/60">Route actuelle :</p>

        <code className="mt-1 block text-sm font-medium text-primary">
          {location.pathname}
        </code>
      </div>
    </div>
  );
}
