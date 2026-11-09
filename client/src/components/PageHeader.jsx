import { Link } from "react-router-dom";

export default function PageHeader({
  title,
  description,
  actions,
  backLink,
  backLabel = "Back",
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
      {backLink && (
        <Link
          to={backLink}
          className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] hover:underline inline-flex items-center gap-1"
        >
          <span className="h-4 w-4">←</span>
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
