import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// Next.js 16: proxy.ts reemplaza a middleware.ts. Refresca la sesión
// de Supabase en cada request (solo se listan rutas dinámicas).
export default function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica a todo excepto assets estáticos:
     * favicon, imágenes, fuentes, y todo lo bajo public/.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
