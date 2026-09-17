import { AuthGate } from "@/components/auth/AuthGate";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeProvider } from "@/components/theme/ThemeContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { uk } from "@/lib/i18n/uk";

/**
 * Authenticated app shell — gated by session; logout in header.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ThemeProvider>
        <div className="app-shell">
          <header className="app-shell__header">
            <p className="app-shell__brand">{uk.app.brand}</p>
            <div className="app-shell__header-actions">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </header>
          <main className="app-shell__main">{children}</main>
        </div>
      </ThemeProvider>
    </AuthGate>
  );
}
