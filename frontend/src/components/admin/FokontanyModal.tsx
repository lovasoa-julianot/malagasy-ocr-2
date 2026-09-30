import { Info, X } from "lucide-react";

interface FokontanyModalProps { isOpen: boolean; onClose: () => void; }
export default function FokontanyModal({ isOpen, onClose }: FokontanyModalProps) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><section className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><Info className="mt-0.5 text-primary"/><div><h2 className="font-bold">Enregistrement d’un Fokontany</h2><p className="mt-2 text-sm text-base-content/70">Un nouveau Fokontany est enregistré automatiquement lors de l’approbation d’une demande Chef, uniquement s’il n’existe pas déjà.</p></div></div><button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Fermer"><X size={17}/></button></div><div className="mt-5 flex justify-end"><button type="button" onClick={onClose} className="btn btn-primary btn-sm">Compris</button></div></section></div>;
}
