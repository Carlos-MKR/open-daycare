"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import type { FeedPost } from "@/lib/feed";

export type PublicationTarget = "mateo" | "sofia" | "benjamin" | "all";
export type PublicationType =
  | "comida"
  | "siesta"
  | "actividad"
  | "logro"
  | "animo"
  | "foto"
  | "anuncio";

type FormState = {
  targets: PublicationTarget[];
  type: PublicationType;
  description: string;
  photoSelected: boolean;
};

type FormErrors = Partial<Record<"targets" | "type" | "description", string>>;

type CreatePublicationModalProps = {
  onClose: () => void;
  onPublish: (post: FeedPost) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
};

const INITIAL_FORM: FormState = {
  targets: ["mateo"],
  type: "comida",
  description: "",
  photoSelected: false,
};

const TARGETS: Array<{ id: PublicationTarget; label: string; initial?: string; tone: string }> = [
  { id: "mateo", label: "Mateo", initial: "M", tone: "bg-avatar-sky text-avatar-sky-text" },
  { id: "sofia", label: "Sofía", initial: "S", tone: "bg-avatar-rose text-avatar-rose-text" },
  { id: "benjamin", label: "Benjamín", initial: "B", tone: "bg-avatar-mint text-avatar-mint-text" },
  { id: "all", label: "Toda la sala", tone: "" },
];

const TYPES: Array<{ id: PublicationType; label: string; className: string }> = [
  { id: "comida", label: "Comida", className: "bg-avatar-amber text-avatar-amber-text" },
  { id: "siesta", label: "Siesta", className: "bg-avatar-violet text-avatar-violet-text" },
  { id: "actividad", label: "Actividad", className: "bg-activity text-white" },
  { id: "logro", label: "Logro", className: "bg-success-soft text-success" },
  { id: "animo", label: "Ánimo", className: "bg-chip-link text-chip-link-text" },
  { id: "foto", label: "Foto", className: "bg-chip-allergy text-chip-allergy-text" },
  { id: "anuncio", label: "Anuncio", className: "bg-announcement-soft text-announcement" },
];

function audienceFor(targets: PublicationTarget[]) {
  if (targets.includes("all")) return "toda la sala";
  const names = targets
    .map((target) => TARGETS.find((item) => item.id === target)?.label)
    .filter(Boolean);
  return names.length === 1 ? `familia de ${names[0]}` : `familias de ${names.join(", ")}`;
}

function variantFor(type: PublicationType): FeedPost["variant"] {
  if (type === "anuncio") return "announcement";
  if (type === "logro" || type === "animo") return "achievement";
  return "activity";
}

