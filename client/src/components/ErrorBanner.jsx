export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
      {message}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-auto flex items-center gap-1 text-xs font-medium underline underline-offset-4 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
