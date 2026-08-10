import { AuthGate } from "@/components/auth/AuthGate";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { uk } from "@/lib/i18n/uk";

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
          <p className="app-shell__brand">{uk.app.brand}</p>
          <LogoutButton />
        </header>
        <main className="app-shell__main">{children}</main>
      </div>
    </AuthGate>
  );
}
