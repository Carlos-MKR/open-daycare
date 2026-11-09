// Enlace inerte a "detalle publicacion" + placeholder de la foto (SPEC 01).
import { ImageIcon } from "@/components/ui/icons";

type PhotoPlaceholderProps = {
  caption: string;
};

export function PhotoPlaceholder({ caption }: PhotoPlaceholderProps) {
  return (
    <a
      href="#"
      className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-[8px] rounded-[16px] border-[1.5px] border-dashed border-dashed-stroke bg-photo-bg text-photo-fg"
    >
      <ImageIcon size={30} strokeWidth={1.7} />
      <span className="text-[13.5px]">{caption}</span>
    </a>
  );
}
