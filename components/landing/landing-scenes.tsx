"use client";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";

function Scene({ children, name, className = "" }: { children: ReactNode; name: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} className={`ls-scene ${className}`} aria-label={name} onPointerMove={event => {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    ref.current?.style.setProperty("--rx", `${-(event.clientY-bounds.top-bounds.height/2)/bounds.height*12}deg`);
    ref.current?.style.setProperty("--ry", `${(event.clientX-bounds.left-bounds.width/2)/bounds.width*18}deg`);
  }} onPointerLeave={() => {ref.current?.style.setProperty("--rx","0deg");ref.current?.style.setProperty("--ry","0deg");}}><div className="ls-world">{children}</div></div>;
}
const creators = [
  {name:"Emma Reed",role:"Style & travel",photo:0,cover:"coquette-velvet",color:"#f2b6d5",link:"The weekly edit"},
  {name:"Leo Martin",role:"Music & sound",photo:5,cover:"vinyl-sunset",color:"#ffbd86",link:"Listen to the new EP"},
  {name:"Ava Chen",role:"Art & illustration",photo:4,cover:"cobalt-glass",color:"#b9c8ff",link:"Explore my work"},
];
export function CreatorStage() {
 const [selected,setSelected]=useState(0);
 const person=creators[selected];
 return <Scene name="Explore example creator profiles" className="ls-creators">
   <div className="ls-pedestal" aria-hidden />
   <div className="ls-portrait-card" key={person.name} style={{"--creator-color":person.color} as CSSProperties}>
     <div className="ls-cover" style={{backgroundImage:`url(/templates/${person.cover}.webp)`}} />
     {/* Local fictional creator portraits. */}
     {/* eslint-disable-next-line @next/next/no-img-element */}
     <img className="ls-person" src={`/demo-portraits/person-${person.photo}.jpg`} alt="" width={180} height={220}/>
     <div className="ls-person-copy"><h3>{person.name}</h3><p>{person.role}</p></div>
     <div className="ls-profile-action">{person.link}<span>↗</span></div>
     <div className="ls-profile-action secondary">Get in touch <span>↗</span></div>
   </div>
   <div className="ls-vinyl" aria-hidden><div/><span/></div>
   <div className="ls-photo-print" aria-hidden><div style={{backgroundImage:"url(/templates/amalfi-summer.webp)"}}/><span>summer, saved.</span></div>
   <div className="ls-play-key" aria-hidden>▶</div>
   <div className="ls-glass-tile" aria-hidden>↗</div>
   <div className="ls-creators-picker" aria-label="Example creators">{creators.map((creator,i)=><button key={creator.name} aria-label={`Show ${creator.name}`} aria-pressed={selected===i} onClick={()=>setSelected(i)} style={{"--creator-color":creator.color} as CSSProperties}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/demo-portraits/person-${creator.photo}.jpg`} alt="" width={44} height={44}/><span>{creator.name.split(" ")[0]}</span></button>)}</div>
 </Scene>;
}
export function ContentStudio(){
 const [layout,setLayout]=useState(false);
 return <Scene name="Interactive content composition" className={`ls-studio ${layout?'ls-arranged':''}`}>
  <div className="ls-studio-base" aria-hidden />
  <div className="ls-studio-title"><span>AVA’S STUDIO</span><h3>A little<br/>colour.</h3></div>
  <div className="ls-art-tile" style={{backgroundImage:"url(/templates/cobalt-glass.webp)"}}><span>Selected work ↗</span></div>
  <div className="ls-note-tile"><span>✳</span><strong>Made<br/>of ideas.</strong></div>
  <div className="ls-video-tile" style={{backgroundImage:"url(/templates/amalfi-summer.webp)"}}><span>▶</span><strong>A week in the studio</strong></div>
  <div className="ls-audio-tile"><span className="ls-audio-disc"/><div><strong>On repeat</strong><div className="ls-wave" aria-hidden>{[20,35,14,40,28,16,32,44,20,30].map((h,i)=><i key={i} style={{height:h,animationDelay:`${i*-.17}s`}}/>)}</div></div></div>
  <button className="ls-arrange" onClick={()=>setLayout(!layout)} aria-pressed={layout}>{layout?'Spread it out':'Bring it together'} <span aria-hidden>↗</span></button>
 </Scene>;
}
