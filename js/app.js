gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==================== VIDEO DE FONDO CON CROSSFADE ====================
   El bucle es manual (sin el atributo `loop`) para poder desvanecer el
   final contra el principio: sin esto se ve un corte seco en cada vuelta.
   La opacidad la mueve requestAnimationFrame, nunca una transición CSS,
   porque cada fade debe poder arrancar desde donde quedó el anterior. */
/* Deja esto vacio hasta tener un video en video/hero.mp4; asi no se pide
   nada que no exista y la consola queda limpia. Para activarlo:
   const HERO_VIDEO_SRC = "video/hero.mp4"; */
const HERO_VIDEO_SRC = "";

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
  if(!wrap || !video || reduced || !HERO_VIDEO_SRC) return;
  video.addEventListener("error",()=>{
    wrap.hidden = true;
    document.body.classList.remove("has-hero-video");
  },{once:true});
  video.addEventListener("loadeddata",()=>{
    wrap.hidden = false;
    document.body.classList.add("has-hero-video");
  },{once:true});
  /* HEAD primero: si no hay video no se dispara ningun 404 en consola */
  fetch(HERO_VIDEO_SRC,{method:"HEAD"}).then(r=>{ if(r.ok) fadingVideo(video, HERO_VIDEO_SRC); }).catch(()=>{});
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
/* Todas caben en un renglón desde 360 px hasta 1920 px. "atienda mejor a
   sus clientes" se partía en dos y el hero completo saltaba ~100 px en cada
   rotación (botones y párrafo bajaban y subían cada 3 s). */
const words = ["automatice procesos","venda en línea","conecte sus sistemas","atienda mejor","crezca sin límites"];
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
  placeUnderline();
  return [...rot.children];
}

/* El subrayado de neón se dibuja bajo el ÚLTIMO renglón del rotador, no bajo
   toda la caja. Palabras largas ("atienda mejor a sus clientes") se parten en
   dos renglones en teléfonos y también en pantallas muy anchas, y con
   left:0;width:100% la línea quedaba cruzando el hueco entre renglones,
   despegada del texto. getClientRects() devuelve un rectángulo por renglón. */
