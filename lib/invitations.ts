// Tipos y utilidades de invitaciones (SPEC 13).
// Sin acceso a datos: las consultas viven en lib/data/; esto es dominio puro.
import { randomInt } from "node:crypto";

export type Relationship = "mother" | "father" | "guardian";

// El modal trabaja con etiquetas en español; la DB con enums en inglés.
export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

export function labelToRelationship(label: string): Relationship | null {
  const entry = Object.entries(RELATIONSHIP_LABELS).find(
    ([, value]) => value === label,
  );

  return entry ? (entry[0] as Relationship) : null;
}

export const INVITATION_VALID_DAYS = 7;

// Alfabeto sin caracteres ambiguos (0/O, 1/I, L) para códigos legibles a mano.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 5;

export function generateInvitationCode(): string {
  let code = "";

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }

  return code;
}

export function invitationExpiresAt(from = new Date()): Date {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + INVITATION_VALID_DAYS);

  return expires;
}
