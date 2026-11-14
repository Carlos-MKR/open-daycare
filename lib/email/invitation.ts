// Envío del correo de invitación con Resend (SPEC 13, paso 3).
// Solo servidor: usar desde Server Actions, nunca desde componentes client.
import { Resend } from "resend";

export type InvitationEmailData = {
  to: string;
  staffName: string;
  parentName: string;
  childName: string;
  roomName: string;
  relationshipLabel: string; // "Mamá" | "Papá" | "Tutor/a"
  code: string;
  activationUrl: string; // `${NEXT_PUBLIC_SITE_URL}/activar-cuenta?code=XXXXX`
  expiresLabel: string; // ej. "7 días"
};

export type EmailSendResult = { ok: true } | { ok: false; error: string };

export async function sendInvitationEmail(
  invitation: InvitationEmailData,
): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { ok: false, error: "Falta RESEND_API_KEY en el servidor." };
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "OpenDayCare <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: invitation.to,
      subject: `${invitation.staffName} te invitó a OpenDayCare`,
      html: buildInvitationHtml(invitation),
    });

    if (error) {
      return { ok: false, error: "No pudimos enviar el correo. Intentá de nuevo." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "No pudimos conectar con el servidor de correos." };
  }
}

// HTML con estilos inline (clientes de correo ignoran CSS externo).
// Paleta de la app: crema #fbf4ec, coral #f08a7e, ámbar #fbf1d6.
function buildInvitationHtml(invitation: InvitationEmailData): string {
  const codeUrl = invitation.activationUrl;

  return `
<div style="font-family: Arial, Helvetica, sans-serif; background:#f6efe6; padding:24px;">
  <div style="max-width:520px; margin:0 auto; background:#fbf4ec; border-radius:16px; padding:28px; color:#3d2f24;">
    <h1 style="font-size:20px; margin:0 0 4px;">OpenDayCare</h1>
    <p style="font-size:15px; margin:0 0 20px; color:#6b5b4d;">
      <strong>${escapeHtml(invitation.staffName)}</strong> te invitó a vincular a
      <strong>${escapeHtml(invitation.childName)}</strong>
      (${escapeHtml(invitation.roomName)}).
    </p>
    <p style="font-size:15px; margin:0 0 20px;">
      Tu rol designado: <strong>${escapeHtml(invitation.relationshipLabel)}</strong>.
    </p>
    <div style="background:#fbf1d6; border:1px dashed #d9b45b; border-radius:12px; padding:18px; text-align:center; margin:0 0 20px;">
      <div style="font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#8a6d1d;">Código de invitación</div>
      <div style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#7a5c16; margin:6px 0;">${escapeHtml(invitation.code)}</div>
      <div style="font-size:13px; color:#8a6d1d;">Vence en ${escapeHtml(invitation.expiresLabel)}</div>
    </div>
    <a href="${escapeHtml(codeUrl)}"
       style="display:block; background:#f08a7e; color:#ffffff; text-decoration:none; text-align:center; font-weight:bold; font-size:15px; padding:14px 0; border-radius:9999px; margin:0 0 16px;">
      Activar mi cuenta
    </a>
    <p style="font-size:12px; color:#8a7a6a; margin:0;">
      ¿No ves el botón? Copiá esta dirección en tu navegador:<br>
      ${escapeHtml(codeUrl)}
    </p>
  </div>
</div>`.trim();
}

// Los nombres vienen de inputs del staff: escapar antes de interpolar en HTML.
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