const rotUnderline = document.querySelector(".rotator-underline");
const rotBox = document.querySelector(".rotator-box");
function placeUnderline(){
  if(!rotUnderline || !rotBox) return;
  const rects = rot.getClientRects();
  if(!rects.length) return;
  const last = rects[rects.length-1];
  const box = rotBox.getBoundingClientRect();
  rotUnderline.style.left = Math.max(0, last.left - box.left) + "px";
  rotUnderline.style.width = last.width + "px";
}
addEventListener("resize", placeUnderline);
/* Las webfonts cambian el ancho del texto al terminar de cargar */
if(document.fonts && document.fonts.ready) document.fonts.ready.then(placeUnderline);

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
const COUNT = innerWidth < 700 ? 40 : 70;
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
        ctx.strokeStyle=`rgba(255,255,255,${(1-d/(120*devicePixelRatio))*0.13})`;
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
        : `rgba(210,210,216,${0.2 + twinkle*0.4})`;
  ctx.beginPath();
    ctx.arc(n.x*W,n.y*H,n.r*devicePixelRatio*(near?1.7:1),0,Math.PI*2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
if(!reduced) draw();

/* ---------- CURSOR GLOW ---------- */
const glow = document.getElementById("glow");
/* Un solo tween por fotograma y solo con puntero fino: antes se encolaba
   un tween por cada evento de raton. */
if(matchMedia("(hover:hover) and (pointer:fine)").matches){
  let gx=0,gy=0,gq=false;
  addEventListener("mousemove",e=>{ gx=e.clientX; gy=e.clientY;
    if(!gq){ gq=true; requestAnimationFrame(()=>{ gq=false; gsap.to(glow,{x:gx,y:gy,duration:0.5,ease:"power2.out",overwrite:"auto"}); }); }
  },{passive:true});
}

/* ---------- AURORAS FLOTANTES ---------- */
/* Las auroras ya no se animan: tres capas de 60vw con blur moviendose
   obligaban a recomponer todo el fondo en cada fotograma. Quietas se
   pintan una sola vez. */

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
  {id:"restaurante",  em:"🍽️", n:"La Cocina de Rosa",       rows:[["Tacos de pastor","$95"],["Agua del día 1 L","$45"],["Listo en","18 min"]], foot:"Menú digital · Mesa 4"},
  {id:"ferreteria",   em:"🔩", n:"Ferretería El Tornillo",  rows:[["Cemento gris 50 kg","$238"],["Varilla 3/8\"","$165"],["Descuento por volumen","−5%"]], foot:"Cotizador de obra"},
  {id:"farmacia",     em:"💊", n:"Farmacia San Miguel",     rows:[["Caduca en 12 días","⏰"],["Stock bajo","📦"],["Pedido sugerido","🤖"]], foot:"Panel de control"},
  {id:"distribuidora",em:"🚚", n:"Distribuidora del Centro",rows:[["Aceite vegetal 1L","$310"],["Atún en agua","$620"],["Crédito disponible","42%"]], foot:"Portal de clientes"},
  {id:"boutique",     em:"👗", n:"Boutique Alma",           rows:[["Vestido floral","$549"],["Chamarra mezclilla","$729"],["Apartado A-217","✓"]], foot:"Catálogo + apartados"},
  {id:"taller",       em:"🔧", n:"Taller Rodríguez",        rows:[["Orden A-1042","70%"],["Balatas delanteras","$1,250"],["Chat con el mecánico","💬"]], foot:"Estatus en vivo"}
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
  b.addEventListener("click",()=>openDemo(t.id, b));
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

  function place(){
    const rect = wrap.getBoundingClientRect();
    /* Solo trabaja mientras la sección está cerca del viewport */
    if(rect.bottom < -200 || rect.top > innerHeight + 200) return;
    const offset = (innerHeight - rect.top) * 0.3;
    row1.style.transform = `translateX(${offset - 400}px)`;
    row2.style.transform = `translateX(${-(offset - 400)}px)`;
  }
  /* Directo en el evento, sin pasar por requestAnimationFrame: si un rAF se
     perdia (pestana en segundo plano, panel sin componer) la bandera
     "ticking" se quedaba en true y el marquee se congelaba para siempre.
     Son dos escrituras de transform; no hace falta coalescer. */
  addEventListener("scroll",place,{passive:true});
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
    /* Los espacios se quedan como texto suelto: si cada uno va en un <span>
       con white-space:pre, el parrafo pierde sus puntos de salto de linea y
       se sale de la pantalla en vez de envolver. */
    const chars = [];
    for(const ch of text){
      if(ch === " "){ el.appendChild(document.createTextNode(" ")); continue; }
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = ch;
      el.appendChild(s);
      chars.push(s);
    }
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
  let activo = null;
  spyLinks.forEach(a=>{
    const on = a.getAttribute("href")==="#"+current;
    a.classList.toggle("active", on);
    if(on) activo = a;
  });
  revealActiveLink(activo);
}
/* En móvil la tira de secciones se desliza: cuando cambia la sección activa,
   el enlace se trae a la vista dentro de la tira (nunca mueve la página). */
