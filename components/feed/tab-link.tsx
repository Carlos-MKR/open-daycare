"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/feed";

// Tab compacto de móvil (SPEC 02); activo por ruta actual (SPEC 03).
type TabLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function TabLink({ href, label, icon }: TabLinkProps) {
  const active = isNavActive(usePathname(), href);

  return (
    <a
      href={href}
      className={`flex flex-1 flex-col items-center gap-[4px] py-[10px] text-[12px] ${
        active ? "font-extrabold text-accent-deep" : "font-semibold text-ink-soft"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
