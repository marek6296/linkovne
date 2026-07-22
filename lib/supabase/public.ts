import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Klient bez cookies — pre verejné stránky a redirect endpoint.
// Beží vždy ako `anon`, takže RLS pustí len zverejnené profily.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "linkove" }, auth: { persistSession: false } },
  );
}
