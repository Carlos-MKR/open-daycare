"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, navLinkClassName } from "@/components/feed/nav-styles";

type NavLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

// Enlace de nav con estado activo derivado de la ruta actual (SPEC 03).
// Los href "#" son inertes; el resto navega con Link.
export function NavLink({ href, label, icon }: NavLinkProps) {
  const className = navLinkClassName(isNavActive(usePathname(), href));

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
