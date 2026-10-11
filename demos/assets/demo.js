/* ==========================================================================
   Armazón compartido de los demos. Cada página define un objeto DEMO con su
   marca, secciones y datos; esto se encarga del resto (barra lateral,
   cambio de sección, avisos flotantes, formato de dinero).

   Sin dependencias: los demos deben abrir al instante aunque el CDN falle.
   ========================================================================== */

const money = n => "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const miles = n => Number(n).toLocaleString("es-MX");

/* Escapa texto que venga de un campo del usuario antes de meterlo al HTML */
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let toastTimer = null;
function toast(msg, icon) {
  const t = document.getElementById("toast");
  t.textContent = (icon || "✓") + "  " + msg;
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 2400);
}

/* Las barras usan scaleX en vez de width: `width` recalcula layout en cada
   fotograma, `transform` va por GPU. El valor entra como fracción 0-1. */
function bar(frac) {
  return `<div class="bar"><i style="transform:scaleX(${Math.max(0, Math.min(1, frac))})"></i></div>`;
}

function chart(datos) {
  const max = Math.max(...datos.map(d => d.v)) || 1;
  return `<div class="chart">${datos.map(d => `
    <div class="col${d.hi ? " hi" : ""}">
      <i style="height:${Math.round((d.v / max) * 118)}px"></i>
      <small>${esc(d.k)}</small>
    </div>`).join("")}</div>`;
}


/* --------------------------------------------------------------------------
   Formularios: panel lateral que se abre para crear algo nuevo
   -------------------------------------------------------------------------- */
function campo(label, inner, hint){
  return `<div class="fc"><span>${esc(label)}</span>${inner}${hint?`<small>${esc(hint)}</small>`:""}</div>`;
}
function opciones(lista, actual){
  return lista.map(v=>{const [val,txt]=Array.isArray(v)?v:[v,v];return `<option value="${esc(val)}"${val==actual?" selected":""}>${esc(txt)}</option>`;}).join("");
}
/* drawer(titulo, html, onSubmit(datos, cerrar)) -> abre el panel; onSubmit
   recibe los valores del formulario por name. Devuelve false para no cerrar. */
function drawer(titulo, html, onSubmit, opts){
  opts=opts||{};
  const ov=document.createElement("div");ov.className="drawer-ov";
  ov.innerHTML=`<aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <div class="drawer-h"><h2>${esc(titulo)}</h2><button class="btn sm" data-x type="button">Cerrar</button></div>
      <form class="drawer-b" novalidate>${html}
        <div class="drawer-f"><button class="btn" type="button" data-x>Cancelar</button>
        <button class="btn primary" type="submit">${esc(opts.enviar||"Guardar")}</button></div></form></aside>`;
  document.body.appendChild(ov);document.body.classList.add("drawer-open");
  const form=ov.querySelector("form");
  const cerrar=()=>{ov.remove();document.body.classList.remove("drawer-open");document.removeEventListener("keydown",esc1);};
  const esc1=e=>{if(e.key==="Escape")cerrar();};
  document.addEventListener("keydown",esc1);
  ov.querySelectorAll("[data-x]").forEach(b=>b.onclick=cerrar);
  ov.addEventListener("click",e=>{if(e.target===ov)cerrar();});
  form.onsubmit=e=>{e.preventDefault();
    const d={};new FormData(form).forEach((v,k)=>{d[k]=typeof v==="string"?v.trim():v;});
    /* validacion nativa pero con mensaje propio */
    const inv=[...form.querySelectorAll("[required]")].find(i=>!i.value.trim());
    if(inv){inv.focus();inv.classList.add("inv");toast("Falta: "+(inv.closest(".fc")?.querySelector("span")?.textContent||inv.name),"⚠️");return;}
    const r=onSubmit(d,form);if(r!==false)cerrar();};
  const first=form.querySelector("input,select,textarea");if(first)first.focus();
  return {cerrar,form};
}

