"use client";
import { useState } from "react";
import { DesignPanel, type DesignTab } from "@/components/editor/design-panel";
import { designCaps } from "@/lib/design-tiers";
import { PLANS } from "@/lib/plans";
import { resolveTheme, type Design } from "@/lib/design";
import { Preview } from "@/components/editor/preview";
export default function Demo() {
  const [design, setDesign] = useState<Design>({});
  const [tab, setTab] = useState<DesignTab>("layout");
  return <main className="dashboard-studio min-h-screen p-6"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_390px]">
    <p className="text-sm lg:col-span-2">Local settings preview — no profile data is saved.</p>
    <div><DesignPanel design={design} caps={designCaps(PLANS.pro)} userId="" themes={[]} activeTheme="classic"
      onPickTheme={()=>{}} onChange={patch=>setDesign(d=>({...d,...patch}))} onReset={()=>setDesign({})}
      onUpsell={()=>{}} tab={tab} onTabChange={setTab} linkBlocks={[]} buttonTarget="all"
      onButtonTargetChange={()=>{}} onLinkChange={()=>{}} onAllButtonAnimation={btnAnimation=>setDesign(d=>({...d,btnAnimation}))}/></div>
    <Preview profileId="demo" displayName="Alex Morgan" username="alex" bio="Design, photography & everyday ideas." avatarUrl="/templates/cobalt-glass.webp" theme={resolveTheme("classic",design)} blocks={[0,1,2].map(i=>({id:String(i),type:"link",position:i,is_active:true,config:{title:["Selected work","Latest stories","Get in touch"][i],url:"https://example.com"}}))} />
  </div></main>;
}
