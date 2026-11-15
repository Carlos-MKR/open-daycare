// Acceso a datos de invitaciones y vínculos padre↔niño (SPEC 13).
// Solo server: recibe el cliente de utils/supabase/server.ts y respeta RLS.
import type { createClient } from "@/utils/supabase/server";
import { RELATIONSHIP_LABELS, type Relationship } from "@/lib/invitations";
import { avatarInitialFor, toneForId, type Kid } from "@/lib/kids";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Fila de vista del panel "Padres vinculados": invitaciones pendientes/vencidas
// y padres ya aceptados conviven en la misma lista.
export type InvitedParent = {
  kind: "invitation" | "accepted";
  name: string;
  relationshipLabel: string; // "Mamá" | "Papá" | "Tutor/a"
  status: "pending" | "expired" | "active";
};

type InvitationRow = {
  created_at: string;
  full_name: string;
  relationship: Relationship;
  status: "pending" | "expired" | "accepted";
  expires_at: string;
};

// Panel del perfil: todo desde `invitations` (RLS staff-legible). Los aceptados
// se muestran vía status `accepted` con el nombre de la invitación: el nombre
// real de `users` no es legible por staff (RLS propia), y `parent_children`
// sigue siendo el vínculo autoritativo para /familia.
export async function fetchLinkedParents(
  supabase: SupabaseServerClient,
  childId: string,
): Promise<InvitedParent[]> {
  const { data } = await supabase
    .from("invitations")
    .select("created_at, full_name, relationship, status, expires_at")
    .eq("child_id", childId)
    .in("status", ["pending", "expired", "accepted"])
    .order("created_at");

  const now = Date.now();

  return ((data ?? []) as InvitationRow[]).map((row) => ({
    kind: row.status === "accepted" ? ("accepted" as const) : ("invitation" as const),
    name: row.full_name,
    relationshipLabel: RELATIONSHIP_LABELS[row.relationship],
    status:
      row.status === "accepted"
        ? ("active" as const)
        : row.status === "expired" || new Date(row.expires_at).getTime() < now
          ? ("expired" as const)
          : ("pending" as const),
  }));
}

// Cuántos padres tiene cada niño (aceptados + invitaciones pendientes vigentes).
// Una sola ronda de queries para todo el listado de /kids.
export async function countLinkedParents(
  supabase: SupabaseServerClient,
  childIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>(childIds.map((id) => [id, 0]));

  if (childIds.length === 0) return counts;

  const [linkedResult, invitationResult] = await Promise.all([
    supabase
      .from("parent_children")
      .select("child_id")
      .in("child_id", childIds),
    supabase
      .from("invitations")
      .select("child_id")
      .in("child_id", childIds)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString()),
  ]);

  for (const row of linkedResult.data ?? []) {
    counts.set(row.child_id, (counts.get(row.child_id) ?? 0) + 1);
  }

  for (const row of invitationResult.data ?? []) {
    counts.set(row.child_id, (counts.get(row.child_id) ?? 0) + 1);
  }

  return counts;
}

export async function attachLinkedParentCounts(
  supabase: SupabaseServerClient,
  kids: Kid[],
): Promise<Kid[]> {
  const counts = await countLinkedParents(
    supabase,
    kids.map((kid) => kid.id),
  );

  return kids.map((kid) => ({
    ...kid,
    linkedParents: counts.get(kid.id) ?? 0,
  }));
}

type LinkedChildRow = {
  created_at: string;
  children: {
    id: string;
    full_name: string;
    birth_date: string;
    enrolled_at: string;
    allergies: string | null;
    medical_notes: string | null;
    status: string;
    rooms: { name: string } | null;
  } | null;
};

// Niños del padre autenticado para /familia: parent_children → children → rooms.
export async function fetchLinkedChildren(
  supabase: SupabaseServerClient,
  parentId: string,
): Promise<Kid[]> {
  const { data } = await supabase
    .from("parent_children")
    .select(
      "created_at, children ( id, full_name, birth_date, enrolled_at, allergies, medical_notes, status, rooms ( name ) )",
    )
    .eq("parent_id", parentId)
    .order("created_at");

  return ((data ?? []) as unknown as LinkedChildRow[]).flatMap((row) => {
    const child = row.children;

    if (!child || child.status !== "active" || !child.rooms) return [];

    return [
      {
        id: child.id,
        name: child.full_name,
        birthDate: child.birth_date,
        room: child.rooms.name,
        roomId: "",
        enrolledAt: child.enrolled_at,
        ...(child.allergies ? { allergies: child.allergies } : {}),
        ...(child.medical_notes ? { medicalNotes: child.medical_notes } : {}),
        avatarInitial: avatarInitialFor(child.full_name),
        avatarTone: toneForId(child.id),
        linkedParents: 1,
      },
    ];
  });
}
