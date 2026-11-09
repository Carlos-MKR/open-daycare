import type { ReactNode } from "react";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  size: AvatarSize;
  bgColor: string;
  textColor?: string;
  children: ReactNode;
};

const SIZES: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "h-[38px] w-[38px]", text: "text-[16px]" },
  md: { container: "h-[40px] w-[40px]", text: "text-[16px]" },
  lg: { container: "h-[44px] w-[44px]", text: "text-[17px]" },
};
export function Avatar({
  size,
  bgColor,
  textColor = "text-white",
  children,
}: AvatarProps) {
  const { container, text } = SIZES[size];

  return (
    <div
      className={`${container} ${bgColor} ${textColor} ${text} flex flex-none items-center justify-center rounded-full font-display font-semibold`}
    >
      {children}
    </div>
  );
}
