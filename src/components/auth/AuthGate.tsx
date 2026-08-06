"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, LOGIN_PATH } from "@/lib/auth";
import styles from "./AuthGate.module.scss";

type AuthGateProps = {
  children: React.ReactNode;
};

/**
 * Client gate: session cookie lives on the API origin, so auth must be
 * checked in the browser. Redirects to `/login` when `getMe` returns 401/null.
 */
export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const admin = await getMe();
        if (cancelled) {
          return;
        }
        if (!admin) {
          router.replace(LOGIN_PATH);
          return;
        }
        setAuthenticated(true);
      } catch {
        if (!cancelled) {
          router.replace(LOGIN_PATH);
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authenticated) {
    return (
      <div className={styles.pending} aria-busy="true" aria-live="polite">
        <p className={styles.pendingText}>Перевірка сесії…</p>
      </div>
    );
  }

  return children;
}
