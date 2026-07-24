import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveTheme, type Design } from "@/lib/design";
import { designForPlan } from "@/lib/design-tiers";
import { planOf } from "@/lib/plans";
import { isVisibleNow, type Block } from "@/lib/blocks";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

type Snapshot = {
  bio: string | null;
  theme: string | null;
  design: Design | null;
  blocks: Block[];
};

/**
 * Stealth (Creator mode) obsah — bio + bloky + tema. V SSR HTML profilu NIE JE
 * nič z tohto (crawler ho v zdrojaku nenajde); reálny návštevník si to po
 * načítaní stránky doťiahne odtiaľto a vykreslí client-side. Endpoint servuje
 * IBA profily so zapnutým creator_mode.
 */
export async function GET(request: NextRequest) {
  const u = (request.nextUrl.searchParams.get("u") ?? "").toLowerCase();
  if (!USERNAME_RE.test(u)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = createPublicClient();
  const { data } = await supabase.rpc("public_profile", { p_username: u });
  const row = (Array.isArray(data) ? data[0] : null) as
    | { snapshot: Snapshot | null; creator_mode: boolean; plan: string }
    | null;

  const plan = planOf(row?.plan);
  if (!row || !row.snapshot || !(row.creator_mode && plan.creatorMode)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const snap = row.snapshot;
  const theme = resolveTheme(snap.theme, designForPlan(snap.design, plan));
  const blocks = (snap.blocks ?? []).filter(isVisibleNow);

  return NextResponse.json(
    { bio: snap.bio ?? null, blocks, theme },
    { headers: { "Cache-Control": "no-store" } },
  );
}
