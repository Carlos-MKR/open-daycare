"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isNavActive } from "@/lib/feed";

type NavLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

// Enlace de nav con estado activo derivado de la ruta actual (SPEC 03).
export function NavLink({ href, label, icon }: NavLinkProps) {
  const active = isNavActive(usePathname(), href);

  return (
    <a
      href={href}
      className={`flex items-center gap-[12px] rounded-[12px] px-[12px] py-[11px] text-[14.5px] ${
        active
          ? "bg-chip-active font-extrabold text-accent-deep"
          : "font-semibold text-ink-soft"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
