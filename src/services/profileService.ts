import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Database } from "@/types/supabase";

const supabase = createSupabaseBrowserClient();

export interface UpdateProfilePayload {
  username?: string;
  full_name?: string;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) {
    throw new Error("Not authenticated");
  }
  const { error, data } = await supabase
    .from("profiles")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
