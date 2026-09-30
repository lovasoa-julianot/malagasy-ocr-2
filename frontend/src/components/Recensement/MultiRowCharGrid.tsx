interface MultiRowCharGridProps {
  value?: string | null;
  columns: number;
  rows: number;
}

export default function MultiRowCharGrid({
  value,
  columns,
  rows,
}: MultiRowCharGridProps) {
  const normalizedValue = (value ?? "").toUpperCase().replace(/\s/g, "");

  const cells = Array.from({ length: columns * rows });

  return (
    <div className="border border-emerald-900 bg-white">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((_, index) => (
          <div
            key={index}
            className="
              flex h-7
              items-center justify-center
              border-b border-r border-emerald-900
              text-[10px]
              font-bold
            "
          >
            {normalizedValue[index] ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}
