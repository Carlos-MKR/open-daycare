import { useCallback } from "react";
import { Avatar } from "@/components/ui/avatar";
import { CameraIcon } from "@/components/ui/icons";
import { usePublicationComposer } from "@/components/feed/publication-composer";

export function ComposerPrompt() {
  const { open } = usePublicationComposer();

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    open(event.currentTarget);
  }, [open]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-[24px] flex w-full items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-[14px] text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
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
