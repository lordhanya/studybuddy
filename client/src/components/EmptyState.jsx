export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="text-center py-12 sm:py-16">
      {Icon && (
        <Icon
          className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3"
          aria-hidden="true"
        />
      )}
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{title}</p>
      {description && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
