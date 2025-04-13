import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../../types/supabase'

/**
 * Creates a Supabase client for client components.
 * 
 * This function creates a browser client that can be used in client components
 * to access Supabase services and real-time subscriptions.
 * 
 * @returns A Supabase client for browser usage
 */
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
  
  try {
    console.log('[Supabase Client] Creating client...');
    
    // Check for existing tokens to debug
    if (typeof window !== 'undefined') {
      const possibleKeys = [
        'sb-auth-token',
        'supabase.auth.token',
        'authState'
      ];
      
      console.log('[Supabase Client] Checking for existing auth tokens:');
      possibleKeys.forEach(key => {
        const hasToken = localStorage.getItem(key) !== null;
        console.log(`[Supabase Client] - ${key}: ${hasToken ? 'exists' : 'missing'}`);
      });
    }
    
    // Add persistent cookie options for better session management
    const client = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',  // Use the more secure PKCE flow
          storageKey: 'sb-auth-token',
          storage: {
            getItem: (key: string): string | null => {
              if (typeof window === 'undefined') return null;
              
              console.log(`[Supabase Client] Getting auth data for: ${key}`);
              
              // Check if we're looking for the auth token
              if (key === 'sb-auth-token') {
                // Try getting the token from Supabase's standard location first
                const supabaseToken = localStorage.getItem(key);
                if (supabaseToken) {
                  console.log(`[Supabase Client] Found auth token in standard location: ${key}`);
                  return supabaseToken;
                }
                
                // If not found, check alternate location
                const altToken = localStorage.getItem('supabase.auth.token');
                if (altToken) {
                  console.log('[Supabase Client] Found auth token in alt location: supabase.auth.token');
                  // Copy to standard location for next time
                  try {
                    localStorage.setItem(key, altToken);
                  } catch (e) {
                    console.error(`[Supabase Client] Error copying token to ${key}:`, e);
                  }
                  return altToken;
                }
                
                // As a last resort, check if we have authState and try to extract tokens
                const authState = localStorage.getItem('authState');
                if (authState) {
                  try {
                    const parsed = JSON.parse(authState);
                    if (parsed.user?.id) {
                      console.log('[Supabase Client] Found authState but no token could be extracted');
                    }
                  } catch (e) {
                    console.error('[Supabase Client] Error parsing authState:', e);
                  }
                }
                
                console.log('[Supabase Client] No auth token found in any location');
                return null;
              }
              
              // For other keys, use standard approach
              const value = localStorage.getItem(key);
              return value;
            },
            setItem: (key: string, value: string): void => {
              if (typeof window === 'undefined') return;
              
              console.log(`[Supabase Client] Setting auth data for: ${key}`);
              
              // Always store in localStorage first for persistence
              try {
                localStorage.setItem(key, value);
                
                // If we're setting the auth token, also save to alternate locations for compatibility
                if (key === 'sb-auth-token') {
                  localStorage.setItem('supabase.auth.token', value);
                  
                  // Also try to update authState
                  try {
                    const authState = localStorage.getItem('authState');
                    if (authState) {
                      const parsed = JSON.parse(authState);
                      const tokenData = JSON.parse(value);
                      
                      if (parsed.user && tokenData.user) {
                        parsed.isAuthenticated = true;
                        parsed.user.id = tokenData.user.id;
                        parsed.user.email = tokenData.user.email;
                        
                        localStorage.setItem('authState', JSON.stringify(parsed));
                        sessionStorage.setItem('authState', JSON.stringify(parsed));
                        console.log('[Supabase Client] Updated authState with new token data');
                      }
                    }
                  } catch (e) {
                    // Ignore errors updating authState
                    console.error('[Supabase Client] Error syncing with authState:', e);
                  }
                }
              } catch (e) {
                console.error(`[Supabase Client] Error storing ${key} in localStorage:`, e);
              }
              
              // Then in sessionStorage for additional security
              try {
                sessionStorage.setItem(key, value);
              } catch (e) {
                console.error(`[Supabase Client] Error storing ${key} in sessionStorage:`, e);
              }
            },
            removeItem: (key: string): void => {
              if (typeof window === 'undefined') return;
              
              console.log(`[Supabase Client] Removing auth data for: ${key}`);
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
              
              // Also remove alternate tokens
              if (key === 'sb-auth-token') {
                localStorage.removeItem('supabase.auth.token');
                console.log('[Supabase Client] Also removed supabase.auth.token');
              }
            }
          }
        },
        cookieOptions: {
          name: 'sb-auth-token', 
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
          sameSite: 'lax'
        }
      }
    );
    
    console.log('[Supabase Client] Client created successfully');
    
    // Verify client has required methods
    if (!client || !client.auth) {
      throw new Error('Failed to initialize Supabase client: Missing auth methods');
    }
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    
    // Return a dummy client that will throw errors when used
    throw new Error(`Failed to initialize Supabase client: ${(error as Error).message || String(error)}`);
  }
} 