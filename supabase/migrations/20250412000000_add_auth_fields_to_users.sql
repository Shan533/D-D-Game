-- Add authentication fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create an update function that will set the user's auth status
CREATE OR REPLACE FUNCTION public.set_user_auth_status(
  user_id UUID,
  email_verified BOOLEAN,
  provider TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.users
  SET 
    email_verified = $2,
    auth_provider = $3,
    last_login = $4,
    updated_at = NOW()
  WHERE id = $1;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 