type PageHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-[24px]">
      <div className="mb-[4px] text-[12.5px] font-extrabold tracking-[.8px] text-accent-deep">
        {eyebrow}
      </div>
      <h1 className="font-display text-[30px] font-semibold text-ink">
        {title}
      </h1>
      <p className="mt-[5px] text-[14.5px] text-muted-strong">{subtitle}</p>
    </div>
  );
}
