export default function EmptyState({ icon: Icon, title, description, actions, children }) {
  return (
    <div className="text-center py-12 sm:py-16">
      {Icon && (
        <Icon
          className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3"
          aria-hidden="true"
        />
      )}
      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{title}</p>
      {description && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {(actions || children) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
