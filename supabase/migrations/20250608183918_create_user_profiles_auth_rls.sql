-- 1. Create the 'profiles' table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for users, linked to auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'User ID from auth.users. Automatically deleted if the auth.user is deleted.';
COMMENT ON COLUMN public.profiles.username IS 'Unique, user-chosen username. Required.';
COMMENT ON COLUMN public.profiles.full_name IS 'Optional full name of the user.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Optional URL to the user''s avatar image.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of the last profile update (UTC).';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp of profile creation (UTC).';

-- 2. Enable Row Level Security (RLS) for the 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for 'profiles' table

-- Policy: Authenticated users can view all profiles.
CREATE POLICY "Authenticated users can view profiles."
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can update their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Function and Trigger to create a profile entry on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username', -- Assumes 'username' is passed in options.data during signup
    NEW.raw_user_meta_data->>'full_name', -- Assumes 'full_name' might be passed in options.data
    NEW.raw_user_meta_data->>'avatar_url', -- Assumes 'avatar_url' might be passed in options.data
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Trigger to execute the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant usage on schema to relevant roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant execute on the function to relevant roles
GRANT ALL ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;
