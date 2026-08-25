"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, isUnauthorizedError, LOGIN_PATH } from "@/lib/auth";
import { uk } from "@/lib/i18n/uk";
import styles from "./AuthGate.module.scss";

type AuthGateProps = {
  children: React.ReactNode;
};

type GateStatus = "checking" | "authenticated" | "error";

/**
 * Client gate: session cookie lives on the API origin, so auth must be
 * checked in the browser. Redirects to `/login` when `getMe` returns null
 * or an unauthorized error. Infra failures stay on an error UI with retry.
 */
export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>("checking");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      setStatus("checking");

      try {
        const admin = await getMe();
        if (cancelled) {
          return;
        }
        if (!admin) {
          router.replace(LOGIN_PATH);
          return;
        }
        setStatus("authenticated");
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (isUnauthorizedError(err)) {
          router.replace(LOGIN_PATH);
          return;
        }
        setStatus("error");
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router, retryKey]);

  if (status === "authenticated") {
    return children;
  }

  if (status === "error") {
    return (
      <div className={styles.pending} role="alert">
        <p className={styles.pendingText}>{uk.auth.sessionCheckFailed}</p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => setRetryKey((key) => key + 1)}
        >
          {uk.auth.retrySession}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pending} aria-busy="true" aria-live="polite">
      <p className={styles.pendingText}>{uk.auth.checkingSession}</p>
    </div>
  );
}
