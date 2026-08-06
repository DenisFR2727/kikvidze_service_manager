import { AuthGate } from "@/components/auth/AuthGate";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * Authenticated app shell — gated by session; logout in header.
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
          <LogoutButton />
        </header>
        <main className="app-shell__main">{children}</main>
      </div>
    </AuthGate>
  );
}
