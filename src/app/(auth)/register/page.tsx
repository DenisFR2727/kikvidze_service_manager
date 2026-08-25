"use client";

import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ApiError } from "@/lib/api-client";
import { APP_HOME_PATH, register } from "@/lib/auth";
import { uk } from "@/lib/i18n/uk";
import type { RegisterRequest } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();

  async function handleRegister(values: RegisterRequest) {
    try {
      await register(values);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        throw new Error(uk.auth.loginTaken);
      }
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        const passwordField = err.fields?.password;
        if (passwordField) {
          throw new Error(uk.auth.passwordTooShort);
        }
        throw new Error(err.message || uk.auth.registerFailed);
      }
      if (err instanceof ApiError) {
        throw new Error(err.message || uk.auth.registerFailed);
      }
      throw err;
    }

    router.replace(APP_HOME_PATH);
    router.refresh();
  }

  return (
    <div className="login">
      <h1 className="login__title">{uk.auth.registerTitle}</h1>
      <RegisterForm onSubmit={handleRegister} />
    </div>
  );
}
