"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import {
  fetchDaycareId,
  fetchRooms,
} from "@/lib/data/children";
import { parseDisplayDateToIso } from "@/lib/kids";
import { createClient } from "@/utils/supabase/server";

export type CreateChildInput = {
  fullName: string;
  birthDate: string; // formato visible dd/mm/aaaa
  roomId: string;
  allergies: string;
  medicalNotes: string;
};

export type CreateChildResult =
  | { ok: true }
  | { ok: false; error: string };

// Alta real de niños (SPEC 12). No se confía en el cliente: sesion, daycare,
// validaciones y pertenencia de la sala se comprueban aqui.
export async function createChild(
  input: CreateChildInput,
): Promise<CreateChildResult> {
  await requireUser();

  const supabase = await createClient();
  const daycareId = await fetchDaycareId(supabase);

  if (!daycareId) {
    return { ok: false, error: "No pudimos identificar tu guardería." };
  }

  const fullName = input.fullName.trim();

  if (!fullName) {
    return { ok: false, error: "Ingresa el nombre completo." };
  }

  const birthDateIso = parseDisplayDateToIso(input.birthDate);

  if (!birthDateIso) {
    return { ok: false, error: "Usa una fecha válida en formato dd/mm/aaaa." };
  }

  // Comparación lexicográfica segura en ISO yyyy-mm-dd.
  if (birthDateIso > todayIso()) {
    return { ok: false, error: "La fecha de nacimiento no puede ser futura." };
  }

  const rooms = await fetchRooms(supabase, daycareId);
  const room = rooms.find((entry) => entry.id === input.roomId);

  if (!room) {
    return { ok: false, error: "Selecciona una sala válida." };
  }

  const { error } = await supabase.from("children").insert({
    room_id: room.id,
    full_name: fullName,
    birth_date: birthDateIso,
    allergies: input.allergies.trim() || null,
    medical_notes: input.medicalNotes.trim() || null,
  });

  if (error) {
    return { ok: false, error: "No pudimos guardar el niño. Intentá de nuevo." };
  }

  revalidatePath("/kids");

  return { ok: true };
}

function todayIso(): string {
  const now = new Date();
  const localMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const month = String(localMidnight.getMonth() + 1).padStart(2, "0");
  const day = String(localMidnight.getDate()).padStart(2, "0");

  return `${localMidnight.getFullYear()}-${month}-${day}`;
}
