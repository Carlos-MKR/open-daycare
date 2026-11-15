import { logout } from "@/actions/auth/logout";
import { AuthLogo } from "@/components/auth/auth-logo";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
import { SectionLabel } from "@/components/feed/section-label";
import { getDisplayName } from "@/lib/auth/require-user";
import { requireRole, PARENT_ROLES } from "@/lib/auth/require-role";
import { fetchLinkedChildren } from "@/lib/data/invitations";
import { fetchPostsForParent } from "@/lib/data/posts";
import { AVATAR_TONES, computeAgeLabel } from "@/lib/kids";
import { createClient } from "@/utils/supabase/server";

// Espacio del padre (SPEC 13/14): hijos vinculados + feed real limitado por RLS.
export const instant = false;

export default async function FamiliaPage() {
  const user = await requireRole(PARENT_ROLES);
  const supabase = await createClient();
  const [kids, posts] = await Promise.all([
    fetchLinkedChildren(supabase, user.id),
    fetchPostsForParent(supabase),
  ]);

  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto w-full max-w-[560px] px-[20px] py-[32px] md:py-[48px]">
        <AuthLogo className="mb-[24px] text-ink" />

        <h1 className="font-display text-[26px] font-semibold text-ink md:text-[30px]">
          Hola, {getDisplayName(user)}
        </h1>
        <p className="mt-[6px] text-[15px] leading-[1.5] text-muted-strong">
          Este es el espacio de tu hijo en OpenDayCare.
        </p>

        {kids.length === 0 ? (
          <div className="mt-[24px] rounded-[16px] border-[1.5px] border-dashed border-line bg-surface px-[18px] py-[22px] text-[14.5px] leading-[1.5] text-muted-strong">
            Todavía no tenés niños vinculados. Si la guardería te envió una
            invitación, activá el enlace del correo o iniciá sesión de nuevo.
          </div>
        ) : (
          <div className="mt-[24px] flex flex-col gap-[14px]">
            {kids.map((kid) => {
              const tone = AVATAR_TONES[kid.avatarTone];

              return (
                <div
                  key={kid.id}
                  className="flex items-center gap-[14px] rounded-[18px] border border-line bg-surface p-[16px] shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)]"
                >
                  <Avatar size="xl" bgColor={tone.bg} textColor={tone.text}>
                    {kid.avatarInitial}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[16px] font-semibold text-ink">
                      {kid.name}
                    </div>
                    <div className="text-[13px] text-muted">
                      {computeAgeLabel(kid.birthDate)} · {kid.room}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="mt-[24px] rounded-[16px] border-[1.5px] border-dashed border-line bg-surface px-[18px] py-[22px] text-center text-[14.5px] leading-[1.5] text-muted-strong">
            Todavía no hay novedades de tus hijos. Te avisamos cuando la
            guardería publique.
          </div>
        ) : (
          <div className="mt-[28px]">
            <SectionLabel label="NOVEDADES" />
            <div className="flex flex-col gap-[16px]">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        <form action={logout} className="mt-[26px]">
          <button
            type="submit"
            className="w-full rounded-[14px] border border-line bg-surface px-[16px] py-[12px] text-[14.5px] font-extrabold text-muted-strong transition hover:border-accent-light"
          >
            Cerrar sesión
          </button>
        </form>
      </main>
    </div>
  );
}
