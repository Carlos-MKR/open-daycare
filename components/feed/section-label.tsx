type SectionLabelProps = {
  label: string;
};

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div className="mb-[14px] flex items-center gap-[14px]">
      <span className="text-[12.5px] font-extrabold tracking-[.8px] text-caption">
        {label}
      </span>
      <span className="h-[1px] flex-1 bg-line-soft" />
    </div>
  );
}
