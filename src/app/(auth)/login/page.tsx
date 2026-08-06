"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { ApiError, apiClient } from "@/lib/api-client";
import type { LoginRequest, LoginResponse } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(values: LoginRequest) {
    try {
      await apiClient.post<LoginResponse>("/api/auth/login", values);
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        throw new Error("Невірний логін або пароль");
      }
      if (err instanceof ApiError) {
        throw new Error(err.message || "Не вдалося увійти. Спробуйте ще раз.");
      }
      throw err;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="login">
      <h1 className="login__title">Вхід</h1>
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
