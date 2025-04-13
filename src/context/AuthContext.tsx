'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { AuthState, User, LoginCredentials, RegisterCredentials } from '../types/auth';

// Create a client instance using the standardized client
const supabaseClient = createClient();

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  message: null,
};

// Create context with better undefined check
const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => { throw new Error('AuthContext not initialized'); },
  register: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => { throw new Error('AuthContext not initialized'); },
  forceRefresh: async () => { throw new Error('AuthContext not initialized'); },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        // Get session from Supabase
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session?.user) {
          // Map user data to our User type
          const mappedUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || 'User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: true, // Always true since we're not requiring verification
            authProvider: session.user.app_metadata?.provider || 'email',
            lastLogin: new Date().toISOString()
          };
          
          setState({
            isAuthenticated: true,
            user: mappedUser,
            loading: false,
            error: null,
            message: null
          });
        } else {
          // No active session
          setState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
            message: null
          });
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: (err as Error).message,
          message: null
        });
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          // User is signed in, update state
          const mappedUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username || 'User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: true, // Always true since we're not requiring verification
            authProvider: session.user.app_metadata?.provider || 'email',
            lastLogin: new Date().toISOString()
          };
          
          setState({
            isAuthenticated: true,
            user: mappedUser,
            loading: false,
            error: null,
            message: null
          });
        } else {
          // User is signed out
          setState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
            message: null
          });
        }
      }
    );

    // Initial check
    checkSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null, message: null }));
      
      // Sign in with Supabase
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Login failed - no user returned');
      }
      
      // Auth state listener will update the state
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
        message: 'Login successful! Redirecting...',
        isAuthenticated: true,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          username: data.user.user_metadata?.username || 'User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: true,
          authProvider: data.user.app_metadata?.provider || 'email',
          lastLogin: new Date().toISOString()
        } : null
      }));
      
      // Use window.location to ensure redirect works regardless of context
      setTimeout(() => {
        window.location.href = '/game';
      }, 500); // Small delay to ensure state update happens
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message,
        message: null
      }));
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null, message: null }));
      
      // Sign up with Supabase
      const { data, error } = await supabaseClient.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
          },
          // Disable email confirmation
          emailRedirectTo: undefined
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Registration failed - no user returned');
      }
      
      // Create a record in the users table
      try {
        const { error: insertError } = await supabaseClient
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            username: credentials.username,
            email_verified: true, // Always mark as verified
            auth_provider: 'email',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
          
        if (insertError && !insertError.message.includes('duplicate key')) {
          console.error('Failed to create user profile:', insertError);
        }
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Continue despite profile errors - the auth part is done
      }
      
      // Auth state listener will handle the state update
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
        message: 'Account created successfully! Redirecting...',
        isAuthenticated: true,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          username: credentials.username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: true,
          authProvider: 'email',
          lastLogin: new Date().toISOString()
        } : null
      }));
      
      // Use window.location to ensure redirect works regardless of context
      setTimeout(() => {
        window.location.href = '/game';
      }, 500); // Small delay to ensure state update happens
    } catch (error) {
      console.error('Registration error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message,
        message: null
      }));
    }
  };

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        // Clear all auth-related storage keys to ensure consistency
        localStorage.removeItem('authState');
        localStorage.removeItem('sb-auth-token');         // Current standard key
        localStorage.removeItem('supabase.auth.token');   // Alternate key
        localStorage.removeItem('supabase-auth-token');   // Legacy key
        
        // Also clear session storage
        sessionStorage.removeItem('authState');
        sessionStorage.removeItem('sb-auth-token');
        sessionStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase-auth-token');
        
        // Clear any game-related state
        localStorage.removeItem('gameSessionId');
        localStorage.removeItem('gameActive');
        localStorage.removeItem('gameStarting');
      }
      
      // Sign out from Supabase
      await supabaseClient.auth.signOut();
      
      // Update state
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        message: 'Successfully logged out'
      });
      
      // Use window.location to ensure redirect works regardless of context
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: (error as Error).message,
        message: null
      });
      
      // Still redirect to login page on error using window.location
      window.location.href = '/login';
    }
  };

  const forceRefresh = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Force refresh the session
      const { data, error } = await supabaseClient.auth.refreshSession();
      
      if (error) {
        console.error('Failed to refresh session:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: `Failed to refresh session: ${error.message}` 
        }));
        return;
      }
      
      if (data.session) {
        console.log('Session refreshed successfully');
        // Get the updated session info
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (user) {
          // Map user data to our User type
          const mappedUser: User = {
            id: user.id,
            email: user.email || '',
            username: user.user_metadata?.username || 'User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: true,
            authProvider: user.app_metadata?.provider || 'email',
            lastLogin: new Date().toISOString()
          };
          
          setState({
            isAuthenticated: true,
            user: mappedUser,
            loading: false,
            error: null,
            message: null
          });
        } else {
          setState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
            message: null
          });
        }
      } else {
        console.warn('No session found after refresh');
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'No session found after refresh. Please login again.',
          message: null
        });
      }
    } catch (err) {
      console.error('Auth refresh error:', err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: `Error refreshing authentication: ${(err as Error).message}` 
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        forceRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 