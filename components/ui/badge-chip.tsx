import type { ReactNode } from "react";

type BadgeChipProps = {
  bgColor: string;
  dotColor: string;
  textColor: string;
  children: ReactNode;
};

export function BadgeChip({
  bgColor,
  dotColor,
  textColor,
  children,
}: BadgeChipProps) {
  return (
    <div
      className={`flex items-center gap-[7px] rounded-full ${bgColor} px-[12px] py-[6px]`}
    >
      <span className={`h-[8px] w-[8px] rounded-full ${dotColor}`} />
      <span className={`text-[12px] font-extrabold tracking-[.5px] ${textColor}`}>
        {children}
      </span>
    </div>
  );
}
