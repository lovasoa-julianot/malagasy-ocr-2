import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  FileImage,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  ScanLine,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { extractCIN } from "../services/ocrService";
import { createRecensement } from "../services/recensementService";

type Step =
  | "documents"
  | "ocr"
  | "verification"
  | "success"
  | "existe";

interface CINFiles {
  recto: File | null;
  verso: File | null;
}

interface OCRData {
  nom: string;
  prenoms: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  numero_cin: string;
  rang: string;
  profession: string;
  nom_pere: string;
  nom_mere: string;
  lieu_delivrance: string;
  date_delivrance: string;
}

/**
 * Champs comparés entre la sortie brute de l'OCR et la fiche
 * effectivement validée par l'agent. La part de champs
 * inchangés mesure la précision réelle de la lecture.
 */
const CHAMPS_EVALUES_OCR: (keyof OCRData)[] = [
  "nom",
  "prenoms",
  "sexe",
  "date_naissance",
  "lieu_naissance",
  "numero_cin",
  "rang",
  "profession",
  "nom_pere",
  "nom_mere",
  "lieu_delivrance",
  "date_delivrance",
];

function normaliser(valeur: string) {
  return valeur.trim().toLowerCase().replace(/\s+/g, " ");
}

function calculerPrecisionOcr(
  brut: OCRData | null,
  final: OCRData,
): number | null {
  if (!brut) return null;

  const compares = CHAMPS_EVALUES_OCR.filter((champ) => {
    const reference = normaliser(brut[champ] ?? "");
    const soumis = normaliser(final[champ] ?? "");

    // Un champ vide des deux côtés n'apporte aucune
    // information sur la qualité de la lecture.
    return reference !== "" || soumis !== "";
  });

  if (compares.length === 0) return null;

  const inchanges = compares.filter(
    (champ) =>
      normaliser(brut[champ] ?? "") === normaliser(final[champ] ?? ""),
  ).length;

  return Math.round((inchanges / compares.length) * 100);
}

