import { redirect } from "next/navigation";

// Inbox / leads sme odstranili — na link-in-bio stranke ho nikto nepouzival.
// Stara adresa ostava funkcna a presmeruje na dashboard.
export default function LeadsPage() {
  redirect("/dashboard");
}
