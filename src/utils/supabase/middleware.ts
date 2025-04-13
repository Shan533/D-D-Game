import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '../../types/supabase'

export async function updateSession(request: NextRequest) {
  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = new URL(request.url);
  const path = url.pathname;
  
  // Debug path and cookies
  console.log(`[Middleware] Processing request for: ${path}`);
  console.log(`[Middleware] Cookies:`, request.cookies.getAll().map(c => c.name).join(', '));

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          console.log('[Middleware] Reading cookies:', cookies.map(c => c.name).join(', '));
          return cookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }))
        },
        setAll(cookiesToSet) {
          console.log('[Middleware] Setting cookies:', cookiesToSet.map(c => c.name).join(', '));
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookies on both request and response
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
              // Add these options to make cookies work more reliably
              path: '/',
              sameSite: 'lax'
            })
          })
        },
      },
    }
  )

  try {
    // Get session from cookies
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Middleware] Session error:', error.message);
    }
    
    console.log(`[Middleware] Session check: ${session ? 'Found session' : 'No session'}`);
    if (session) {
      console.log(`[Middleware] User ID: ${session.user.id}`);
    }
    
    // Protect game routes - redirect to login if no session
    if ((path === '/game' || path.startsWith('/game/')) && !session) {
      console.log('[Middleware] No valid session for protected route, redirecting to login');
      // Set a flag in a cookie to signal client-side to check localStorage
      response.cookies.set('check_local_tokens', 'true', {
        path: '/',
        maxAge: 30, // Only valid for 30 seconds
        sameSite: 'lax'
      });
      
      console.log('[Middleware] Setting cookie to check local tokens on client side');
      
      // Still allow access to game route since client JS will handle redirect if needed
      return response;
    }
    
    // Redirect authenticated users from login/register pages to game page
    if (session && (path === '/login' || path === '/register' || path === '/')) {
      console.log('[Middleware] User is authenticated, redirecting from login/register');
      return NextResponse.redirect(new URL('/game', request.url));
    }
    
    return response;
  } catch (error) {
    console.error('[Middleware] Auth middleware error:', error);
    
    // If there's an error, still protect game routes
    if (path === '/game' || path.startsWith('/game/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return response;
  }
} 