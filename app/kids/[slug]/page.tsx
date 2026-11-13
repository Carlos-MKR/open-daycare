import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileTabBar } from "@/components/feed/mobile-tabbar";
import { MobileTopBar } from "@/components/feed/mobile-topbar";
import { Sidebar } from "@/components/feed/sidebar";
import { AllergyAlert } from "@/components/kids/allergy-alert";
import { DetailRows } from "@/components/kids/detail-rows";
import { KidProfile } from "@/components/kids/kid-profile";
import { ProfileHeader } from "@/components/kids/profile-header";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { getDisplayName, requireUser } from "@/lib/auth/require-user";
import { getKidBySlug, KIDS } from "@/lib/kids";

// Los perfiles vienen de datos estáticos; se prerenderizan los 8 slugs
// conocidos y usePathname resuelve sin suspender (cacheComponents).
export function generateStaticParams() {
  return KIDS.map((kid) => ({ slug: kid.slug }));
}

// El cuerpo de la página depende por completo de params; permitimos que la
// ruta sea blocking para preservar el 404 de slugs desconocidos en lugar de
// flushear un shell instantáneo (partialPrefetching).
export const instant = false;

// Perfil del niño (references/pantallas/perfil-nino.dc.html, SPEC 03).
export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[slug]">) {
  const user = await requireUser();

  const { slug } = await params;
  const kid = getKidBySlug(slug);
  if (!kid) notFound();

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar displayName={getDisplayName(user)} />
      <div className="min-w-0 flex-1">
        <MobileTopBar />
        <MobileTabBar />
        <main className="md:h-screen md:overflow-y-auto">
          <div className="mx-auto w-full max-w-[820px] px-[16px] pt-[74px] pb-[140px] md:px-[40px] md:pt-[34px] md:pb-[80px]">
            <Link
              href="/kids"
              className="mb-[20px] flex items-center gap-[7px] text-[14px] font-bold text-muted-strong"
            >
              <ChevronLeftIcon size={18} strokeWidth={2.2} />
              Volver a Niños
            </Link>

            <div className="flex flex-wrap items-start gap-[26px]">
              <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
                <ProfileHeader kid={kid} />
                {kid.allergyNote ? <AllergyAlert note={kid.allergyNote} /> : null}
                <DetailRows kid={kid} />
              </div>

              <KidProfile kid={kid} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
