"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { ApiError } from "@/lib/api-client";
import { APP_HOME_PATH, login } from "@/lib/auth";
import type { LoginRequest } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(values: LoginRequest) {
    try {
      await login(values);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        throw new Error("Невірний логін або пароль");
      }
      if (err instanceof ApiError) {
        throw new Error(err.message || "Не вдалося увійти. Спробуйте ще раз.");
      }
      throw err;
    }

    router.replace(APP_HOME_PATH);
    router.refresh();
  }

  return (
    <div className="login">
      <h1 className="login__title">Вхід</h1>
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
