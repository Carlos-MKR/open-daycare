import { logout } from "@/actions/auth/logout";
import { Avatar } from "@/components/ui/avatar";
import { LogoutIcon } from "@/components/ui/icons";
import { BrandMark } from "@/components/feed/brand-mark";

// Top bar fija para móvil (<768px), SPEC 02.
export function MobileTopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-[16px] py-[11px] md:hidden">
      <BrandMark />
      <div className="flex items-center gap-[8px]">
        <Avatar size="sm" bgColor="bg-accent">
          C
        </Avatar>
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[10px] bg-cream text-muted-strong"
          >
            <LogoutIcon size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
