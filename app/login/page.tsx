import Link from "next/link";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

function BrandPanel() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-[#f6a98e] via-accent to-[#ec7e62] p-[56px_60px] text-white md:flex md:flex-col md:justify-between">
      <div className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/10" />
      <div className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10" />
      <AuthLogo className="relative" />
      <div className="relative">
        <h1 className="mb-[18px] font-display text-[42px] font-semibold leading-[1.12]">
          El día de cada niño,
          <br />
          compartido con su familia.
        </h1>
        <p className="max-w-[430px] text-[17px] leading-[1.6] text-white/90">
          Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.
        </p>
      </div>
      <div className="relative text-[14px] text-white/90">🌿 Guardería Sala Soles</div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <AuthShell brandPanel={<BrandPanel />}>
      <main className="flex min-h-screen items-center justify-center px-[24px] py-[40px] md:px-[40px]">
        <div className="w-full max-w-[392px]">
          <h2 className="mb-[6px] font-display text-[30px] font-semibold text-ink">Iniciar sesión</h2>
          <p className="mb-[28px] text-[15px] text-muted-strong">Ingresá para ver el día de hoy.</p>
          <LoginForm />
          <p className="mt-[24px] text-center text-[14.5px] text-muted-strong">
            ¿Te invitó la guardería?{" "}
            <Link href="/activar-cuenta" className="font-extrabold text-edit-link">
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </main>
    </AuthShell>
  );
}
