import type { ReactNode } from "react";

// Enlace de navegación; inerte por decisión de la SPEC 01 (href="#").
type NavLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

export function NavLink({ href, label, icon, active = false }: NavLinkProps) {
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
