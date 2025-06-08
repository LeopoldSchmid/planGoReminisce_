import type { User as SupabaseUser } from '@supabase/supabase-js';

// Represents the user object provided by Supabase Auth
export type User = SupabaseUser;

// Represents the structure of our 'profiles' table
// This should align with the columns defined in the migration and generated in supabase.ts
export interface Profile {
  id: string; // UUID, matches auth.users.id
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  updated_at: string; // TIMESTAMPTZ (ISO 8601 string format)
  created_at: string; // TIMESTAMPTZ (ISO 8601 string format)
}

// Combines Supabase user data with our custom profile data
export interface UserWithProfile extends User {
  profile?: Profile | null;
}

// Add other application-specific types here as the project grows.
