"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { mapRegisterApiError } from "@/components/auth/authApiErrors";
import {
  APP_HOME_PATH,
  LOGIN_PATH,
  register,
} from "@/lib/auth";
import { uk } from "@/lib/i18n/uk";
import type { RegisterRequest } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();

  async function handleRegister(values: RegisterRequest) {
    try {
      await register(values);
    } catch (err) {
      const mapped = mapRegisterApiError(err);
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
      <h1 className="login__title">{uk.auth.registerTitle}</h1>
      <RegisterForm onSubmit={handleRegister} />
      <p className="login__nav">
        <Link href={LOGIN_PATH}>{uk.auth.toLogin}</Link>
      </p>
    </div>
  );
}
