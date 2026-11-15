// Acceso a datos de publicaciones (SPEC 14). Solo server: recibe el cliente
// de utils/supabase/server.ts y la visibilidad la gobierna la RLS de posts
// (policies sobre visible_post_ids()).
import type { createClient } from "@/utils/supabase/server";
import { fetchRooms } from "@/lib/data/children";
import { variantForType, type PostType, type PostView } from "@/lib/posts";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PostRow = {
  id: string;
  author_id: string;
  type: PostType;
  body: string;
  published_at: string;
  room_id: string | null;
  rooms: { name: string } | null;
  post_children: { children: { id: string; full_name: string } | null }[];
};

// users.full_name no puede ir embebido: su RLS solo deja leer la fila propia.
// El nombre del autor se trae con la función DEFINER user_names(ids[]).
const POST_SELECT =
  "id, author_id, type, body, published_at, room_id, rooms ( name ), post_children ( children ( id, full_name ) )";

async function toPostViews(
  supabase: SupabaseServerClient,
  rows: PostRow[],
): Promise<PostView[]> {
  const authorIds = [...new Set(rows.map((row) => row.author_id))];

  const { data: names } = await supabase.rpc("user_names", { p_ids: authorIds });
  const nameById = new Map<string, string>(
    ((names ?? []) as { id: string; full_name: string }[]).map((entry) => [
      entry.id,
      entry.full_name,
    ]),
  );

  return rows.map((row) => {
    const childNames = row.post_children
      .flatMap((entry) => entry.children)
      .filter((child): child is { id: string; full_name: string } => child !== null)
      .map((child) => child.full_name);

    return {
      id: row.id,
      type: row.type,
      body: row.body,
      publishedAt: row.published_at,
      authorName: nameById.get(row.author_id) ?? "Personal",
      ...(row.rooms ? { roomName: row.rooms.name } : {}),
      childNames,
      variant: variantForType(row.type),
    };
  });
}

// Feed del staff: la RLS ya limita a los posts visibles de staff; además se
// descarta cualquier post cuya sala o niños etiquetados no pertenezcan al
// daycare del usuario (defensa para el día del multi-daycare).
export async function fetchPostsForDaycare(
  supabase: SupabaseServerClient,
  daycareId: string,
): Promise<PostView[]> {
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("published_at", { ascending: false });

  const rows = (data ?? []) as unknown as PostRow[];

  if (rows.length === 0) return [];

  const rooms = await fetchRooms(supabase, daycareId);
  const roomIds = new Set(rooms.map((room) => room.id));
  const filtered = await filterByDaycareRooms(supabase, rows, roomIds);

  return toPostViews(supabase, filtered);
}

// Feed del padre: la RLS ya devuelve exactamente lo suyo (posts de sus hijos
// + anuncios de sus salas); el query corre con la sesión del padre.
export async function fetchPostsForParent(
  supabase: SupabaseServerClient,
): Promise<PostView[]> {
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("published_at", { ascending: false });

  return toPostViews(supabase, (data ?? []) as unknown as PostRow[]);
}

async function filterByDaycareRooms(
  supabase: SupabaseServerClient,
  rows: PostRow[],
  roomIds: Set<string>,
): Promise<PostRow[]> {
  const childIds = [
    ...new Set(
      rows.flatMap((row) =>
        row.post_children.flatMap((entry) => entry.children?.id ?? []),
      ),
    ),
  ];

  if (childIds.length === 0) {
    return rows.filter((row) => row.room_id === null || roomIds.has(row.room_id));
  }

  const { data: children } = await supabase
    .from("children")
    .select("id, room_id")
    .in("id", childIds);

  const roomOfChild = new Map<string, string>(
    ((children ?? []) as { id: string; room_id: string }[]).map((child) => [
      child.id,
      child.room_id,
    ]),
  );

  return rows.filter((row) => {
    if (row.room_id !== null && !roomIds.has(row.room_id)) return false;

    const taggedRooms = row.post_children
      .flatMap((entry) => entry.children?.id ?? [])
      .map((id) => roomOfChild.get(id))
      .filter((room): room is string => Boolean(room));

    return taggedRooms.length === 0 || taggedRooms.some((room) => roomIds.has(room));
  });
}
