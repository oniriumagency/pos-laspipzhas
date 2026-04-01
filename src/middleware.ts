import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Middleware que intercepta todo tráfico a nivel "Edge" (antes de que Next.js renderice la vista)
export async function middleware(request: NextRequest) {
  // 1. Configuramos el objeto Response primario necesario para refrescar cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Instanciamos el cliente de Supabase puro en SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Enganchamos las cookies a la Request y clonamos el Response para 
          // evitar advertencias restrictivas del Server de Next.js.
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 3. Extracción de sesión con un chequeo nativo del SDK (valida contra servidor que el Token JWT no haya caducado)
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Bloques Lógicos de Interceptación
  const nextPath = request.nextUrl.pathname;

  // RUTAS PROTEGIDAS del App Shell (Se agregan validaciones)
  const isProtectedRoute = 
    nextPath.startsWith('/pos') ||
    nextPath.startsWith('/inventario') ||
    nextPath.startsWith('/alertas');

  if (!user && isProtectedRoute) {
    // Bloqueo duro: Usuario crudo intenta acceder al POS. Se patea hacia Login.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // AUTO-REDIRECT Si ya estás logueado no tienes por qué ver el Login o la Raíz "/"
  if (user && (nextPath === '/' || nextPath.startsWith('/login'))) {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  return response;
}

// Configuración restrictiva del Middleware (Performance): 
// Omitimos llamadas a estáticos, SVGs y extensiones core de NextJS
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
