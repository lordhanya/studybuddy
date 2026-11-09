import { Link } from "react-router-dom";

export default function PageHeader({
  title,
  description,
  actions,
  backLink,
  backLabel = "Back",
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        {backLink && (
          <Link
            to={backLink}
            className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:underline inline-flex items-center gap-1"
          >
            <span aria-hidden="true">←</span>
            {backLabel}
          </Link>
        )}
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
