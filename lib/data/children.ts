// Acceso a datos de salas y niños (SPEC 12). Solo server: recibe el cliente
// de utils/supabase/server.ts y respeta RLS.
import type { createClient } from "@/utils/supabase/server";
import {
  avatarInitialFor,
  toneForId,
  type Kid,
  type Room,
} from "@/lib/kids";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ChildRow = {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  allergies: string | null;
  medical_notes: string | null;
  room_id: string;
};

const CHILD_SELECT =
  "id, full_name, birth_date, enrolled_at, allergies, medical_notes, room_id";

// Fila propia de `users` (RLS: auth.uid() = id). null si el perfil no tiene daycare.
export async function fetchDaycareId(
  supabase: SupabaseServerClient,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("daycare_id")
    .eq("id", user.id)
    .maybeSingle();

  return data?.daycare_id ?? null;
}

export async function fetchRooms(
  supabase: SupabaseServerClient,
  daycareId: string,
): Promise<Room[]> {
  const { data } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("daycare_id", daycareId)
    .order("created_at");

  return data ?? [];
}

export async function fetchKids(
  supabase: SupabaseServerClient,
  daycareId: string,
): Promise<Kid[]> {
  const rooms = await fetchRooms(supabase, daycareId);
  if (rooms.length === 0) return [];

  const { data } = await supabase
    .from("children")
    .select(CHILD_SELECT)
    .eq("status", "active")
    .in(
      "room_id",
      rooms.map((room) => room.id),
    )
    .order("full_name");

  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]));

  return (data ?? []).flatMap((row) => {
    const roomName = roomNameById.get(row.room_id);
    return roomName ? [toKid(row, roomName)] : [];
  });
}

// null si el id no existe, está archivado o su sala no es del daycare → 404.
export async function fetchKidById(
  supabase: SupabaseServerClient,
  daycareId: string,
  id: string,
): Promise<Kid | null> {
  const { data: row } = await supabase
    .from("children")
    .select(CHILD_SELECT)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (!row) return null;

  const rooms = await fetchRooms(supabase, daycareId);
  const room = rooms.find((entry) => entry.id === row.room_id);

  return room ? toKid(row, room.name) : null;
}

function toKid(row: ChildRow, roomName: string): Kid {
  return {
    id: row.id,
    name: row.full_name,
    birthDate: row.birth_date,
    room: roomName,
    roomId: row.room_id,
    enrolledAt: row.enrolled_at,
    ...(row.allergies ? { allergies: row.allergies } : {}),
    ...(row.medical_notes ? { medicalNotes: row.medical_notes } : {}),
    avatarInitial: avatarInitialFor(row.full_name),
    avatarTone: toneForId(row.id),
  };
}
