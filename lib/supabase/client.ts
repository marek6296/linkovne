import { createBrowserClient } from "@supabase/ssr";

// Vsetky Linkovne tabulky zijú v schéme `linkove`, nie v `public`.
// Schéma `public` patri ostatnym projektom v tomto Supabase — nesiahame na nu.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "linkove" } },
  );
}
