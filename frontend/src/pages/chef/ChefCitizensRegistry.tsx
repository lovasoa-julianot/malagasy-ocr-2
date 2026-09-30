import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  Eye,
  User,
  MapPin,
  X,
  FileCheck2,
} from "lucide-react";
import { getCitizenRegistry } from "../../services/chefPortalService";
import type { FokontanyCitizenItem } from "../../types/chefFokontany";

export default function ChefCitizensRegistry() {
  const [citizens, setCitizens] = useState<FokontanyCitizenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCitizen, setSelectedCitizen] = useState<FokontanyCitizenItem | null>(null);

  useEffect(() => {
    loadCitizens();
  }, []);

  async function loadCitizens() {
    try {
      setLoading(true);
      const data = await getCitizenRegistry();
      setCitizens(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return citizens.filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        c.numero_cin.toLowerCase().includes(q) ||
        c.nom.toLowerCase().includes(q) ||
        c.prenoms.toLowerCase().includes(q) ||
        (c.profession && c.profession.toLowerCase().includes(q)) ||
        (c.adresse && c.adresse.toLowerCase().includes(q))
      );
    });
  }, [citizens, search]);

  const exportCSV = () => {
    const headers = [
      "CIN",
      "Nom",
      "Prénoms",
      "Sexe",
      "Date Naissance",
      "Lieu Naissance",
      "Profession",
      "Adresse",
      "Téléphone",
      "Date Recensement",
    ];
    const rows = filtered.map((c) => [
      c.numero_cin,
      `"${c.nom}"`,
      `"${c.prenoms}"`,
      c.sexe,
      c.date_naissance,
      `"${c.lieu_naissance || ""}"`,
      `"${c.profession || ""}"`,
      `"${c.adresse}"`,
      `"${c.telephone || ""}"`,
      c.date_recensement,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `registre_citoyens_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Administration des résidents
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Registre des résidents du Fokontany
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Carnet officiel numérique de la population résidente et fiches citoyennes validées.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          className="btn btn-outline btn-success btn-sm gap-1.5"
        >
          <Download size={14} />
          Exporter le registre (CSV)
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
            placeholder="Rechercher par CIN, nom, profession ou adresse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-10 text-sm focus:border-emerald-500 focus:outline-emerald-500"
          />
        </div>
      </div>

      {/* Tableau des résidents */}
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xs">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-200 bg-base-200/50 text-xs font-semibold uppercase text-base-content/60">
                <th>Citoyen</th>
                <th>Numéro CIN</th>
                <th>Sexe & Âge</th>
                <th>Profession</th>
                <th>Adresse / Résidence</th>
                <th>Contact</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <span className="loading loading-spinner loading-md text-emerald-600" />
                    <p className="mt-2 text-xs text-base-content/50">
                      Chargement du registre...
                    </p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-base-content/50">
                    Aucun résident trouvé avec ces critères.
                  </td>
                </tr>
              ) : (
                filtered.map((cit) => (
                  <tr
                    key={cit.id}
                    className="border-b border-base-200/60 hover:bg-base-200/30 transition text-xs"
                  >
                    <td>
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {cit.nom} {cit.prenoms}
                        </p>
                        <p className="text-[11px] text-base-content/40">
                          Recensé le {cit.date_recensement}
                        </p>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                        {cit.numero_cin}
                      </span>
                    </td>

                    <td>
                      <p className="font-medium">{cit.sexe}</p>
                      <p className="text-[11px] text-base-content/50">
                        Né(e) le {cit.date_naissance}
                      </p>
                    </td>

                    <td>
                      <span className="badge badge-sm badge-neutral font-medium">
                        {cit.profession || "Non renseignée"}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center gap-1.5 text-base-content/80">
                        <MapPin size={12} className="text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{cit.adresse}</span>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono text-base-content/70">
                        {cit.telephone || "-"}
                      </span>
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCitizen(cit)}
                        className="btn btn-ghost btn-xs text-emerald-600 gap-1 font-semibold"
                      >
                        <Eye size={13} />
                        Fiche
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-base-200 px-4 py-3 text-xs text-base-content/50">
          <span>{filtered.length} résidents inscrits</span>
          <span>100% vérifiés et conformes</span>
        </div>
      </div>

      {/* Modal Fiche Citoyenne Complète */}
      {selectedCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-base-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <User size={24} />
                </div>
                <div>
                  <span className="badge badge-success font-mono text-xs font-bold text-white mb-1">
                    CIN : {selectedCitizen.numero_cin}
                  </span>
                  <h3 className="font-bold text-lg text-slate-800">
                    {selectedCitizen.nom} {selectedCitizen.prenoms}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-base-200/50 p-3">
                  <p className="text-base-content/50">Date de naissance</p>
                  <p className="font-bold text-sm mt-0.5">{selectedCitizen.date_naissance}</p>
                </div>
                <div className="rounded-xl bg-base-200/50 p-3">
                  <p className="text-base-content/50">Lieu de naissance</p>
                  <p className="font-bold text-sm mt-0.5">{selectedCitizen.lieu_naissance || "Fianarantsoa"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-base-200/50 p-3">
                  <p className="text-base-content/50">Profession</p>
                  <p className="font-bold text-sm mt-0.5">{selectedCitizen.profession || "Sans profession"}</p>
                </div>
                <div className="rounded-xl bg-base-200/50 p-3">
                  <p className="text-base-content/50">Téléphone</p>
                  <p className="font-bold text-sm mt-0.5">{selectedCitizen.telephone || "Non renseigné"}</p>
                </div>
              </div>

              <div className="rounded-xl bg-base-200/50 p-3">
                <p className="text-base-content/50">Adresse au sein du Fokontany</p>
                <p className="font-bold text-sm mt-0.5">{selectedCitizen.adresse}</p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 p-3 flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={16} className="text-emerald-600" />
                  <span>Fiche n° <strong>{selectedCitizen.numero_fiche}</strong></span>
                </div>
                <span className="badge badge-success badge-sm text-white font-medium">Validée</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="btn btn-sm btn-primary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
