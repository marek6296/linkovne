import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * linkovne.com/i/<code> pokryva dve veci naraz:
 *
 *  • Referral kod (kazdy ucet ma vlastny) — pozvanka od kamosa. Novemu userovi
 *    ho odlozime do cookie `ref`, po registracii sa naviaze (attach_referral).
 *    Odmena pre toho, kto pozval, padne az ked privedeny zaplati (webhook).
 *  • Admin invite kod — grant Pro/Business rovno (redeem_invite), ako doteraz.
 *
 * Prihlaseny user uz nemoze byt „privedeny", takze referral link ho len
 * posle do dashboardu; admin invite sa mu uplatni.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const clean = code.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);

  if (!clean) return NextResponse.redirect(new URL("/register", request.url));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: isReferral } = await supabase.rpc("is_referral_code", {
    p_code: clean,
  });

  if (user) {
    // Uz je to nas user — referralom sa priviest neda, len admin invite grantne.
    if (!isReferral) await supabase.rpc("redeem_invite", { p_code: clean });
    return NextResponse.redirect(
      new URL(isReferral ? "/dashboard" : "/dashboard?upgraded=1", request.url),
    );
  }

  // Neprihlaseny → kod si odlozime a posleme na registraciu.
  const res = NextResponse.redirect(new URL("/register", request.url));
  if (isReferral) {
    // Referral drzime dlhsie — potvrdenie mailu moze registraciu oddialit.
    res.cookies.set("ref", clean, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  } else {
    res.cookies.set("invite", clean, {
      httpOnly: true,
      maxAge: 3600,
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}