export function CreatePublicationModal({ onClose, onPublish, triggerRef }: CreatePublicationModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const firstControlRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    firstControlRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "button, textarea, [href], input, select",
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const close = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    onClose();
    triggerRef?.current?.focus();
  };

  const toggleTarget = (target: PublicationTarget) => {
    setForm((current) => {
      if (target === "all") return { ...current, targets: ["all"] };
      const withoutAll = current.targets.filter((item) => item !== "all");
      const targets = withoutAll.includes(target)
        ? withoutAll.filter((item) => item !== target)
        : [...withoutAll, target];
      return { ...current, targets };
    });
    setErrors((current) => ({ ...current, targets: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!form.targets.length) nextErrors.targets = "Seleccioná al menos un destinatario.";
    if (!form.type) nextErrors.type = "Seleccioná un tipo de publicación.";
    if (!form.description.trim()) nextErrors.description = "Escribí una descripción.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const typeLabel = TYPES.find((item) => item.id === form.type)?.label ?? "Publicación";
    onPublish({
      id: `publication-${Date.now()}`,
      title: form.targets.includes("all") ? "Toda la sala" : TARGETS.find((item) => item.id === form.targets[0])?.label ?? "Publicación",
      time: "Ahora",
      authorLabel: "publicado por vos",
      variant: variantFor(form.type),
      audience: `${audienceFor(form.targets)} · ${typeLabel.toLowerCase()}`,
      body: form.description.trim(),
      photoPlaceholder: form.photoSelected ? "Foto agregada" : undefined,
      likes: 0,
      comments: 0,
    });
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-[16px] py-[24px] md:px-[24px] md:py-[40px]"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-publication-title"
        className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-line bg-[#fbf4ec] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
      >
        <form onSubmit={handleSubmit}>
          <header className="relative flex items-center justify-between border-b border-line px-[20px] py-[18px] md:px-[26px] md:py-[20px]">
            <button type="button" onClick={close} className="text-[15px] font-bold text-muted-strong">Cancelar</button>
            <h1 id="create-publication-title" className="font-display text-[18px] font-semibold text-ink">Nueva publicación</h1>
            <button type="submit" className="text-[15px] font-extrabold text-accent-deep">Publicar</button>
            <button type="button" aria-label="Cerrar" onClick={close} className="absolute right-[8px] top-[6px] rounded-full p-[2px] text-muted-strong hover:bg-cream">
              <XIcon size={14} />
            </button>
          </header>

          <div className="p-[20px] md:p-[26px]">
            <fieldset className="mb-[22px]">
              <legend className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-muted-strong">PARA</legend>
              <div className="flex flex-wrap gap-[9px]">
                {TARGETS.map((target, index) => {
                  const selected = form.targets.includes(target.id);
                  return (
                    <button
                      key={target.id}
                      ref={index === 0 ? firstControlRef : undefined}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleTarget(target.id)}
                      className={`flex items-center gap-[8px] rounded-full border-[1.5px] px-[6px] py-[6px] text-[14px] font-bold ${selected ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-soft"}`}
                    >
                      {target.initial && <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold ${selected ? target.tone : target.tone}`}>{target.initial}</span>}
                      <span className={target.initial ? "pr-[8px]" : "px-[10px]"}>{target.label}</span>
                    </button>
                  );
                })}
              </div>
              {errors.targets && <p className="mt-[6px] text-[12px] font-bold text-alert-title">{errors.targets}</p>}
            </fieldset>

            <fieldset className="mb-[22px]">
              <legend className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-muted-strong">TIPO</legend>
              <div className="flex flex-wrap gap-[9px]">
                {TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    aria-pressed={form.type === type.id}
                    onClick={() => setForm((current) => ({ ...current, type: type.id }))}
                    className={`rounded-full px-[16px] py-[8px] text-[13.5px] font-extrabold ${type.className} ${form.type === type.id ? "ring-2 ring-ink ring-offset-2 ring-offset-[#fbf4ec]" : ""}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {errors.type && <p className="mt-[6px] text-[12px] font-bold text-alert-title">{errors.type}</p>}
            </fieldset>

            <label className="mb-[10px] block text-[12px] font-extrabold tracking-[.7px] text-muted-strong" htmlFor="publication-description">DESCRIPCIÓN</label>
            <textarea
              id="publication-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Contá cómo le fue hoy…"
              className="mb-[6px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-line bg-white px-[16px] py-[14px] text-[15px] leading-[1.5] text-ink outline-none focus:border-accent"
            />
            {errors.description && <p className="mb-[16px] text-[12px] font-bold text-alert-title">{errors.description}</p>}

            <div className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-muted-strong">FOTOS</div>
            <div className="flex gap-[12px]">
              <div className="flex h-[96px] w-[96px] items-center justify-center rounded-[14px] border border-line bg-photo-bg text-chevron"><ImageIcon size={26} strokeWidth={1.7} /></div>
              <button
                type="button"
                aria-pressed={form.photoSelected}
                onClick={() => setForm((current) => ({ ...current, photoSelected: !current.photoSelected }))}
                className={`flex h-[96px] w-[96px] flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed bg-photo-bg text-[12px] text-photo-fg ${form.photoSelected ? "border-accent-deep text-accent-deep" : "border-dashed-stroke"}`}
              >
                <PlusIcon size={22} className="text-accent-deep" />
                {form.photoSelected ? "Agregada" : "Agregar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
