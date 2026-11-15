import { connection } from "next/server";
import Link from "next/link";
import { ActivationForm } from "@/components/auth/activation-form";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthShell } from "@/components/auth/auth-shell";
import { avatarInitialFor } from "@/lib/kids";
import { createClient } from "@/utils/supabase/server";

// Página pública pero dinámica: lee ?code= y consulta la DB por request (SPEC 13).
export const instant = false;

type InvitationPayload = {
  status: "pending" | "accepted" | "expired" | "cancelled";
  full_name: string;
  email: string;
  relationship: string;
  child_id: string;
  child_name: string;
  room_name: string;
  expires_at: string;
};

type ActivationViewState =
  | { kind: "no-code" }
  | { kind: "not-found" }
  | { kind: "expired" }
  | { kind: "accepted" }
  | { kind: "valid"; invitation: InvitationPayload };

const VIEWS: Record<
  Exclude<ActivationViewState, { kind: "valid" }>["kind"],
  { title: string; message: string; action: "login" | "email" }
> = {
  "no-code": {
    title: "Código no encontrado",
    message:
      "No encontramos el código de invitación en el enlace. Abrí el link que te enviamos por correo.",
    action: "email",
  },
  "not-found": {
    title: "Invitación inválida",
    message:
      "Este código de invitación no existe. Pedile a la guardería que te envíe una nueva.",
    action: "email",
  },
  expired: {
    title: "Invitación vencida",
    message:
      "Esta invitación ya no está vigente. Pedile a la guardería que te envíe una nueva.",
    action: "email",
  },
  accepted: {
    title: "Invitación ya utilizada",
    message: "Esta invitación ya fue activada. Ingresá con tu cuenta.",
    action: "login",
  },
};

// Validación real de la invitación antes de mostrar el formulario (SPEC 13).
export default async function ActivationPage({
  searchParams,
}: PageProps<"/activar-cuenta">) {
  // connection() marca la página como request-bound: sin sesión ni cookies que
  // la dinamicen, supabase-js llamaría Date.now() durante el prerender.
  await connection();

  const rawCode = (await searchParams).code ?? "";
  // ?code= puede repetirse en la URL; el primero manda.
  const code = (Array.isArray(rawCode) ? rawCode[0] ?? "" : rawCode).trim().toUpperCase();

  if (!code) {
    return renderNotice(VIEWS["no-code"]);
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("validate_invitation", { p_code: code });
  const invitation = data as InvitationPayload | null;

  if (!invitation || invitation.status === "cancelled") {
    return renderNotice(VIEWS["not-found"]);
  }

  if (invitation.status === "expired") {
    return renderNotice(VIEWS.expired);
  }

  if (invitation.status === "accepted") {
    return renderNotice(VIEWS.accepted);
  }

  return (
    <AuthShell>
      <main className="w-full max-w-[440px] px-[24px] py-[40px] md:px-0">
        <AuthLogo className="mb-[22px] text-ink" />
        <h1 className="mb-[8px] font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Hola, {invitation.full_name.split(" ")[0]}
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-line bg-white px-[16px] py-[14px]">
          <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-avatar-sky font-display text-[19px] font-semibold text-avatar-sky-text">
            {avatarInitialFor(invitation.child_name)}
          </div>
          <div>
            <div className="text-[13px] text-muted-strong">Te invitaron a seguir a</div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {invitation.child_name} · {invitation.room_name}
            </div>
          </div>
        </div>

        <ActivationForm code={code} email={invitation.email} />
        <p className="mt-[22px] text-center text-[14.5px] text-muted-strong">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-edit-link">
            Iniciar sesión
          </Link>
        </p>
      </main>
    </AuthShell>
  );
}

// Estados de error de la invitación: sin formulario, con el mismo shell visual.
function renderNotice(view: (typeof VIEWS)[keyof typeof VIEWS]) {
  return (
    <AuthShell>
      <main className="w-full max-w-[440px] px-[24px] py-[40px] md:px-0">
        <AuthLogo className="mb-[22px] text-ink" />
        <h1 className="mb-[8px] font-display text-[28px] font-semibold leading-[1.15] text-ink">
          {view.title}
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
          {view.message}
        </p>
        <div className="rounded-[16px] border-[1.5px] border-line bg-white px-[16px] py-[14px] text-[14.5px] text-ink">
          {view.action === "login" ? (
            <Link href="/login" className="font-extrabold text-edit-link">
              Iniciar sesión
            </Link>
          ) : (
            <span className="text-muted-strong">
              Revisá tu casilla de correo y volvé a abrir el enlace de activación.
            </span>
          )}
        </div>
      </main>
    </AuthShell>
  );
}
