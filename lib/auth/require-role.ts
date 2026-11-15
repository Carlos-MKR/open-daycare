import { connection } from "next/server";
import { redirect } from "next/navigation";
import { landingPathForRole, fetchUserRole, type UserRole } from "@/lib/auth/role";
import { createClient } from "@/utils/supabase/server";

// Roles con acceso al área de personal. `admin` todavía no tiene UI propia
// (SPEC 10); se lo trata como staff hasta su spec.
export const STAFF_ROLES: UserRole[] = ["staff", "admin"];

export const PARENT_ROLES: UserRole[] = ["parent"];

// Guard de sesión + navegación por rol (SPEC 13): si el rol no está permitido,
// el usuario va a su landing (padre → /familia, staff → /). Con perfil
// inexistente (trigger roto) deja pasar: es el degradado que ya existía, sin
// loops de redirect.
export async function requireRole(allowed: UserRole[]) {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await fetchUserRole(supabase, user.id);

  if (role && !allowed.includes(role)) {
    redirect(landingPathForRole(role));
  }

  return user;
}
