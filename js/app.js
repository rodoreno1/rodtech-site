gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==================== VIDEO DE FONDO CON CROSSFADE ====================
   El bucle es manual (sin el atributo `loop`) para poder desvanecer el
   final contra el principio: sin esto se ve un corte seco en cada vuelta.
   La opacidad la mueve requestAnimationFrame, nunca una transición CSS,
   porque cada fade debe poder arrancar desde donde quedó el anterior. */
const HERO_VIDEO_SRC = "video/hero.mp4";

function fadingVideo(video, src){
  const FADE_MS = 500, FADE_OUT_LEAD = 0.55;
  let rafId = null, fadingOut = false;

  function fadeTo(target, duration){
    if(rafId) cancelAnimationFrame(rafId);
    const from = parseFloat(video.style.opacity) || 0;
    const t0 = performance.now();
    (function step(now){
      const p = duration <= 0 ? 1 : Math.min(1,(now - t0) / duration);
      video.style.opacity = String(from + (target - from) * p);
      rafId = p < 1 ? requestAnimationFrame(step) : null;
    })(t0);
  }

  const onLoaded = ()=>{
    video.style.opacity = "0";
    const pr = video.play();
    if(pr && pr.catch) pr.catch(()=>{});   /* autoplay bloqueado: no es fatal */
    fadeTo(1, FADE_MS);
  };
  const onTime = ()=>{
    const left = video.duration - video.currentTime;
    if(!fadingOut && video.duration && left <= FADE_OUT_LEAD && left > 0){
      fadingOut = true;
      fadeTo(0, FADE_MS);
    }
  };
  const onEnded = ()=>{
    video.style.opacity = "0";
    setTimeout(()=>{
      video.currentTime = 0;
      const pr = video.play();
      if(pr && pr.catch) pr.catch(()=>{});
      fadingOut = false;
      fadeTo(1, FADE_MS);
    },100);
  };

  video.addEventListener("loadeddata",onLoaded);
  video.addEventListener("timeupdate",onTime);
  video.addEventListener("ended",onEnded);
  video.src = src;
}

/* Solo se enciende si el archivo existe de verdad; si no, se queda el
   fondo de partículas y nadie ve un hueco negro. */
(function initHeroVideo(){
  const wrap = document.getElementById("heroVideoWrap");
  const video = document.getElementById("heroVideo");
  if(!wrap || !video || reduced) return;
  video.addEventListener("error",()=>{
    wrap.hidden = true;
    document.body.classList.remove("has-hero-video");
  },{once:true});
  video.addEventListener("loadeddata",()=>{
    wrap.hidden = false;
    document.body.classList.add("has-hero-video");
  },{once:true});
  fadingVideo(video, HERO_VIDEO_SRC);
})();

/* ==================== BLUR TEXT: entrada palabra por palabra ====================
   Recorre los nodos de texto para no destruir el marcado interno
   (los <br> y el <span class="neon-text"> del degradado sobreviven). */
