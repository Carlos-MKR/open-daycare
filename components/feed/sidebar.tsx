import { Suspense, useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { LogoutIcon, PlusIcon } from "@/components/ui/icons";
import { BrandMark } from "@/components/feed/brand-mark";
import { NavLink } from "@/components/feed/nav-link";
import { navLinkClassName } from "@/components/feed/nav-styles";
import { usePublicationComposer } from "@/components/feed/publication-composer";
import { NAV_ITEMS } from "@/lib/feed";

// Nav estática (sin estado activo): fallback del prerender mientras
// usePathname resuelve, p. ej. en /kids/[slug] con cacheComponents.
function InertNav() {
  return NAV_ITEMS.map((item) => (
    <a key={item.id} href={item.href} className={navLinkClassName(false)}>
      <item.icon size={19} />
      {item.label}
    </a>
  ));
}

export function Sidebar() {
  const { open } = usePublicationComposer();

  const handleCreatePublication = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    open(event.currentTarget);
  }, [open]);

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-[16px] py-[24px] md:flex">
      <div className="px-[8px] pb-[22px] pt-[4px]">
        <BrandMark />
      </div>

      <button
        type="button"
        onClick={handleCreatePublication}
        className="mb-[18px] flex w-full items-center justify-center gap-[8px] rounded-[14px] bg-linear-to-b from-accent-light to-accent-strong py-[12px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <PlusIcon size={17} />
        Nueva publicación
      </button>

      <nav className="flex flex-1 flex-col gap-[4px]">
        <Suspense fallback={<InertNav />}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              href={item.href}
              label={item.label}
              icon={<item.icon size={19} />}
            />
          ))}
        </Suspense>
      </nav>

      <div className="mt-[10px] border-t border-line pt-[14px]">
        <div className="flex items-center gap-[11px] px-[8px] py-[6px]">
          <Avatar size="sm" bgColor="bg-accent">
            C
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold text-ink">
              Caro Giménez
            </div>
            <div className="text-[12px] text-muted">Maestra · Sala Soles</div>
          </div>
          <a
            href="#"
            title="Cerrar sesión"
            className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-[10px] bg-cream text-muted-strong"
          >
            <LogoutIcon size={16} />
          </a>
        </div>
      </div>
    </aside>
  );
}
