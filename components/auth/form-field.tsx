import type { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({ label, error, id, className = "", ...props }: FormFieldProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-[8px] block text-[12px] font-bold tracking-[0.7px] text-muted-strong"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`w-full rounded-[14px] border-[1.5px] border-line bg-white px-[16px] py-[14px] text-[15px] text-ink outline-none transition focus:border-accent ${className}`}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-[6px] text-[12px] font-semibold text-alert-title">
          {error}
        </p>
      ) : null}
    </div>
  );
}
