gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- PRELOADER ---------- */
const loader = document.getElementById("loader");
gsap.to("#loaderFill",{width:"100%",duration:0.9,ease:"power2.inOut",onComplete:()=>{
  gsap.to(loader,{opacity:0,duration:0.5,onComplete:()=>loader.remove()});
  heroIntro();
}});

function heroIntro(){
  if(reduced) return;
  gsap.from(".hero h1 .line > span",{yPercent:110,duration:0.95,stagger:0.13,ease:"power3.out"});
  gsap.from(".hero .reveal",{opacity:0,y:30,duration:0.8,stagger:0.15,delay:0.45,ease:"power2.out"});
  gsap.to(".scroll-hint",{y:10,repeat:-1,yoyo:true,duration:0.8,ease:"sine.inOut"});
}

/* ---------- PALABRA ROTATIVA: letra por letra (anime.js) ---------- */
const words = ["automatice procesos","venda en línea","conecte sus sistemas","atienda mejor a sus clientes","crezca sin límites"];
let wi = 0;
const rot = document.getElementById("rotator");
function setWord(w){
  rot.innerHTML = w.split("").map(ch=>
    `<span class="rl">${ch===" "?"&nbsp;":ch}</span>`).join("");
}
setWord(words[0]);
if(!reduced){
  anime({targets:"#rotator .rl",translateY:[18,0],opacity:[0,1],
    delay:anime.stagger(24),duration:500,easing:"easeOutCubic"});
  setInterval(()=>{
    anime({targets:"#rotator .rl",translateY:[0,-18],opacity:[1,0],
      delay:anime.stagger(14),duration:280,easing:"easeInCubic",
      complete:()=>{
        wi=(wi+1)%words.length;
        setWord(words[wi]);
        anime({targets:"#rotator .rl",translateY:[18,0],opacity:[0,1],
          delay:anime.stagger(24),duration:480,easing:"easeOutCubic"});
      }});
  },3000);
}

/* ---------- CIRCUITO SVG: se dibuja solo (anime.js) ---------- */
function drawCircuit(){
  if(reduced) return;
  anime.remove(".circuit path, .circuit circle");
  anime({targets:".circuit path",strokeDashoffset:[anime.setDashoffset,0],
    delay:anime.stagger(160),duration:1400,easing:"easeInOutSine"});
  anime({targets:".circuit circle",scale:[0,1],opacity:[0,1],
    transformOrigin:"center",delay:anime.stagger(120,{start:600}),
    duration:600,easing:"easeOutElastic(1,.5)"});
}
setTimeout(drawCircuit,1500);

/* ---------- LOGO: letras que saltan al pasar el cursor (anime.js) ---------- */
document.querySelectorAll("nav .logo").forEach(logo=>{
  logo.innerHTML = [...logo.textContent].map((ch,i)=>
    `<span class="ll" style="${i>=3?'color:var(--neon)':''}">${ch}</span>`).join("");
  logo.addEventListener("mouseenter",()=>{
    if(reduced) return;
    anime.remove(logo.querySelectorAll(".ll"));
    anime({targets:logo.querySelectorAll(".ll"),translateY:[0,-7,0],
      delay:anime.stagger(45),duration:420,easing:"easeOutCubic"});
  });
});

