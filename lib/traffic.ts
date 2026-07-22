import { channelLabel } from "@/lib/channels";

/**
 * Klasifikacia navstevy do platformy — funguje AJ bez trackovanych linkov.
 * Ak je znamy tracked `source` (?s=instagram), ma prednost; inak sa platforma
 * odhadne z hostname referrera. Cielom je, aby „odkial fanusikovia chodia"
 * fungovalo automaticky pre kazdeho, nielen ked si niekto poctivo lepi ?s=.
 */

const HOST_RULES: [RegExp, string][] = [
  [/(^|\.)instagram\.com$|(^|\.)l\.instagram\.com$|(^|\.)ig\.me$/i, "instagram"],
  [/(^|\.)tiktok\.com$|musical\.ly|musically|zhiliao/i, "tiktok"],
  [/(^|\.)(x|twitter)\.com$|(^|\.)t\.co$/i, "x"],
  [/(^|\.)reddit\.com$|(^|\.)redd\.it$|out\.reddit\.com$/i, "reddit"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, "youtube"],
  [/(^|\.)threads\.(net|com)$/i, "threads"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.(com|me)$|(^|\.)l\.facebook\.com$/i, "facebook"],
  [/(^|\.)snapchat\.com$/i, "snapchat"],
  [/(^|\.)t\.me$|(^|\.)telegram\.(org|me)$/i, "telegram"],
  [/(^|\.)onlyfans\.com$|(^|\.)fanvue\.com$/i, "creatorsite"],
  [/(^|\.)google\.[a-z.]+$/i, "google"],
  [/(^|\.)bing\.com$|(^|\.)duckduckgo\.com$/i, "search"],
  [/linktr\.ee|allmylinks|beacons\.ai|hoo\.be|snipfeed|carrd\.co/i, "linkinbio"],
];

const LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X / Twitter",
  reddit: "Reddit",
  youtube: "YouTube",
  threads: "Threads",
  facebook: "Facebook",
  snapchat: "Snapchat",
  telegram: "Telegram",
  creatorsite: "OnlyFans / Fanvue",
  google: "Google",
  search: "Search",
  linkinbio: "Other link-in-bio",
  other: "Other sites",
  direct: "Direct / in-app",
};

function classifyReferrer(referrer: string | null): string {
  if (!referrer) return "direct";
  for (const [re, key] of HOST_RULES) if (re.test(referrer)) return key;
  return "other";
}

/**
 * Jednotny nazov platformy pre jednu navstevu/klik. Tracked source vyhrava
 * (aj vlastne kampane), inak klasifikujeme referrer.
 */
export function trafficLabel(
  referrer: string | null | undefined,
  source: string | null | undefined,
): string {
  if (source) return channelLabel(source);
  return LABELS[classifyReferrer(referrer ?? null)] ?? "Other sites";
}

export type TrafficRow = {
  label: string;
  views: number;
  clicks: number;
  rate: number; // % klikov k navstevam
};

/** Zoskupi navstevy + kliky do platforiem a spocita mieru prekliku. */
export function buildTrafficRows(
  views: { referrer?: string | null; source?: string | null }[],
  clicks: { referrer?: string | null; source?: string | null }[],
): TrafficRow[] {
  const map = new Map<string, { views: number; clicks: number }>();
  const bump = (label: string, key: "views" | "clicks") => {
    const cur = map.get(label) ?? { views: 0, clicks: 0 };
    cur[key] += 1;
    map.set(label, cur);
  };
  for (const v of views) bump(trafficLabel(v.referrer, v.source), "views");
  for (const c of clicks) bump(trafficLabel(c.referrer, c.source), "clicks");

  return [...map.entries()]
    .map(([label, v]) => ({
      label,
      views: v.views,
      clicks: v.clicks,
      rate: v.views > 0 ? Math.round((v.clicks / v.views) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views || b.clicks - a.clicks);
}

/**
 * Jednoveta rada v ludskej reci — „co s tym". Vracia null, kym nie je dost dat,
 * nech nerobime zaver z 3 navstev.
 */
export function trafficInsight(rows: TrafficRow[]): string | null {
  const totalViews = rows.reduce((n, r) => n + r.views, 0);
  if (totalViews < 8 || rows.length === 0) return null;

  const withViews = rows.filter((r) => r.views > 0);
  const biggest = withViews[0]; // uz zoradene podla views
  if (!biggest) return null;

  // Na porovnanie konverzie berieme len kanaly s dost navstevami (min. sum).
  const floor = Math.max(5, Math.round(totalViews * 0.1));
  const qualifying = withViews.filter((r) => r.views >= floor);
  const bestConv = [...qualifying].sort((a, b) => b.rate - a.rate)[0];

  // 1) Velky zdroj, ale nikto neklikne → problem s hookom/prvym linkom.
  if (biggest.views >= 8 && biggest.clicks === 0) {
    return `${biggest.label} sends the most visitors but none click through — try a stronger first link or hook.`;
  }

  // 2) Iny kanal konvertuje vyrazne lepsie ako najvacsi zdroj → tlac tam.
  if (
    bestConv &&
    biggest.rate > 0 &&
    bestConv.label !== biggest.label &&
    bestConv.rate >= biggest.rate * 1.5
  ) {
    const mult = Math.round((bestConv.rate / Math.max(1, biggest.rate)) * 10) / 10;
    return `${biggest.label} brings the most traffic, but ${bestConv.label} converts ${mult}× better — worth posting there more.`;
  }

  // 3) Inak len pochvalime najsilnejsi kanal.
  const champ = bestConv && bestConv.rate > 0 ? bestConv : biggest;
  return `${champ.label} is your strongest channel right now — lean into it.`;
}
