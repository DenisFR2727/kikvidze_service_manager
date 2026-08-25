"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { ApiError } from "@/lib/api-client";
import { APP_HOME_PATH, login } from "@/lib/auth";
import { uk } from "@/lib/i18n/uk";
import type { LoginRequest } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(values: LoginRequest) {
    try {
      await login(values);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        throw new Error(uk.auth.invalidCredentials);
      }
      if (err instanceof ApiError && err.code === "NETWORK") {
        throw new Error(uk.auth.loginFailed);
      }
      if (err instanceof ApiError) {
        throw new Error(uk.auth.loginFailed);
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
    </div>
  );
}
