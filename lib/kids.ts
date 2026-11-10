// Mock de la sala Soles según references/pantallas/ninos.dc.html y perfil-nino.dc.html.
// Identificadores de código en inglés; el texto visible queda en español (datos mock).

export type AvatarTone = "sky" | "rose" | "mint" | "amber" | "violet";

export type ParentStatus = "active" | "pending";

export type LinkedParent = {
  name: string;
  role: string;
  status: ParentStatus;
  initial: string;
  tone: AvatarTone;
};

export type Kid = {
  slug: string;
  name: string;
  ageLabel: string;
  birthDate: string;
  room: string;
  enrolledSince: string;
  allergyChip?: string;
  allergyNote?: string;
  avatarInitial: string;
  avatarTone: AvatarTone;
  parents: LinkedParent[];
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

export function linkedParentsLabel(kid: Kid): string {
  if (kid.parents.length === 0) return "sin padres vinculados";
  return `${kid.parents.length} ${
    kid.parents.length === 1 ? "padre vinculado" : "padres vinculados"
  }`;
}

export function getKidBySlug(slug: string): Kid | undefined {
  return KIDS.find((kid) => kid.slug === slug);
}

export const KIDS: Kid[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    ageLabel: "3 años",
    birthDate: "12 mar 2022",
    room: "Soles",
    enrolledSince: "feb 2025",
    allergyChip: "MANÍ",
    allergyNote:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    avatarInitial: "M",
    avatarTone: "sky",
    parents: [
      {
        name: "Lucía Fernández",
        role: "Mamá · activa",
        status: "active",
        initial: "L",
        tone: "violet",
      },
      {
        name: "Diego Fernández",
        role: "Papá · invitación enviada",
        status: "pending",
        initial: "D",
        tone: "sky",
      },
    ],
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    ageLabel: "2 años",
    birthDate: "5 jul 2022",
    room: "Soles",
    enrolledSince: "mar 2025",
    avatarInitial: "S",
    avatarTone: "rose",
    parents: [
      {
        name: "Ana Méndez",
        role: "Mamá · activa",
        status: "active",
        initial: "A",
        tone: "mint",
      },
    ],
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    ageLabel: "3 años",
    birthDate: "28 ene 2022",
    room: "Soles",
    enrolledSince: "feb 2025",
    avatarInitial: "B",
    avatarTone: "mint",
    parents: [
      {
        name: "Carla Ruiz",
        role: "Mamá · activa",
        status: "active",
        initial: "C",
        tone: "rose",
      },
      {
        name: "Pablo Ruiz",
        role: "Papá · activa",
        status: "active",
        initial: "P",
        tone: "amber",
      },
    ],
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    ageLabel: "2 años",
    birthDate: "19 sep 2022",
    room: "Soles",
    enrolledSince: "ago 2025",
    avatarInitial: "V",
    avatarTone: "amber",
    parents: [],
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    ageLabel: "3 años",
    birthDate: "30 may 2022",
    room: "Soles",
    enrolledSince: "feb 2025",
    allergyChip: "LACTOSA",
    allergyNote:
      "Alergia a la lactosa. Evitar lácteos y derivados; hay leche de avena en la sala.",
    avatarInitial: "T",
    avatarTone: "violet",
    parents: [
      {
        name: "Martín Díaz",
        role: "Papá · activa",
        status: "active",
        initial: "M",
        tone: "sky",
      },
    ],
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    ageLabel: "2 años",
    birthDate: "14 abr 2023",
    room: "Soles",
    enrolledSince: "mar 2025",
    avatarInitial: "E",
    avatarTone: "rose",
    parents: [
      {
        name: "Sofía Castro",
        role: "Mamá · activa",
        status: "active",
        initial: "S",
        tone: "amber",
      },
    ],
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    ageLabel: "3 años",
    birthDate: "22 nov 2021",
    room: "Soles",
    enrolledSince: "feb 2025",
    avatarInitial: "L",
    avatarTone: "sky",
    parents: [
      {
        name: "Javier Romero",
        role: "Papá · activa",
        status: "active",
        initial: "J",
        tone: "violet",
      },
    ],
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    ageLabel: "2 años",
    birthDate: "8 feb 2023",
    room: "Soles",
    enrolledSince: "mar 2025",
    avatarInitial: "O",
    avatarTone: "mint",
    parents: [
      {
        name: "Rocío Vega",
        role: "Mamá · activa",
        status: "active",
        initial: "R",
        tone: "violet",
      },
    ],
  },
];
