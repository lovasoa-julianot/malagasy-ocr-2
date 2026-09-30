import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

import type { RecensementDetail } from "../../services/recensementService";
import CharGrid from "./CharGrid";
import MultiRowCharGrid from "./MultiRowCharGrid";

interface RecensementSheetProps {
  data: RecensementDetail;
}

const formatDate = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR").format(date);
};

const display = (value?: string | null) => {
  return value?.trim() || "—";
};

const RecensementSheet = forwardRef<HTMLDivElement, RecensementSheetProps>(
  ({ data }, ref) => {
    const personne = data.personne;
    const fokontany = data.fokontany;

    const verificationUrl = `${window.location.origin}/verification/${data.qr_token}`;

    return (
      <div
        ref={ref}
        id="printable-recensement"
        className="
        mx-auto
        w-full
        max-w-[210mm]
        bg-[#daf2ec]
        text-emerald-950
        shadow-xl
        print:w-[210mm]
        print:max-w-none
        print:shadow-none
      "
      >
        {/* ================= HEADER ================= */}

        <div className="border-2 border-emerald-900">
          <div className="flex items-stretch border-b-2 border-emerald-900">
            <div className="flex-1 px-4 py-3 text-center">
              <div className="text-[11px] font-bold uppercase">
                Commission Électorale Nationale Indépendante
              </div>

              <div className="mt-1 text-xl font-black tracking-wide">
                CENI MADAGASCAR
              </div>

              <div className="mt-1 text-[9px] font-semibold">
                DOCUMENT GÉNÉRÉ PAR LE SYSTÈME DE RECENSEMENT
              </div>
            </div>

            <div className="w-[55mm] border-l-2 border-emerald-900">
              <div className="border-b border-emerald-900 px-2 py-1 text-[8px] font-bold">
                N° FICHE
              </div>

              <div className="flex h-10 items-center justify-center bg-white text-xl font-black tracking-widest">
                {data.numero_fiche}
              </div>
            </div>
          </div>

          {/* ================= TITRE ================= */}

          <div className="border-b-2 border-emerald-900 px-4 py-3 text-center">
            <h1 className="text-lg font-black uppercase tracking-wide">
              FICHE D'INSCRIPTION AU RECENSEMENT ÉLECTORAL
            </h1>

            <p className="mt-1 text-[10px] font-semibold">
              Fanavaozana tanteraka ny lisitry ny mpifidy 2026–2027
            </p>
          </div>

          {/* ================= ADMINISTRATIVE ================= */}

          <div className="border-b-2 border-emerald-900 p-3">
            <div className="mb-2 text-[10px] font-black uppercase">
              Identification administrative
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <CharGrid
                  label="FOKONTANY - CODE"
                  value={fokontany.code}
                  length={12}
                />
              </div>

              <div>
                <CharGrid
                  label="N° KARINE"
                  value={data.numero_karine}
                  length={12}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">Fokontany</div>
                <div className="mt-1 text-[10px] font-black">
                  {display(fokontany.nom)}
                </div>
              </div>

              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">Commune</div>
                <div className="mt-1 text-[10px] font-black">
                  {display(fokontany.commune)}
                </div>
              </div>

              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">District</div>
                <div className="mt-1 text-[10px] font-black">
                  {display(fokontany.district)}
                </div>
              </div>
            </div>

            <div className="mt-3 border border-emerald-900 bg-white p-2">
              <div className="text-[8px] font-bold uppercase">Région</div>

              <div className="mt-1 text-[10px] font-black">
                {display(fokontany.region)}
              </div>
            </div>
          </div>

          {/* ================= IDENTITÉ ================= */}

          <div className="border-b-2 border-emerald-900 p-3">
            <div className="mb-3 text-[10px] font-black uppercase">
              Identification du citoyen
            </div>

            <div className="space-y-3">
              <CharGrid
                label="ANARANA / NOM"
                value={personne.nom}
                length={28}
              />

              <MultiRowCharGrid
                value={personne.prenoms}
                columns={28}
                rows={2}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-[9px] font-bold uppercase">
                    Date de naissance
                  </div>

                  <div className="border border-emerald-900 bg-white px-2 py-2 text-[11px] font-black">
                    {formatDate(personne.date_naissance)}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[9px] font-bold uppercase">
                    Sexe
                  </div>

                  <div className="border border-emerald-900 bg-white px-2 py-2 text-[11px] font-black">
                    {display(personne.sexe)}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-[9px] font-bold uppercase">
                  Lieu de naissance
                </div>

                <div className="border border-emerald-900 bg-white px-2 py-2 text-[10px] font-black">
                  {display(personne.lieu_naissance)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-[9px] font-bold uppercase">
                    Profession
                  </div>

                  <div className="border border-emerald-900 bg-white px-2 py-2 text-[10px] font-black">
                    {display(personne.profession)}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[9px] font-bold uppercase">
                    N° CIN
                  </div>

                  <div className="border border-emerald-900 bg-white px-2 py-2 text-[11px] font-black tracking-wider">
                    {display(personne.numero_cin)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= FILIATION ================= */}

          <div className="border-b-2 border-emerald-900 p-3">
            <div className="mb-3 text-[10px] font-black uppercase">
              Filiation
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-[9px] font-bold uppercase">Père</div>

                <div className="min-h-9 border border-emerald-900 bg-white px-2 py-2 text-[10px] font-black">
                  {display(personne.nom_pere)}
                </div>
              </div>

              <div>
                <div className="mb-1 text-[9px] font-bold uppercase">Mère</div>

                <div className="min-h-9 border border-emerald-900 bg-white px-2 py-2 text-[10px] font-black">
                  {display(personne.nom_mere)}
                </div>
              </div>
            </div>
          </div>

          {/* ================= CIN ================= */}

          <div className="border-b-2 border-emerald-900 p-3">
            <div className="mb-3 text-[10px] font-black uppercase">
              Informations relatives à la CIN
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">Numéro CIN</div>

                <div className="mt-1 text-[11px] font-black tracking-wider">
                  {display(personne.numero_cin)}
                </div>
              </div>

              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">Série CIN</div>

                <div className="mt-1 text-[11px] font-black">
                  {display(personne.numero_serie_cin)}
                </div>
              </div>

              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">
                  Date de délivrance
                </div>

                <div className="mt-1 text-[10px] font-black">
                  {formatDate(personne.date_delivrance)}
                </div>
              </div>

              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">
                  Lieu de délivrance
                </div>

                <div className="mt-1 text-[10px] font-black">
                  {display(personne.lieu_delivrance)}
                </div>
              </div>
            </div>
          </div>

          {/* ================= RECENSEMENT ================= */}

          <div className="border-b-2 border-emerald-900 p-3">
            <div className="mb-3 text-[10px] font-black uppercase">
              Informations du recensement
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">Statut</div>

                <div className="mt-1 text-[10px] font-black">{data.statut}</div>
              </div>

              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">
                  Date d'inscription
                </div>

                <div className="mt-1 text-[10px] font-black">
                  {formatDate(data.created_at)}
                </div>
              </div>

              <div className="border border-emerald-900 bg-white p-2">
                <div className="text-[8px] font-bold uppercase">
                  Matricule agent
                </div>

                <div className="mt-1 text-[10px] font-black">
                  {data.agent.matricule}
                </div>
              </div>
            </div>

            <div className="mt-3 border border-emerald-900 bg-white p-2">
              <div className="text-[8px] font-bold uppercase">
                Agent recenseur
              </div>

              <div className="mt-1 text-[10px] font-black">
                {data.agent.nom} {data.agent.prenoms}
              </div>
            </div>
          </div>

          {/* ================= QR + VALIDATION ================= */}

          <div className="p-3">
            <div className="grid grid-cols-[1fr_auto] gap-5">
              <div>
                <div className="text-[10px] font-black uppercase">
                  Preuve d'inscription
                </div>

                <p className="mt-2 text-[9px] leading-4">
                  Cette fiche constitue la preuve de l'enregistrement numérique
                  du citoyen dans le système de recensement.
                </p>

                <div className="mt-4 border border-emerald-900 bg-white p-2">
                  <div className="text-[8px] font-bold uppercase">N° fiche</div>

                  <div className="mt-1 text-xl font-black tracking-[0.2em]">
                    {data.numero_fiche}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="border border-emerald-900 bg-white p-2">
                    <div className="text-[8px] font-bold uppercase">
                      Fokontany
                    </div>

                    <div className="mt-1 text-[9px] font-black">
                      {fokontany.nom}
                    </div>
                  </div>

                  <div className="border border-emerald-900 bg-white p-2">
                    <div className="text-[8px] font-bold uppercase">CIN</div>

                    <div className="mt-1 text-[9px] font-black">
                      {personne.numero_cin}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="border-2 border-emerald-900 bg-white p-2">
                  <QRCodeSVG
                    value={verificationUrl}
                    size={145}
                    level="M"
                    includeMargin
                  />
                </div>

                <div className="mt-2 text-center text-[8px] font-bold uppercase">
                  Scanner pour vérifier
                </div>
              </div>
            </div>

            {/* ================= SIGNATURES ================= */}

            <div className="mt-5 grid grid-cols-2 border border-emerald-900">
              <div className="min-h-[28mm] border-r border-emerald-900 p-2">
                <div className="text-center text-[8px] font-bold uppercase">
                  Signature de l'agent recenseur
                </div>
              </div>

              <div className="min-h-[28mm] p-2">
                <div className="text-center text-[8px] font-bold uppercase">
                  Signature du citoyen
                </div>
              </div>
            </div>

            <div className="mt-3 text-center text-[7px] font-semibold">
              Document généré électroniquement — Vérification possible via le QR
              code.
            </div>
          </div>
        </div>
      </div>
    );
  },
);

RecensementSheet.displayName = "RecensementSheet";

export default RecensementSheet;
