import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Kam ist po prihlaseni — povolujeme len internu cestu, nie cudziu URL
  const rawNext = searchParams.get("next") ?? "";
  const next = /^\/[a-z0-9/_-]*$/i.test(rawNext) ? rawNext : "";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  // Ci uz je Linkovne user alebo len prihlaseny do ineho nasho webu,
  // rozhodne /dashboard — ten posle na /onboarding, ak profil chyba.
  return NextResponse.redirect(`${origin}${next || "/dashboard"}`);
}
