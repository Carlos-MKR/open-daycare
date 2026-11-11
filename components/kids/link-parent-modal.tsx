"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { InfoIcon, SendIcon, XIcon } from "@/components/ui/icons";

export type LinkParentFormState = {
  name: string;
  email: string;
  relationship: "Mamá" | "Papá" | "Tutor/a";
};

type LinkParentFormErrors = Partial<
  Record<keyof LinkParentFormState, string>
>;

type LinkParentModalProps = {
  isOpen: boolean;
  kidName: string;
  onClose: () => void;
  onSave: (form: LinkParentFormState) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

const INITIAL_FORM: LinkParentFormState = {
  name: "",
  email: "",
  relationship: "Mamá",
};

const RELATIONSHIPS: LinkParentFormState["relationship"][] = [
  "Mamá",
  "Papá",
  "Tutor/a",
];

function validateForm(form: LinkParentFormState): LinkParentFormErrors {
  const errors: LinkParentFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Ingresa el nombre del padre o madre.";
  }

  if (!form.email.trim()) {
    errors.email = "Ingresa un email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Ingresa un email válido.";
  }

  return errors;
}

export function LinkParentModal({
  isOpen,
  kidName,
  onClose,
  onSave,
  returnFocusRef,
}: LinkParentModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<LinkParentFormErrors>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const handleClose = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    firstInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        "button, input, [href], [tabindex]:not([tabindex='-1'])",
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      returnFocusRef.current?.focus();
    }
  }, [isOpen, returnFocusRef]);

  if (!isOpen) {
    return null;
  }

  function updateField(
    field: keyof LinkParentFormState,
    value: string | LinkParentFormState["relationship"],
  ) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalidField = Object.keys(nextErrors)[0] as keyof LinkParentFormState;
      dialogRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
        ?.focus();
      return;
    }

    onSave(form);
    handleClose();
  }

  function errorId(field: keyof LinkParentFormState) {
    return `${titleId}-${field}-error`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-[16px] py-[24px] md:px-[24px] md:py-[40px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[480px] overflow-hidden rounded-[24px] border border-line bg-[#fbf4ec] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <div className="flex items-center justify-between border-b border-line px-[20px] py-[18px] md:px-[26px] md:py-[20px]">
          <div>
            <h2 id={titleId} className="font-display text-[18px] font-semibold text-ink">
              Vincular padre
            </h2>
            <p className="text-[13px] text-muted">a {kidName}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-line-faint text-muted-strong"
          >
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-[20px] py-[22px] md:px-[26px]">
          <div className="mb-[20px] flex gap-[11px] rounded-[14px] bg-[#e3ecfb] px-[16px] py-[13px] text-[13.5px] leading-[1.45] text-[#3f5694]">
            <InfoIcon size={20} className="mt-[1px] flex-none text-announcement" />
            <span>
              Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {kidName}.
            </span>
          </div>

          <Field
            ref={firstInputRef}
            name="name"
            label="Nombre del padre/madre"
            placeholder="Ej. Diego Fernández"
            value={form.name}
            error={errors.name}
            errorId={errorId("name")}
            onChange={(value) => updateField("name", value)}
          />

          <Field
            name="email"
            type="email"
            label="Email"
            placeholder="correo@ejemplo.com"
            value={form.email}
            error={errors.email}
            errorId={errorId("email")}
            onChange={(value) => updateField("email", value)}
          />

          <fieldset className="mb-[20px] border-0 p-0">
            <legend className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-muted-strong">
              PARENTESCO
            </legend>
            <div className="flex gap-[9px]">
              {RELATIONSHIPS.map((relationship) => {
                const selected = form.relationship === relationship;
                return (
                  <button
                    key={relationship}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updateField("relationship", relationship)}
                    className={`flex-1 rounded-full border-[1.5px] px-[8px] py-[11px] text-[14px] font-extrabold ${
                      selected
                        ? "border-[#9fb8ec] bg-[#ccd8f4] text-[#4e72c8]"
                        : "border-line bg-surface text-ink-soft"
                    }`}
                  >
                    {relationship}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mb-[20px] rounded-[16px] border-[1.5px] border-dashed border-[#e6d08a] bg-[#fbf1d6] p-[18px] text-center">
            <div className="mb-[8px] text-[12px] font-extrabold tracking-[.7px] text-[#a88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8a7234]">
              7K4P9
            </div>
            <div className="mt-[6px] text-[13px] text-[#a88526]">Vence en 7 días</div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-accent-light to-accent-strong px-[16px] py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
          >
            <SendIcon size={19} />
            Enviar invitación
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="mt-[10px] w-full py-[5px] text-[14px] font-extrabold text-muted-strong"
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  name: "name" | "email";
  label: string;
  placeholder: string;
  value: string;
  type?: "text" | "email";
  error?: string;
  errorId: string;
  onChange: (value: string) => void;
};

function Field({
  name,
  label,
  placeholder,
  value,
  type = "text",
  error,
  errorId,
  onChange,
  ref,
}: FieldProps & { ref?: RefObject<HTMLInputElement | null> }) {
  return (
    <label className="mb-[18px] block">
      <span className="mb-[8px] block text-[12px] font-extrabold tracking-[.7px] text-muted-strong">
        {label.toUpperCase()}
      </span>
      <input
        ref={ref}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-[16px] py-[13px] text-[15px] text-ink outline-none placeholder:text-placeholder"
      />
      {error ? (
        <span id={errorId} className="mt-[5px] block text-[12px] font-bold text-accent-deep">
          {error}
        </span>
      ) : null}
    </label>
  );
}
