import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  allergyChipLabel,
  AVATAR_TONES,
  computeAgeLabel,
  type Kid,
} from "@/lib/kids";

type KidCardProps = {
  kid: Kid;
};

// Card del listado de niños reales (SPEC 12): chip de alergia si aplica y
// "VINCULAR" porque la vinculación de padres todavía es mock.
export function KidCard({ kid }: KidCardProps) {
  const tone = AVATAR_TONES[kid.avatarTone];
  const allergyChip = allergyChipLabel(kid.allergies);

  return (
    <Link
      href={`/kids/${kid.id}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-line bg-surface p-[16px] shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition duration-150 hover:-translate-y-[2px] hover:border-accent-light"
    >
      <Avatar size="xl" bgColor={tone.bg} textColor={tone.text}>
        {kid.avatarInitial}
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold text-ink">
          {kid.name}
        </div>
        <div className="text-[13px] text-muted">
          {computeAgeLabel(kid.birthDate)} · sin padres vinculados
        </div>
      </div>
      {allergyChip ? (
        <span className="flex-none rounded-full bg-chip-allergy px-[9px] py-[5px] text-[11px] font-extrabold text-chip-allergy-text">
          {allergyChip}
        </span>
      ) : (
        <span className="flex-none rounded-full bg-chip-link px-[9px] py-[5px] text-[11px] font-extrabold text-chip-link-text">
          VINCULAR
        </span>
      )}
    </Link>
  );
}