/* ---------- CANVAS: partículas violeta/neón ---------- */
const canvas = document.getElementById("net");
const ctx = canvas.getContext("2d");
let W,H,nodes=[],mouse={x:-999,y:-999};
function resize(){
  W = canvas.width = canvas.offsetWidth * devicePixelRatio;
  H = canvas.height = canvas.offsetHeight * devicePixelRatio;
}
resize(); addEventListener("resize",resize);
const COUNT = innerWidth < 700 ? 45 : 100;
for(let i=0;i<COUNT;i++){
  nodes.push({
    x:Math.random(), y:Math.random(),
    vx:(Math.random()-0.5)*0.0006, vy:(Math.random()-0.5)*0.0006,
    r:Math.random()*1.8+0.7,
    tw:Math.random()*Math.PI*2,
    cyan:Math.random()<0.3
  });
}
addEventListener("mousemove",e=>{
  const b = canvas.getBoundingClientRect();
  mouse.x = (e.clientX-b.left)/b.width;
  mouse.y = (e.clientY-b.top)/b.height;
});
let t=0;
function draw(){
  t+=0.02;
  ctx.clearRect(0,0,W,H);
  for(const n of nodes){
    n.x+=n.vx; n.y+=n.vy;
    if(n.x<0||n.x>1)n.vx*=-1;
    if(n.y<0||n.y>1)n.vy*=-1;
  }
  for(let i=0;i<nodes.length;i++){
    for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j];
      const dx=(a.x-b.x)*W, dy=(a.y-b.y)*H;
      const d=Math.hypot(dx,dy);
      if(d<120*devicePixelRatio){
        ctx.strokeStyle=`rgba(139,92,246,${(1-d/(120*devicePixelRatio))*0.28})`;
        ctx.lineWidth=0.8;
        ctx.beginPath();
        ctx.moveTo(a.x*W,a.y*H);
        ctx.lineTo(b.x*W,b.y*H);
        ctx.stroke();
      }
    }
  }
  for(const n of nodes){
    const dx=(n.x-mouse.x)*W, dy=(n.y-mouse.y)*H;
    const near = Math.hypot(dx,dy) < 160*devicePixelRatio;
    const twinkle = 0.5 + Math.sin(t + n.tw)*0.5;
    ctx.fillStyle = near
      ? "rgba(43,240,228,1)"
      : n.cyan
        ? `rgba(43,240,228,${0.25 + twinkle*0.4})`
        : `rgba(167,139,250,${0.3 + twinkle*0.45})`;
  ctx.beginPath();
    ctx.arc(n.x*W,n.y*H,n.r*devicePixelRatio*(near?1.7:1),0,Math.PI*2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
if(!reduced) draw();

/* ---------- CURSOR GLOW ---------- */
const glow = document.getElementById("glow");
addEventListener("mousemove",e=>{
  gsap.to(glow,{x:e.clientX,y:e.clientY,duration:0.5,ease:"power2.out"});
});

/* ---------- AURORAS FLOTANTES ---------- */
if(!reduced){
  gsap.to(".aurora-1",{x:"14vw",y:"12vh",duration:14,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to(".aurora-2",{x:"-12vw",y:"-14vh",duration:17,yoyo:true,repeat:-1,ease:"sine.inOut"});
  gsap.to(".aurora-3",{x:"-16vw",y:"10vh",duration:12,yoyo:true,repeat:-1,ease:"sine.inOut"});
}

/* ---------- SPOTLIGHT EN TARJETAS ---------- */
document.querySelectorAll(".service").forEach(card=>{
  card.addEventListener("mousemove",e=>{
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx",((e.clientX-r.left)/r.width*100)+"%");
    card.style.setProperty("--my",((e.clientY-r.top)/r.height*100)+"%");
  });
});

/* ==================== SISTEMA DE PESTAÑAS ==================== */
const views = {};
document.querySelectorAll(".view").forEach(v=>views[v.dataset.view]=v);
const tabLinks = document.querySelectorAll(".tab-link");
const pill = document.getElementById("tabPill");
let currentView = "inicio";

function movePill(btn,instant){
  const parent = btn.parentElement.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  const props = {x:r.left-parent.left, width:r.width, duration:instant?0:0.45, ease:"back.out(1.6)"};
  reduced||instant ? gsap.set(pill,{x:props.x,width:props.width}) : gsap.to(pill,props);
}

function animateViewIn(view){
  if(reduced) return;
  const targets = view.querySelectorAll(
    ".hero .mono,.hero h1 .line,.hero p,.hero-actions,.giant-marquee,.section-head,.service,.biz,.step,.problem,.cta");
  gsap.fromTo(targets,
    {opacity:0,y:44,scale:0.985},
    {opacity:1,y:0,scale:1,duration:0.65,stagger:0.07,ease:"power3.out",clearProps:"scale"});
  const pf = view.querySelector("#progressFill");
  if(pf) gsap.fromTo(pf,{width:"0%"},{width:"100%",duration:1.6,delay:0.5,ease:"power2.inOut"});
  /* anime.js: los iconos entran con rebote elástico escalonado */
  const icons = view.querySelectorAll(".icon,.biz-icon,.step .display");
  if(icons.length){
    anime.remove(icons);
    anime({targets:icons,scale:[0.3,1],rotate:[-14,0],opacity:[0,1],
      delay:anime.stagger(80,{start:280}),duration:900,easing:"easeOutElastic(1,.55)"});
  }
  if(view.dataset.view==="inicio") drawCircuit();
}

function showView(name){
  if(!views[name] || name===currentView) return;
  const oldV = views[currentView], newV = views[name];
  currentView = name;
  tabLinks.forEach(b=>b.classList.toggle("active",b.dataset.target===name));
  const activeBtn = [...tabLinks].find(b=>b.dataset.target===name);
  movePill(activeBtn);
  activeBtn.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  const swap = ()=>{
    oldV.classList.remove("active");
    newV.classList.add("active");
    window.scrollTo({top:0,behavior:"instant"});
    animateViewIn(newV);
  };
  if(reduced){ swap(); return; }
  gsap.to(oldV,{opacity:0,y:-24,duration:0.22,ease:"power2.in",onComplete:()=>{
    gsap.set(oldV,{clearProps:"all"});
    swap();
  }});
}

tabLinks.forEach(b=>b.addEventListener("click",()=>showView(b.dataset.target)));
movePill(document.querySelector(".tab-link.active"),true);
addEventListener("resize",()=>movePill(document.querySelector(".tab-link.active"),true));

/* Los enlaces internos (menú, botones del hero) también cambian de pestaña */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  const target = a.getAttribute("href").slice(1);
  if(views[target]){
    a.addEventListener("click",e=>{e.preventDefault();showView(target);});
  }
});

/* Animación inicial de la vista de inicio tras el preloader */
setTimeout(()=>{ if(!reduced) animateViewIn(views.inicio); }, 1500);

/* ==================== TILT 3D EN TARJETAS ==================== */
if(!reduced && matchMedia("(hover:hover)").matches){
  document.querySelectorAll(".service,.biz").forEach(card=>{
    card.addEventListener("mousemove",e=>{
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY-r.top)/r.height - 0.5) * -8;
      const ry = ((e.clientX-r.left)/r.width - 0.5) * 10;
      gsap.to(card,{rotateX:rx,rotateY:ry,y:-8,transformPerspective:700,duration:0.35,ease:"power2.out"});
    });
    card.addEventListener("mouseleave",()=>{
      gsap.to(card,{rotateX:0,rotateY:0,y:0,duration:0.5,ease:"elastic.out(1,0.5)"});
    });
  });
}

