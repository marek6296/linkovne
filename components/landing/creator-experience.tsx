"use client";

// Adapted from the supplied ProfileCard, Team and TestimonialCarousel references.
// Demo content describes use cases, not customer testimonials or real statistics.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";

const FEATURES = [
 {image:"/landing/feature-profile.webp",title:"Your profile.\nYour style.",text:"Choose your colours, photos and layout. Bring your links and content together on a page that feels like you.",alt:"Sculptural profile page with colourful link blocks and design swatches",cta:"Create your profile"},
 {image:"/landing/feature-privacy.webp",title:"Your links.\nMore privacy.",text:"Keep sensitive destinations behind a Link Shield confirmation screen. Add an optional 18+ check and choose how visitors open your links.",alt:"A cobalt link passing through an ivory arch with a privacy screen and shield",cta:"Build your page"},
 {image:"/landing/feature-social.webp",title:"Every channel.\nConnected.",text:"Add your social accounts to one profile. Help people find your videos, posts and latest updates from a single link.",alt:"Camera, music and video tiles connected to one central profile",cta:"Bring it together"},
];
export function FeatureSpotlight() {
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const ref=useRef<HTMLElement>(null);
 const visible=useInView(ref,{amount:.35});
 const reduced=useReducedMotion();
 useEffect(()=>{
  if(!visible || reduced || paused) return;
  const timer=setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%FEATURES.length);},8000);
  return()=>clearInterval(timer);
 },[visible,reduced,paused]);
 const feature=FEATURES[index];
 return <section ref={ref} id="features" className="creator-spotlight" aria-label="Linkovne features"
  onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
  onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setPaused(false);}}>
  <div className="spotlight-layout landing-width">
   <div className="spotlight-photo">
    {FEATURES.map((item,i)=><div key={item.image} className={`spotlight-photo-layer${i===index?" is-active":""}`} aria-hidden={i!==index}>
     <Image src={item.image} alt={item.alt} fill sizes="(max-width:760px) 90vw, 620px" className="spotlight-image" />
    </div>)}
   </div>
   <div className="spotlight-copy">
    <AnimatePresence initial={false} mode="wait"><motion.div key={index} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:reduced?0:.3}}><h2>{feature.title}</h2><p>{feature.text}</p></motion.div></AnimatePresence>
    <Link href="/register" className="landing-button landing-button-blue">{feature.cta}</Link>
    <div className="spotlight-progress" aria-hidden="true">{FEATURES.map((_,i)=><span key={i} className={i===index?"active":""}/>)}</div>
   </div>
  </div>
 </section>;
}
const TYPES=[{name:"Creators",image:1},{name:"Designers",image:2},{name:"Freelancers",image:0},{name:"Agencies",image:3}];
export function CreatorGallery(){
 const reduced=useReducedMotion();
 return <section className="creator-gallery landing-width"><h2>Different people.<br/>Endless possibilities.</h2><div className="creator-gallery-grid">{TYPES.map((item,index)=><motion.div className="creator-gallery-person" key={item.name} initial={reduced?false:{opacity:0,y:35}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} transition={{duration:.65,delay:index*.1,ease:[.21,.47,.32,.98]}}><div className="creator-gallery-image"><Image src={`/landing/creator-${item.image}.png`} alt={`Illustrative ${item.name.toLowerCase()} portrait`} width={270} height={336} sizes="(max-width:600px) 40vw, 250px" /></div><h3>{item.name}</h3></motion.div>)}</div></section>;
}
