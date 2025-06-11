import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;

  // Create a Supabase client for auth checks
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          requestHeaders.set('Set-Cookie', `${name}=${value}; Path=/; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''}`);
        },
        remove(name: string, options: any) {
          requestHeaders.set('Set-Cookie', `${name}=; Max-Age=0; Path=/;`);
        },
      },
    }
  );

  // Check auth status
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;
  
  console.log(`[Middleware] Path: ${pathname}, Auth: ${isLoggedIn ? 'Authenticated' : 'Not authenticated'}`);

  // Handle dashboard routes (protected routes)
  if (pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      // Redirect to login if trying to access protected routes while not logged in
      console.log('[Middleware] Redirecting unauthenticated user to login');
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    // User is authenticated, allow access to dashboard routes
    console.log('[Middleware] Allowing access to dashboard route');
  }

  // Handle auth routes (login/signup)
  if (pathname === '/login' || pathname === '/signup') {
    if (isLoggedIn) {
      // Redirect to dashboard if already logged in
      console.log('[Middleware] Redirecting authenticated user to dashboard');
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
};
