import { X, Printer, Loader2 } from "lucide-react";
import { useRef } from "react";

import type { RecensementDetail } from "../../services/recensementService";
import RecensementSheet from "./RecensementSheet";

interface RecensementDetailModalProps {
  data: RecensementDetail | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

export default function RecensementDetailModal({
  data,
  loading = false,
  error = null,
  onClose,
}: RecensementDetailModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  if (!data && !loading && !error) {
    return null;
  }

  return (
    <>
      {/* Print-only version - positioned at root level, hidden on screen, visible when printing */}
      {data && (
        <div className="print-only" style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
          <RecensementSheet data={data} />
        </div>
      )}

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div
          className="
            flex h-[95vh]
            w-full max-w-6xl
            flex-col overflow-hidden
            rounded-2xl
            bg-slate-900
            shadow-2xl
          "
        >
          {/* HEADER MODAL */}

          <div className="no-print flex shrink-0 items-center justify-between border-b border-slate-700 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Consultation de la fiche
              </h2>

              {data && (
                <p className="mt-1 text-xs text-slate-400">
                  Fiche N° {data.numero_fiche}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {data && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-square text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* CONTENU */}

          <div className="no-print flex-1 overflow-y-auto bg-slate-800 p-5">
            {loading && (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <Loader2 className="h-8 w-8 animate-spin" />

                  <span className="text-sm">Chargement de la fiche...</span>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="flex h-full items-center justify-center">
                <div className="alert alert-error max-w-lg">
                  <span>{error}</span>
                </div>
              </div>
            )}

            {data && !loading && !error && (
              <div className="mx-auto w-fit">
                <div ref={sheetRef}>
                  <RecensementSheet data={data} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .print-only {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            page-break-after: always;
            z-index: 9999 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .fixed.inset-0 {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}