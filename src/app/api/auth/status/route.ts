import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to check authentication status for debugging
 */
export async function GET(request: NextRequest) {
  try {
    // Create a server-side Supabase client
    const supabase = await createClient()
    
    // Get session and user
    const { data: sessionData } = await supabase.auth.getSession()
    const { data: userData } = await supabase.auth.getUser()
    
    // Get all cookies for debugging
    const cookies = request.cookies.getAll().map(cookie => ({
      name: cookie.name,
      value: cookie.name.startsWith('sb-') ? '[REDACTED]' : cookie.value.substring(0, 10) + '...',
    }))
    
    return NextResponse.json({
      authenticated: !!sessionData.session,
      hasUser: !!userData.user,
      userId: userData.user?.id || null,
      email: userData.user?.email || null,
      cookies: cookies,
      sessionExpires: sessionData.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : null,
      userMetadata: userData.user?.user_metadata || null,
    }, { status: 200 })
  } catch (error) {
    console.error('Error in auth status check:', error)
    return NextResponse.json({
      authenticated: false,
      error: (error as Error).message,
    }, { status: 500 })
  }
} 