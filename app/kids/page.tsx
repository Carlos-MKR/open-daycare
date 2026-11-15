import { KidsView } from "@/components/kids/kids-view";
import { getDisplayName } from "@/lib/auth/require-user";
import { requireRole, STAFF_ROLES } from "@/lib/auth/require-role";
import { fetchDaycareId, fetchKids, fetchRooms } from "@/lib/data/children";
import { attachLinkedParentCounts } from "@/lib/data/invitations";
import { createClient } from "@/utils/supabase/server";

// La página lee la sesión y la DB en el request, no puede prerendererse (SPEC 10/12).
export const instant = false;

// Listado de niños reales (SPEC 12) detrás del guard de autenticación (SPEC 10),
// con el conteo de padres vinculados (SPEC 13).
export default async function KidsPage() {
  const user = await requireRole(STAFF_ROLES);
  const supabase = await createClient();
  const daycareId = await fetchDaycareId(supabase);

  const [rooms, kids] = daycareId
    ? await Promise.all([
        fetchRooms(supabase, daycareId),
        fetchKids(supabase, daycareId).then((entries) =>
          attachLinkedParentCounts(supabase, entries),
        ),
      ])
    : [[], []];

  return (
    <KidsView displayName={getDisplayName(user)} rooms={rooms} kids={kids} />
  );
}
