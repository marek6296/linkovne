import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardChrome } from "@/components/dashboard/chrome";

/**
 * Zdielany layout pre CELY dashboard. Header, menu, plan badge a admin link sa
 * nacitaju RAZ pri vstupe a pri preklikavani medzi podstrankami sa uz
 * NErenderuju (Next drzi layout pripnuty). Podstranky riesia len svoj obsah —
 * navigacia je preto svizna.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: account }, { data: isAdmin }] = await Promise.all([
    supabase.from("accounts").select("plan").eq("id", user.id).maybeSingle(),
    supabase.rpc("is_admin"),
  ]);

  return (
    <DashboardChrome planKey={account?.plan ?? "free"} isAdmin={isAdmin === true}>
      {children}
    </DashboardChrome>
  );
}
