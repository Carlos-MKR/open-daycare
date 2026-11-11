"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  forwardRef,
  type FormEvent,
  type RefObject,
} from "react";

export type AddChildFormState = {
  fullName: string;
  birthDate: string;
  room: string;
  allergies: string;
  medicalNotes: string;
};

type AddChildFormErrors = Partial<Record<keyof AddChildFormState, string>>;

type AddChildModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (child: AddChildFormState) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

const INITIAL_FORM: AddChildFormState = {
  fullName: "",
  birthDate: "",
  room: "Soles",
  allergies: "",
  medicalNotes: "",
};

const FIELD_LABELS: Record<keyof AddChildFormState, string> = {
  fullName: "Nombre completo",
  birthDate: "Fecha de nacimiento",
  room: "Sala",
  allergies: "Alergias (etiquetas)",
  medicalNotes: "Notas médicas",
};

function validateForm(form: AddChildFormState): AddChildFormErrors {
  const errors: AddChildFormErrors = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Ingresa el nombre completo.";
  }

  if (!form.birthDate.trim()) {
    errors.birthDate = "Ingresa la fecha de nacimiento.";
  }

  if (!form.room) {
    errors.room = "Selecciona una sala.";
  }

  return errors;
}

export function AddChildModal({
  isOpen,
  onClose,
  onSave,
  returnFocusRef,
}: AddChildModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<AddChildFormErrors>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    firstInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, [href], [tabindex]:not([tabindex='-1'])",
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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    returnFocusRef?.current?.focus();
  }, [isOpen, returnFocusRef]);

  if (!isOpen) {
    return null;
  }

  function updateField(field: keyof AddChildFormState, value: string) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  }

  function handleClose() {
    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalidField = Object.keys(nextErrors)[0] as keyof AddChildFormState;
      dialogRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)
        ?.focus();
      return;
    }

    onSave(form);
    handleClose();
  }

  function errorId(field: keyof AddChildFormState) {
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
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-line bg-[#fbf4ec] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <div className="flex items-center justify-between border-b border-line px-[20px] py-[20px] md:px-[26px]">
          <button
            type="button"
            onClick={handleClose}
            className="text-[15px] font-bold text-muted-strong"
          >
            Cancelar
          </button>
          <h2 id={titleId} className="font-display text-[18px] font-semibold text-ink">
            Agregar niño
          </h2>
          <button
            type="submit"
            form={`${titleId}-form`}
            className="text-[15px] font-extrabold text-accent-deep"
          >
            Guardar
          </button>
        </div>

        <form
          id={`${titleId}-form`}
          onSubmit={handleSubmit}
          className="space-y-[18px] px-[20px] py-[24px] md:px-[26px]"
          noValidate
        >
          <FormField
            ref={firstInputRef}
            name="fullName"
            label={FIELD_LABELS.fullName}
            value={form.fullName}
            placeholder="Ej. Martina López"
            error={errors.fullName}
            errorId={errorId("fullName")}
            onChange={(value) => updateField("fullName", value)}
          />

          <div className="grid gap-[18px] md:grid-cols-2">
            <FormField
              name="birthDate"
              label={FIELD_LABELS.birthDate}
              value={form.birthDate}
              placeholder="dd/mm/aaaa"
              error={errors.birthDate}
              errorId={errorId("birthDate")}
              onChange={(value) => updateField("birthDate", value)}
            />
            <label className="block">
              <span className="mb-[8px] block text-[12px] font-extrabold tracking-[.7px] text-muted-strong">
                {FIELD_LABELS.room.toUpperCase()}
              </span>
              <span className="relative block">
                <select
                  name="room"
                  value={form.room}
                  onChange={(event) => updateField("room", event.target.value)}
                  aria-invalid={Boolean(errors.room)}
                  aria-describedby={errors.room ? errorId("room") : undefined}
                  className="w-full appearance-none rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-[16px] py-[13px] pr-[42px] text-[15px] font-bold text-ink outline-none"
                >
                  <option value="Soles">Soles</option>
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-[16px] top-1/2 size-[16px] -translate-y-1/2 text-[#b0a290]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <FieldError id={errorId("room")} message={errors.room} />
            </label>
          </div>

          <FormField
            name="allergies"
            label={FIELD_LABELS.allergies}
            value={form.allergies}
            placeholder="Ej. Maní, Lactosa"
            error={errors.allergies}
            errorId={errorId("allergies")}
            onChange={(value) => updateField("allergies", value)}
          />

          <label className="block">
            <span className="mb-[8px] block text-[12px] font-extrabold tracking-[.7px] text-muted-strong">
              {FIELD_LABELS.medicalNotes.toUpperCase()}
            </span>
            <textarea
              name="medicalNotes"
              value={form.medicalNotes}
              onChange={(event) => updateField("medicalNotes", event.target.value)}
              placeholder="Indicaciones, medicación, contactos…"
              className="min-h-[90px] w-full resize-y rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-[16px] py-[13px] text-[15px] leading-[1.5] text-ink outline-none placeholder:text-placeholder"
            />
          </label>
        </form>
      </div>
    </div>
  );
}

type FormFieldProps = {
  name: keyof AddChildFormState;
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  errorId: string;
  onChange: (value: string) => void;
};

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { name, label, value, placeholder, error, errorId, onChange },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-[8px] block text-[12px] font-extrabold tracking-[.7px] text-muted-strong">
        {label.toUpperCase()}
      </span>
      <input
        ref={ref}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-[14px] border-[1.5px] border-[#eadfd0] bg-white px-[16px] py-[13px] text-[15px] text-ink outline-none placeholder:text-placeholder"
      />
      <FieldError id={errorId} message={error} />
    </label>
  );
});

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span id={id} className="mt-[5px] block text-[12px] font-bold text-accent-deep">
      {message}
    </span>
  );
}
