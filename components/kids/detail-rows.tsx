import { formatDateLabel, formatMonthYear, type Kid } from "@/lib/kids";

type DetailRowsProps = {
  kid: Kid;
};

// Filas de datos reales del perfil (SPEC 12): nacimiento, sala e ingreso.
export function DetailRows({ kid }: DetailRowsProps) {
  const rows = [
    { label: "Fecha de nacimiento", value: formatDateLabel(kid.birthDate) },
    { label: "Sala", value: kid.room },
    { label: "Ingresado en", value: formatMonthYear(kid.enrolledAt) },
  ];

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex justify-between px-[18px] py-[15px] ${
            index < rows.length - 1 ? "border-b border-line-faint" : ""
          }`}
        >
          <span className="text-[14.5px] text-muted-strong">{row.label}</span>
          <span className="text-[14.5px] font-extrabold text-ink">
            {row.value}
          </span>
        </div>
      ))}
      {kid.medicalNotes ? (
        <div className="border-t border-line-faint px-[18px] py-[15px]">
          <div className="text-[14.5px] text-muted-strong">Notas médicas</div>
          <p className="mt-[6px] text-[14px] leading-[1.5] text-ink">
            {kid.medicalNotes}
          </p>
        </div>
      ) : null}
    </div>
  );
}
