import { SunIcon } from "@/components/ui/icons";

export function BrandMark() {
  return (
    <a href="#" className="flex items-center gap-[11px]">
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-linear-[155deg] from-accent-lighter to-accent">
        <SunIcon size={21} className="text-white" />
      </div>
      <div>
        <div className="font-display text-[17px] leading-none font-semibold text-ink">
          OpenDayCare
        </div>
        <div className="mt-[2px] text-[11.5px] text-muted">Sala Soles</div>
      </div>
    </a>
  );
}
