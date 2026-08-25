"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_PATH, logout } from "@/lib/auth";
import { uk } from "@/lib/i18n/uk";
import styles from "./LogoutButton.module.scss";

/**
 * Clears the API session cookie and leaves the authenticated shell.
 * Always navigates to login so the app gate cannot show job data afterward.
 */
export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    try {
      await logout();
    } catch {
      // Session may already be gone — still leave the app shell.
    } finally {
      router.replace(LOGIN_PATH);
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => void handleLogout()}
      disabled={isPending}
    >
      {isPending ? uk.auth.loggingOut : uk.auth.logout}
    </button>
  );
}
