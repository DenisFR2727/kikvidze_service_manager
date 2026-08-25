/**
 * Unauthenticated auth shell (login / register).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      <main className="auth-shell__main">{children}</main>
    </div>
  );
}
