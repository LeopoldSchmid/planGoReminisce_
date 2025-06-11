// src/services/authService.ts
// Centralized service for Supabase Auth actions (signUp, signIn, signOut, etc.)
// Used by auth pages and AuthContext for maintainability and testability

import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const supabase = createSupabaseBrowserClient();

export async function signUp({ email, password, username }: { email: string; password: string; username: string }) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });
}

export async function signIn({ email, password }: { email: string; password: string }) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

// Optionally, add password reset, update email, etc. as needed.
