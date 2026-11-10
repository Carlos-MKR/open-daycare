"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, tabLinkClassName } from "@/components/feed/nav-styles";

// Tab compacto de móvil (SPEC 02); activo por ruta actual (SPEC 03).
// Los href "#" son inertes; el resto navega con Link.
type TabLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function TabLink({ href, label, icon }: TabLinkProps) {
  const className = tabLinkClassName(isNavActive(usePathname(), href));

  if (href === "#") {
    return (
      <a href="#" className={className}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {icon}
      {label}
    </Link>
  );
}
