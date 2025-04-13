import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { action, addFields } = await request.json();
    
    // Only allow this in development or with proper authorization in production
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.MIGRATION_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Get Supabase client
    const supabase = await createClient();
    
    if (action === 'migrateUsers' && addFields) {
      // Instead of running raw SQL, we'll use Supabase's query builder
      // to check if columns exist and add them if they don't
      
      let needsUpdate = false;
      let missingColumns = [];
      
      try {
        // Step 1: Try to select with our new column names to see if they exist
        const { error: metadataError } = await supabase
          .from('users')
          .select('email_verified, auth_provider, last_login')
          .limit(1);
          
        if (metadataError) {
          console.log('Column check error, likely missing columns:', metadataError.message);
          needsUpdate = true;
          
          // Try to extract which columns are missing from the error message
          const errorMsg = metadataError.message.toLowerCase();
          if (errorMsg.includes('email_verified')) missingColumns.push('email_verified');
          if (errorMsg.includes('auth_provider')) missingColumns.push('auth_provider');
          if (errorMsg.includes('last_login')) missingColumns.push('last_login');
        } else {
          // Columns already exist
          console.log('All columns already exist in the users table');
        }
      } catch (error) {
        console.error('Error checking columns:', error);
        needsUpdate = true;
        missingColumns = ['email_verified', 'auth_provider', 'last_login']; // Assume all are missing
      }
      
      if (needsUpdate) {
        // We need to run SQL ALTER TABLE commands via Supabase Dashboard
        // Since we can't run raw SQL directly, provide instructions
        return NextResponse.json({
          success: false,
          needsManualMigration: true,
          missingColumns,
          message: 'Database schema needs to be updated manually',
          sql: `
-- Execute this SQL in the Supabase SQL Editor:
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Then update existing users:
UPDATE users
SET 
  email_verified = TRUE,
  auth_provider = 'email',
  last_login = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
);
          `
        }, { status: 200 });
      }
      
      // If we don't need an update, check if we need to update existing user data
      try {
        // Get users who haven't been updated yet
        const { data: usersToUpdate, error: usersError } = await supabase
          .from('users')
          .select('id')
          .is('email_verified', null)
          .limit(10);
          
        if (!usersError && usersToUpdate && usersToUpdate.length > 0) {
          return NextResponse.json({
            success: false,
            needsDataUpdate: true,
            message: 'User data needs to be updated',
            sql: `
-- Execute this SQL in the Supabase SQL Editor to update existing users:
UPDATE users
SET 
  email_verified = TRUE,
  auth_provider = 'email',
  last_login = NOW()
WHERE email_verified IS NULL OR auth_provider IS NULL OR last_login IS NULL;
            `
          }, { status: 200 });
        }
      } catch (error) {
        console.error('Error checking user data:', error);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Database schema is up to date'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      error: `Migration failed: ${(error as Error).message}`,
      needsManualMigration: true,
      sql: `
-- Execute this SQL in the Supabase SQL Editor:
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Then update existing users:
UPDATE users
SET 
  email_verified = TRUE,
  auth_provider = 'email',
  last_login = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL
);
      `
    }, { status: 500 });
  }
} 