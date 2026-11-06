export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
