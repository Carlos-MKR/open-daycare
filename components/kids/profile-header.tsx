import { Avatar } from "@/components/ui/avatar";
import { AVATAR_TONES, computeAgeLabel, type Kid } from "@/lib/kids";

type ProfileHeaderProps = {
  kid: Kid;
};

// Cabecera del perfil: avatar grande, nombre y botón "Editar" (inerte).
export function ProfileHeader({ kid }: ProfileHeaderProps) {
  const tone = AVATAR_TONES[kid.avatarTone];

  return (
    <div className="flex items-center gap-[18px]">
      <Avatar size="hero" bgColor={tone.bg} textColor={tone.text}>
        {kid.avatarInitial}
      </Avatar>
      <div className="flex-1">
        <h1 className="font-display text-[28px] font-semibold text-ink">
          {kid.name}
        </h1>
        <p className="mt-[3px] text-[15px] text-muted-strong">
          {computeAgeLabel(kid.birthDate)} · {kid.room}
        </p>
      </div>
      <a
        href="#"
        className="rounded-[12px] border-[1.5px] border-line bg-surface px-[16px] py-[9px] text-[14px] font-bold text-ink-soft"
      >
        Editar
      </a>
    </div>
  );
}
