import Link from "next/link";
import { ActivationForm } from "@/components/auth/activation-form";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ActivationPage() {
  return (
    <AuthShell>
      <main className="w-full max-w-[440px] px-[24px] py-[40px] md:px-0">
        <AuthLogo className="mb-[22px] text-ink" />
        <h1 className="mb-[8px] font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted-strong">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-line bg-white px-[16px] py-[14px]">
          <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-avatar-sky font-display text-[19px] font-semibold text-avatar-sky-text">
            M
          </div>
          <div>
            <div className="text-[13px] text-muted-strong">Te invitaron a seguir a</div>
            <div className="font-display text-[17px] font-semibold text-ink">Mateo · Sala Soles</div>
          </div>
        </div>

        <ActivationForm />
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
