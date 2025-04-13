import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../types/supabase'

/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please import from '@/utils/supabase/client' directly.
 */

// For backward compatibility
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'Missing Supabase credentials. Please check your environment variables.';
    console.error(errorMsg, {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'defined' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'defined' : 'missing'
    });
    
    throw new Error(errorMsg);
  }
  
  // Debug: Check if auth token exists in storage
  if (typeof window !== 'undefined') {
    const storageKey = 'sb-auth-token';
    const localToken = localStorage.getItem(storageKey);
    const sessionToken = sessionStorage.getItem(storageKey);
    
    console.log('Auth token storage status:', {
      localStorageExists: !!localToken,
      sessionStorageExists: !!sessionToken
    });
    
    if (localToken) {
      try {
        const parsed = JSON.parse(localToken);
        console.log('Auth token exists:', {
          type: parsed?.type || 'unknown',
          expiresAt: parsed?.expires_at || 'unknown',
          hasAccessToken: !!parsed?.access_token,
          hasRefreshToken: !!parsed?.refresh_token
        });
      } catch (e) {
        console.error('Failed to parse auth token:', e);
      }
    }
  }
  
  try {
    // Add persistent cookie options for better session management
    const client = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'sb-auth-token',
          storage: {
            getItem: (key) => {
              // Debug token retrieval
              console.log(`Getting auth key: ${key}`);
              
              // Try localStorage first for persistence
              if (typeof window !== 'undefined') {
                const localValue = localStorage.getItem(key);
                console.log(`localStorage result for ${key}:`, localValue ? 'found' : 'not found');
                
                // If not in localStorage, check sessionStorage as fallback
                if (localValue === null) {
                  const sessionValue = sessionStorage.getItem(key);
                  console.log(`sessionStorage result for ${key}:`, sessionValue ? 'found' : 'not found');
                  
                  if (sessionValue !== null) {
                    // Copy to localStorage for persistence
                    try {
                      localStorage.setItem(key, sessionValue);
                      console.log(`Auth data for ${key} copied from sessionStorage to localStorage`);
                    } catch (e) {
                      console.error(`Error copying ${key} to localStorage:`, e);
                    }
                    return sessionValue;
                  }
                  return null;
                }
                return localValue;
              }
              return null;
            },
            setItem: (key, value) => {
              // Debug token storage
              console.log(`Storing auth key: ${key}`);
              
              if (typeof window !== 'undefined') {
                // Always store in localStorage first for persistence
                try {
                  localStorage.setItem(key, value);
                } catch (e) {
                  console.error(`Error storing ${key} in localStorage:`, e);
                }
                
                // Then in sessionStorage for additional security
                try {
                  sessionStorage.setItem(key, value);
                } catch (e) {
                  console.error(`Error storing ${key} in sessionStorage:`, e);
                }
                
                console.log(`Auth data for ${key} stored in both localStorage and sessionStorage`);
              }
            },
            removeItem: (key) => {
              // Debug token removal
              console.log(`Removing auth key: ${key}`);
              
              if (typeof window !== 'undefined') {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
                console.log(`Auth data for ${key} removed from both localStorage and sessionStorage`);
              }
            }
          }
        }
      }
    );
    
    // Verify client has required methods
    if (!client || !client.auth) {
      throw new Error('Failed to initialize Supabase client: Missing auth methods');
    }
    
    // Try to get session to verify client is working
    client.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Error getting session at initialization:', error);
      } else {
        console.log('Initial session check:', { 
          hasSession: !!data.session,
          userId: data.session?.user?.id || 'none'
        });
      }
    });
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    
    // Return a dummy client that will throw errors when used
    throw new Error(`Failed to initialize Supabase client: ${(error as Error).message || String(error)}`);
  }
}

let supabase;

try {
  // Create a singleton client for use throughout the app
  supabase = createClient();
  
  // Verify the client has auth methods
  if (!supabase.auth) {
    throw new Error("Invalid Supabase client: missing auth methods");
  }
} catch (err: unknown) {
  console.error("Error initializing Supabase client:", err);
  
  // Don't use a mock client - throw an error instead to force proper error handling
  throw new Error(`Failed to initialize Supabase client: ${err instanceof Error ? err.message : String(err)}`);
}

// Re-export the proper client instead of creating a new one
import { createClient as createNewClient } from '@/utils/supabase/client';
export default createNewClient(); 