export default function NouveauRecensement() {
  const navigate = useNavigate();
  const { agent } = useAuth();

  const [step, setStep] = useState<Step>("documents");

  const [files, setFiles] = useState<CINFiles>({
    recto: null,
    verso: null,
  });

  const [previews, setPreviews] = useState({
    recto: null as string | null,
    verso: null as string | null,
  });

  const [numeroKarine, setNumeroKarine] = useState("");

  const [ocrData, setOcrData] = useState<OCRData | null>(null);

  /*
   * Sortie brute de l'OCR, conservée séparément des champs
   * éditables afin de mesurer la précision de la lecture
   * lors de l'enregistrement de la fiche.
   */
  const [ocrBrut, setOcrBrut] = useState<OCRData | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [registrationResult, setRegistrationResult] = useState<{
    numero_fiche: string;
    numero_cin: string;
    qr_token: string;
    statut: string;
    message: string;
    deja_existe: boolean;
  } | null>(null);

  /*
   * La page est normalement protégée par AgentRoute.
   * Cette vérification évite simplement un rendu incohérent
   * si l'agent n'est pas encore disponible.
   */
  if (!agent) {
    return null;
  }

  function attachImageFile(file: File, side: "recto" | "verso") {
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("L’image ne doit pas dépasser 15 Mo.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFiles((previous) => ({ ...previous, [side]: file }));
    setPreviews((previous) => {
      if (previous[side]) URL.revokeObjectURL(previous[side]!);
      return { ...previous, [side]: previewUrl };
    });
    setError(null);
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    side: "recto" | "verso",
  ) {
    const file = event.target.files?.[0];
    if (file) attachImageFile(file, side);
    event.target.value = "";
  }

  function removeFile(side: "recto" | "verso") {
    setFiles((previous) => ({
      ...previous,
      [side]: null,
    }));

    setPreviews((previous) => {
      if (previous[side]) {
        URL.revokeObjectURL(previous[side]!);
      }

      return {
        ...previous,
        [side]: null,
      };
    });
  }

  async function handleStartOCR() {
    if (!files.recto || !files.verso) {
      setError("Veuillez fournir le recto et le verso de la CIN.");
      return;
    }

    setError(null);
    setStep("ocr");

    try {
      const result = await extractCIN(files.recto, files.verso);

      const donnees: OCRData = {
        nom: result.nom ?? "",
        prenoms: result.prenoms ?? "",
        sexe: result.sexe ?? "",
        date_naissance: result.date_naissance ?? "",
        lieu_naissance: result.lieu_naissance ?? "",
        numero_cin: result.numero_cin ?? "",
        rang: result.numero_serie_cin ?? "",
        profession: result.profession ?? "",
        nom_pere: result.nom_pere ?? "",
        nom_mere: result.nom_mere ?? "",
        lieu_delivrance: result.lieu_delivrance ?? "",
        date_delivrance: result.date_delivrance ?? "",
      };

      setOcrBrut(donnees);
      setOcrData(donnees);

      setStep("verification");
    } catch (error) {
      console.error("Erreur OCR :", error);

      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l'extraction OCR.",
      );

      setStep("documents");
    }
  }

  function updateOCRField(field: keyof OCRData, value: string) {
    setOcrData((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        [field]: value,
      };
    });
  }

  async function handleSave() {
    if (!ocrData?.nom.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (!ocrData?.prenoms.trim()) {
      setError("Les prénoms sont obligatoires.");
      return;
    }

    if (!ocrData?.numero_cin.trim()) {
      setError("Le numéro CIN est obligatoire.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const result = await createRecensement({
        numero_karine: numeroKarine.trim() || null,

        nom: ocrData.nom.trim(),
        prenoms: ocrData.prenoms.trim(),
        sexe: ocrData.sexe.trim() || null,

        date_naissance: ocrData.date_naissance.trim() || null,
        lieu_naissance: ocrData.lieu_naissance.trim() || null,

        numero_cin: ocrData.numero_cin.trim(),
        numero_serie_cin: ocrData.rang.trim() || null,

        profession: ocrData.profession.trim() || null,

        nom_pere: ocrData.nom_pere.trim() || null,
        nom_mere: ocrData.nom_mere.trim() || null,

        lieu_delivrance: ocrData.lieu_delivrance.trim() || null,
        date_delivrance: ocrData.date_delivrance.trim() || null,

        date_recensement_terrain: new Date().toISOString().slice(0, 10),

        ocr_confidence: calculerPrecisionOcr(ocrBrut, ocrData),
      });

      setRegistrationResult({
        numero_fiche: result.numero_fiche,
        numero_cin: result.numero_cin,
        qr_token: result.qr_token,
        statut: result.statut,
        message: result.message,
        deja_existe: result.deja_existe,
      });

      if (result.deja_existe) {
        setStep("existe");
      } else {
        setStep("success");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);

      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'enregistrement.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    Object.values(previews).forEach((preview) => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    });

    setFiles({
      recto: null,
      verso: null,
    });

    setPreviews({
      recto: null,
      verso: null,
    });

    setNumeroKarine("");
    setOcrData(null);
    setOcrBrut(null);
    setRegistrationResult(null);
    setError(null);
    setStep("documents");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Recensement</span>
          <span>/</span>
          <span className="text-slate-300">Nouveau recensement</span>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Nouveau recensement
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Numérisez la CIN, vérifiez les informations extraites puis
              enregistrez le recensement.
            </p>
          </div>

          {step !== "success" && (
            <button
              type="button"
              onClick={() => {
                if (step === "documents") {
                  navigate("/agent/dashboard");
                } else {
                  setStep("documents");
                }
              }}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft size={17} />
              Retour
            </button>
          )}
        </div>
      </section>

      <ProgressSteps currentStep={step} />

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <X size={18} className="mt-0.5 shrink-0" />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {step === "documents" && (
        <DocumentsStep
          files={files}
          previews={previews}
          numeroKarine={numeroKarine}
          onFileChange={handleFileChange}
          onCaptureFile={attachImageFile}
          onRemove={removeFile}
          onNumeroKarineChange={setNumeroKarine}
          onStartOCR={handleStartOCR}
        />
      )}

      {step === "ocr" && <OCRProcessingStep />}

      {step === "verification" && ocrData && (
        <VerificationStep
          data={ocrData}
          numeroKarine={numeroKarine}
          previews={previews}
          isSaving={isSaving}
          onChange={updateOCRField}
          onBack={() => setStep("documents")}
          onSave={handleSave}
        />
      )}

      {step === "success" && registrationResult && (
        <SuccessStep
          result={registrationResult}
          onNew={resetForm}
          onHistory={() => navigate("/agent/historique")}
        />
      )}

      {step === "existe" && registrationResult && (
        <ExisteStep
          result={registrationResult}
          onNew={resetForm}
          onHistory={() => navigate("/agent/historique")}
        />
      )}
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/* Progress                                                                  */
/* -------------------------------------------------------------------------- */

function ProgressSteps({ currentStep }: { currentStep: Step }) {
  const steps = [
    {
      id: "documents",
      label: "Documents",
    },
    {
      id: "ocr",
      label: "Extraction OCR",
    },
    {
      id: "verification",
      label: "Vérification",
    },
    {
      id: "success",
      label: "Enregistrement",
    },
  ];

  const currentIndex = steps.findIndex((item) => item.id === currentStep);

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex min-w-155 items-center">
        {steps.map((item, index) => {
          const completed = index < currentIndex;
          const active = index === currentIndex;

          return (
            <div key={item.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`
                    flex h-9 w-9 shrink-0 items-center justify-center
                    rounded-full border text-xs font-bold
                    ${
                      completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : active
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-500"
                    }
                  `}
                >
                  {completed ? <Check size={16} /> : index + 1}
                </div>

                <span
                  className={`
                    hidden text-sm font-medium sm:block
                    ${active || completed ? "text-slate-200" : "text-slate-500"}
                  `}
                >
                  {item.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                    mx-4 h-px flex-1
                    ${
                      index < currentIndex
                        ? "bg-emerald-500/50"
                        : "bg-slate-800"
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Documents                                                                 */
/* -------------------------------------------------------------------------- */

interface DocumentsStepProps {
  files: CINFiles;
  previews: {
    recto: string | null;
    verso: string | null;
  };
  numeroKarine: string;
  onFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    side: "recto" | "verso",
  ) => void;
  onCaptureFile: (file: File, side: "recto" | "verso") => void;
  onRemove: (side: "recto" | "verso") => void;
  onNumeroKarineChange: (value: string) => void;
  onStartOCR: () => void;
}

function DocumentsStep({
  files,
  previews,
  numeroKarine,
  onFileChange,
  onCaptureFile,
  onRemove,
  onNumeroKarineChange,
  onStartOCR,
}: DocumentsStepProps) {
  const { agent } = useAuth();

  const rectoInput = useRef<HTMLInputElement>(null);
  const versoInput = useRef<HTMLInputElement>(null);
  const [cameraSide, setCameraSide] = useState<"recto" | "verso" | null>(null);

  if (!agent) return null;

  const ready = Boolean(files.recto && files.verso);

  return (
    <div className="space-y-6">
      {/* Administrative information */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <FileText size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Informations du recensement
            </h2>

            <p className="text-xs text-slate-500">
              Informations administratives de la fiche
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-1">
          <InputField
            label="Numéro Karine"
            placeholder="Ex. 312877"
            value={numeroKarine}
            onChange={onNumeroKarineChange}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ReadonlyInfo
            icon={<UserRound size={16} />}
            label="Agent"
            value={`${agent.nom} ${agent.prenoms}`}
          />

          <ReadonlyInfo
            icon={<MapPin size={16} />}
            label="Fokontany"
            value={agent.fokontany?.nom ?? "Non renseigné"}
          />
        </div>
      </section>

      {/* CIN */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Carte d'identité nationale
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Importez ou photographiez les deux faces de la CIN.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <CINUploadCard
            side="recto"
            file={files.recto}
            preview={previews.recto}
            inputRef={rectoInput}
            onFileChange={onFileChange}
            onCapture={() => setCameraSide("recto")}
            onRemove={onRemove}
          />

          <CINUploadCard
            side="verso"
            file={files.verso}
            preview={previews.verso}
            inputRef={versoInput}
            onFileChange={onFileChange}
            onCapture={() => setCameraSide("verso")}
            onRemove={onRemove}
          />
        </div>

        <div className="mt-6 rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-blue-400" size={19} />

            <div>
              <p className="text-sm font-medium text-slate-200">
                Extraction assistée par OCR
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Les photos recto et verso seront envoyées au serveur à l’étape suivante pour extraire les données. Vous pourrez les vérifier et les corriger avant l’enregistrement.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onStartOCR}
            disabled={!ready}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl bg-blue-600 px-5 py-3
              text-sm font-semibold text-white
              shadow-lg shadow-blue-600/20
              transition
              hover:bg-blue-500
              disabled:cursor-not-allowed
              disabled:bg-slate-800
              disabled:text-slate-500
              disabled:shadow-none
            "
          >
            <ScanLine size={18} />
            Envoyer les photos et lancer l’OCR
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {cameraSide && (
        <CameraCaptureDialog
          side={cameraSide}
          onClose={() => setCameraSide(null)}
          onCapture={(file) => {
            if (!cameraSide) return;
            onCaptureFile(file, cameraSide);
            setCameraSide(null);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CIN Upload Card                                                           */
/* -------------------------------------------------------------------------- */

interface CINUploadCardProps {
  side: "recto" | "verso";
  file: File | null;
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    side: "recto" | "verso",
  ) => void;
  onCapture: () => void;
  onRemove: (side: "recto" | "verso") => void;
}

function CINUploadCard({
  side,
  file,
  preview,
  inputRef,
  onFileChange,
  onCapture,
  onRemove,
}: CINUploadCardProps) {
  const title = side === "recto" ? "Recto" : "Verso";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
            <FileImage size={15} />
          </div>

          <span className="text-sm font-semibold text-slate-200">
            CIN {title}
          </span>
        </div>

        {file && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 size={14} />
            Prêt
          </span>
        )}
      </div>

      <div className="p-4">
        {preview ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black">
            <img
              src={preview}
              alt={`CIN ${title}`}
              className="aspect-16/10 w-full object-contain"
            />

            <button
              onClick={() => onRemove(side)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur transition hover:bg-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            className="
              flex aspect-16/10 flex-col items-center
              justify-center rounded-xl border border-dashed
              border-slate-700 bg-slate-900/50
            "
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
              <ImagePlus size={25} />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-300">
              Aucun document
            </p>

            <p className="mt-1 text-xs text-slate-600">JPG, PNG ou WEBP</p>
          </div>
        )}

        {file && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-300">
                {file.name}
              </p>

              <p className="text-[11px] text-slate-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={() => onRemove(side)}
              className="shrink-0 text-xs text-slate-500 hover:text-red-400"
            >
              Supprimer
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onFileChange(event, side)}
          />

          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Upload size={15} />
            Importer
          </button>

          <button
            type="button"
            onClick={onCapture}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Camera size={15} />
            Photographier
          </button>
        </div>
      </div>
    </div>
  );
}

interface CameraCaptureDialogProps {
  side: "recto" | "verso";
  onCapture: (file: File) => void;
  onClose: () => void;
}

function CameraCaptureDialog({ side, onCapture, onClose }: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let mediaStream: MediaStream | null = null;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("La caméra n’est pas disponible dans ce navigateur. Importez une photo à la place.");
        return;
      }

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setCameraReady(true);
        }
      } catch (error) {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : "";
        setCameraError(
          name === "NotAllowedError"
            ? "L’accès à la caméra a été refusé. Autorisez-le dans votre navigateur ou importez une photo."
            : "Impossible d’ouvrir la caméra. Vérifiez qu’elle n’est pas déjà utilisée, ou importez une photo.",
        );
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      mediaStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("La caméra n’est pas encore prête. Réessayez dans un instant.");
      return;
    }

    setCapturing(true);
    const scale = Math.min(1, 1920 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("La photo n’a pas pu être préparée. Réessayez ou importez une image.");
      setCapturing(false);
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      setCapturing(false);
      if (!blob) {
        setCameraError("La photo n’a pas pu être créée. Réessayez.");
        return;
      }

      onCapture(new File([blob], `cin-${side}-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      }));
    }, "image/jpeg", 0.92);
  }

  const sideLabel = side === "recto" ? "recto" : "verso";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="camera-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Capture CIN</p>
            <h2 id="camera-title" className="mt-1 text-lg font-semibold text-slate-900">Photographier le {sideLabel}</h2>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-square" aria-label="Fermer la caméra">
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-950 p-3 sm:p-5">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-sm text-white">
                <Loader2 size={24} className="animate-spin text-blue-400" />
                Ouverture de la caméra…
              </div>
            )}
            {cameraError && (
              <div role="alert" className="absolute inset-x-4 bottom-4 rounded-xl border border-rose-200 bg-white p-4 text-sm text-rose-700 shadow-lg">
                {cameraError}
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-300">Placez la carte entière dans le cadre et assurez-vous que le texte est net.</p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-between">
          <button type="button" onClick={onClose} className="btn btn-ghost">Annuler</button>
          <button type="button" onClick={capturePhoto} disabled={!cameraReady || capturing} className="btn btn-primary gap-2">
            {capturing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {capturing ? "Préparation…" : "Capturer cette photo"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* OCR Processing                                                             */
/* -------------------------------------------------------------------------- */

function OCRProcessingStep() {
  return (
    <div className="flex min-h-130 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
      <div className="max-w-md px-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-400">
          <Loader2 size={36} className="animate-spin" />
        </div>

        <h2 className="mt-6 text-xl font-bold text-white">
          Analyse de la carte en cours
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Le système analyse le recto et le verso de la CIN afin d'extraire
          automatiquement les informations d'identité.
        </p>

        <div className="mx-auto mt-6 max-w-xs space-y-2 text-left">
          <ProcessingItem label="Lecture du recto" />
          <ProcessingItem label="Lecture du verso" />
          <ProcessingItem label="Structuration des données" />
        </div>

        <p className="mt-6 text-xs text-slate-600">Veuillez patienter...</p>
      </div>
    </div>
  );
}

function ProcessingItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-950 px-3 py-2.5">
      <Loader2 size={14} className="animate-spin text-blue-400" />

      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Verification                                                              */
/* -------------------------------------------------------------------------- */

interface VerificationStepProps {
  data: OCRData;
  numeroKarine: string;
  previews: {
    recto: string | null;
    verso: string | null;
  };
  isSaving: boolean;
  onChange: (field: keyof OCRData, value: string) => void;
  onBack: () => void;
  onSave: () => void;
}

function VerificationStep({
  data,
  numeroKarine,
  previews,
  isSaving,
  onChange,
  onBack,
  onSave,
}: VerificationStepProps) {
  const { agent } = useAuth();

  if (!agent) return null;
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      {/* Documents */}
      <section className="space-y-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <ScanLine size={18} />
            </div>

            <div>
              <h2 className="font-semibold text-white">Documents analysés</h2>

              <p className="text-xs text-slate-500">
                Source de l'extraction OCR
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <DocumentPreview label="Recto de la CIN" preview={previews.recto} />

            <DocumentPreview label="Verso de la CIN" preview={previews.verso} />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-amber-400" />

            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Vérification humaine
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Vérifiez chaque information extraite avant de valider
                définitivement le recensement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">Données extraites</h2>

              <p className="mt-1 text-xs text-slate-500">
                Les champs restent modifiables par l'agent.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 size={14} />
              OCR terminé
            </span>
          </div>
        </div>

        <div className="space-y-7 p-5 sm:p-6">
          {/* Identity */}
          <FormSection title="Identité">
            <div className="grid gap-4 md:grid-cols-2">
              <EditableField
                label="Nom"
                value={data.nom}
                onChange={(value) => onChange("nom", value)}
                required
              />

              <EditableField
                label="Prénoms"
                value={data.prenoms}
                onChange={(value) => onChange("prenoms", value)}
                required
              />

              <EditableField
                label="Sexe"
                value={data.sexe}
                onChange={(value) => onChange("sexe", value)}
              />

              <EditableField
                label="Date de naissance"
                value={data.date_naissance}
                onChange={(value) => onChange("date_naissance", value)}
              />

              <EditableField
                label="Lieu de naissance"
                value={data.lieu_naissance}
                onChange={(value) => onChange("lieu_naissance", value)}
              />

              <EditableField
                label="Profession"
                value={data.profession}
                onChange={(value) => onChange("profession", value)}
              />
            </div>
          </FormSection>

          {/* CIN */}
          <FormSection title="Carte d'identité">
            <div className="grid gap-4 md:grid-cols-2">
              <EditableField
                label="Numéro CIN"
                value={data.numero_cin}
                onChange={(value) => onChange("numero_cin", value)}
                required
              />

              <EditableField
                label="Rang / série"
                value={data.rang}
                onChange={(value) => onChange("rang", value)}
              />

              <EditableField
                label="Date de délivrance"
                value={data.date_delivrance}
                onChange={(value) => onChange("date_delivrance", value)}
              />

              <EditableField
                label="Lieu de délivrance"
                value={data.lieu_delivrance}
                onChange={(value) => onChange("lieu_delivrance", value)}
              />
            </div>
          </FormSection>

          {/* Parents */}
          <FormSection title="Filiation">
            <div className="grid gap-4 md:grid-cols-2">
              <EditableField
                label="Nom du père"
                value={data.nom_pere}
                onChange={(value) => onChange("nom_pere", value)}
              />

              <EditableField
                label="Nom de la mère"
                value={data.nom_mere}
                onChange={(value) => onChange("nom_mere", value)}
              />
            </div>
          </FormSection>

          {/* Administrative */}
          <FormSection title="Informations administratives">
            <div className="grid gap-4 md:grid-cols-2">
              <ReadonlyInfo
                icon={<FileText size={15} />}
                label="N° Karine"
                value={numeroKarine || "Non renseigné"}
              />

              <ReadonlyInfo
                icon={<UserRound size={15} />}
                label="Agent"
                value={`${agent.nom} ${agent.prenoms}`}
              />

              <ReadonlyInfo
                icon={<MapPin size={15} />}
                label="Fokontany"
                value={agent.fokontany?.nom || "Non renseigné"}
              />
            </div>
          </FormSection>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-between">
            <button
              onClick={onBack}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <ArrowLeft size={17} />
              Revenir aux documents
            </button>

            <button
              onClick={onSave}
              disabled={isSaving}
              className="
                inline-flex items-center justify-center gap-2
                rounded-xl bg-emerald-600 px-5 py-3
                text-sm font-semibold text-white
                shadow-lg shadow-emerald-600/20
                transition hover:bg-emerald-500
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Valider et enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Success                                                                    */
/* -------------------------------------------------------------------------- */

interface SuccessStepProps {
  result: {
    numero_fiche: string;
    numero_cin: string;
    qr_token: string;
  };
  onNew: () => void;
  onHistory: () => void;
}

function SuccessStep({ result, onNew, onHistory }: SuccessStepProps) {
  const { agent } = useAuth();

  if (!agent) return null;
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-3xl border border-emerald-500/20 bg-slate-900 p-6 text-center shadow-2xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 size={42} />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Recensement enregistré
        </p>

        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          Fiche créée avec succès
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
          Les données de la personne ont été enregistrées et associées à votre
          Fokontany.
        </p>

        <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
          <ResultCard label="Numéro de fiche" value={result.numero_fiche} />

          <ResultCard label="Numéro CIN" value={result.numero_cin} />

          <ResultCard label="Agent" value={`${agent.nom} ${agent.prenoms}`} />

          <ResultCard
            label="Fokontany"
            value={agent.fokontany?.nom || "Non renseigné"}
          />
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left">
          <p className="text-xs text-slate-500">QR Token</p>

          <p className="mt-2 break-all font-mono text-xs text-slate-400">
            {result.qr_token}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            <ScanLine size={18} />
            Nouveau recensement
          </button>

          <button
            onClick={onHistory}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Voir l'historique
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Personne deja enregistree                                                  */
/* -------------------------------------------------------------------------- */

interface ExisteStepProps {
  result: {
    numero_fiche: string;
    numero_cin: string;
    qr_token: string;
    statut: string;
    message: string;
    deja_existe: boolean;
  };
  onNew: () => void;
  onHistory: () => void;
}

function ExisteStep({
  result,
  onNew,
  onHistory,
}: ExisteStepProps) {
  const { agent } = useAuth();

  if (!agent) return null;
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-3xl border border-amber-500/20 bg-slate-900 p-6 text-center shadow-2xl sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <AlertCircle size={42} />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Personne deja enregistree
        </p>

        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
          Aucun doublon cree
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
          Cette personne est deja enregistree dans la base de donnees. Aucune
          nouvelle fiche n'a ete creee.
        </p>

        <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
          <ResultCard label="Personne existante" value="Oui" />

          <ResultCard label="Numero CIN" value={result.numero_cin} />

          <ResultCard
            label="Derniere fiche associee"
            value={result.numero_fiche || "Aucune"}
          />

          <ResultCard
            label="Agent"
            value={`${agent.nom} ${agent.prenoms}`}
          />
        </div>

        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left">
          <p className="text-xs text-slate-500">Message</p>

          <p className="mt-2 break-all text-xs text-slate-400">
            {result.message || "La personne existe deja."}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onNew}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            <ScanLine size={18} />
            Nouveau recensement
          </button>

          <button
            onClick={onHistory}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Voir l'historique
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable UI                                                               */
/* -------------------------------------------------------------------------- */

function InputField({
  label,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="
          w-full rounded-xl border border-slate-700
          bg-slate-950 px-4 py-3 text-sm text-white
          outline-none transition
          placeholder:text-slate-700
          focus:border-blue-500
          focus:ring-2 focus:ring-blue-500/10
        "
      />
    </label>
  );
}

function EditableField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="
          w-full rounded-xl border border-slate-700
          bg-slate-950 px-4 py-3 text-sm text-slate-200
          outline-none transition
          focus:border-blue-500
          focus:ring-2 focus:ring-blue-500/10
        "
      />
    </label>
  );
}

function ReadonlyInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
      <div className="text-slate-600">{icon}</div>

      <div className="min-w-0">
        <p className="text-[11px] text-slate-600">{label}</p>

        <p className="truncate text-sm font-medium text-slate-300">{value}</p>
      </div>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-slate-200">{title}</h3>

      {children}
    </div>
  );
}

function DocumentPreview({
  label,
  preview,
}: {
  label: string;
  preview: string | null;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>

      {preview ? (
        <img
          src={preview}
          alt={label}
          className="aspect-16/10 w-full rounded-xl border border-slate-800 bg-black object-contain"
        />
      ) : (
        <div className="flex aspect-16/10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
          <div className="text-center">
            <FileImage size={25} className="mx-auto text-slate-700" />

            <p className="mt-2 text-xs text-slate-600">Aperçu non disponible</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left">
      <p className="text-xs text-slate-600">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}
