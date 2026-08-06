"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_PATH, logout } from "@/lib/auth";
import styles from "./LogoutButton.module.scss";

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
      {isPending ? "Вихід…" : "Вийти"}
    </button>
  );
}
