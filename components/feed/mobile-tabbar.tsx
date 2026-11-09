import { PlusIcon } from "@/components/ui/icons";
import { TabLink } from "@/components/feed/tab-link";
import { NAV_ITEMS } from "@/lib/feed";

const HIDDEN_ON_DESKTOP = "md:hidden";

// Tab bar inferior + FAB de nueva publicación, solo móvil (SPEC 02). Enlaces inertes.
export function MobileTabBar() {
  return (
    <>
      <a
        href="#"
        aria-label="Nueva publicación"
        className={`${HIDDEN_ON_DESKTOP} fixed right-[16px] bottom-[76px] z-10 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-linear-to-b from-accent-light to-accent-strong text-white shadow-2xl shadow-accent/60`}
      >
        <PlusIcon size={24} />
      </a>

      <nav
        className={`${HIDDEN_ON_DESKTOP} fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]`}
      >
        {NAV_ITEMS.map((item) => (
          <TabLink
            key={item.id}
            href={item.href}
            label={item.label}
            icon={<item.icon size={20} />}
            active={item.id === "feed"}
          />
        ))}
      </nav>
    </>
  );
}
