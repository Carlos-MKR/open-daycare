"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Cierra la sesión suprimiendo las cookies de Auth y devuelve al login.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
