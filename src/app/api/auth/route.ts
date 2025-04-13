import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { action, email, password, username } = await request.json();
    
    // Get Supabase client using our helper
    const supabase = await createClient();

    if (action === 'register') {
      // Register new user
      console.log('Registration request received for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) {
        console.error('Registration error:', error);
        throw error;
      }

      console.log('Registration successful for user:', data.user?.id || 'unknown');

      if (data.user) {
        // Add a small delay to ensure auth process completes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Use direct insert for the user profile
        console.log('Creating profile for user:', data.user.id);
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            username,
            email_verified: !!data.user.email_confirmed_at,
            auth_provider: data.user.app_metadata?.provider || 'email',
            last_login: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Profile creation error:', JSON.stringify(profileError));
          
          // If we hit a foreign key constraint error, it likely means the auth user
          // hasn't been fully propagated to the database yet
          if (profileError.message?.includes('foreign key constraint')) {
            return NextResponse.json(
              { 
                error: 'Registration is complete, but user profile setup requires login. Please check your email to confirm your account and then login.',
                status: 'partialComplete'
              },
              { status: 202 }  // 202 Accepted - the request has been accepted for processing
            );
          }
          
          return NextResponse.json(
            { error: `Profile creation failed: ${profileError.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          user: data.user,
          message: 'Registration successful! Please check your email to confirm your account.'
        });
      }
    } else if (action === 'login') {
      // Login existing user
      console.log('Login request received for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful for user:', data.user?.id || 'unknown');

      return NextResponse.json({ 
        success: true, 
        user: data.user,
        message: 'Login successful'
      });
    } else if (action === 'logout') {
      // Logout user
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        throw error;
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
} 