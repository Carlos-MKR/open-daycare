import { Avatar } from "@/components/ui/avatar";
import { PlusIcon } from "@/components/ui/icons";
import type { InvitedParent } from "@/lib/data/invitations";
import { AVATAR_TONES, avatarInitialFor, toneForId } from "@/lib/kids";
import type { RefObject } from "react";

type ParentsPanelProps = {
  parents: InvitedParent[];
  onLinkParent: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

// Chip de estado del vínculo (SPEC 13): ACTIVO / PENDIENTE / EXPIRADA.
const STATUS_STYLES: Record<
  InvitedParent["status"],
  { label: string; detail: string; className: string }
> = {
  active: {
    label: "ACTIVO",
    detail: "cuenta activa",
    className: "bg-success-soft text-success",
  },
  pending: {
    label: "PENDIENTE",
    detail: "invitación enviada",
    className: "bg-chip-pending text-chip-pending-text",
  },
  expired: {
    label: "EXPIRADA",
    detail: "invitación vencida",
    className: "bg-chip-allergy text-chip-allergy-text",
  },
};

export function ParentsPanel({ parents, onLinkParent, triggerRef }: ParentsPanelProps) {
  return (
    <div className="rounded-[16px] border border-line bg-surface px-[18px] py-[16px]">
      <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-caption">
        PADRES VINCULADOS
      </div>
      <div className="flex flex-col gap-[14px]">
        {parents.length === 0 ? (
          <div className="text-[13.5px] text-muted">sin padres vinculados</div>
        ) : null}
        {parents.map((parent) => {
          const status = STATUS_STYLES[parent.status];
          const tone = AVATAR_TONES[toneForId(parent.name)];

          return (
            <div
              key={`${parent.kind}-${parent.name}-${status.label}`}
              className="flex items-center gap-[12px]"
            >
              <Avatar size="md" bgColor={tone.bg}>
                {avatarInitialFor(parent.name)}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold text-ink">
                  {parent.name}
                </div>
                <div className="text-[12.5px] text-muted">
                  {parent.relationshipLabel} · {status.detail}
                </div>
              </div>
              <span
                className={`flex-none rounded-full px-[9px] py-[4px] text-[10.5px] font-extrabold ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          );
        })}
        <button
          ref={triggerRef}
          type="button"
          onClick={onLinkParent}
          className="flex items-center gap-[12px] pt-[8px] text-left"
        >
          <span className="flex h-[40px] w-[40px] flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-dashed-soft text-photo-fg">
            <PlusIcon size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[14.5px] font-extrabold text-edit-link">
            Vincular otro padre
          </span>
        </button>
      </div>
    </div>
  );
}
