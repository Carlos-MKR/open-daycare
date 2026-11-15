"use server";

import { requireUser } from "@/lib/auth/require-user";
import { fetchDaycareId, fetchKids, fetchRooms } from "@/lib/data/children";
import type { Kid, Room } from "@/lib/kids";
import { createClient } from "@/utils/supabase/server";

export type ComposerAudience =
  | { ok: true; kids: Kid[]; rooms: Room[] }
  | { ok: false; error: string };

// Audiencia del composer: el provider está montado en el layout raíz (fijo,
// sin sesión), así que los niños y salas reales se cargan aquí al abrir el
// modal, con la cookie de sesión del request.
export async function fetchComposerAudience(): Promise<ComposerAudience> {
  await requireUser();

  const supabase = await createClient();
  const daycareId = await fetchDaycareId(supabase);

  if (!daycareId) {
    return { ok: false, error: "No pudimos identificar tu guardería." };
  }

  const [rooms, kids] = await Promise.all([
    fetchRooms(supabase, daycareId),
    fetchKids(supabase, daycareId),
  ]);

  return { ok: true, kids, rooms };
}
