import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Auth callback handler to support authentication cookie refresh
 * This ensures cookies are properly set after login/signup operations
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/game'
  
  // Create a Supabase client for server-side requests
  const supabase = await createClient()
  
  // Handle access and refresh tokens if they're in the URL
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }
  
  // Redirect to the specified URL
  return NextResponse.redirect(new URL(next, request.url))
} 