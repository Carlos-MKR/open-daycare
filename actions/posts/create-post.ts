"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { fetchDaycareId, fetchKidById, fetchRooms } from "@/lib/data/children";
import { POST_TYPES, type PostType } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

export type CreatePostInput = {
  type: PostType;
  body: string;
  childIds: string[];
  roomId: string | null;
};

export type CreatePostResult = { ok: true } | { ok: false; error: string };

// Alta real de publicaciones (SPEC 14). La audiencia es exactamente una de
// las dos: niños etiquetados XOR toda la sala (anuncio).
export async function createPost(
  input: CreatePostInput,
): Promise<CreatePostResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["staff", "admin"].includes(profile.role)) {
    return { ok: false, error: "Solo el personal puede publicar." };
  }

  const body = input.body.trim();

  if (!body) {
    return { ok: false, error: "Escribí una descripción." };
  }

  if (!POST_TYPES.includes(input.type)) {
    return { ok: false, error: "Seleccioná un tipo de publicación." };
  }

  const daycareId = await fetchDaycareId(supabase);

  if (!daycareId) {
    return { ok: false, error: "No pudimos identificar tu guardería." };
  }

  const hasChildren = input.childIds.length > 0;
  const hasRoom = input.roomId !== null && input.roomId !== "";

  if (hasChildren === hasRoom) {
    return {
      ok: false,
      error: hasChildren
        ? "Elegí niños o toda la sala, no las dos cosas."
        : "Seleccioná al menos un destinatario.",
    };
  }

  let childIds: string[] = [];

  if (hasChildren) {
    const kids = await Promise.all(
      input.childIds.map((id) => fetchKidById(supabase, daycareId, id)),
    );

    if (kids.some((kid) => kid === null)) {
      return { ok: false, error: "Uno de los niños ya no está disponible." };
    }

    childIds = input.childIds;
  }

  let roomId: string | null = null;

  if (hasRoom) {
    if (input.type !== "announcement") {
      return {
        ok: false,
        error: "Los avisos para toda la sala son de tipo Anuncio.",
      };
    }

    const rooms = await fetchRooms(supabase, daycareId);
    const room = rooms.find((entry) => entry.id === input.roomId);

    if (!room) {
      return { ok: false, error: "Seleccioná una sala válida." };
    }

    roomId = room.id;
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      room_id: roomId,
      type: input.type,
      body,
    })
    .select("id")
    .single();

  if (error || !post) {
    return { ok: false, error: "No pudimos publicar. Intentá de nuevo." };
  }

  if (childIds.length > 0) {
    const { error: tagsError } = await supabase.from("post_children").insert(
      childIds.map((childId) => ({ post_id: post.id, child_id: childId })),
    );

    if (tagsError) {
      // Sin policy de DELETE (edición/borrado fuera de SPEC 14) no podemos
      // revertir el post: quedaría sin destinatarios, visible solo para el
      // staff. Ventana casi inalcanzable (los niños ya fueron validados
      // arriba); se resuelve de raíz con la spec de borrado de posts.
      return { ok: false, error: "No pudimos publicar. Intentá de nuevo." };
    }
  }

  revalidatePath("/");
  revalidatePath("/familia");

  return { ok: true };
}
