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

    const sheetStyle: React.CSSProperties = {
      width: "210mm",
      height: "297mm",
      background: "white",
      color: "black",
      fontFamily: '"DejaVu Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
      padding: "8mm 7mm",
      boxSizing: "border-box",
      margin: "0 auto",
      fontSize: "2.5mm",
      lineHeight: 1.3,
    };

    return (
      <div
        ref={ref}
        id="printable-recensement"
        style={sheetStyle}
        className="print-sheet"
      >
        <style jsx>{`
          @media print {
            .print-sheet {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 5mm 5mm;
              box-shadow: none;
            }
            
            @page {
              margin: 0;
              size: A4;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-bg-white {
              background: white !important;
            }
            
            .print-border-emerald {
              border-color: #064e3b !important;
            }
          }
        `}</style>

        {/* ================= HEADER ================= */}

        <div
          className="header print-border-emerald"
          style={{
            border: "1.5px solid #064e3b",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "2.5mm",
          }}
        >
          <div
            className="header-top print-bg-white"
            style={{
              display: "flex",
              borderBottom: "1.5px solid #064e3b",
              background: "#f0fdf4",
            }}
          >
            <div
              className="header-left"
              style={{
                flex: 1,
                padding: "2mm 3mm",
                textAlign: "center",
              }}
            >
              <div
                className="org-name"
                style={{
                  fontSize: "2.8mm",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  color: "#064e3b",
                  lineHeight: 1.15,
                }}
              >
                Commission Électorale Nationale Indépendante
              </div>

              <div
                className="org-acronym"
                style={{
                  fontSize: "4.2mm",
                  fontWeight: 900,
                  letterSpacing: "1.5px",
                  color: "#064e3b",
                  marginTop: "0.5mm",
                  lineHeight: 1.1,
                }}
              >
                CENI MADAGASCAR
              </div>

              <div
                className="org-subtitle"
                style={{
                  fontSize: "2mm",
                  fontWeight: 600,
                  color: "#065f46",
                  marginTop: "0.5mm",
                }}
              >
                DOCUMENT GÉNÉRÉ PAR LE SYSTÈME DE RECENSEMENT
              </div>
            </div>

            <div
              className="header-right"
              style={{
                width: "45mm",
                borderLeft: "1.5px solid #064e3b",
                background: "white",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="fiche-number-label print-border-emerald"
                style={{
                  fontSize: "1.8mm",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#064e3b",
                  padding: "0.8mm 1.5mm",
                  borderBottom: "1px solid #064e3b",
                  textAlign: "center",
                }}
              >
                N° FICHE
              </div>

              <div
                className="fiche-number-value"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "5mm",
                  fontWeight: 900,
                  letterSpacing: "3px",
                  color: "#064e3b",
                  fontFamily: '"Courier New", monospace',
                  minHeight: "18mm",
                }}
              >
                {data.numero_fiche}
              </div>
            </div>
          </div>

          {/* ================= TITRE ================= */}

          <div
            className="title-section print-bg-white"
            style={{
              borderBottom: "1.5px solid #064e3b",
              padding: "2mm 3mm",
              textAlign: "center",
              background: "#f0fdf4",
            }}
          >
            <h1
              className="title-main"
              style={{
                fontSize: "3.5mm",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                color: "#064e3b",
                lineHeight: 1.15,
              }}
            >
              FICHE D'INSCRIPTION AU RECENSEMENT ÉLECTORAL
            </h1>

            <p
              className="title-sub"
              style={{
                fontSize: "2.2mm",
                fontWeight: 600,
                color: "#065f46",
                marginTop: "0.5mm",
              }}
            >
              Fanavaozana tanteraka ny lisitry ny mpifidy 2026–2027
            </p>
          </div>
        </div>

        {/* ================= ADMINISTRATIVE ================= */}

        <section className="section print-border-emerald" style={sectionStyle}>
          <div className="section-header print-bg-white" style={sectionHeaderStyle}>
            Identification administrative
          </div>

          <div className="section-content" style={sectionContentStyle}>
            <div style={grid2Style}>
              <div>
                <CharGrid label="FOKONTANY - CODE" value={fokontany.code} length={12} />
              </div>

              <div>
                <CharGrid label="N° KARINE" value={data.numero_karine} length={12} />
              </div>
            </div>

            <div style={grid4Style}>
              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Fokontany</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {display(fokontany.nom)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Commune</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {display(fokontany.commune)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>District</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {display(fokontany.district)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Région</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {display(fokontany.region)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= IDENTITÉ ================= */}

        <section className="section print-border-emerald" style={sectionStyle}>
          <div className="section-header print-bg-white" style={sectionHeaderStyle}>
            Identification du citoyen
          </div>

          <div className="section-content" style={{ ...sectionContentStyle, display: 'flex', flexDirection: 'column', gap: '2mm' }}>
            <div>
              <CharGrid label="ANARANA / NOM" value={personne.nom} length={28} />
            </div>

            <div>
              <MultiRowCharGrid label="PRÉNOMS" value={personne.prenoms} columns={28} rows={2} />
            </div>

            <div style={grid4Style}>
              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Date de naissance</div>
                <div className="field-value" style={fieldValueStyle}>
                  {formatDate(personne.date_naissance)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Sexe</div>
                <div className="field-value-small" style={fieldValueSmallStyle}>
                  {display(personne.sexe)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Lieu de naissance</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {display(personne.lieu_naissance)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Profession</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {display(personne.profession)}
                </div>
              </div>
            </div>

            <div style={grid2Style}>
              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>N° CIN</div>
                <div className="field-value" style={fieldValueStyle}>
                  {display(personne.numero_cin)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Série CIN</div>
                <div className="field-value-small" style={fieldValueSmallStyle}>
                  {display(personne.numero_serie_cin)}
                </div>
              </div>
            </div>

            <div style={grid2Style}>
              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Date délivrance CIN</div>
                <div className="field-value-small" style={fieldValueSmallStyle}>
                  {formatDate(personne.date_delivrance)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Lieu délivrance CIN</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {display(personne.lieu_delivrance)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FILIATION ================= */}

        <section className="section print-border-emerald" style={sectionStyle}>
          <div className="section-header print-bg-white" style={sectionHeaderStyle}>
            Filiation
          </div>

          <div className="section-content" style={sectionContentStyle}>
            <div style={grid2Style}>
              <div className="field-box print-border-emerald" style={{ ...fieldBoxStyle, minHeight: '16mm' }}>
                <div className="field-label" style={fieldLabelStyle}>Père</div>
                <div className="field-value-text" style={{ ...fieldValueTextStyle, fontSize: '2.6mm' }}>
                  {display(personne.nom_pere)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={{ ...fieldBoxStyle, minHeight: '16mm' }}>
                <div className="field-label" style={fieldLabelStyle}>Mère</div>
                <div className="field-value-text" style={{ ...fieldValueTextStyle, fontSize: '2.6mm' }}>
                  {display(personne.nom_mere)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= RECENSEMENT ================= */}

        <section className="section print-border-emerald" style={sectionStyle}>
          <div className="section-header print-bg-white" style={sectionHeaderStyle}>
            Informations du recensement
          </div>

          <div className="section-content" style={sectionContentStyle}>
            <div style={grid4Style}>
              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Statut</div>
                <div className="field-value-small" style={fieldValueSmallStyle}>
                  {data.statut}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Date d'inscription</div>
                <div className="field-value-small" style={fieldValueSmallStyle}>
                  {formatDate(data.created_at)}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Matricule agent</div>
                <div className="field-value-small" style={fieldValueSmallStyle}>
                  {data.agent.matricule}
                </div>
              </div>

              <div className="field-box print-border-emerald" style={fieldBoxStyle}>
                <div className="field-label" style={fieldLabelStyle}>Agent recenseur</div>
                <div className="field-value-text" style={fieldValueTextStyle}>
                  {data.agent.nom} {data.agent.prenoms}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= QR + VALIDATION ================= */}

        <section className="section print-border-emerald" style={sectionStyle}>
          <div className="section-header print-bg-white" style={sectionHeaderStyle}>
            Preuve d'inscription et vérification
          </div>

          <div className="section-content" style={sectionContentStyle}>
            <div className="qr-section" style={qrSectionStyle}>
              <div className="qr-left" style={qrLeftStyle}>
                <div className="proof-title" style={proofTitleStyle}>
                  Preuve d'inscription
                </div>

                <p className="proof-text" style={proofTextStyle}>
                  Cette fiche constitue la preuve de l'enregistrement numérique
                  du citoyen dans le système de recensement électoral.
                </p>

                <div className="fiche-proof-box print-border-emerald" style={ficheProofBoxStyle}>
                  <div className="fiche-proof-label" style={ficheProofLabelStyle}>N° fiche</div>
                  <div className="fiche-proof-value" style={ficheProofValueStyle}>
                    {data.numero_fiche}
                  </div>
                </div>

                <div className="proof-grid" style={proofGridStyle}>
                  <div className="proof-item print-border-emerald" style={proofItemStyle}>
                    <div className="proof-item-label" style={proofItemLabelStyle}>Fokontany</div>
                    <div className="proof-item-value" style={proofItemValueStyle}>
                      {display(fokontany.nom)}
                    </div>
                  </div>

                  <div className="proof-item print-border-emerald" style={proofItemStyle}>
                    <div className="proof-item-label" style={proofItemLabelStyle}>CIN</div>
                    <div className="proof-item-value" style={proofItemValueStyle}>
                      {display(personne.numero_cin)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="qr-box print-border-emerald" style={qrBoxStyle}>
                <div className="qr-code print-bg-white" style={qrCodeStyle}>
                  <QRCodeSVG
                    value={verificationUrl}
                    size={140}
                    level="Q"
                    includeMargin
                  />
                </div>

                <div className="qr-label" style={qrLabelStyle}>
                  Scanner pour vérifier
                </div>
              </div>
            </div>

            <div className="footer-note" style={footerNoteStyle}>
              Document généré électroniquement — Vérification possible via le QR code.
            </div>
          </div>
        </section>
      </div>
    );
  },
);

const sectionStyle: React.CSSProperties = {
  border: "1.5px solid #064e3b",
  borderRadius: "3px",
  marginBottom: "2mm",
  overflow: "hidden",
};

const sectionHeaderStyle: React.CSSProperties = {
  background: "#064e3b",
  color: "white",
  padding: "1.8mm 2.5mm",
  fontSize: "2.5mm",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
};

const sectionContentStyle: React.CSSProperties = {
  padding: "2mm",
};

const grid2Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2mm",
  marginBottom: "2mm",
};

const grid4Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr",
  gap: "2mm",
  marginBottom: "2mm",
};

const fieldBoxStyle: React.CSSProperties = {
  border: "1px solid #064e3b",
  background: "white",
  padding: "1.5mm",
  borderRadius: "2px",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "1.8mm",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#064e3b",
  marginBottom: "0.8mm",
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: "2.5mm",
  fontWeight: 900,
  color: "#064e3b",
  fontFamily: '"Courier New", monospace',
};

const fieldValueSmallStyle: React.CSSProperties = {
  fontSize: "2.1mm",
  fontWeight: 700,
  color: "#064e3b",
};

const fieldValueTextStyle: React.CSSProperties = {
  fontSize: "2.3mm",
  fontWeight: 700,
  color: "#064e3b",
};

const qrSectionStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 130px",
  gap: "3mm",
  alignItems: "start",
};

const qrLeftStyle: React.CSSProperties = {
  minWidth: 0,
};

const proofTitleStyle: React.CSSProperties = {
  fontSize: "2.3mm",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#064e3b",
  marginBottom: "1.5mm",
};

const proofTextStyle: React.CSSProperties = {
  fontSize: "2mm",
  lineHeight: 1.4,
  color: "#065f46",
  marginBottom: "2mm",
};

const ficheProofBoxStyle: React.CSSProperties = {
  border: "1.5px solid #064e3b",
  background: "white",
  padding: "1.5mm",
  borderRadius: "2px",
  marginBottom: "2mm",
};

const ficheProofLabelStyle: React.CSSProperties = {
  fontSize: "1.8mm",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#064e3b",
  marginBottom: "0.8mm",
};

const ficheProofValueStyle: React.CSSProperties = {
  fontSize: "4.5mm",
  fontWeight: 900,
  letterSpacing: "2px",
  color: "#064e3b",
  fontFamily: '"Courier New", monospace',
  textAlign: "center",
};

const proofGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2mm",
};

const proofItemStyle: React.CSSProperties = {
  border: "1px solid #064e3b",
  background: "white",
  padding: "1.5mm",
  borderRadius: "2px",
};

const proofItemLabelStyle: React.CSSProperties = {
  fontSize: "1.8mm",
  fontWeight: 700,
  textTransform: "uppercase",
  color: "#064e3b",
  marginBottom: "0.8mm",
};

const proofItemValueStyle: React.CSSProperties = {
  fontSize: "2.3mm",
  fontWeight: 700,
  color: "#064e3b",
};

const qrBoxStyle: React.CSSProperties = {
  border: "1.5px solid #064e3b",
  background: "white",
  padding: "3mm",
  borderRadius: "3px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const qrCodeStyle: React.CSSProperties = {
  background: "white",
};

const qrLabelStyle: React.CSSProperties = {
  marginTop: "2mm",
  fontSize: "2.1mm",
  fontWeight: 700,
  textTransform: "uppercase",
  textAlign: "center",
  color: "#064e3b",
};

const footerNoteStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "1.7mm",
  fontWeight: 600,
  color: "#065f46",
  marginTop: "2mm",
};

RecensementSheet.displayName = "RecensementSheet";

export default RecensementSheet;