interface CharGridProps {
  value?: string | null;
  length: number;
  label?: string;
  className?: string;
}

export default function CharGrid({ value, length, label, className }: CharGridProps) {
  const normalizedValue = (value ?? "")
    .toUpperCase()
    .replace(/\s/g, "")
    .slice(0, length);

  return (
    <div className={`flex flex-col ${className || ""}`}>
      {label && (
        <div className="mb-1.5 text-[1.8mm] font-bold uppercase text-emerald-900 print:text-emerald-900">
          {label}
        </div>
      )}

      <div className="flex gap-[1px] char-grid">
        {Array.from({ length }).map((_, index) => (
          <div
            key={index}
            className="char-cell flex items-center justify-center border border-emerald-900 bg-emerald-50 text-emerald-900 print:bg-white print:border-emerald-900 font-bold uppercase font-mono"
            style={{ width: '4.5mm', height: '5.5mm', fontSize: '3.2mm' }}
          >
            {normalizedValue[index] ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}
