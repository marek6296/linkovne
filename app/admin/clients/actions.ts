"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { buildCouponParams } from "@/lib/discounts";

export type UserDiscountState = { error?: string; ok?: boolean } | undefined;

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin === true;
}

/** Nájde aktívne (živé) predplatné zákazníka — na priradenie/odobranie zľavy. */
async function activeSubscriptionId(customerId: string): Promise<string | null> {
  if (!stripe) return null;
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const live = subs.data.find((s) =>
    ["active", "trialing", "past_due"].includes(s.status),
  );
  return live?.id ?? null;
}

/**
 * Dá konkrétnemu zákazníkovi zľavu na jeho bežiace predplatné — „kamarát fixná
 * cena". Vytvorí coupon a priradí ho na subscription (premietne sa do ďalších
 * faktúr). Ak zákazník nemá živé predplatné, treba mu radšej dať promo kód.
 */
export async function giveUserDiscount(
  customerId: string,
  formData: FormData,
): Promise<UserDiscountState> {
  if (!(await requireAdmin())) return { error: "Not allowed." };
  if (!stripe) return { error: "Billing isn't configured." };
  if (!customerId) {
    return { error: "This customer has no Stripe record yet." };
  }

  const built = buildCouponParams({
    kind: String(formData.get("kind") ?? "percent"),
    value: Number(String(formData.get("value") ?? "").trim()),
    duration: String(formData.get("duration") ?? "forever"),
    months: parseInt(String(formData.get("months") ?? ""), 10),
    name: String(formData.get("note") ?? "Manual discount"),
  });
  if ("error" in built) return { error: built.error };

  const subId = await activeSubscriptionId(customerId);
  if (!subId) {
    return {
      error:
        "No active subscription — create a promo code for this customer instead.",
    };
  }

  try {
    const coupon = await stripe.coupons.create(built.params);
    await stripe.subscriptions.update(subId, {
      discounts: [{ coupon: coupon.id }],
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Stripe rejected it." };
  }

  revalidatePath(`/admin/clients`);
  return { ok: true };
}

/** Odoberie zľavu z bežiaceho predplatného zákazníka. */
export async function removeUserDiscount(
  customerId: string,
): Promise<UserDiscountState> {
  if (!(await requireAdmin())) return { error: "Not allowed." };
  if (!stripe) return { error: "Billing isn't configured." };

  const subId = await activeSubscriptionId(customerId);
  if (!subId) return { error: "No active subscription." };

  try {
    await stripe.subscriptions.update(subId, { discounts: [] });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't remove it." };
  }

  revalidatePath(`/admin/clients`);
  return { ok: true };
}
