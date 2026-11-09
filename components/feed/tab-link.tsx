import type { ReactNode } from "react";

// Tab compacto de móvil: icono sobre etiqueta (SPEC 02).
type TabLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
};

export function TabLink({ href, label, icon, active = false }: TabLinkProps) {
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
