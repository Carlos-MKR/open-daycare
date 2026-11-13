"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { createClient } from "@/utils/supabase/client";

type LoginFormState = {
  email: string;
  password: string;
};

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const initialState: LoginFormState = {
  email: "",
  password: "",
};

const CREDENTIALS_ERROR = "Email o contraseña incorrectos.";
const NETWORK_ERROR = "No pudimos conectar con el servidor. Intentá de nuevo.";

function validate(state: LoginFormState): LoginErrors {
  const errors: LoginErrors = {};

  if (!state.email) {
    errors.email = "Ingresá tu email.";
  } else if (!/^\S+@\S+\.\S+$/.test(state.email)) {
    errors.email = "Ingresá un email válido.";
  }

  if (!state.password) {
    errors.password = "Ingresá tu contraseña.";
  }

  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });

      if (error) {
        setErrors({ form: CREDENTIALS_ERROR });
        setSubmitting(false);
        return;
      }

      router.push("/");
      // Renderizado fresco del servidor con la cookie de sesión recién escrita.
      router.refresh();
    } catch {
      setErrors({ form: NETWORK_ERROR });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
      <FormField
        id="login-email"
        label="EMAIL"
        type="email"
        value={state.email}
        onChange={(event) => setState({ ...state, email: event.target.value })}
        error={errors.email}
        autoComplete="email"
      />
      <div>
        <FormField
          id="login-password"
          label="CONTRASEÑA"
          type="password"
          placeholder="••••••••"
          value={state.password}
          onChange={(event) => setState({ ...state, password: event.target.value })}
          error={errors.password}
          autoComplete="current-password"
        />
        <div className="mt-[10px] text-right">
          <span className="cursor-pointer text-[13.5px] font-bold text-edit-link">
            ¿Olvidaste tu contraseña?
          </span>
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[15px] bg-gradient-to-b from-accent-light to-accent-strong px-[16px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Ingresando…" : "Iniciar sesión"}
      </button>
      {errors.form ? (
        <p role="alert" className="-mt-[6px] text-center text-[13px] font-semibold text-alert-title">
          {errors.form}
        </p>
      ) : null}
    </form>
  );
}
