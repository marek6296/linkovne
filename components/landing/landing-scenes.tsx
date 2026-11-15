"use client";
import { useRef, type CSSProperties, type ReactNode } from "react";

function Scene({ children, name, className = "" }: { children: ReactNode; name: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref} className={`ls-scene ${className}`} aria-label={name} onPointerMove={event => {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    ref.current?.style.setProperty("--rx", `${-(event.clientY-bounds.top-bounds.height/2)/bounds.height*12}deg`);
    ref.current?.style.setProperty("--ry", `${(event.clientX-bounds.left-bounds.width/2)/bounds.width*18}deg`);
  }} onPointerLeave={() => {ref.current?.style.setProperty("--rx","0deg");ref.current?.style.setProperty("--ry","0deg");}}><div className="ls-world">{children}</div></div>;
}
export function CreatorStage() {
 const person = {name:"Emma Reed",role:"Style & travel",photo:0,cover:"coquette-velvet",color:"#f2b6d5",link:"The weekly edit"};
 return <Scene name="Example creator page" className="ls-creators">
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

 </Scene>;
}
export function ContentStudio() {
 return <Scene name="Example portfolio with an organised image gallery" className="ls-studio">
   <div className="studio-window">
     <div className="studio-toolbar" aria-hidden="true"><span/><span/><span/><div>ava.design</div><b>↗</b></div>
     <div className="studio-page">
       <header className="studio-heading"><div><h3>Ava Chen</h3><p>Art direction & digital design</p></div><span aria-hidden="true">✳</span></header>
       <div className="studio-gallery">
         <div className="studio-project studio-project-main"><div className="studio-image" style={{backgroundImage:"url(/templates/cobalt-glass.webp)"}}/><div className="studio-caption"><strong>Form & light</strong><span>01</span></div></div>
         <div className="studio-project"><div className="studio-image" style={{backgroundImage:"url(/templates/rose-crystal.webp)"}}/><div className="studio-caption"><strong>Soft shapes</strong><span>02</span></div></div>
         <div className="studio-project"><div className="studio-image" style={{backgroundImage:"url(/templates/paper-sculpture.webp)"}}/><div className="studio-caption"><strong>Paper studies</strong><span>03</span></div></div>
       </div>
       <div className="studio-contact"><span>Let’s work together</span><span aria-hidden="true">↗</span></div>
     </div>
   </div>
 </Scene>;
}
