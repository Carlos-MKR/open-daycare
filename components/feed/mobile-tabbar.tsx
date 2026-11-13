"use client";

import { Suspense, useCallback } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { TabLink } from "@/components/feed/tab-link";
import { tabLinkClassName } from "@/components/feed/nav-styles";
import { usePublicationComposer } from "@/components/feed/publication-composer";
import { NAV_ITEMS } from "@/lib/feed";

const HIDDEN_ON_DESKTOP = "md:hidden";

// Tabs estáticos (sin estado activo): fallback del prerender mientras
// usePathname resuelve, p. ej. en /kids/[slug] con cacheComponents.
function InertTabs() {
  return NAV_ITEMS.map((item) => (
    <a key={item.id} href={item.href} className={tabLinkClassName(false)}>
      <item.icon size={20} />
      {item.label}
    </a>
  ));
}

// Tab bar inferior + FAB de nueva publicación, solo móvil (SPEC 02). Enlaces inertes.
export function MobileTabBar() {
  const { open } = usePublicationComposer();
  const handleCreatePublication = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    open(event.currentTarget);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={handleCreatePublication}
        aria-label="Nueva publicación"
        className={`${HIDDEN_ON_DESKTOP} fixed right-[16px] bottom-[76px] z-10 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-linear-to-b from-accent-light to-accent-strong text-white shadow-2xl shadow-accent/60`}
      >
        <PlusIcon size={24} />
      </button>

      <nav
        className={`${HIDDEN_ON_DESKTOP} fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]`}
      >
        <Suspense fallback={<InertTabs />}>
          {NAV_ITEMS.map((item) => (
            <TabLink
              key={item.id}
              href={item.href}
              label={item.label}
              icon={<item.icon size={20} />}
            />
          ))}
        </Suspense>
      </nav>
    </>
  );
}
