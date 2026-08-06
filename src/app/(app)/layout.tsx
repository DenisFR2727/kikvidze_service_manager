import { AuthGate } from "@/components/auth/AuthGate";

/**
 * Authenticated app shell — gated by session via AuthGate (T020).
 * Logout control — T021.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="app-shell">
        <header className="app-shell__header">
          <p className="app-shell__brand">Kikvidze Service Manager</p>
        </header>
        <main className="app-shell__main">{children}</main>
      </div>
    </AuthGate>
  );
}