/* ---------- MAGNETIC BUTTONS ---------- */
document.querySelectorAll(".btn").forEach(btn=>{
  btn.addEventListener("mousemove",e=>{
    const r = btn.getBoundingClientRect();
    gsap.to(btn,{x:(e.clientX-r.left-r.width/2)*0.25,y:(e.clientY-r.top-r.height/2)*0.35,duration:0.3});
  });
  btn.addEventListener("mouseleave",()=>gsap.to(btn,{x:0,y:0,duration:0.4,ease:"elastic.out(1,0.4)"}));
});

/* ==================== DEMOS INTERACTIVOS ==================== */
const overlay = document.getElementById("demoOverlay");
const frame = document.getElementById("demoFrame");
const demoTitle = document.getElementById("demoTitle");
const money = n => "$" + n.toLocaleString("es-MX",{minimumFractionDigits:2});

function openDemo(id){
  demoTitle.textContent = DEMOS[id].title;
  frame.innerHTML = "";
  DEMOS[id].render(frame);
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeDemo(){
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}
document.getElementById("demoClose").addEventListener("click",closeDemo);
overlay.addEventListener("click",e=>{ if(e.target===overlay) closeDemo(); });
addEventListener("keydown",e=>{ if(e.key==="Escape") closeDemo(); });
document.querySelectorAll(".biz").forEach(card=>{
  card.addEventListener("click",()=>openDemo(card.dataset.demo));
});
