import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  brandPanel?: ReactNode;
};

export function AuthShell({ children, brandPanel }: AuthShellProps) {
  return (
    <div
      className={`min-h-screen bg-cream ${
        brandPanel ? "md:grid md:grid-cols-[1.05fr_1fr]" : "flex items-center justify-center"
      }`}
    >
      {brandPanel}
      {children}
    </div>
  );
}
