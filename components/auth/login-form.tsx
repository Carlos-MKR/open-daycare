"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";

type LoginFormState = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginFormState, string>>;

const initialState: LoginFormState = {
  email: "caro@opendaycare.com",
  password: "",
};

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      router.push("/");
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
        className="w-full rounded-[15px] bg-gradient-to-b from-accent-light to-accent-strong px-[16px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition hover:brightness-105"
      >
        Iniciar sesión
      </button>
    </form>
  );
}
