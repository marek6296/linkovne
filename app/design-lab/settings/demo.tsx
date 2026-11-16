"use client";
import { useState } from "react";
import { DesignPanel, type DesignTab } from "@/components/editor/design-panel";
import { designCaps } from "@/lib/design-tiers";
import { PLANS } from "@/lib/plans";
import type { Design } from "@/lib/design";
export default function Demo() {
  const [design, setDesign] = useState<Design>({});
  const [tab, setTab] = useState<DesignTab>("bg");
  return <main className="dashboard-studio min-h-screen p-6"><div className="mx-auto max-w-2xl">
    <p className="mb-4 text-sm">Local settings preview — no profile data is saved.</p>
    <DesignPanel design={design} caps={designCaps(PLANS.pro)} userId="" themes={[]} activeTheme="classic"
      onPickTheme={()=>{}} onChange={patch=>setDesign(d=>({...d,...patch}))} onReset={()=>setDesign({})}
      onUpsell={()=>{}} tab={tab} onTabChange={setTab} linkBlocks={[]} buttonTarget="all"
      onButtonTargetChange={()=>{}} onLinkChange={()=>{}} onAllButtonAnimation={btnAnimation=>setDesign(d=>({...d,btnAnimation}))}/>
  </div></main>;
}
