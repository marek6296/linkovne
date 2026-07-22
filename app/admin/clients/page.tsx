import { createClient } from "@/lib/supabase/server";
import { ClientsTable, type ClientRow } from "@/components/admin/clients-table";

/** Admin → Clients. Cely CRM zoznam s vyhladavanim a triedenim. */
export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_users");
  const list = (data ?? []) as ClientRow[];

  return <ClientsTable accounts={list} />;
}
