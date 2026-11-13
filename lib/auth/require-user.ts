import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

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
