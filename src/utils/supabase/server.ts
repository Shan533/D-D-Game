import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../../types/supabase'

/**
 * Creates a Supabase client for server components.
 * 
 * This function creates a Supabase client that can be used in server components,
 * server actions, route handlers, and middleware.
 * 
 * @returns A Supabase client with the correct cookie handling
 */
export async function createClient() {
  console.log('[Server Supabase] Creating server client...');
  console.log('[Server Supabase] Available cookies:', cookies().getAll().map(c => c.name).join(', '));
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value
        },
        set(name, value, options) {
          cookies().set(name, value, options)
        },
        remove(name, options) {
          cookies().delete({ name, ...options })
        },
      },
      cookieOptions: {
        name: 'sb-auth-token',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax'
      }
    }
  )
} 