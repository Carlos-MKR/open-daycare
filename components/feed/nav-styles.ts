// Lógica y estilos compartidos por NavLink/TabLink (client) y sus fallbacks
// estáticos (sidebar y tab bar). Con cacheComponents, usePathname suspende en
// prerenders con params desconocidos, p. ej. /kids/[slug]; el fallback inerte
// mantiene el layout mientras resuelve (SPEC 03).

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navLinkClassName(active: boolean): string {
  return `flex items-center gap-[12px] rounded-[12px] px-[12px] py-[11px] text-[14.5px] ${
    active
      ? "bg-chip-active font-extrabold text-accent-deep"
      : "font-semibold text-ink-soft"
  }`;
}

export function tabLinkClassName(active: boolean): string {
  return `flex flex-1 flex-col items-center gap-[4px] py-[10px] text-[12px] ${
    active ? "font-extrabold text-accent-deep" : "font-semibold text-ink-soft"
  }`;
}
