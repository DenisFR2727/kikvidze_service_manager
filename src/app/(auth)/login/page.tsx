"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { mapLoginApiError } from "@/components/auth/authApiErrors";
import { APP_HOME_PATH, REGISTER_PATH, login } from "@/lib/auth";
import { uk } from "@/lib/i18n/uk";
import type { LoginRequest } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(values: LoginRequest) {
    try {
      await login(values);
    } catch (err) {
      const mapped = mapLoginApiError(err);
      if (mapped) {
        throw mapped;
      }
      throw err;
    }

    router.replace(APP_HOME_PATH);
    router.refresh();
  }

  return (
    <div className="login">
      <h1 className="login__title">{uk.auth.title}</h1>
      <p className="login__subtitle">{uk.auth.loginSubtitle}</p>
      <LoginForm onSubmit={handleLogin} />
      <p className="login__nav">
        <Link href={REGISTER_PATH}>{uk.auth.toRegister}</Link>
      </p>
    </div>
  );
}
