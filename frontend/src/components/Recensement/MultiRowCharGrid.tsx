interface MultiRowCharGridProps {
  value?: string | null;
  columns: number;
  rows: number;
  className?: string;
}

export default function MultiRowCharGrid({
  value,
  columns,
  rows,
  className,
}: MultiRowCharGridProps) {
  const normalizedValue = (value ?? "").toUpperCase().replace(/\s/g, "");

  const cells = Array.from({ length: columns * rows });

  return (
    <div className={`multi-row-grid ${className || ""}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="char-grid flex gap-[1px]">
          {Array.from({ length: columns }).map((_, colIndex) => {
            const index = rowIndex * columns + colIndex;
            return (
              <div
                key={index}
                className="char-cell flex items-center justify-center border border-emerald-900 bg-emerald-50 text-emerald-900 print:bg-white print:border-emerald-900 font-bold uppercase font-mono"
                style={{ width: '4.5mm', height: '5.5mm', fontSize: '3.2mm' }}
              >
                {normalizedValue[index] ?? ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
