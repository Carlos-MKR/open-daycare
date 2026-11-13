// Tipos de vista y formateadores para niños/salas (SPEC 12).
// El acceso a datos vive en lib/data/children.ts; aquí no hay datos mock.

export type AvatarTone = "sky" | "rose" | "mint" | "amber" | "violet";

export type ParentStatus = "active" | "pending";

export type LinkedParent = {
  name: string;
  role: string;
  status: ParentStatus;
  initial: string;
  tone: AvatarTone;
};

export type Room = {
  id: string;
  name: string;
};

export type Kid = {
  id: string; // uuid de public.children
  name: string;
  birthDate: string; // ISO yyyy-mm-dd
  room: string; // nombre de la sala, ej. "Sala Soles"
  roomId: string;
  enrolledAt: string; // ISO yyyy-mm-dd
  allergies?: string; // texto libre en español
  medicalNotes?: string;
  avatarInitial: string;
  avatarTone: AvatarTone;
};

export type AvatarToneStyles = {
  bg: string;
  text: string;
};

export const AVATAR_TONES: Record<AvatarTone, AvatarToneStyles> = {
  sky: { bg: "bg-avatar-sky", text: "text-avatar-sky-text" },
  rose: { bg: "bg-avatar-rose", text: "text-avatar-rose-text" },
  mint: { bg: "bg-avatar-mint", text: "text-avatar-mint-text" },
  amber: { bg: "bg-avatar-amber", text: "text-avatar-amber-text" },
  violet: { bg: "bg-avatar-violet", text: "text-avatar-violet-text" },
};

const TONE_ORDER: AvatarTone[] = ["sky", "rose", "mint", "amber", "violet"];

const MONTH_SHORT_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Tono de avatar estable por niño: hash simple del uuid.
export function toneForId(id: string): AvatarTone {
  let hash = 0;

  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }

  return TONE_ORDER[hash % TONE_ORDER.length];
}

export function avatarInitialFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

// "3 años" / "1 año" / "Menos de 1 año" desde una fecha ISO.
export function computeAgeLabel(birthDateIso: string): string {
  const birth = parseIsoDate(birthDateIso);
  if (!birth) return "—";

  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() >= birth.getDate());

  if (!hadBirthdayThisYear) years -= 1;
  if (years < 1) return "Menos de 1 año";

  return `${years} ${years === 1 ? "año" : "años"}`;
}

// "2022-03-12" → "12 mar 2022".
export function formatDateLabel(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return "—";

  return `${date.getDate()} ${MONTH_SHORT_ES[date.getMonth()]} ${date.getFullYear()}`;
}

// "2026-11-12" → "nov 2026".
export function formatMonthYear(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return "—";

  return `${MONTH_SHORT_ES[date.getMonth()]} ${date.getFullYear()}`;
}

// Chip de la tarjeta: primeras dos palabras de las alergias, en mayúsculas.
export function allergyChipLabel(allergies?: string | null): string | undefined {
  const trimmed = allergies?.trim();
  if (!trimmed) return undefined;

  return trimmed.split(/\s+/).slice(0, 2).join(" ").toUpperCase();
}

// "dd/mm/aaaa" válida → "yyyy-mm-dd"; null si el formato o el calendario fallan.
// Se arma por string para evitar desfases de zona horaria de `new Date(str)`.
export function parseDisplayDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  const isRealDay =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  if (!isRealDay) return null;

  return `${year}-${month}-${day}`;
}

function parseIsoDate(isoDate: string): Date | null {
  const [year, month, day] = isoDate.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}
