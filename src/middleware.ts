import { createServerClient } from '@supabase/ssr'; // Use createServerClient
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Import cookies

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Manually create the Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value; // Use request.cookies
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          request.cookies.set(name, '', options);
        },
      },
    }
  );

  // Refresh the session if expired
  await supabase.auth.getSession();

  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  console.log('Middleware: Pathname:', pathname); // Log pathname
  console.log('Middleware: Session:', session); // Log session

  // If user is not signed in and the current path is not an auth page, redirect the user to the login page.
  if (!session && pathname !== '/login' && pathname !== '/signup' && pathname !== '/password-reset' && !pathname.startsWith('/auth')) {
    console.log('Middleware: Redirecting to /login'); // Log redirection
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is signed in and the current path is an auth page, redirect the user to the dashboard.
  if (session && (pathname === '/login' || pathname === '/signup' || pathname === '/password-reset')) {
    console.log('Middleware: Redirecting to /dashboard'); // Log redirection
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
