import { Avatar } from "@/components/ui/avatar";
import { CameraIcon } from "@/components/ui/icons";

// Enlace inerte a "crear publicación" hasta que exista su ruta (SPEC 01).
export function ComposerPrompt({ onCreatePublication }: { onCreatePublication?: (event: React.MouseEvent<HTMLElement>) => void }) {
  return (
    <button
      type="button"
      onClick={onCreatePublication}
      className="mb-[24px] flex items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <Avatar size="md" bgColor="bg-accent">
        C
      </Avatar>
      <span className="flex-1 text-[15px] text-muted">
        Compartí un momento…
      </span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-chip-active text-liked">
        <CameraIcon size={19} />
      </span>
    </button>
  );
}
