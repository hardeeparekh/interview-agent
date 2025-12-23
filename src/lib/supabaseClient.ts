// Export a single, shared Supabase client for the whole app.
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export let supabase: SupabaseClient | null = null;

if (typeof window !== "undefined") {
  if (!supabaseUrl) {
    console.warn(
      "NEXT_PUBLIC_SUPABASE_URL not set — Supabase client not initialized."
    );
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
}