let lastSpy = null;
function revealActiveLink(a){
  if(!a || a===lastSpy) return;
  lastSpy = a;
  const scroller = a.closest(".nav-scroll");
  if(!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
  const left = a.offsetLeft - 12;
  const visibleFrom = scroller.scrollLeft, visibleTo = scroller.scrollLeft + scroller.clientWidth - 48;
  if(a.offsetLeft < visibleFrom || a.offsetLeft + a.offsetWidth > visibleTo){
    scroller.scrollTo({left:Math.max(0,left), behavior: reduced ? "auto" : "smooth"});
  }
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

let demoTrigger = null;
function openDemo(id, trigger){
  demoTrigger = trigger || document.activeElement;
  if(typeof clearDemoTimers==="function") clearDemoTimers();
  demoTitle.textContent = DEMOS[id].title;
  /* El modal es la probada rápida; el enlace lleva al sistema completo */
  const full = document.getElementById("demoFull");
  if(full) full.href = "demos/" + id + ".html";
  frame.innerHTML = "";
  DEMOS[id].render(frame);
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  /* El foco entra al dialogo: lectores de pantalla y teclado lo necesitan */
  document.getElementById("demoClose").focus();
}
function closeDemo(){
  overlay.classList.remove("open");
  document.body.style.overflow = "";
  /* Detiene comandas, chats y notificaciones pendientes del demo abierto */
  if(typeof clearDemoTimers==="function") clearDemoTimers();
  document.querySelectorAll(".dapp-toast").forEach(t=>t.remove());
  if(demoTrigger && demoTrigger.focus) demoTrigger.focus();
}
document.getElementById("demoClose").addEventListener("click",closeDemo);
overlay.addEventListener("click",e=>{ if(e.target===overlay) closeDemo(); });
addEventListener("keydown",e=>{
  if(!overlay.classList.contains("open")) return;
  if(e.key==="Escape"){ closeDemo(); return; }
  /* Tab se queda dentro del modal */
  if(e.key==="Tab"){
    const f=[...overlay.querySelectorAll("button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex=\"-1\"])")].filter(x=>x.offsetParent!==null);
    if(!f.length) return;
    const first=f[0], last=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  }
});
/* Vista previa en cada tarjeta de giro, armada con los mismos datos de las
   fichas del marquee (TILES) para no duplicar contenido. */
document.querySelectorAll(".biz").forEach(card=>{
  const t = TILES.find(x=>x.id===card.dataset.demo);
  if(t && !card.querySelector(".biz-preview")){
    const pv = document.createElement("div");
    pv.className = "biz-preview"; pv.setAttribute("aria-hidden","true");
    pv.innerHTML = `<div class="pv-top"><i>${t.em}</i>${t.n}<span class="pv-dots"><b></b><b></b><b></b></span></div>
      <div class="pv-body">${t.rows.slice(0,3).map(([a,c])=>`<div class="pv-row">${a}<i>${c}</i></div>`).join("")}</div>`;
    card.prepend(pv);
  }
});
/* ---------- CINTA DE DEMOS: flechas, tarjeta activa y avance automático ---------- */
(function initBizStrip(){
  const strip = document.getElementById("bizStrip");
  if(!strip) return;
  const cards = [...strip.querySelectorAll(".biz")];
  if(cards.length < 2) return;
  const prev = document.querySelector(".strip-btn.prev");
  const next = document.querySelector(".strip-btn.next");
  const paso = () => cards[1].offsetLeft - cards[0].offsetLeft;
  let manual = false, timer = null, autoScrolling = false, autoT = null;

  function go(dir){
    const max = strip.scrollWidth - strip.clientWidth;
    let left = strip.scrollLeft + dir*paso();
    if(dir > 0 && strip.scrollLeft >= max - 4) left = 0;     /* al final, vuelve al inicio */
    if(dir < 0 && strip.scrollLeft <= 4) left = max;
    autoScrolling = true;
    clearTimeout(autoT); autoT = setTimeout(()=>{ autoScrolling = false; }, 900);
    strip.scrollTo({left, behavior: reduced ? "auto" : "smooth"});
  }
  if(prev) prev.addEventListener("click",()=>{ manual = true; stop(); go(-1); });
  if(next) next.addEventListener("click",()=>{ manual = true; stop(); go(1); });

  /* Tarjeta activa: la primera que se ve completa */
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>e.target.classList.toggle("is-visible", e.intersectionRatio >= 0.9));
    const first = cards.find(c=>c.classList.contains("is-visible"));
    cards.forEach(c=>c.classList.toggle("is-active", c === first));
  },{root:strip, threshold:[0.9]});
  cards.forEach(c=>io.observe(c));

  /* Avance automático solo en escritorio y solo mientras la cinta está a la
     vista; se detiene para siempre en cuanto la persona la mueve por su
     cuenta (rueda, dedo o flechas) y se pausa mientras el cursor está encima. */
  function start(){ stop(); timer = setInterval(()=>{ if(!manual) go(1); }, 4500); }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }
  if(reduced || !matchMedia("(hover:hover)").matches) return;
  strip.addEventListener("scroll",()=>{ if(!autoScrolling){ manual = true; stop(); } },{passive:true});
  strip.addEventListener("pointerdown",()=>{ manual = true; stop(); },{passive:true});
  strip.addEventListener("mouseenter",stop);
  strip.addEventListener("mouseleave",()=>{ if(!manual && enVista) start(); });
  let enVista = false;
  new IntersectionObserver(entries=>{
    enVista = entries[0].isIntersecting;
    if(enVista && !manual && !strip.matches(":hover")) start(); else stop();
  },{threshold:0.35}).observe(strip);
})();

