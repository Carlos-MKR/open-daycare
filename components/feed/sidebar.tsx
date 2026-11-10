import { Avatar } from "@/components/ui/avatar";
import { LogoutIcon, PlusIcon } from "@/components/ui/icons";
import { BrandMark } from "@/components/feed/brand-mark";
import { NavLink } from "@/components/feed/nav-link";
import { NAV_ITEMS } from "@/lib/feed";

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-[16px] py-[24px] md:flex">
      <div className="px-[8px] pb-[22px] pt-[4px]">
        <BrandMark />
      </div>

      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-[8px] rounded-[14px] bg-linear-to-b from-accent-light to-accent-strong py-[12px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <PlusIcon size={17} />
        Nueva publicación
      </a>

      <nav className="flex flex-1 flex-col gap-[4px]">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            href={item.href}
            label={item.label}
            icon={<item.icon size={19} />}
          />
        ))}
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
