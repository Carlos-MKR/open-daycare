import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Rutas accesibles sin sesión. Todo lo demás exige usuario autenticado.
const PUBLIC_PATHS = ['/login', '/activar-cuenta'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Copia las cookies de refresh de una respuesta a otra para no perder
// el token renovado cuando el proxy redirige en vez de continuar.
function copyAuthCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

// Refresca el token de sesión en cada request que pasa por proxy.ts y
// aplica la protección de rutas: sin sesión las rutas privadas redirecten
// a /login; con sesión /login redirecte al feed.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: no ejecutar código entre createServerClient y
  // getUser() sin llamar antes a getSession() para evitar robos de sesión.
  // getUser() además refresca el token si toca, y debe correr antes de
  // generar la respuesta para que setAll pueda escribir las cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublicPath(pathname)) {
    const redirectResponse = NextResponse.redirect(
      new URL('/login', request.url),
    );
    copyAuthCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (user && pathname === '/login') {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    copyAuthCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}
