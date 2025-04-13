import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// This middleware runs for every request
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Define which routes this middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 