import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-6">
          <div className="w-full max-w-md rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] p-6 text-[hsl(var(--card-foreground))]">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              The page could not be rendered. Reload to try again.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-[hsl(var(--secondary))] p-3 text-xs">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[hsl(var(--primary))] px-4 text-sm font-medium text-[hsl(var(--primary-foreground))]"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
