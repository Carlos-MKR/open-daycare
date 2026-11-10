import { AlertTriangleIcon } from "@/components/ui/icons";

type AllergyAlertProps = {
  note: string;
};

// Panel rosa de alergias y notas del perfil.
export function AllergyAlert({ note }: AllergyAlertProps) {
  return (
    <div className="flex gap-[14px] rounded-[16px] bg-alert-bg p-[16px] pr-[18px]">
      <div className="flex h-[40px] w-[40px] flex-none items-center justify-center rounded-[11px] bg-alert-icon text-white">
        <AlertTriangleIcon size={22} />
      </div>
      <div>
        <div className="mb-[2px] text-[15px] font-extrabold text-alert-title">
          Alergias y notas
        </div>
        <p className="text-[14.5px] leading-[1.5] text-alert-text">{note}</p>
      </div>
    </div>
  );
}
