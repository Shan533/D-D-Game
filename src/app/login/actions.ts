'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    try {
      await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', data.user.id)
    } catch (err) {
      console.error('Error updating login timestamp:', err)
    }
  }

  return redirect('/api/auth/callback?next=/game')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  })

  if (error) {
    return redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data.user) {
    // Add a small delay to ensure auth process completes
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        email: data.user.email,
        username,
        email_verified: !!data.user.email_confirmed_at,
        auth_provider: data.user.app_metadata?.provider || 'email',
        last_login: new Date().toISOString()
      }])

    if (profileError) {
      if (profileError.message?.includes('foreign key constraint')) {
        return redirect('/api/auth/callback?next=' + encodeURIComponent('/login?message=' + encodeURIComponent('Account created. Please check your email to confirm your account and then login.')))
      }
      
      return redirect('/login?error=' + encodeURIComponent(`Profile creation failed: ${profileError.message}`))
    }
    
    // For email confirmation based registration
    if (!data.session) {
      return redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account'))
    }
    
    // For auto-confirmed registration (passwordless, OAuth, etc)
    return redirect('/api/auth/callback?next=/game')
  }

  return redirect('/login?message=' + encodeURIComponent('Check your email to confirm your account'))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Create a short-lived cookie to signal client-side JS to clear local storage
  const cookieStore = await cookies()
  cookieStore.set('sb-logout', 'true', { 
    maxAge: 10, // 10 seconds should be enough
    path: '/' 
  })
  
  return redirect('/login?message=' + encodeURIComponent('You have been logged out'))
} 