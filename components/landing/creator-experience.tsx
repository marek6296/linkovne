"use client";

// Adapted from the supplied ProfileCard, Team and TestimonialCarousel references.
// Demo content describes use cases, not customer testimonials or real statistics.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";

export function CreatorPortrait() {
  const reduced = useReducedMotion();
  return <motion.div className="creator-portrait-scene" initial={false}>
    <div className="creator-outline" aria-hidden="true" />
    <motion.article className="creator-cover-card" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{type:"spring",stiffness:100,damping:22}} whileHover={reduced ? undefined : {y:-7,scale:1.015}} aria-label="Example Linkovne page for Sofia Lane">
      <div className="creator-cover-image"><Image src="/sofia-lane.png" alt="Example creator Sofia Lane" fill sizes="(max-width:760px) 85vw, 440px" priority className="creator-cover-photo" /></div>
      <div className="creator-cover-shade" />
      <motion.div className="creator-cover-content" initial={reduced ? false : {opacity:0,y:20,filter:"blur(5px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} transition={{delay:.25,type:"spring",stiffness:100,damping:20}}>
        <h3>Sofia Lane</h3><p>Style, travel & everything in between.</p>
        <div className="creator-example-links"><span>The summer edit <b>↗</b></span><span>Travel journal <b>↗</b></span><span>Work with me <b>↗</b></span></div>
      </motion.div>
    </motion.article>
    <div className="creator-side-word" aria-hidden="true">your space.</div>
  </motion.div>;
}

const STORIES = [
  {image:"/landing/story-2.jpg",title:"Make it your own.",text:"Your colours, your photos, your links. Build a page that feels like you, right down to the details.",name:"Taylor",role:"Independent creator",href:"/register",cta:"Create your page"},
  {image:"/landing/story-0.jpg",title:"Bring your work together.",text:"Give your portfolio, latest projects and contact details one home. Share it everywhere you show up.",name:"Alex",role:"Design & photography",href:"/register",cta:"Build your portfolio"},
  {image:"/landing/story-1.jpg",title:"Room for every profile.",text:"Manage up to ten creator profiles from one account with Business. Keep each page’s content and style its own.",name:"Jordan",role:"Creator management",href:"#pricing",cta:"Explore the plans"},
];
export function CreatorSpotlight() {
 const [index,setIndex]=useState(0);
 const ref=useRef<HTMLElement>(null);
 const visible=useInView(ref,{amount:.35});
 const reduced=useReducedMotion();
 useEffect(()=>{
  if(!visible || reduced) return;
  const timer=setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%STORIES.length);},6500);
  return()=>clearInterval(timer);
 },[visible,reduced]);
 const story=STORIES[index];
 return <section ref={ref} id="features" className="creator-spotlight" aria-label="Ways to use Linkovne">
  <div className="spotlight-layout landing-width">
   <div className="spotlight-photo"><AnimatePresence initial={false} mode="sync"><motion.div key={story.image} className="spotlight-photo-layer" initial={{opacity:0,scale:1.04}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:reduced?0:.7}}><Image src={story.image} alt={`${story.name}, illustrative creator portrait`} fill sizes="(max-width:760px) 90vw, 620px" className="spotlight-image" /></motion.div></AnimatePresence><div className="spotlight-person"><strong>{story.name}</strong><span>{story.role}</span></div></div>
   <div className="spotlight-copy"><AnimatePresence initial={false} mode="wait"><motion.div key={index} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:reduced?0:.25}}><h2>{story.title}</h2><p>{story.text}</p></motion.div></AnimatePresence><Link href={story.href} className="landing-button landing-button-blue">{story.cta}<span aria-hidden>↗</span></Link><div className="spotlight-progress" aria-hidden="true">{STORIES.map((_,i)=><span key={i} className={i===index?"active":""}/>)}</div></div>
  </div>
 </section>;
}
const TYPES=[{name:"Creators",image:1},{name:"Designers",image:2},{name:"Freelancers",image:0},{name:"Agencies",image:3}];
export function CreatorGallery(){
 const reduced=useReducedMotion();
 return <section className="creator-gallery landing-width"><h2>Different people.<br/>Endless possibilities.</h2><div className="creator-gallery-grid">{TYPES.map((item,index)=><motion.div className="creator-gallery-person" key={item.name} initial={reduced?false:{opacity:0,y:35}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} transition={{duration:.65,delay:index*.1,ease:[.21,.47,.32,.98]}}><div className="creator-gallery-image"><Image src={`/landing/creator-${item.image}.png`} alt={`Illustrative ${item.name.toLowerCase()} portrait`} width={270} height={336} sizes="(max-width:600px) 40vw, 250px" /></div><h3>{item.name}</h3></motion.div>)}</div></section>;
}
