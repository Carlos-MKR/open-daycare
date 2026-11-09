import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  BellIcon,
  ChildrenIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  SunIcon,
  UserIcon,
} from "@/components/ui/icons";
import { NavLink } from "@/components/feed/nav-link";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
}> = [
  { label: "Feed", href: "#", active: true, icon: <HomeIcon size={19} /> },
  { label: "Niños", href: "#", icon: <ChildrenIcon size={19} /> },
  { label: "Avisos", href: "#", icon: <BellIcon size={19} /> },
  { label: "Mi cuenta", href: "#", icon: <UserIcon size={19} /> },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-[16px] py-[24px]">
      <a
        href="#"
        className="flex items-center gap-[11px] px-[8px] pt-[4px] pb-[22px]"
      >
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-linear-[155deg] from-accent-lighter to-accent">
          <SunIcon size={21} className="text-white" />
        </div>
        <div>
          <div className="font-display text-[17px] leading-none font-semibold text-ink">
            OpenDayCare
          </div>
          <div className="mt-[2px] text-[11.5px] text-muted">Sala Soles</div>
        </div>
      </a>

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
            key={item.label}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.active}
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
            <div className="text-[12px] text-muted">Maestra · Soles</div>
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