/* --------------------------------------------------------------------------
   Persistencia: lo que el prospecto haga sobrevive a una recarga.
   DEMO.estado = { clave, get:()=>obj, set:(obj)=>void }
   -------------------------------------------------------------------------- */
function guardarEstado(DEMO){
  if(!DEMO.estado)return;
  try{localStorage.setItem("rt-demo-"+DEMO.estado.clave,JSON.stringify(DEMO.estado.get()));}catch(e){}
}
function cargarEstado(DEMO){
  if(!DEMO.estado)return false;
  try{const raw=localStorage.getItem("rt-demo-"+DEMO.estado.clave);if(!raw)return false;DEMO.estado.set(JSON.parse(raw));return true;}catch(e){return false;}
}
function reiniciarDemo(DEMO){
  try{localStorage.removeItem("rt-demo-"+DEMO.estado.clave);}catch(e){}
  location.reload();
}

/* --------------------------------------------------------------------------
   Arranque
   -------------------------------------------------------------------------- */
function startDemo(DEMO) {
  document.title = DEMO.negocio + " — Demo RodTech";
  const restaurado = cargarEstado(DEMO);
  /* boton de reinicio en la cinta, solo si el demo guarda estado */
  const strip = document.querySelector(".demo-strip");
  if (DEMO.estado && strip) {
    const b = document.createElement("button"); b.className = "strip-reset"; b.type = "button";
    b.textContent = "↺ Reiniciar demo"; b.title = "Borra lo que hayas capturado y vuelve a los datos de ejemplo";
    b.onclick = () => reiniciarDemo(DEMO);
    strip.insertBefore(b, strip.querySelector("a"));
  }

  const app = document.getElementById("app");
  const side = document.createElement("aside");
  side.className = "side";
  const main = document.createElement("main");
  main.className = "main";
  app.append(side, main);

  let actual = DEMO.secciones[0].id;

  function pintarNav() {
    side.innerHTML = `
      <div class="biz">
        <div class="mark">${DEMO.emoji}</div>
        <div><b>${esc(DEMO.negocio)}</b><span>${esc(DEMO.rubro)}</span></div>
      </div>
      ${DEMO.secciones.map(s => `
        <button class="nav-item${s.id === actual ? " on" : ""}" data-sec="${s.id}">
          <span class="ic">${s.ic}</span>${esc(s.nombre)}
          ${s.badge && s.badge() ? `<span class="badge">${s.badge()}</span>` : ""}
        </button>`).join("")}
      <div class="foot">Sistema construido por RodTech<br>para ${esc(DEMO.negocio)}</div>`;
    side.querySelectorAll("[data-sec]").forEach(b =>
      b.onclick = () => { actual = b.dataset.sec; pintar(); });
  }

  function pintar() {
    const sec = DEMO.secciones.find(s => s.id === actual);
    pintarNav();
    main.innerHTML = `
      <div class="head">
        <div><h1>${esc(sec.titulo)}</h1><p>${esc(sec.sub)}</p></div>
        ${sec.accion ? `<button class="btn primary" id="accionPrincipal">${esc(sec.accion.txt)}</button>` : ""}
      </div>
      <div id="cuerpo"></div>`;
    if (sec.accion) document.getElementById("accionPrincipal").onclick = () => sec.accion.fn(refrescar);
    sec.render(document.getElementById("cuerpo"), refrescar);
    main.scrollTop = 0;
  }

  /* Las secciones llaman a esto tras cambiar datos; re-pinta sin perder
     en qué sección estabas. */
  function refrescar() { guardarEstado(DEMO); pintar(); }
  /* Las páginas pueden saltar a otra sección (p. ej. "Surtir" manda al punto de venta) */
  DEMO.ir = id => { if (DEMO.secciones.some(s => s.id === id)) { actual = id; refrescar(); } };

  pintar();
  if (restaurado) toast("Se restauró lo que capturaste la última vez","💾");
  return refrescar;
}
