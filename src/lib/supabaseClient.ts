import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase'; // Will be generated next

// Note: This client is intended for use in client components or client-side logic.
// For server components and route handlers, you'll typically use a different setup
// often involving createServerClient or createRouteHandlerClient from @supabase/ssr.

// A function to create the client instance ensures environment variables are read at runtime.
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Optionally, you can export a singleton instance if preferred for simpler import in client components,
// but be mindful of when environment variables are accessed if Next.js build process is involved.
// const supabase = createSupabaseBrowserClient();
// export { supabase };
