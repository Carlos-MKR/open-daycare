"use client";

import { useEffect, useRef, useState } from "react";
import { createPost } from "@/actions/posts/create-post";
import { XIcon } from "@/components/ui/icons";
import { AVATAR_TONES, type Kid, type Room } from "@/lib/kids";
import { POST_TYPES, POST_TYPE_LABELS, type PostType } from "@/lib/posts";

// Estado de la audiencia real cargada por Server Action al abrir el modal.
export type ComposerAudienceState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; kids: Kid[]; rooms: Room[] };

type CreatePublicationModalProps = {
  audience: ComposerAudienceState;
  onRetryAudience: () => void;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
};

type FormErrors = Partial<
  Record<"targets" | "room" | "type" | "description", string>
>;

// Colores de chips del diseño (SPEC 07), ahora por tipo real de la DB.
const TYPE_CHIP_STYLES: Record<PostType, string> = {
  meal: "bg-avatar-amber text-avatar-amber-text",
  nap: "bg-avatar-violet text-avatar-violet-text",
  activity: "bg-activity text-white",
  achievement: "bg-success-soft text-success",
  mood: "bg-chip-link text-chip-link-text",
  announcement: "bg-announcement-soft text-announcement",
};

export function CreatePublicationModal({
  audience,
  onRetryAudience,
  onClose,
  triggerRef,
}: CreatePublicationModalProps) {
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [salaMode, setSalaMode] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState<PostType>("meal");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const firstControlRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = () => {
    onClose();
    triggerRef?.current?.focus();
  };

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

  const toggleChild = (id: string) => {
    setSalaMode(false);
    setTargetIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    setErrors((current) => ({ ...current, targets: undefined }));
  };

  const toggleSala = () => {
    setSalaMode((current) => !current);
    setTargetIds([]);
    setErrors((current) => ({ ...current, targets: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (audience.status !== "ready" || submitting) return;

    const nextErrors: FormErrors = {};

    if (!salaMode && targetIds.length === 0) {
      nextErrors.targets = "Seleccioná al menos un destinatario.";
    }

    if (salaMode && !roomId) {
      nextErrors.room = "Elegí la sala del aviso.";
    }

    if (salaMode && type !== "announcement") {
      nextErrors.type = "Los avisos para toda la sala son de tipo Anuncio.";
    }

    if (!description.trim()) {
      nextErrors.description = "Escribí una descripción.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setServerError(null);
    setSubmitting(true);

    const result = await createPost({
      type,
      body: description,
      childIds: salaMode ? [] : targetIds,
      roomId: salaMode ? roomId : null,
    });

    setSubmitting(false);

    if (result.ok) {
      close();
    } else {
      setServerError(result.error);
    }
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
            <button
              type="submit"
              disabled={audience.status !== "ready" || submitting}
              className="text-[15px] font-extrabold text-accent-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Publicando…" : "Publicar"}
            </button>
            <button type="button" aria-label="Cerrar" onClick={close} className="absolute right-[8px] top-[6px] rounded-full p-[2px] text-muted-strong hover:bg-cream">
              <XIcon size={14} />
            </button>
          </header>

          <div className="p-[20px] md:p-[26px]">
            <fieldset className="mb-[22px]">
              <legend className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-muted-strong">PARA</legend>

              {audience.status === "loading" ? (
                <p className="text-[14px] text-muted-strong">Cargando niños de la sala…</p>
              ) : null}

              {audience.status === "error" ? (
                <div className="flex flex-wrap items-center gap-[10px]">
                  <p className="text-[13px] font-bold text-alert-title">{audience.error}</p>
                  <button
                    type="button"
                    onClick={onRetryAudience}
                    className="rounded-full border border-line bg-surface px-[14px] py-[6px] text-[13px] font-extrabold text-edit-link"
                  >
                    Reintentar
                  </button>
                </div>
              ) : null}

              {audience.status === "ready" ? (
                <>
                  <div className="flex flex-wrap gap-[9px]">
                    {audience.kids.map((kid, index) => {
                      const tone = AVATAR_TONES[kid.avatarTone];
                      const selected = !salaMode && targetIds.includes(kid.id);

                      return (
                        <button
                          key={kid.id}
                          ref={index === 0 ? firstControlRef : undefined}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleChild(kid.id)}
                          className={`flex items-center gap-[8px] rounded-full border-[1.5px] px-[6px] py-[6px] text-[14px] font-bold ${selected ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-soft"}`}
                        >
                          <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold ${tone.bg} ${tone.text}`}>
                            {kid.avatarInitial}
                          </span>
                          <span className="pr-[8px]">{kid.name}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      aria-pressed={salaMode}
                      onClick={toggleSala}
                      className={`rounded-full border-[1.5px] px-[16px] py-[8px] text-[14px] font-bold ${salaMode ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink-soft"}`}
                    >
                      Toda la sala
                    </button>
                  </div>
                  {errors.targets && <p className="mt-[6px] text-[12px] font-bold text-alert-title">{errors.targets}</p>}

                  {salaMode ? (
                    <label className="mt-[14px] block">
                      <span className="mb-[6px] block text-[12px] font-extrabold tracking-[.7px] text-muted-strong">SALA</span>
                      <select
                        value={roomId}
                        onChange={(event) => {
                          setRoomId(event.target.value);
                          setErrors((current) => ({ ...current, room: undefined }));
                        }}
                        className="w-full rounded-[14px] border-[1.5px] border-line bg-white px-[14px] py-[11px] text-[15px] text-ink outline-none focus:border-accent"
                      >
                        <option value="">Elegí una sala…</option>
                        {audience.rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                      {errors.room && <p className="mt-[6px] text-[12px] font-bold text-alert-title">{errors.room}</p>}
                    </label>
                  ) : null}
                </>
              ) : null}
            </fieldset>

            <fieldset className="mb-[22px]">
              <legend className="mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-muted-strong">TIPO</legend>
              <div className="flex flex-wrap gap-[9px]">
                {POST_TYPES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={type === item}
                    onClick={() => {
                      setType(item);
                      setErrors((current) => ({ ...current, type: undefined }));
                    }}
                    className={`rounded-full px-[16px] py-[8px] text-[13.5px] font-extrabold ${TYPE_CHIP_STYLES[item]} ${type === item ? "ring-2 ring-ink ring-offset-2 ring-offset-[#fbf4ec]" : ""}`}
                  >
                    {POST_TYPE_LABELS[item]}
                  </button>
                ))}
              </div>
              {errors.type && <p className="mt-[6px] text-[12px] font-bold text-alert-title">{errors.type}</p>}
            </fieldset>

            <label className="mb-[10px] block text-[12px] font-extrabold tracking-[.7px] text-muted-strong" htmlFor="publication-description">DESCRIPCIÓN</label>
            <textarea
              id="publication-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setErrors((current) => ({ ...current, description: undefined }));
              }}
              placeholder="Contá cómo le fue hoy…"
              className="mb-[6px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-line bg-white px-[16px] py-[14px] text-[15px] leading-[1.5] text-ink outline-none focus:border-accent"
            />
            {errors.description && <p className="mb-[16px] text-[12px] font-bold text-alert-title">{errors.description}</p>}

            {serverError ? (
              <p role="alert" className="text-[13px] font-bold text-alert-title">{serverError}</p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
