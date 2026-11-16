"use client";
import { useState } from "react";
import { CoverPhotoPicker } from "@/components/editor/cover-photo-picker";
import { PremiumProfileControls } from "@/components/editor/premium-profile-controls";
import { SocialsEditor } from "@/components/editor/block-card";
import { Preview } from "@/components/editor/preview";
import { ProfileHeader, BlockList } from "@/components/blocks/render";
import { ProfileTopControls } from "@/components/profile/profile-top-controls";
import { ProfileShell } from "@/components/profile/profile-shell";
import { resolveTheme, PROFILE_LAYOUTS, type Design } from "@/lib/design";
import { designForPlan } from "@/lib/design-tiers";
import { PLANS } from "@/lib/plans";
import { SOCIAL_PLATFORMS, type Block, type BlockConfig } from "@/lib/blocks";
import { TEMPLATES } from "@/lib/templates";
const presets = TEMPLATES.filter(
  (t) => t.tagline === "Design Lab · editable composition",
);
export default function Studio() {
  const [design, setDesign] = useState<Design>(presets[0].design),
    [name, setName] = useState("Sofia Lane"),
    [free, setFree] = useState(false),
    [publicView, setPublicView] = useState(false);
  const [social, setSocial] = useState<BlockConfig>({
    socialPresentation: "dock",
    socialStyle: "brand",
    items: SOCIAL_PLATFORMS.map((platform) => ({
      platform,
      url:
        platform === "email"
          ? "hello@example.com"
          : platform === "phone"
            ? "+421900000000"
            : "https://example.com",
      label: platform === "custom" ? "My community" : undefined,
      icon: "heart",
    })),
  });
  const theme = resolveTheme(
    "classic",
    designForPlan(design, free ? PLANS.free : PLANS.pro),
  );
  const blocks = [
    {
      id: "demo-work",
      type: "link",
      config: { title: "Explore my work", url: "https://example.com" },
    },
    {
      id: "demo-contact",
      type: "link",
      config: { title: "Get in touch", url: "https://example.com" },
    },
    { id: "demo-socials", type: "socials", config: social },
  ].map((b, i) => ({
    ...b,
    profile_id: "demo",
    position: i,
    is_active: true,
  })) as Block[];
  return (
    <main className="mx-auto max-w-6xl p-5 md:p-10">
      <a href="/design-lab" className="text-sm underline">
        ← Design Lab
      </a>
      <h1 className="mt-6 text-3xl font-semibold">Premium profile studio</h1>
      <p className="mt-2 text-sm text-soft">
        Lokálna ukážka skutočných ovládačov. Zmeny sa neukladajú do žiadneho
        profilu.
      </p>
      <div className="mt-7 grid gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <label className="block text-sm">
            Starting look
            <select
              className="field mt-2 w-full"
              defaultValue={presets[0].key}
              onChange={(e) =>
                setDesign(presets.find((t) => t.key === e.target.value)!.design)
              }
            >
              {presets.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Profile name
            <input
              className="field mt-2 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Composition
            <select
              className="field mt-2 w-full"
              value={design.profileLayout ?? "centered"}
              onChange={(e) =>
                setDesign((d) => ({
                  ...d,
                  profileLayout: e.target.value as Design["profileLayout"],
                }))
              }
            >
              {Object.entries(PROFILE_LAYOUTS).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={free}
              onChange={(e) => setFree(e.target.checked)}
            />
            Simulate Free plan
          </label>
          {design.profileLayout === "cover" && <CoverPhotoPicker value={design.coverImage} userId="" allowed={!free} onChange={coverImage => setDesign(d => ({...d, coverImage}))} onUpsell={() => {}} />}
          <PremiumProfileControls
            design={design}
            allowed={!free}
            userId=""
            onChange={(patch) => setDesign((d) => ({ ...d, ...patch }))}
            onUpsell={() => {}}
          />
          <details className="rounded-2xl border border-line p-4">
            <summary className="cursor-pointer font-medium">
              Social links
            </summary>
            <div className="mt-5">
              <SocialsEditor
                premium={!free}
                config={social}
                onPatch={(patch) => setSocial((s) => ({ ...s, ...patch }))}
              />
            </div>
          </details>
        </div>
        <div>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={publicView}
              onChange={(e) => setPublicView(e.target.checked)}
            />
            Public page view (desktop rail)
          </label>
          {publicView ? (
            <div className="profile-stage">
              <ProfileShell theme={theme} showBranding={false}><ProfileTopControls theme={theme} showPromo={false} />
                <div className="profile-content">
                  <ProfileHeader
                    displayName={name}
                    username="sofia"
                    bio="Photographer & visual storyteller."
                    avatarUrl="/landing/hero-sofia.webp"
                    theme={theme}
                  />
                  <div className="profile-links">
                    <BlockList
                      blocks={blocks}
                      profileId="demo"
                      theme={theme}
                      premium={!free}
                    />
                  </div>
                </div>
              </ProfileShell>
            </div>
          ) : (
            <Preview
              displayName={name}
              username="sofia"
              bio="Photographer & visual storyteller."
              avatarUrl="/landing/hero-sofia.webp"
              blocks={blocks}
              theme={theme}
              profileId="demo"
              premium={!free}
              showBranding
            />
          )}
        </div>
      </div>
    </main>
  );
}
