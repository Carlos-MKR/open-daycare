"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";

type ActivationFormState = {
  invitationCode: string;
  email: string;
  password: string;
  photoConsent: boolean;
};

type ActivationErrors = Partial<Record<keyof ActivationFormState, string>>;

const initialState: ActivationFormState = {
  invitationCode: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  password: "",
  photoConsent: true,
};

function validate(state: ActivationFormState): ActivationErrors {
  const errors: ActivationErrors = {};

  if (!state.invitationCode) errors.invitationCode = "Ingresá tu código de invitación.";
  if (!state.email) {
    errors.email = "Ingresá tu email.";
  } else if (!/^\S+@\S+\.\S+$/.test(state.email)) {
    errors.email = "Ingresá un email válido.";
  }
  if (!state.password) errors.password = "Creá una contraseña.";
  if (!state.photoConsent) errors.photoConsent = "Necesitamos tu autorización para continuar.";

  return errors;
}

export function ActivationForm() {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState<ActivationErrors>({});

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
        id="invitation-code"
        label="CÓDIGO DE INVITACIÓN"
        value={state.invitationCode}
        onChange={(event) => setState({ ...state, invitationCode: event.target.value.toUpperCase() })}
        error={errors.invitationCode}
        className="font-display text-[18px] font-bold tracking-[3px]"
        autoComplete="one-time-code"
      />
      <FormField
        id="activation-email"
        label="EMAIL"
        type="email"
        value={state.email}
        onChange={(event) => setState({ ...state, email: event.target.value })}
        error={errors.email}
        autoComplete="email"
      />
      <FormField
        id="activation-password"
        label="CREAR CONTRASEÑA"
        type="password"
        value={state.password}
        onChange={(event) => setState({ ...state, password: event.target.value })}
        error={errors.password}
        autoComplete="new-password"
      />
      <div>
        <label className="flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-[#fbf1d6] px-[16px] py-[14px]">
          <input
            type="checkbox"
            checked={state.photoConsent}
            onChange={(event) => setState({ ...state, photoConsent: event.target.checked })}
            className="sr-only"
          />
          <span
            className={`mt-[1px] flex h-[24px] w-[24px] flex-none items-center justify-center rounded-[8px] ${
              state.photoConsent ? "bg-[#5fb97e]" : "border-2 border-[#c5a85d] bg-transparent"
            }`}
          >
            {state.photoConsent ? (
              <svg
                aria-hidden="true"
                className="h-[15px] w-[15px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </span>
          <span className="text-[14px] leading-[1.45] text-[#8a7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
          </span>
        </label>
        {errors.photoConsent ? (
          <p className="mt-[6px] text-[12px] font-semibold text-alert-title">{errors.photoConsent}</p>
        ) : null}
      </div>
      <button
        type="submit"
        className="w-full rounded-[15px] bg-gradient-to-b from-accent-light to-accent-strong px-[16px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition hover:brightness-105"
      >
        Activar mi cuenta
      </button>
    </form>
  );
}
