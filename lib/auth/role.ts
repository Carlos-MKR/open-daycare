// Rol del usuario y destino según el rol (SPEC 13). La fila propia de `users`
// es legible por RLS (auth.uid() = id), así que sirve desde client y server.
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "staff" | "parent" | "admin";

const LANDING_BY_ROLE: Record<UserRole, string> = {
  staff: "/",
  parent: "/familia",
  admin: "/",
};

export async function fetchUserRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRole | null> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (data?.role as UserRole) ?? null;
}

// Sin perfil conocido (o rol desconocido) cae al feed: comportamiento previo.
export function landingPathForRole(role: UserRole | null): string {
  if (!role || !(role in LANDING_BY_ROLE)) return "/";

  return LANDING_BY_ROLE[role];
}
