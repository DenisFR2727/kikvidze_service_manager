/**
 * Authenticated app shell.
 * Auth gate / logout wired in T020–T021.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <p className="app-shell__brand">Kikvidze Service Manager</p>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
