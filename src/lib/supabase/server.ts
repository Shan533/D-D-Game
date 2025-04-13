import { createClient } from '@/utils/supabase/server'

// For backward compatibility
export const createServerSupabaseClient = createClient

// Since we're transitioning to the new implementation completely,
// let's add a deprecation notice as a comment
/* 
 * DEPRECATED: This file is maintained for backward compatibility only.
 * Please import from '@/utils/supabase/server' directly.
 */ 