function splitIntoWords(el){
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while(walker.nextNode()) textNodes.push(walker.currentNode);
  const words = [];
  textNodes.forEach(node=>{
    if(!node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(part=>{
      if(!part) return;
      if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
      const s = document.createElement("span");
      s.className = "bw";
      s.textContent = part;
      frag.appendChild(s);
      words.push(s);
    });
    node.parentNode.replaceChild(frag, node);
  });
  return words;
}

function blurTextIn(el, delay){
  if(reduced) return;
  const words = splitIntoWords(el);
  if(!words.length) return;
  gsap.set(words,{filter:"blur(10px)",opacity:0,y:50});
  gsap.timeline({delay:delay||0})
    .to(words,{filter:"blur(5px)",opacity:0.5,y:-5,duration:0.35,ease:"power2.out",stagger:0.06})
    .to(words,{filter:"blur(0px)",opacity:1,y:0,duration:0.35,ease:"power2.out",stagger:0.06,
      clearProps:"filter,transform"}, 0.35);
}

/* El hero arranca de inmediato. Antes habia un preloader de 1.4 s, pero el
   sitio pesa 36 KB comprimidos: ya habia cargado antes de que la barra
   llegara a la mitad, asi que solo anadia espera a contenido que estaba
   listo. */
heroIntro();

function heroIntro(){
  if(reduced) return;
  /* Las dos primeras líneas entran palabra por palabra; la tercera es el
     rotador, que tiene su propia animación letra a letra con anime.js */
  document.querySelectorAll(".hero h1 .line[data-blur]").forEach((line,i)=>
    blurTextIn(line, i*0.12));
  /* clearProps es importante: sin el, .rotator-box se queda con un
     transform inline que lo promueve a capa propia, y al reemplazar las
     letras dentro quedaba pintada la capa vieja de la primera letra. */
  gsap.from(".hero h1 .line:not([data-blur]) > span",
    {yPercent:110,duration:0.95,delay:0.35,ease:"power3.out",clearProps:"transform"});
  gsap.from(".hero .reveal",{opacity:0,y:30,duration:0.8,stagger:0.06,delay:0.5,ease:"power2.out"});
  gsap.from(".smarquee",{opacity:0,duration:1,delay:0.7,ease:"power2.out"});
  gsap.to(".scroll-hint",{y:10,repeat:-1,yoyo:true,duration:0.8,ease:"sine.inOut"});
}

/* ---------- PALABRA ROTATIVA: letra por letra (anime.js) ---------- */
const words = ["automatice procesos","venda en línea","conecte sus sistemas","atienda mejor a sus clientes","crezca sin límites"];
let wi = 0;
const rot = document.getElementById("rotator");
/* replaceChildren en vez de innerHTML: sustituye todos los nodos en una
   sola operacion, en lugar de reparsear HTML mientras anime.js todavia
   tiene transforms vivos encima de las letras que se van. */
function setWord(w){
  const frag = document.createDocumentFragment();
  for(const ch of w){
    /* .rl recibe el transform de anime.js; .rl-g lleva el degradado.
       Separarlos evita el artefacto de pintado de Chrome al animar un
       elemento que ademas usa background-clip:text (ver styles.css). */
    const wrap = document.createElement("span");
    wrap.className = "rl";
    const glyph = document.createElement("span");
    glyph.className = "rl-g";
    glyph.textContent = ch === " " ? " " : ch;
    wrap.appendChild(glyph);
    frag.appendChild(wrap);
  }
  rot.replaceChildren(frag);
  return [...rot.children];
}
setWord(words[0]);
if(!reduced){
  anime({targets:[...rot.children],translateY:[18,0],opacity:[0,1],
    delay:anime.stagger(24),duration:500,easing:"easeOutCubic"});

  /* Cadena de setTimeout en lugar de setInterval. Con setInterval, una
     pestana en segundo plano acumula disparos y al volver se lanzan varias
     animaciones a la vez sobre los mismos nodos; ahi es donde una letra
     del texto anterior se quedaba congelada. Encadenado, un ciclo no puede
     empezar hasta que el anterior termino. */
  const rotateOnce = () => {
    const salen = [...rot.children];
    anime.remove(salen);
    anime({targets:salen,translateY:[0,-18],opacity:[1,0],
      delay:anime.stagger(14),duration:280,easing:"easeOutCubic",
      complete:()=>{
        wi = (wi+1) % words.length;
        const entran = setWord(words[wi]);
        anime.remove(entran);
        anime({targets:entran,translateY:[18,0],opacity:[0,1],
          delay:anime.stagger(24),duration:480,easing:"easeOutCubic",
          complete:()=>setTimeout(rotateOnce,2200)});
      }});
  };
  setTimeout(rotateOnce,2600);
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
/* 1500 ms estaba calibrado para esperar al preloader; sin el, el circuito
   entra junto con el resto del hero */
setTimeout(drawCircuit,400);

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

/* ==================== MARQUEE REACTIVO AL SCROLL ====================
   Fichas que representan cada demo. Al hacer clic abren el demo real,
   así que la decoración también sirve de puerta de entrada. */
const TILES = [
  {id:"restaurante",  em:"🍽️", n:"La Cocina de Rosa",       rows:[["Tacos de pastor","$95"],["Agua del día","$45"],["Flan napolitano","$55"]], foot:"Menú digital · Mesa 4"},
  {id:"ferreteria",   em:"🔩", n:"Ferretería El Tornillo",  rows:[["Cemento gris 50 kg","$238"],["Varilla 3/8","$165"],["Tubo PVC 4\"","$210"]], foot:"Cotizador · COT-871"},
  {id:"farmacia",     em:"💊", n:"Farmacia San Miguel",     rows:[["Caduca en 12 días","⏰"],["Stock bajo","📦"],["Pedido sugerido","🤖"]], foot:"Panel de control"},
  {id:"distribuidora",em:"🚚", n:"Distribuidora del Centro",rows:[["Aceite vegetal 1L","$310"],["Atún en agua","$620"],["Crédito disponible","42%"]], foot:"Portal de clientes"},
  {id:"boutique",     em:"👗", n:"Boutique Alma",           rows:[["Vestido floral","$549"],["Chamarra mezclilla","$729"],["Apartado A-217","✓"]], foot:"Catálogo + apartados"},
  {id:"taller",       em:"🔧", n:"Taller Rodríguez",        rows:[["Orden A-1042","70%"],["Balatas delanteras","$1,250"],["Chat con el taller","💬"]], foot:"Estatus en vivo"}
];

function buildTile(t){
  const b = document.createElement("button");
  b.className = "stile liquid-glass";
  b.type = "button";
  b.setAttribute("aria-label","Abrir demo de "+t.n);
  b.dataset.demo = t.id;
  b.innerHTML =
    `<div class="stile-top"><span class="em">${t.em}</span><b>${t.n}</b></div>
     <div class="stile-body">
       ${t.rows.map(([a,c])=>`<div class="stile-line">${a}<i>${c}</i></div>`).join("")}
     </div>
     <div class="stile-foot">${t.foot}</div>`;
  b.addEventListener("click",()=>openDemo(t.id));
  return b;
}

(function initMarquee(){
  const wrap = document.getElementById("smarquee");
  const row1 = document.getElementById("smRow1");
  const row2 = document.getElementById("smRow2");
  if(!wrap || !row1 || !row2) return;

  /* Se triplica cada fila para que nunca se vea el final del carrete */
  const setA = [TILES[0],TILES[1],TILES[2]];
  const setB = [TILES[3],TILES[4],TILES[5]];
  for(let i=0;i<3;i++){
    setA.forEach(t=>row1.appendChild(buildTile(t)));
    setB.forEach(t=>row2.appendChild(buildTile(t)));
  }

  if(reduced) return;   /* sin movimiento: las fichas se quedan quietas */

  let ticking = false;
  function place(){
    ticking = false;
    const rect = wrap.getBoundingClientRect();
    /* Solo trabaja mientras la sección está cerca del viewport */
    if(rect.bottom < -200 || rect.top > innerHeight + 200) return;
    const offset = (innerHeight - rect.top) * 0.3;
    row1.style.transform = `translateX(${offset - 400}px)`;
    row2.style.transform = `translateX(${-(offset - 400)}px)`;
  }
  function onScroll(){ if(!ticking){ ticking = true; requestAnimationFrame(place); } }
  addEventListener("scroll",onScroll,{passive:true});
  addEventListener("resize",place);
  place();
})();

/* ==================== TARJETAS QUE SE APILAN ====================
   Cada tarjeta se queda pegada arriba y se encoge conforme la siguiente
   sube: da la sensación de un montón de fichas en perspectiva. */
(function initStack(){
  const stack = document.getElementById("casosStack");
  if(!stack) return;
  const items = [...stack.querySelectorAll(".stack-item")];
  const cards = items.map(it=>it.querySelector(".stack-card"));
  const total = cards.length;

  /* El desfase vertical es lo que deja ver el canto de las de abajo */
  cards.forEach((card,i)=>{ card.style.top = `calc(110px + ${i*16}px)`; });

  if(reduced || innerWidth <= 760) return;

  items.forEach((item,i)=>{
    if(i === total - 1) return;   /* la última no se encoge */
    const targetScale = 1 - (total - 1 - i) * 0.03;
    gsap.fromTo(cards[i],{scale:1},{
      scale:targetScale, ease:"none",
      scrollTrigger:{trigger:item,start:"top 110px",endTrigger:items[total-1],end:"top 260px",scrub:true}
    });
  });
})();

/* ==================== REVELADO LETRA POR LETRA ====================
   La opacidad de cada letra sigue el avance del scroll: el texto se
   "enciende" de izquierda a derecha mientras lees. */
(function initCharReveal(){
  document.querySelectorAll(".chreveal").forEach(el=>{
    const text = el.textContent;
    el.textContent = "";
    const chars = [...text].map(ch=>{
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      if(ch === " ") s.style.whiteSpace = "pre";
      el.appendChild(s);
      return s;
    });
    if(reduced){ gsap.set(chars,{opacity:1}); return; }
    gsap.to(chars,{opacity:1,ease:"none",stagger:0.5,
      scrollTrigger:{trigger:el,start:"top 85%",end:"bottom 55%",scrub:true}});
  });
})();

/* ==================== SCROLLSPY: resalta la sección activa en el nav ==================== */
const spyLinks = [...document.querySelectorAll('#navLinks a[href^="#"]:not(.nav-cta)')];
const spySections = ["servicios","ideas","proceso","problemas","nosotros","faq","contacto"]
  .map(id=>({id, el:document.getElementById(id)}))
  .filter(s=>s.el);
function updateSpy(){
  const y = scrollY + innerHeight*0.4;
  let current = "";
  for(const s of spySections){ if(s.el.offsetTop <= y) current = s.id; }
  spyLinks.forEach(a=>a.classList.toggle("active", a.getAttribute("href")==="#"+current));
}
addEventListener("scroll",updateSpy,{passive:true});
addEventListener("resize",updateSpy);
updateSpy();

/* ==================== REVEALS AL HACER SCROLL (GSAP + anime.js) ==================== */
if(!reduced){
  /* Encabezados de sección: el h2 entra palabra por palabra, el resto en bloque */
  gsap.utils.toArray(".section-head, .cta").forEach(el=>{
    const h2 = el.querySelector("h2");
    if(h2){
      ScrollTrigger.create({trigger:el,start:"top 86%",once:true,
        onEnter:()=>blurTextIn(h2)});
      gsap.from([...el.children].filter(c=>c!==h2).concat(
        [...(h2.parentElement===el?[]:[h2.parentElement])].filter(Boolean)
          .flatMap(p=>[...p.children].filter(c=>c!==h2))),
        {opacity:0,y:40,duration:0.8,ease:"power3.out",
         scrollTrigger:{trigger:el,start:"top 86%",once:true}});
    } else {
      gsap.from(el,{opacity:0,y:40,duration:0.8,ease:"power3.out",
        scrollTrigger:{trigger:el,start:"top 86%",once:true}});
    }
  });
  /* Tarjetas y filas, en lotes con stagger */
  /* Las .stack-card quedan fuera a propósito: ya tienen su propio scrub
     de escala y una segunda animación de opacidad las haría pelear */
  ScrollTrigger.batch(".service,.biz,.step",{
    start:"top 90%",
    once:true,
    onEnter:els=>{
      gsap.fromTo(els,
        {opacity:0,y:44,scale:0.985},
        {opacity:1,y:0,scale:1,duration:0.65,stagger:0.08,ease:"power3.out",clearProps:"scale"});
      /* anime.js: iconos y números entran con rebote elástico */
      const icons = [];
      els.forEach(el=>icons.push(...el.querySelectorAll(".icon,.biz-icon,.step .display")));
      if(icons.length){
        anime.remove(icons);
        anime({targets:icons,scale:[0.3,1],rotate:[-14,0],opacity:[0,1],
          delay:anime.stagger(80,{start:200}),duration:900,easing:"easeOutElastic(1,.55)"});
      }
    }
  });
  /* Línea de progreso del proceso */
  ScrollTrigger.create({
    trigger:"#proceso",start:"top 70%",once:true,
    onEnter:()=>gsap.fromTo("#progressFill",{scaleX:0},{scaleX:1,duration:1.6,ease:"power2.inOut"})
  });
  /* Footer gigante */
  gsap.from(".footer-giant .word",{opacity:0,y:60,duration:1,ease:"power3.out",
    scrollTrigger:{trigger:".footer-giant",start:"top 90%",once:true}});
}

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
  if(typeof clearDemoTimers==="function") clearDemoTimers();
  demoTitle.textContent = DEMOS[id].title;
  /* El modal es la probada rápida; el enlace lleva al sistema completo */
  const full = document.getElementById("demoFull");
  if(full) full.href = "demos/" + id + ".html";
  frame.innerHTML = "";
  DEMOS[id].render(frame);
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeDemo(){
  overlay.classList.remove("open");
  document.body.style.overflow = "";
  /* Detiene comandas, chats y notificaciones pendientes del demo abierto */
  if(typeof clearDemoTimers==="function") clearDemoTimers();
  document.querySelectorAll(".dapp-toast").forEach(t=>t.remove());
}
document.getElementById("demoClose").addEventListener("click",closeDemo);
overlay.addEventListener("click",e=>{ if(e.target===overlay) closeDemo(); });
addEventListener("keydown",e=>{ if(e.key==="Escape") closeDemo(); });
document.querySelectorAll(".biz").forEach(card=>{
  card.addEventListener("click",()=>openDemo(card.dataset.demo));
});
