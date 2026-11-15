"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ActivateAccountInput = {
  code: string;
  email: string;
  password: string;
  photoConsent: boolean;
};

export type ActivationResult = { ok: true } | { ok: false; error: string };

type InvitationPayload = {
  status: "pending" | "accepted" | "expired" | "cancelled";
  full_name: string;
  email: string;
} | null;

const MIN_PASSWORD_LENGTH = 8;

// Registro por invitación (SPEC 13): valida en servidor, crea la cuenta con
// rol parent y consume el código. La sesión queda en cookies SSR (autoconfirm).
export async function activateAccount(
  input: ActivateAccountInput,
): Promise<ActivationResult> {
  const code = input.code.trim().toUpperCase();
  const email = input.email.trim().toLowerCase();

  if (!code || !email) {
    return { ok: false, error: "Faltan los datos de la invitación." };
  }

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: "La contraseña necesita al menos 8 caracteres.",
    };
  }

  if (!input.photoConsent) {
    return { ok: false, error: "Necesitamos tu autorización para continuar." };
  }

  const supabase = await createClient();

  // Revalidación autoritativa: el estado de la página puede estar desactualizado.
  const { data: validation } = await supabase.rpc("validate_invitation", {
    p_code: code,
  });
  const invitation = validation as InvitationPayload;

  if (!invitation || invitation.status !== "pending") {
    if (invitation?.status === "accepted") {
      return { ok: false, error: "Esta invitación ya fue activada. Ingresá con tu cuenta." };
    }

    if (invitation?.status === "expired") {
      return { ok: false, error: "La invitación venció. Pedí una nueva a la guardería." };
    }

    return { ok: false, error: "No encontramos esa invitación. Revisá el código." };
  }

  if (invitation.email.toLowerCase() !== email) {
    return { ok: false, error: "El email no coincide con la invitación." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: invitation.full_name,
        role: "parent",
        photo_consent: true,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { ok: false, error: "Ya tenés una cuenta. Ingresá con tu contraseña." };
    }

    return { ok: false, error: "No pudimos crear tu cuenta. Intentá de nuevo." };
  }

  // Con "Confirm email" desactivado (paso 11) signUp entrega sesión directo.
  // Si el proyecto sigue pidiendo confirmación, se intenta el login y, si no,
  // se guía al usuario sin consumir la invitación.
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (signInError) {
      return {
        ok: false,
        error: "Tu cuenta fue creada. Confirmá el email que te enviamos y volvé a intentar.",
      };
    }
  }

  // Consume el código a nombre del usuario recién autenticado.
  const { data: accepted } = await supabase.rpc("accept_invitation", {
    p_code: code,
    p_email: email,
  });

  if (!accepted) {
    return {
      ok: false,
      error: "No pudimos activar la invitación. Puede que ya haya sido usada.",
    };
  }

  redirect("/familia");
}
