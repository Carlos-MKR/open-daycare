import type { Kid } from "@/lib/kids";

type DetailRowsProps = {
  kid: Kid;
};

// Filas de datos del perfil: nacimiento, sala e ingreso.
export function DetailRows({ kid }: DetailRowsProps) {
  const rows = [
    { label: "Fecha de nacimiento", value: kid.birthDate },
    { label: "Sala", value: kid.room },
    { label: "Ingreso", value: kid.enrolledSince },
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
    </div>
  );
}
