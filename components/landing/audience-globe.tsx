"use client";

// COBE rendering and pin projection adapted from the supplied TestimonialGlobe.
// Used as an audience illustration; locations are examples, not customer data.
import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useInView, useReducedMotion } from "motion/react";
const PLACES = [{lat:48.15,lng:17.1,image:1},{lat:40.71,lng:-74,image:0},{lat:35.68,lng:139.69,image:2},{lat:-33.87,lng:151.21,image:3},{lat:-23.55,lng:-46.63,image:1}];
function project(lat:number,lng:number,phi:number){
 const la=lat*Math.PI/180,lo=lng*Math.PI/180-Math.PI;
 const x=-Math.cos(la)*Math.cos(lo),y=Math.sin(la),z=Math.cos(la)*Math.sin(lo);
 const cp=Math.cos(phi),sp=Math.sin(phi),ct=Math.cos(.3),st=Math.sin(.3);
 return {x:((cp*x+sp*z)*.84+1)/2,y:(1-(sp*st*x+ct*y-cp*st*z)*.84)/2,depth:-sp*ct*x+st*y+cp*ct*z};
}
export function AudienceGlobe(){
 const host=useRef<HTMLDivElement>(null),pins=useRef<(HTMLDivElement|null)[]>([]);
 const visible=useInView(host,{amount:.1}); const reduced=useReducedMotion();
 const activity=useRef({visible,reduced});activity.current={visible,reduced};
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const root=host.current;if(!root)return;
  const canvas=document.createElement("canvas");canvas.style.cssText="width:100%;height:100%;display:block";root.appendChild(canvas);
  let size=root.clientWidth,phi=4.5,frame=0,last=0;
  let globe:ReturnType<typeof createGlobe> | undefined;
  try{
   globe=createGlobe(canvas,{width:size,height:size,devicePixelRatio:Math.min(devicePixelRatio,2),phi,theta:.3,dark:0,diffuse:1.2,mapSamples:16000,mapBrightness:5,baseColor:[.87,.88,1],markerColor:[.93,.28,.6],glowColor:[.98,.96,.95],markers:PLACES.map(p=>({location:[p.lat,p.lng],size:.05})),markerElevation:.04});
   setReady(Boolean(canvas.getContext("webgl2")||canvas.getContext("webgl")));
  }catch{setReady(false);}
  function draw(now:number){
   const dt=last?Math.min((now-last)/1000,.05):0;last=now;
   if(activity.current.visible&&!document.hidden){
    if(!activity.current.reduced)phi+=dt*.13;
    globe?.update({phi,width:size,height:size});
    PLACES.forEach((p,i)=>{const el=pins.current[i];if(!el)return;const point=project(p.lat,p.lng,phi);el.style.opacity=String(Math.max(0,Math.min(1,point.depth*5)));el.style.transform=`translate(${point.x*size}px,${point.y*size}px) translate(-50%,-50%) scale(${.7+Math.max(0,point.depth)*.3})`;});
   }
   frame=requestAnimationFrame(draw);
  }
  const observer=new ResizeObserver(()=>{size=root.clientWidth;});observer.observe(root);frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();globe?.destroy();root.replaceChildren();};
 },[]);
 return <div className="audience-globe" role="img" aria-label="Illustration of an audience connecting around the world"><div className={`audience-globe-fallback ${ready?'is-ready':''}`} aria-hidden="true">◎</div><div ref={host} className="audience-globe-canvas"/>{PLACES.map((p,i)=><div key={i} ref={el=>{pins.current[i]=el;}} className="audience-globe-pin" aria-hidden="true" style={{display:ready?undefined:"none"}}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/landing/creator-${p.image}.png`} alt="" width={50} height={60}/></div>)}<span className="audience-globe-label">Your audience, everywhere.</span></div>;
}
