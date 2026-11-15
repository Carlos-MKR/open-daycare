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
import { getDisplayName } from "@/lib/auth/require-user";
import { requireRole, STAFF_ROLES } from "@/lib/auth/require-role";
import { fetchDaycareId, fetchKidById } from "@/lib/data/children";
import { fetchLinkedParents } from "@/lib/data/invitations";
import { createClient } from "@/utils/supabase/server";

// El perfil depende de la sesión y de la DB: página dinámica (SPEC 12).
export const instant = false;

// Perfil del niño con datos reales (references/pantallas/perfil-nino.dc.html,
// SPEC 12). La ruta cambió de slug a uuid: dos niños pueden llamarse igual.
export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  const user = await requireRole(STAFF_ROLES);
  const supabase = await createClient();
  const daycareId = await fetchDaycareId(supabase);

  if (!daycareId) notFound();

  const { id } = await params;
  const [kid, linkedParents] = await Promise.all([
    fetchKidById(supabase, daycareId, id),
    fetchLinkedParents(supabase, id),
  ]);
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
                {kid.allergies ? <AllergyAlert note={kid.allergies} /> : null}
                <DetailRows kid={kid} />
              </div>

              <KidProfile kid={kid} parents={linkedParents} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
