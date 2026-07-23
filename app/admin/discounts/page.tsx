import { stripe } from "@/lib/stripe";
import { DiscountForm } from "@/components/admin/discount-form";
import { DeactivateCodeButton } from "@/components/admin/discount-form";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  active: boolean;
  discount: string;
  duration: string;
  uses: string;
  expires: string | null;
};

function couponSummary(c: {
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: string;
  duration_in_months: number | null;
}): { discount: string; duration: string } {
  const discount =
    c.percent_off != null
      ? c.percent_off === 100
        ? "Free (100% off)"
        : `${c.percent_off}% off`
      : c.amount_off != null
        ? `${(c.amount_off / 100).toFixed(2)} ${(c.currency ?? "eur").toUpperCase()} off`
        : "—";
  const duration =
    c.duration === "forever"
      ? "Forever"
      : c.duration === "repeating"
        ? `${c.duration_in_months} months`
        : "Once";
  return { discount, duration };
}

async function loadCodes(): Promise<Row[]> {
  if (!stripe) return [];
  const list = await stripe.promotionCodes.list({
    limit: 100,
    expand: ["data.promotion.coupon"],
  });
  return list.data.map((pc) => {
    const coupon = pc.promotion.coupon as unknown as {
      percent_off: number | null;
      amount_off: number | null;
      currency: string | null;
      duration: string;
      duration_in_months: number | null;
    };
    const { discount, duration } = couponSummary(coupon);
    return {
      id: pc.id,
      code: pc.code,
      active: pc.active,
      discount,
      duration,
      uses: pc.max_redemptions
        ? `${pc.times_redeemed}/${pc.max_redemptions}`
        : `${pc.times_redeemed}`,
      expires: pc.expires_at
        ? new Date(pc.expires_at * 1000).toLocaleDateString()
        : null,
    };
  });
}

export default async function DiscountsPage() {
  if (!stripe) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h1 className="text-lg font-semibold">Discounts</h1>
        <p className="mt-2 text-sm text-soft">
          Billing isn&apos;t configured yet — add <code>STRIPE_SECRET_KEY</code>{" "}
          to enable discount codes.
        </p>
      </div>
    );
  }

  const codes = await loadCodes();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-grotesk text-2xl font-bold tracking-tight">
          Discounts &amp; promo codes
        </h1>
        <p className="mt-1 text-sm text-soft">
          Created here, they live in Stripe and apply to real subscriptions.
          Customers enter the code at checkout, or use a promo link.
        </p>
      </div>

      <DiscountForm />

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-3.5">
          <p className="text-sm font-semibold">Active &amp; past codes</p>
        </div>
        {codes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-soft">
            No promo codes yet — create your first one above.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {codes.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5"
              >
                <code className="rounded-lg bg-ink/[0.06] px-2.5 py-1 text-sm font-bold tracking-wide">
                  {r.code}
                </code>
                <span className="text-sm font-medium">{r.discount}</span>
                <span className="text-xs text-soft">{r.duration}</span>
                <span className="text-xs text-soft">Used {r.uses}</span>
                {r.expires && (
                  <span className="text-xs text-soft">
                    Expires {r.expires}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.active
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-black/[0.06] text-soft"
                    }`}
                  >
                    {r.active ? "Active" : "Off"}
                  </span>
                  {r.active && <DeactivateCodeButton id={r.id} code={r.code} />}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
