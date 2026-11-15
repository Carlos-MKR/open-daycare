"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { fetchKidById } from "@/lib/data/children";
import { sendInvitationEmail } from "@/lib/email/invitation";
import {
  INVITATION_VALID_DAYS,
  generateInvitationCode,
  invitationExpiresAt,
  labelToRelationship,
  type Relationship,
} from "@/lib/invitations";
import { createClient } from "@/utils/supabase/server";

export type LinkParentInput = {
  childId: string;
  parentName: string;
  email: string;
  relationshipLabel: string; // "Mamá" | "Papá" | "Tutor/a"
};

export type LinkParentResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_INSERT_ATTEMPTS = 5;

// Vinculación real de padre (SPEC 13): invita, persiste y envía el correo.
// Nada se confía del cliente: sesión, rol staff, pertenencia del niño y
// validaciones se comprueban acá. Si el correo falla, la invitación queda
// `pending` y el reintento reutiliza el mismo código.
export async function linkParent(
  input: LinkParentInput,
): Promise<LinkParentResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, daycare_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "staff") {
    return { ok: false, error: "Solo el personal puede enviar invitaciones." };
  }

  if (!profile.daycare_id) {
    return { ok: false, error: "No pudimos identificar tu guardería." };
  }

  const parentName = input.parentName.trim();
  const email = input.email.trim().toLowerCase();
  const relationship = labelToRelationship(input.relationshipLabel);

  if (!parentName) {
    return { ok: false, error: "Ingresa el nombre del padre o madre." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Ingresa un email válido." };
  }

  if (!relationship) {
    return { ok: false, error: "Selecciona un parentesco válido." };
  }

  const kid = await fetchKidById(supabase, profile.daycare_id, input.childId);

  if (!kid) {
    return { ok: false, error: "No encontramos a ese niño en tu guardería." };
  }

  const pending = await findPendingInvitation(supabase, kid.id, email);
  const code = pending?.code ?? (await insertInvitation(supabase, {
    childId: kid.id,
    invitedBy: user.id,
    parentName,
    email,
    relationship,
  }));

  if (!code) {
    return { ok: false, error: "No pudimos generar la invitación. Intentá de nuevo." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const emailResult = await sendInvitationEmail({
    to: email,
    staffName: profile.full_name,
    parentName,
    childName: kid.name,
    roomName: kid.room,
    relationshipLabel: input.relationshipLabel,
    code,
    activationUrl: `${siteUrl}/activar-cuenta?code=${code}`,
    expiresLabel: `${INVITATION_VALID_DAYS} días`,
  });

  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error };
  }

  revalidatePath(`/kids/${kid.id}`);

  return { ok: true, code };
}

// Invitación pendiente vigente para el mismo niño + email: se reenvía su código
// en lugar de crear duplicados.
async function findPendingInvitation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  childId: string,
  email: string,
): Promise<{ code: string } | null> {
  const { data } = await supabase
    .from("invitations")
    .select("code")
    .eq("child_id", childId)
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

type NewInvitation = {
  childId: string;
  invitedBy: string;
  parentName: string;
  email: string;
  relationship: Relationship;
};

// Inserta con código único; ante colisión (unique_violation) reintenta.
// Devuelve el código insertado o null si agotó los intentos.
async function insertInvitation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invitation: NewInvitation,
): Promise<string | null> {
  for (let attempt = 0; attempt < CODE_INSERT_ATTEMPTS; attempt += 1) {
    const code = generateInvitationCode();
    const { error } = await supabase.from("invitations").insert({
      child_id: invitation.childId,
      invited_by: invitation.invitedBy,
      full_name: invitation.parentName,
      email: invitation.email,
      relationship: invitation.relationship,
      code,
      status: "pending",
      expires_at: invitationExpiresAt().toISOString(),
    });

    if (!error) return code;

    // 23505 = unique violation: solo la colisión de código admite reintento.
    if (error.code !== "23505") return null;
  }

  return null;
}
