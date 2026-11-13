import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

// Nombre visible para el perfil del sidebar: full_name del perfil de Auth,
// con fallback a la parte local del email. Solo display (SPEC 10 mini-fix);
// la fuente autoritativa sera public.users cuando se hidraten datos reales.
export function getDisplayName(user: User): string {
  const fullName = user.user_metadata?.full_name;

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  return user.email ? user.email.split('@')[0] : 'Invitada';
}

// Guard server-side para páginas protegidas: verifica la sesión contra el
// servidor de Auth (getUser es autoritativa) y redirige a /login sin usuario.
// connection() marca el render como request-bound: supabase-js llama
// Date.now() internamente y eso rompe el prerender con cacheComponents.
// Uso: `const user = await requireUser()` dentro de un Server Component.
export async function requireUser() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