document.querySelectorAll(".biz").forEach(card=>{
  card.addEventListener("click",()=>openDemo(card.dataset.demo, card));
  card.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); openDemo(card.dataset.demo, card); } });
});

/* ==================== FORMULARIO DE CONTACTO ====================
   El sitio se hospeda en Vercel, que a diferencia de Netlify no recolecta
   formularios. Así que el envío se arma aquí: se compone un mensaje legible
   con lo que escribió la persona y se abre WhatsApp, que es por donde ya
   entra el resto de los clientes.

   Si algún día se conecta un servicio de formularios, basta con poner su URL
   en el atributo data-endpoint del <form>: entonces se hace POST ahí y se
   lleva a gracias.html, y WhatsApp queda como respaldo si ese POST falla.
   Nunca se pierde el mensaje. */
(function initContactForm(){
  const form = document.getElementById("contactForm");
  const ok   = document.getElementById("formOk");
  if(!form || !ok) return;

  const WA_NUM = "529531342851";
  const okLink = document.getElementById("formOkLink");
  const btn    = form.querySelector('button[type="submit"]');
  const again  = document.getElementById("formAgain");

  function mensaje(d){
    const lineas = [
      "Hola RodTech, les escribo desde su sitio.",
      "",
      "Nombre: " + d.nombre,
      "Negocio: " + d.negocio,
      "WhatsApp: " + d.whatsapp
    ];
    if(d.correo) lineas.push("Correo: " + d.correo);
    lineas.push("", "Lo que necesito:", d.mensaje);
    return lineas.join("\n");
  }

  function mostrarOk(url){
    if(okLink) okLink.href = url;
    form.hidden = true;
    ok.hidden = false;
    ok.scrollIntoView({block:"center", behavior: reduced ? "auto" : "smooth"});
  }

  form.addEventListener("submit", e=>{
    e.preventDefault();
    /* La validación nativa ya marcó los campos vacíos */
    if(!form.reportValidity()) return;

    const fd = new FormData(form);
    /* Campo trampa: los bots lo llenan, las personas no lo ven */
    if((fd.get("bot-field")||"").toString().trim()) return;

    const datos = {
      nombre:   (fd.get("nombre")||"").toString().trim(),
      negocio:  (fd.get("negocio")||"").toString().trim(),
      whatsapp: (fd.get("whatsapp")||"").toString().trim(),
      correo:   (fd.get("correo")||"").toString().trim(),
      mensaje:  (fd.get("mensaje")||"").toString().trim()
    };
    const waUrl = "https://wa.me/" + WA_NUM + "?text=" + encodeURIComponent(mensaje(datos));

    const endpoint = form.dataset.endpoint;
    if(endpoint){
      btn.disabled = true;
      const textoOriginal = btn.textContent;
      btn.textContent = "Enviando…";
      fetch(endpoint,{method:"POST",body:fd,headers:{Accept:"application/json"}})
        .then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); location.href = "gracias.html"; })
        .catch(()=>{ /* si el servicio falla, el mensaje se va por WhatsApp */
          btn.disabled = false; btn.textContent = textoOriginal;
          window.open(waUrl,"_blank","noopener");
          mostrarOk(waUrl);
        });
      return;
    }

    /* La ventana se abre dentro del clic, que es lo que respetan los
       bloqueadores de emergentes. Si aun así no abre, queda el enlace. */
    window.open(waUrl,"_blank","noopener");
    mostrarOk(waUrl);
  });

  if(again) again.addEventListener("click",()=>{
    ok.hidden = true;
    form.hidden = false;
    form.querySelector("#f-nombre").focus();
  });
})();
