import { Avatar } from "@/components/ui/avatar";
import { PlusIcon } from "@/components/ui/icons";
import { AVATAR_TONES, type LinkedParent, type ParentStatus } from "@/lib/kids";

type ParentsPanelProps = {
  parents: LinkedParent[];
};

// Chip de estado del vínculo: ACTIVA / PENDIENTE.
const STATUS_STYLES: Record<ParentStatus, { label: string; className: string }> = {
  active: {
    label: "ACTIVA",
    className: "bg-success-soft text-success",
  },
  pending: {
    label: "PENDIENTE",
    className: "bg-chip-pending text-chip-pending-text",
  },
};

export function ParentsPanel({ parents }: ParentsPanelProps) {
  return (
    <div className="rounded-[16px] border border-line bg-surface px-[18px] py-[16px]">
      <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-caption">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-[14px]">
        {parents.map((parent) => {
          const status = STATUS_STYLES[parent.status];
          const tone = AVATAR_TONES[parent.tone];

          return (
            <div key={parent.name} className="flex items-center gap-[12px]">
              <Avatar size="md" bgColor={tone.bg}>
                {parent.initial}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold text-ink">
                  {parent.name}
                </div>
                <div className="text-[12.5px] text-muted">{parent.role}</div>
              </div>
              <span
                className={`flex-none rounded-full px-[9px] py-[4px] text-[10.5px] font-extrabold ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          );
        })}
        <a href="#" className="flex items-center gap-[12px] pt-[8px]">
          <span className="flex h-[40px] w-[40px] flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-dashed-soft text-photo-fg">
            <PlusIcon size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[14.5px] font-extrabold text-edit-link">
            Vincular otro padre
          </span>
        </a>
      </div>
    </div>
  );
}
