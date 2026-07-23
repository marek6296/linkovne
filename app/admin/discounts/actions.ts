"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { buildCouponParams } from "@/lib/discounts";

/**
 * Zľavy a promo kódy sa vytvárajú a spravujú TU (v admine), ale žijú v Stripe —
 * Stripe je jediný zdroj pravdy. Coupon = definícia zľavy (-% / -€, trvanie),
 * Promotion Code = zákaznícky kód napojený na coupon (max použití, expirácia).
 *
 * Autorizácia: admin layout síce chráni stránku, ale server action sa dá zavolať
 * aj priamo — preto si TU overíme is_admin (obrana do hĺbky).
 */
export type DiscountState = { error?: string; ok?: boolean } | undefined;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { ok: isAdmin === true };
}

const CODE_RE = /^[A-Z0-9]{3,40}$/;

export async function createDiscount(formData: FormData): Promise<DiscountState> {
  const { ok } = await requireAdmin();
  if (!ok) return { error: "Not allowed." };
  if (!stripe) return { error: "Billing isn't configured (missing Stripe key)." };

  const rawCode = String(formData.get("code") ?? "").trim().toUpperCase();
  const rawMax = String(formData.get("max_redemptions") ?? "").trim();
  const rawExpires = String(formData.get("expires_at") ?? "").trim();

  // ---- Coupon (definícia zľavy) ----
  const built = buildCouponParams({
    kind: String(formData.get("kind") ?? "percent"),
    value: Number(String(formData.get("value") ?? "").trim()),
    duration: String(formData.get("duration") ?? "once"),
    months: parseInt(String(formData.get("months") ?? ""), 10),
    name: String(formData.get("note") ?? ""),
  });
  if ("error" in built) return { error: built.error };
  const couponParams = built.params;

  // ---- Promotion code (zákaznícky kód) ----
  const promoParams: Record<string, unknown> = {};
  if (rawCode) {
    if (!CODE_RE.test(rawCode)) {
      return { error: "Code must be 3–40 letters/numbers (A–Z, 0–9)." };
    }
    promoParams.code = rawCode;
  }
  if (rawMax) {
    const max = parseInt(rawMax, 10);
    if (!(max >= 1)) return { error: "Max redemptions must be at least 1." };
    promoParams.max_redemptions = max;
  }
  if (rawExpires) {
    const d = new Date(rawExpires);
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      return { error: "Expiry must be a future date." };
    }
    promoParams.expires_at = Math.floor(d.getTime() / 1000);
  }

  try {
    const coupon = await stripe.coupons.create(couponParams);
    await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      ...promoParams,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe rejected the discount.";
    return { error: msg };
  }

  revalidatePath("/admin/discounts");
  return { ok: true };
}

/** Deaktivuje promo kód — nové uplatnenia sa zastavia (existujúce zľavy bežia ďalej). */
export async function deactivatePromoCode(id: string): Promise<DiscountState> {
  const { ok } = await requireAdmin();
  if (!ok) return { error: "Not allowed." };
  if (!stripe) return { error: "Billing isn't configured." };
  try {
    await stripe.promotionCodes.update(id, { active: false });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't deactivate." };
  }
  revalidatePath("/admin/discounts");
  return { ok: true };
}
