import { redirect } from "next/navigation";

// „All pages" sa zlucilo do Analytics ako sekcia „All models". Stara adresa
// ostava funkcna kvoli ulozenym linkom — presmeruje na analytiku.
export default function AgencyPage() {
  redirect("/dashboard/analytics");
}
