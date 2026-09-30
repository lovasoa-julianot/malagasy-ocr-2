interface CharGridProps {
  value?: string | null;
  length: number;
  label?: string;
}

export default function CharGrid({ value, length, label }: CharGridProps) {
  const normalizedValue = (value ?? "")
    .toUpperCase()
    .replace(/\s/g, "")
    .slice(0, length);

  return (
    <div className="flex flex-col">
      {label && (
        <div className="mb-1 text-[9px] font-bold uppercase text-slate-800">
          {label}
        </div>
      )}

      <div className="flex">
        {Array.from({ length }).map((_, index) => (
          <div
            key={index}
            className="
              flex h-7 w-7 items-center justify-center
              border border-emerald-900
              bg-white
              text-[11px]
              font-bold
              uppercase
            "
          >
            {normalizedValue[index] ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}
