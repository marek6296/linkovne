import * as THREE from "three";

const W = 720;
const H = 1120;
const themes = [
  { name: "Sofia Lane", kind: "photo", image: "/landing/hero-sofia.webp", colour: "#f6c9e0", ink: "#272238", title: ["Sofia", "Lane."], subtitle: "Photography & travel", links: ["The travel journal", "Work with me"], tile: "Summer, on film.", art: "/templates/amalfi-summer.webp" },
  { name: "Noah James", kind: "music", image: "/landing/hero-noah.webp", colour: "#3449df", ink: "#fffaf5", title: ["NOAH", "JAMES"], subtitle: "Sound for the slow days.", links: ["Listen to the new EP", "Shows & bookings"], tile: "After hours", art: "/templates/vinyl-sunset.webp" },
  { name: "Studio Forma", kind: "design", image: "/templates/cobalt-glass.webp", colour: "#ebe6f8", ink: "#25223c", title: ["studio", "forma"], subtitle: "Objects. Ideas. A different angle.", links: ["Selected work", "Let’s make something"], tile: "Form & light", art: "/templates/rose-crystal.webp" },
];

export async function createHeroWorld(host: HTMLDivElement, animate: boolean) {
  await document.fonts.ready;
  const images = new Map<string, HTMLImageElement>();
  await Promise.all([...new Set(themes.flatMap(t => [t.image, t.art]))].map(src => new Promise<void>((resolve, reject) => {
    const img = new Image(); img.onload = () => { images.set(src, img); resolve(); }; img.onerror = reject; img.src = src;
  })));
  const font = getComputedStyle(document.body).getPropertyValue("--font-bricolage").trim() || "sans-serif";
  const textures: THREE.Texture[] = [];
  function canvasTexture(draw: (c: CanvasRenderingContext2D) => void, w = W, h = H) {
    const canvas = document.createElement("canvas"); canvas.width = w * 2; canvas.height = h * 2;
    const context = canvas.getContext("2d")!;
    context.scale(2, 2); context.imageSmoothingQuality = "high";
    draw(context);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture); return texture;
  }
  function photo(c: CanvasRenderingContext2D, src: string, x: number, y: number, w: number, h: number) {
    const img = images.get(src)!; const s = Math.max(w / img.width, h / img.height);
    c.drawImage(img, x + (w-img.width*s)/2, y+(h-img.height*s)/2, img.width*s, img.height*s);
  }
  function round(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, colour: string) {
    c.fillStyle = colour; c.beginPath(); c.roundRect(x,y,w,h,r); c.fill();
  }
  const backs = canvasTexture(c => { c.fillStyle = "#fff8f0"; c.fillRect(0,0,W,H); c.fillStyle = "#3449df"; c.textAlign = "center"; c.font = `700 78px ${font}`; c.fillText("linkovne.", W/2,H/2); });
  const faces = themes.map(t => canvasTexture(c => {
    c.fillStyle = t.colour; c.fillRect(0,0,W,H);
    c.save(); c.beginPath(); c.rect(0,0,W,740); c.clip(); photo(c,t.image,0,0,W,740); c.restore();
    const gradient = c.createLinearGradient(0,480,0,650); gradient.addColorStop(0,"transparent"); gradient.addColorStop(1,t.colour);
    c.fillStyle = gradient; c.fillRect(0,480,W,260);
    c.fillStyle = t.ink; c.font = `${t.kind === "design" ? 500 : 800} ${t.kind === "music" ? 104 : 115}px ${font}`;
    c.fillText(t.title[0],48,630); c.fillText(t.title[1],48,734);
    c.font = `400 28px ${font}`; c.fillText(t.subtitle,50,791);
    t.links.forEach((link,i) => { round(c,42,844+i*101,636,80,24,i===0 ? "#fffaf5" : t.kind === "music" ? "#f4c7df" : "#272238"); c.fillStyle=i===0 || t.kind==="music" ? "#272238" : "#fffaf5"; c.font=`500 29px ${font}`; c.fillText(link,70,894+i*101); c.fillText("↗",620,894+i*101); });
  }));
  const tiles = themes.map(t => canvasTexture(c => {
    c.fillStyle = "#fffaf5"; c.fillRect(0,0,600,660); c.save(); c.beginPath(); c.roundRect(22,22,556,450,30); c.clip(); photo(c,t.art,22,22,556,450); c.restore();
    c.fillStyle = "#25223c"; c.font = `650 46px ${font}`; c.fillText(t.tile,32,539); c.font = `400 27px ${font}`; c.fillText(t.kind === "music" ? "The new EP  •  Listen now" : t.kind === "design" ? "View the collection  ↗" : "Explore the journal  ↗",32,597);
  },600,660));
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:"high-performance" });
  renderer.setPixelRatio(Math.min(3, Math.max(2, window.devicePixelRatio))); renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000,0); host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(33,1,.1,100); camera.position.set(0,.05,11.7);
  scene.add(new THREE.HemisphereLight(0xffffff,0xb894b7,3));
  const key=new THREE.DirectionalLight(0xffffff,4); key.position.set(-4,6,7); scene.add(key);
  const rim=new THREE.DirectionalLight(0x899aff,3); rim.position.set(5,1,-4); scene.add(rim);
  const rig=new THREE.Group(); scene.add(rig);
  const rotor=new THREE.Group(); rig.add(rotor);
  const geometries: THREE.BufferGeometry[]=[];
  const materials: THREE.Material[]=[];
  function material(colour:string,metalness=0,roughness=.4) { const m=new THREE.MeshStandardMaterial({color:colour,metalness,roughness}); materials.push(m); return m; }
  function flat(map:THREE.Texture) { const m=new THREE.MeshBasicMaterial({map}); materials.push(m); return m; }
  function roundedShape(w:number,h:number,r:number) {
    const s=new THREE.Shape(); const x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
  }
  function panel(w:number,h:number,depth:number,texture:THREE.Texture,back=backs) {
    const g=new THREE.Group(); const shape=roundedShape(w,h,.17);
    const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:16});geo.translate(0,0,-depth/2);geometries.push(geo);
    g.add(new THREE.Mesh(geo,material("#fff5ed",.15,.32)));
    const surface=new THREE.ShapeGeometry(shape,24); const p=surface.attributes.position;
    const uv=surface.attributes.uv; for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+w/2)/w,(p.getY(i)+h/2)/h);geometries.push(surface);
    const front=new THREE.Mesh(surface,flat(texture));front.position.z=depth/2+.027;g.add(front);
    const rear=new THREE.Mesh(surface,flat(back));rear.rotation.y=Math.PI;rear.position.z=-depth/2-.027;g.add(rear);
    return {group:g,front,rear};
  }
  const main=panel(2.75,4.35,.07,faces[0],faces[1]); main.group.position.set(0,.18,0);rotor.add(main.group);
  function createAccessories() {
  const accessory=new THREE.Group();
  const tile=panel(1.65,1.83,.06,tiles[0]);tile.group.position.set(-1.0,-1.55,.65);tile.group.rotation.z=.08;accessory.add(tile.group);
  const props=themes.map(()=>new THREE.Group());props.forEach(g=>accessory.add(g));
  function mesh(geo:THREE.BufferGeometry,mat:THREE.Material,parent:THREE.Group) { geometries.push(geo); const m=new THREE.Mesh(geo,mat);parent.add(m);return m; }
  // Camera body and layered lens are real geometry, so depth stays correct throughout a turn.
  const cam=props[0];cam.position.set(1.6,.92,.42);cam.rotation.set(.12,-.18,-.15);
  const body=panel(.98,.69,.35,canvasTexture(c=>{c.fillStyle="#353348";c.fillRect(0,0,200,140);c.fillStyle="#eee5dc";c.fillRect(12,10,36,15);},200,140));cam.add(body.group);
  for(let i=0;i<5;i++){const lens=mesh(new THREE.CylinderGeometry(.26-i*.022,.26-i*.022,.055,64),material(i===4?"#233aa0":"#292937",.65,.23),cam);lens.rotation.x=Math.PI/2;lens.position.z=.22+i*.05;}
  const glint=mesh(new THREE.SphereGeometry(.055,20,20),material("#a7c5ff",.5,.1),cam);glint.position.set(-.06,.07,.48);
  // A physically layered vinyl record with concentric grooves.
  const vinyl=props[1];vinyl.position.set(1.38,.82,.34);vinyl.rotation.set(.17,-.13,-.1);
  const disc=mesh(new THREE.CylinderGeometry(.72,.72,.065,96),material("#161622",.45,.28),vinyl);disc.rotation.x=Math.PI/2;
  for(let r=.31;r<.70;r+=.035){const groove=mesh(new THREE.TorusGeometry(r,.0035,5,96),material("#454151",.4,.45),vinyl);groove.position.z=.036;}
  const label=mesh(new THREE.CylinderGeometry(.26,.26,.008,64),material("#ef91c5"),vinyl);label.rotation.x=Math.PI/2;label.position.z=.041;
  const hole=mesh(new THREE.CylinderGeometry(.039,.039,.012,32),material("#181626"),vinyl);hole.rotation.x=Math.PI/2;hole.position.z=.048;
  // Sculptural chrome knot for the designer theme.
  const knot=mesh(new THREE.TorusKnotGeometry(.46,.13,120,18),material("#b5baff",.88,.19),props[2]);props[2].position.set(1.45,.9,.38);props[2].rotation.set(.2,-.35,.15);
  const socials=new THREE.Group();socials.position.set(1.83,-.87,.15);accessory.add(socials);
  ["◎","♪","▶"].forEach((symbol,i)=>{const t=canvasTexture(c=>{c.fillStyle="#3449df";c.fillRect(0,0,160,160);c.fillStyle="#fffaf5";c.textAlign="center";c.textBaseline="middle";c.font="bold 90px sans-serif";c.fillText(symbol,80,82);},160,160);const p=panel(.43,.43,.05,t,t);p.group.position.y=-i*.56;socials.add(p.group);});
    return {group:accessory, tile, props, vinyl, knot};
  }
  const sides=[createAccessories(),createAccessories()];
  sides[1].group.rotation.y=Math.PI;
  sides.forEach(side=>rotor.add(side.group));
  let elapsed=0; let last=performance.now(); let frame=0; let visible=true; let disposed=false; let pointerX=0,pointerY=0; let preparedCycle=-1;
  const dwell=4.4,turn=1.8,period=dwell+turn;
  function prepare(cycle:number) {
    // Only prepare the hidden face. The visible face already contains the incoming profile.
    const current=cycle%2, next=1-current;
    const theme=cycle%themes.length, nextTheme=(theme+1)%themes.length;
    const faceMeshes=[main.front,main.rear];
    if(cycle===0) {
      (faceMeshes[current].material as THREE.MeshBasicMaterial).map=faces[theme];
      (sides[current].tile.front.material as THREE.MeshBasicMaterial).map=tiles[theme];
      sides[current].props.forEach((p,n)=>p.visible=n===theme);
    }
    (faceMeshes[next].material as THREE.MeshBasicMaterial).map=faces[nextTheme];
    (sides[next].tile.front.material as THREE.MeshBasicMaterial).map=tiles[nextTheme];
    sides[next].props.forEach((p,n)=>p.visible=n===nextTheme);
    preparedCycle=cycle;
  }
  prepare(0);
  textures.forEach(t=>t.anisotropy=renderer.capabilities.getMaxAnisotropy());
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=camera.aspect<.82?11.7:10.7;camera.updateProjectionMatrix();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{threshold:.05});intersection.observe(host);
  const move=(e:PointerEvent)=>{const r=host.getBoundingClientRect();if(!animate)return;pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;};
  const leave=()=>{pointerX=0;pointerY=0;};host.addEventListener("pointermove",move);host.addEventListener("pointerleave",leave);
  const ease=(x:number)=>x*x*x*(x*(x*6-15)+10);
  function render(now:number){if(disposed)return;frame=requestAnimationFrame(render);const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;if(!visible||document.hidden)return;
    if(animate)elapsed+=dt;
    const cycle=Math.floor(elapsed/period),phase=elapsed%period;
    if(cycle!==preparedCycle)prepare(cycle);
    const progress=Math.max(0,(phase-dwell)/turn);
    // A real half-turn: the following profile is already on the reverse face.
    const angle=(cycle%2)*Math.PI+ease(progress)*Math.PI;
    const rotation=-.26+angle;
    sides.forEach((side,i)=>{
      const facing=Math.cos(rotation+i*Math.PI);
      side.group.visible=facing>0;
      side.group.scale.setScalar(Math.max(.001,facing));
    });
    host.dataset.scene=themes[(cycle+(Math.cos(rotation)*(cycle%2===0?1:-1)<0?1:0))%themes.length].name;
    rotor.rotation.set(-.035, rotation, -.025);
    rig.rotation.y+=(pointerX*.13-rig.rotation.y)*.045;rig.rotation.x+=(-pointerY*.07-rig.rotation.x)*.045;
    rig.position.y=animate?Math.sin(elapsed*.7)*.035:0;
    if(animate)sides.forEach(({vinyl,knot})=>{vinyl.rotation.z=-elapsed*.16;knot.rotation.y=elapsed*.18;});
    renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(render);
  return ()=>{disposed=true;cancelAnimationFrame(frame);resizeObserver.disconnect();intersection.disconnect();host.removeEventListener("pointermove",move);host.removeEventListener("pointerleave",leave);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
}
