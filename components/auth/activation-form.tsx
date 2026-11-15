"use client";

import { useState, type FormEvent } from "react";
import { activateAccount } from "@/actions/auth/activate-account";
import { FormField } from "@/components/auth/form-field";

type ActivationFormProps = {
  // Datos traídos de la invitación real: no editables por el invitado.
  code: string;
  email: string;
};

type ActivationFormState = {
  password: string;
  photoConsent: boolean;
};

type ActivationErrors = Partial<Record<keyof ActivationFormState, string>>;

const initialState: ActivationFormState = {
  password: "",
  photoConsent: true,
};

function validate(state: ActivationFormState): ActivationErrors {
  const errors: ActivationErrors = {};

  if (!state.password) {
    errors.password = "Creá una contraseña.";
  } else if (state.password.length < 8) {
    errors.password = "La contraseña necesita al menos 8 caracteres.";
  }

  if (!state.photoConsent) {
    errors.photoConsent = "Necesitamos tu autorización para continuar.";
  }

  return errors;
}

export function ActivationForm({ code, email }: ActivationFormProps) {
  const [state, setState] = useState(initialState);
  const [errors, setErrors] = useState<ActivationErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Registro real (SPEC 13): el action crea la cuenta, consume el código y
  // redirige a /familia. El éxito nunca vuelve acá; solo los errores.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    const result = await activateAccount({
      code,
      email,
      password: state.password,
      photoConsent: state.photoConsent,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
      <FormField
        id="invitation-code"
        label="CÓDIGO DE INVITACIÓN"
        value={code}
        readOnly
        className="bg-cream font-display text-[18px] font-bold tracking-[3px] text-muted-strong"
        autoComplete="one-time-code"
      />
      <FormField
        id="activation-email"
        label="EMAIL"
        type="email"
        value={email}
        readOnly
        className="bg-cream text-muted-strong"
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
      {formError ? (
        <p className="text-[13px] font-bold text-alert-title">{formError}</p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[15px] bg-gradient-to-b from-accent-light to-accent-strong px-[16px] py-[15px] text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition hover:brightness-105 disabled:opacity-70"
      >
        {submitting ? "Activando…" : "Activar mi cuenta"}
      </button>
    </form>
  );
}
