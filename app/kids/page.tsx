import { KidsView } from "@/components/kids/kids-view";
import { getDisplayName, requireUser } from "@/lib/auth/require-user";
import { fetchDaycareId, fetchKids, fetchRooms } from "@/lib/data/children";
import { createClient } from "@/utils/supabase/server";

// La página lee la sesión y la DB en el request, no puede prerendererse (SPEC 10/12).
export const instant = false;

// Listado de niños reales (SPEC 12) detrás del guard de autenticación (SPEC 10).
export default async function KidsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const daycareId = await fetchDaycareId(supabase);

  const [rooms, kids] = daycareId
    ? await Promise.all([
        fetchRooms(supabase, daycareId),
        fetchKids(supabase, daycareId),
      ])
    : [[], []];

  return (
    <KidsView displayName={getDisplayName(user)} rooms={rooms} kids={kids} />
  );
}
