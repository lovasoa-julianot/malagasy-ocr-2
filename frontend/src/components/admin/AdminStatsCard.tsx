import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "error" | "info";
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
}

const variantStyles = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  error: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  info: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

export default function AdminStatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "primary",
  trend,
  onClick,
}: AdminStatsCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xs transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-base-content/60">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-base-content">
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </p>

          {description && (
            <p className="mt-2 text-xs text-base-content/50">{description}</p>
          )}

          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              {trend.positive ? (
                <span className="inline-flex items-center gap-0.5 text-emerald-600">
                  <TrendingUp size={13} />
                  +{trend.value}
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-rose-600">
                  <TrendingDown size={13} />
                  -{trend.value}
                </span>
              )}
              <span className="text-base-content/40">vs mois dernier</span>
            </div>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${variantStyles[variant]}`}
        >
          <Icon size={22} />
        </div>
      </div>

      {isClickable && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
          <span>Consulter les détails</span>
          <ArrowUpRight size={13} />
        </div>
      )}
    </div>
  );
}
