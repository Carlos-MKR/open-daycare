// Tipos de dominio y etiquetas de publicaciones (SPEC 14). Sin datos mock:
// el acceso a datos vive en lib/data/posts.ts.
import type { PostVariant } from "@/lib/feed";

export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "announcement";

export type PostView = {
  id: string;
  type: PostType;
  body: string;
  publishedAt: string; // ISO timestamptz
  authorName: string;
  roomName?: string; // sala del anuncio "toda la sala"
  childNames: string[]; // destinatarios etiquetados
  variant: PostVariant; // estilos del diseño (SPEC 01)
};

export const POST_TYPES: PostType[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "mood",
  "announcement",
];

export const POST_TYPE_LABELS: Record<PostType, string> = {
  meal: "Comida",
  nap: "Siesta",
  activity: "Actividad",
  achievement: "Logro",
  mood: "Ánimo",
  announcement: "Anuncio",
};

// Solo para elegir estilos de chip/avatar; la etiqueta visible usa el tipo real.
export function variantForType(type: PostType): PostVariant {
  if (type === "announcement") return "announcement";
  if (type === "achievement" || type === "mood") return "achievement";

  return "activity";
}

// Título de la tarjeta: nombres de los niños o "Anuncio general".
export function postTitle(post: PostView): string {
  return post.childNames.length > 0 ? post.childNames.join(", ") : "Anuncio general";
}

// Línea "Para: …" según la regla de audiencia de 07-DB-Schema §8.
export function audienceLabel(post: PostView): string {
  const typeLabel = POST_TYPE_LABELS[post.type].toLowerCase();

  if (post.childNames.length > 0) {
    const names = post.childNames.join(", ");
    const prefix = post.childNames.length === 1 ? "familia de" : "familias de";

    return `${prefix} ${names} · ${typeLabel}`;
  }

  if (post.roomName) return `toda la sala · ${post.roomName}`;

  return `toda la guardería · ${typeLabel}`;
}

// "14:20" si es hoy, "12 nov" si es otro día (mismo criterio que el mock).
export function publishedLabel(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`;
  }

  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(date);
}
