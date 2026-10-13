/* ==================== UTILIDADES COMPARTIDAS DE LOS DEMOS ====================
   Seis sistemas de ejemplo para operaciones industriales y B2B: importaciones,
   flotilla, almacén, cotizador, portal de clientes y producción. Los datos
   son ficticios, pero las fechas, los folios, los totales y los tiempos se
   calculan de verdad a partir del reloj del visitante: un demo con "18 jul"
   quemado en el código se ve viejo a los tres días; uno que dice "ETA jueves
   4 de septiembre" se lee como un sistema que está corriendo ahora mismo. */

/* Temporizadores de los demos: se limpian al abrir/cerrar el modal (ver app.js) */
const demoTimers = [];
const demoIntervals = [];
function dLater(fn, ms){ const id = setTimeout(fn, ms); demoTimers.push(id); return id; }
function dEvery(fn, ms){ const id = setInterval(fn, ms); demoIntervals.push(id); return id; }
function clearDemoTimers(){
  while(demoTimers.length) clearTimeout(demoTimers.pop());
  while(demoIntervals.length) clearInterval(demoIntervals.pop());
}

/* ---------- Fechas y horas reales ---------- */
const DIA_MS = 86400000;
function enDias(n){ return new Date(Date.now() + n*DIA_MS); }
function fechaCorta(n){
  return enDias(n).toLocaleDateString("es-MX",{day:"numeric",month:"short"}).replace(".","");
}
function fechaLarga(n){
  return enDias(n).toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});
}
function horaMas(min){
  return new Date(Date.now() + (min||0)*60000)
    .toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
}
const ahora = () => horaMas(0);
/* Próximo día de la semana con nombre: 1 = lunes … 6 = sábado */
function proximo(diaSemana){
  const hoy = new Date().getDay();
  let delta = (diaSemana - hoy + 7) % 7;
  if(delta === 0) delta = 7;
  return delta;
}
/* Próxima vez que el calendario llegue a ese día del mes */
function proximoDiaMes(dia){
  const hoy = new Date();
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
  if(d <= hoy) d.setMonth(d.getMonth()+1);
  return d.toLocaleDateString("es-MX",{day:"numeric",month:"short"}).replace(".","");
}

/* Folio estable durante toda la sesión del demo, con el formato que usaría el
   sistema real: prefijo + año + consecutivo. */
let folioSeq = Math.floor(Date.now()/1000) % 900 + 100;
function nuevoFolio(prefijo){
  folioSeq++;
  return prefijo + "-" + new Date().getFullYear() + "-" + String(folioSeq).padStart(4,"0");
}

/* Barra de estado tipo teléfono con la hora real */
function statusBar(){
  return `<div class="dapp-statusbar"><span>${ahora()}</span>
    <span aria-hidden="true">📶 LTE&nbsp;&nbsp;🔋 82%</span></div>`;
}

/* Cabecera de la app simulada */
function appHead(emoji, negocio, sub, extra){
  return `<div class="dapp-head">${statusBar()}
    <div class="dapp-head-row">
      <div class="dapp-head-txt"><h4>${emoji} ${negocio}</h4><small>${sub}</small></div>
      ${extra||""}
    </div>
  </div>`;
}

/* Fila de producto. El bloque de precio y cantidad baja a un segundo renglón
   cuando no cabe: antes se exprimía contra el nombre y el precio terminaba
   pintado a media descripción. */
function itemRow(o){
  return `<div class="dapp-item${o.mute?" is-mute":""}">
    <div class="main">
      ${o.emoji?`<div class="prod-emoji">${o.emoji}</div>`:""}
      <div class="info"><b>${o.title}</b><span>${o.meta}</span></div>
    </div>
    <div class="side">${o.side}</div>
  </div>`;
}

/* Botones − / cantidad / + */
function stepper(key, valor, opts){
  const o = opts||{};
  return `<button class="dapp-btn-sm minus" data-minus="${attr(key)}" aria-label="Quitar uno"${valor?"":" disabled"}>−</button>
    <span class="dapp-qty" aria-live="polite">${valor}${o.unidad?`<i>${o.unidad}</i>`:""}</span>
    <button class="dapp-btn-sm" data-plus="${attr(key)}" aria-label="Agregar uno"${o.tope&&valor>=o.tope?" disabled":""}>+</button>`;
}

/* Notificación flotante dentro del modal */
function toast(msg, icon){
  const modal = document.querySelector("#demoOverlay .modal");
  if(!modal) return;
  modal.querySelectorAll(".dapp-toast").forEach(t=>t.remove());
  const t = document.createElement("div");
  t.className = "dapp-toast";
  t.textContent = (icon||"✅") + " " + msg;
  modal.appendChild(t);
  requestAnimationFrame(()=>t.classList.add("show"));
  dLater(()=>{ t.classList.remove("show"); dLater(()=>t.remove(),300); },2400);
}

/* Pantalla de carga (skeleton) al abrir cada demo, como una app que trae datos */
function withLoading(root, paint){
  if(typeof reduced!=="undefined" && reduced){ paint(); return; }
  root.innerHTML = `<div class="dapp-body" style="padding-top:22px">
    <div class="skel skel-head"></div>
    <div class="skel skel-item"></div><div class="skel skel-item"></div>
    <div class="skel skel-item"></div><div class="skel skel-item"></div></div>`;
  dLater(paint, 450);
}

/* Mantiene el cursor al final al re-pintar un buscador */
function keepCaret(root, sel){
  const v = root.querySelector(sel);
  if(!v) return;
  v.focus();
  v.setSelectionRange(v.value.length, v.value.length);
}

function successScreen(container,icon,titulo,texto,detalle){
  container.innerHTML = `
    <div class="dapp-success">
      <div class="big">${icon}</div>
      <b>${titulo}</b>
      <p>${texto}</p>
      ${detalle?`<div class="dapp-receipt">${detalle}</div>`:""}
      <p class="dapp-note">Esto es una demostración. Tu versión real se conecta con tu operación y tus datos.</p>
    </div>`;
}

/* Gráfica de barras de la semana, en CSS puro */
function sparkline(datos, etiquetas){
  const max = Math.max(...datos), min = Math.min(...datos);
  /* Escala desde 28% en vez de desde cero: con barras de 68% a 100% las
     diferencias de la semana no se distinguían a simple vista. */
  const alto = v => Math.round(28 + 72*(v-min)/Math.max(1,max-min));
  return `<div class="spark" role="img" aria-label="Ventas de los últimos 7 días">
    ${datos.map((v,i)=>`<span class="spark-col">
      <i class="${i===datos.length-1?'hoy':''}" style="height:${alto(v)}%"></i>
      <em>${etiquetas[i]}</em></span>`).join("")}
  </div>`;
}

/* Miles con separador, para piezas y toneladas */
const miles = n => Number(n).toLocaleString("es-MX");
/* Para meter un nombre de producto en un atributo: las pulgadas (8") rompían
   el data-plus="…" y el botón dejaba de encontrar su partida. */
const attr = s => String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;");
/* Dólares con dos decimales, para FOB y precios referenciados en USD */
const usd = n => "USD " + n.toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
/* Tipo de cambio "del día": estable durante la visita, verosímil entre visitas */
const TC = 18.42;

const DEMOS = {

/* ============ 1. IMPORTACIONES ============
   Embarques del proveedor extranjero a la bodega: etapa, ETA, pedimento y el
   costeo landed (lo que de verdad cuesta cada pieza puesta en México), más
   la orden de compra al proveedor. */
importaciones:{
  title:"Importaciones y embarques",
  render(root){
    const ETAPAS = ["Zarpó del origen","En tránsito marítimo","En aduana · Manzanillo","Liberado · en camino a bodega","Recibido en bodega"];
    const provs = ["Shenzhen Hengli Tools","Ningbo Steelworks Co.","Houston Pump Supply"];
    let embarques = [
      {id:"MSKU-447812-3",prov:"Shenzhen Hengli Tools",desc:"Taladros y esmeriles",pz:1200,fob:48600,flete:2900,igi:5,etapa:2,eta:3,oc:"OC-2026-0318",cont:"40' HC",peso:"8,400 kg",ped:"26 47 3421 6012345"},
      {id:"TGHU-991204-7",prov:"Ningbo Steelworks Co.",desc:"Rodamientos y bandas",pz:3800,fob:31250,flete:2650,igi:10,etapa:1,eta:11,oc:"OC-2026-0322",cont:"20' DV",peso:"6,100 kg",ped:"—"},
      {id:"CMAU-205583-1",prov:"Houston Pump Supply",desc:"Bombas centrífugas 5 HP",pz:24,fob:62000,flete:1800,igi:0,etapa:4,eta:0,oc:"OC-2026-0301",cont:"Consolidado terrestre",peso:"2,900 kg",ped:"26 24 3410 6009871"},
      {id:"OOLU-883421-0",prov:"Shenzhen Hengli Tools",desc:"Refacciones y accesorios",pz:5400,fob:12800,flete:2400,igi:5,etapa:0,eta:26,oc:"OC-2026-0331",cont:"20' DV",peso:"3,200 kg",ped:"—"}
    ];
    const catalogo = [
      {n:"Taladro percutor 1/2\"",p:38.5,moq:200},
      {n:"Esmeril angular 4 1/2\"",p:27.9,moq:200},
      {n:"Rodamiento 6205-2RS",p:1.15,moq:1000},
      {n:"Banda en V A-42",p:2.4,moq:500},
      {n:"Bomba centrífuga 5 HP",p:2580,moq:4}
    ];
    let tab="En tránsito", view="lista", sel=null, oc={}, provOC=provs[0], incoterm="FOB";
    const abiertos = () => embarques.filter(e=>e.etapa<4);
    const enBodega = () => embarques.filter(e=>e.etapa===4);

    /* Costeo landed: lo que cuesta cada pieza ya en bodega, en pesos */
    function costeo(e){
      const fobMX = e.fob*TC, fleteMX = e.flete*TC, seguro = Math.round(fobMX*0.004);
      const base = fobMX+fleteMX+seguro;
      const igi = Math.round(base*e.igi/100), dta = Math.round(base*0.008);
      const iva = Math.round((base+igi+dta)*0.16);
      const aa = Math.round(base*0.0045)+6500;
      const total = Math.round(base+igi+dta+iva+aa);
      return {fobMX:Math.round(fobMX),fleteMX:Math.round(fleteMX),seguro,igi,dta,iva,aa,total,unit:total/e.pz};
    }
    const tagEtapa = e => e.etapa===4?'<span class="dapp-badge green">En bodega</span>'
      : e.etapa===2?'<span class="dapp-badge amber">En aduana</span>'
      : e.etapa===3?'<span class="dapp-badge violet">Liberado</span>':'<span class="dapp-badge violet">En tránsito</span>';

    /* La aduana libera un contenedor mientras la persona mira: así se siente un sistema vivo */
    dLater(()=>{
      const e = embarques.find(x=>x.id==="MSKU-447812-3");
      if(e && e.etapa===2){ e.etapa=3; e.eta=1; toast("MSKU-447812-3 liberado en aduana","🛃"); if(view!=="oc") paint(); }
    },7000);

    function paint(){
      if(view==="detalle" && sel){
        const e = sel, c = costeo(e);
        root.innerHTML =
          appHead("🚢","Contenedor "+e.id,e.desc+" · "+miles(e.pz)+" pz · "+e.cont) + `
          <div class="dapp-body">
            <div class="dapp-countdown">
              <div><span>${e.etapa===4?"Recibido":"Llegada estimada a bodega"}</span><b>${e.etapa===4?"Completo":e.eta===0?"Hoy":e.eta===1?"Mañana":fechaCorta(e.eta)}</b></div>
              ${tagEtapa(e)}
            </div>
            <div class="dapp-timeline">
              ${ETAPAS.map((p,i)=>`<div class="tl-step ${i<e.etapa?"done":i===e.etapa?"now":""}">
                <div class="tl-dot">${i<e.etapa?"✓":i===e.etapa?"●":""}</div>
                <div><b>${p}</b><span>${i===2&&e.etapa>=2?"Pedimento "+e.ped:i===e.etapa?"ahora mismo":i<e.etapa?fechaCorta(-(e.etapa-i)*6):"—"}</span></div>
              </div>`).join("")}
            </div>
            <div class="dapp-label">Costeo landed · TC ${TC.toFixed(2)} (DOF de hoy)</div>
            <div class="dapp-sheet">
              <div class="dapp-row"><span>FOB ${usd(e.fob)}</span><span>${money(c.fobMX)}</span></div>
              <div class="dapp-row"><span>Flete marítimo ${usd(e.flete)}</span><span>${money(c.fleteMX)}</span></div>
              <div class="dapp-row"><span>Seguro 0.4%</span><span>${money(c.seguro)}</span></div>
              <div class="dapp-row"><span>IGI ${e.igi}%</span><span>${money(c.igi)}</span></div>
              <div class="dapp-row"><span>DTA 0.8%</span><span>${money(c.dta)}</span></div>
              <div class="dapp-row"><span>IVA 16%</span><span>${money(c.iva)}</span></div>
              <div class="dapp-row"><span>Agente aduanal y maniobras</span><span>${money(c.aa)}</span></div>
              <div class="dapp-row total"><span>Costo total en bodega</span><span>${money(c.total)}</span></div>
              <div class="dapp-row is-ok"><span><b>Costo por pieza</b></span><span><b>${money(Math.round(c.unit*100)/100)}</b></span></div>
            </div>
            <p class="dapp-note">El costo por pieza se recalcula solo con el tipo de cambio del día: el precio de venta nunca se queda viejo.</p>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Embarques</button>
            <button class="dapp-cta" id="avisar">📲 Avisar a ventas</button>
          </div>`;
        root.querySelector("#back").onclick=()=>{view="lista";paint();};
        root.querySelector("#avisar").onclick=()=>toast("Ventas recibió el costo landed y la fecha de llegada","📲");
        return;
      }
      if(view==="oc"){
        const sub = Object.entries(oc).reduce((s,[k,v])=>s+catalogo.find(c=>c.n===k).p*v,0);
        root.innerHTML =
          appHead("📝","Nueva orden de compra","Al proveedor · partidas en USD") + `
          <div class="dapp-body">
            <div class="dapp-label">Proveedor</div>
            <div class="dapp-chips">${provs.map(p=>`<button class="chip ${p===provOC?'on':''}" data-prov="${p}">${p}</button>`).join("")}</div>
            <div class="dapp-label">Incoterm</div>
            <div class="dapp-chips">${["FOB","CIF","EXW"].map(i=>`<button class="chip ${i===incoterm?'on':''}" data-inc="${i}">${i}</button>`).join("")}</div>
            ${catalogo.map(it=>itemRow({
              title: it.n,
              meta: `${usd(it.p)} c/u · mínimo ${miles(it.moq)} pz`,
              side: stepper(it.n, oc[it.n]||0)
            })).join("")}
            <p class="dapp-note">Las cantidades suben de 100 en 100 para taladros y esmeriles, de 500 en rodamientos y bandas y de 1 en bombas, como vende cada proveedor.</p>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Embarques</button>
            <div class="dapp-total"><span>Subtotal ${incoterm}</span><b>${usd(sub)}</b></div>
            <button class="dapp-cta" id="enviar" ${sub===0?"disabled":""}>Enviar OC</button>
          </div>`;
        root.querySelectorAll("[data-prov]").forEach(b=>b.onclick=()=>{provOC=b.dataset.prov;paint();});
        root.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>{incoterm=b.dataset.inc;paint();});
        const paso = n => n.startsWith("Bomba")?1:n.startsWith("Rodamiento")||n.startsWith("Banda")?500:100;
        root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{const k=b.dataset.plus;oc[k]=(oc[k]||0)+paso(k);paint();});
        root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{const k=b.dataset.minus;if(oc[k]){oc[k]=Math.max(0,oc[k]-paso(k));if(!oc[k])delete oc[k];}paint();});
        root.querySelector("#back").onclick=()=>{view="lista";paint();};
        root.querySelector("#enviar").onclick=()=>{
          const folio = nuevoFolio("OC");
          const pz = Object.values(oc).reduce((a,b)=>a+b,0);
          toast("OC "+folio+" enviada a "+provOC,"✅");
          successScreen(root,"📝","Orden de compra enviada",
            "El proveedor la recibe por correo con la proforma; en cuanto confirme, el embarque aparece en la lista con su ETA.",
            `<div class="dapp-row"><span>Folio</span><span>${folio}</span></div>
             <div class="dapp-row"><span>Proveedor</span><span>${provOC}</span></div>
             <div class="dapp-row"><span>Incoterm</span><span>${incoterm}</span></div>
             <div class="dapp-row"><span>Piezas</span><span>${miles(pz)}</span></div>
             <div class="dapp-row"><span>Tránsito estimado</span><span>${provOC.includes("Houston")?"8 días":"34 días"}</span></div>
             <div class="dapp-row total"><span>Total ${incoterm}</span><span>${usd(sub)}</span></div>`);
          oc={}; view="lista";
        };
        return;
      }
      const lista = tab==="En tránsito"?abiertos():enBodega();
      root.innerHTML =
        appHead("🚢","Grupo Altamira","Importaciones · comercio exterior",`<button class="dapp-mini" id="nuevaOC">+ Orden de compra</button>`) + `
        <div class="dapp-body">
          <div class="stat-grid">
            <div class="stat-card"><span>En tránsito</span><b>${abiertos().length}</b><em>${usd(fobTotal(abiertos()))}</em></div>
            <div class="stat-card"><span>En aduana</span><b>${embarques.filter(e=>e.etapa===2).length}</b><em class="${embarques.some(e=>e.etapa===2)?"is-bad":""}">${embarques.some(e=>e.etapa===2)?"pedimento en curso":"ninguno"}</em></div>
            <div class="stat-card"><span>TC hoy</span><b>${TC.toFixed(2)}</b><em>DOF</em></div>
          </div>
          <div class="dapp-tabs">${["En tránsito","En bodega"].map(t=>`<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t} (${t==="En tránsito"?abiertos().length:enBodega().length})</button>`).join("")}</div>
          ${lista.map(e=>itemRow({
            emoji: e.etapa===4?"🏭":e.etapa===2?"🛃":"🚢",
            title: `${e.id} ${tagEtapa(e)}`,
            meta: `${e.desc} · ${miles(e.pz)} pz · ${e.prov}<br>${e.etapa===4?"Recibido completo":"ETA "+(e.eta===0?"hoy":e.eta===1?"mañana":fechaCorta(e.eta))} · ${e.oc}`,
            side: `<button class="dapp-tab" data-ver="${e.id}">Ver</button>`
          })).join("")}
          <p class="dapp-note">Cada contenedor se actualiza con el aviso de la naviera y del agente aduanal: nadie llama a preguntar "¿ya llegó?".</p>
        </div>`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-ver]").forEach(b=>b.onclick=()=>{sel=embarques.find(e=>e.id===b.dataset.ver);view="detalle";paint();});
      root.querySelector("#nuevaOC").onclick=()=>{view="oc";paint();};
    }
    function fobTotal(l){ return l.reduce((s,e)=>s+e.fob,0); }
    withLoading(root, paint);
  }
},

/* ============ 2. FLOTILLA ============
   Torre de control de entregas: unidades en ruta, choferes, paradas con hora
   prevista y real, evidencia de entrega y la vista del chofer. */
flotilla:{
  title:"Torre de control",
  render(root){
    let unidades = [
      {u:"Unidad 14",chofer:"Beto Márquez",ruta:"Ruta Norte",estado:"en ruta",hechas:5,total:8,x:.62,y:.28,dx:.004,dy:.003,retraso:0,
        paradas:[["Ferretería Industrial Garza","08:40","08:36"],["Maquinados del Norte","09:20","09:25"],["Grupo Acerero Apodaca","10:05","10:02"],["Bodega Santa Catarina","10:50","10:58"],["Plásticos Monterrey","11:30","11:27"],["Fundidora Escobedo","12:10",""],["Transformadores del Bajío","12:50",""],["Base","13:30",""]]},
      {u:"Unidad 9",chofer:"Lupe Hernández",ruta:"Ruta Poniente",estado:"retrasado",hechas:3,total:7,x:.22,y:.55,dx:.003,dy:-.002,retraso:14,
        paradas:[["Cementos Regionales","08:30","08:33"],["Aceros García","09:15","09:12"],["Maderas y Triplay SA","10:00","10:40"],["Industrias Lerma","10:45",""],["Envases del Centro","11:30",""],["Papelera San Rafael","12:15",""],["Base","13:00",""]]},
      {u:"Unidad 21",chofer:"Carlos Ruiz",ruta:"Ruta Sur",estado:"entregando",hechas:6,total:6,x:.48,y:.72,dx:-.003,dy:.002,retraso:0,
        paradas:[["Vidriera Guadalupe","08:20","08:18"],["Tornillería Juárez","09:00","08:55"],["Galvanizados SA","09:40","09:44"],["Grupo Vitro Planta 2","10:30","10:28"],["Empaques Nacionales","11:10","11:05"],["Base","12:00","11:52"]]},
      {u:"Unidad 3",chofer:"Toño Salas",ruta:"Carga en base",estado:"en base",hechas:0,total:5,x:.85,y:.82,dx:0,dy:0,retraso:0,paradas:[]}
    ];
    let view="torre", sel=null, chofer=null, paso=null, etaMin=12;
    const entregas = () => unidades.reduce((s,u)=>s+u.hechas,0);
    const totales = () => unidades.reduce((s,u)=>s+u.total,0);
    const badge = u => u.estado==="retrasado"?'<span class="dapp-badge red">Retraso '+u.retraso+' min</span>'
      : u.estado==="en base"?'<span class="dapp-badge amber">En base</span>'
      : u.estado==="entregando"?'<span class="dapp-badge green">Entregando</span>':'<span class="dapp-badge violet">En ruta</span>';

    /* Las unidades se mueven en el mapa y el reloj del chofer corre */
    dEvery(()=>{
      unidades.forEach(u=>{ if(u.estado==="en base") return;
        u.x=Math.min(.95,Math.max(.05,u.x+u.dx)); u.y=Math.min(.95,Math.max(.05,u.y+u.dy));
        if(u.x<=.05||u.x>=.95) u.dx*=-1; if(u.y<=.05||u.y>=.95) u.dy*=-1; });
      root.querySelectorAll("[data-pin]").forEach(p=>{const u=unidades.find(x=>x.u===p.dataset.pin); if(u){p.style.left=(u.x*100)+"%";p.style.top=(u.y*100)+"%";}});
    },900);
    dEvery(()=>{ if(etaMin>1) etaMin--; const el=root.querySelector("#etaMin"); if(el) el.textContent=etaMin+" min"; },4000);
    dLater(()=>{ toast("Unidad 9 confirmó la parada 4 · retraso recuperado","✅"); const u=unidades[1]; u.estado="en ruta"; u.retraso=0; u.hechas=4; u.paradas[3][2]=ahora(); if(view==="torre") paint(); },9000);

    function mapa(){
      return `<div class="fleet-map" aria-hidden="true">
        ${unidades.map(u=>`<span class="fleet-pin ${u.estado.replace(" ","-")}" data-pin="${u.u}" style="left:${u.x*100}%;top:${u.y*100}%"><i>${u.u.replace("Unidad ","")}</i></span>`).join("")}
        <b class="fleet-base">Base</b>
      </div>`;
    }

    function paint(){
      if(view==="unidad" && sel){
        const u = sel;
        root.innerHTML =
          appHead("🚛",u.u+" · "+u.chofer,u.ruta+" · "+u.hechas+" de "+u.total+" paradas") + `
          <div class="dapp-body">
            <div class="dapp-card">
              <div class="dapp-row" style="padding:0"><span><b>Avance de la ruta</b></span><span><b>${Math.round(u.hechas/u.total*100)}%</b></span></div>
              <div class="credit-bar"><div class="credit-fill${u.estado==="retrasado"?" is-hot":""}" style="transform:scaleX(${u.hechas/u.total})"></div></div>
              <span class="muted small">${u.estado==="retrasado"?"Va "+u.retraso+" min tarde · el cliente de la siguiente parada ya fue avisado":"En tiempo · siguiente parada en "+etaMin+" min"}</span>
            </div>
            <div class="dapp-timeline">
              ${u.paradas.map(([n,prev,real],i)=>`<div class="tl-step ${real?"done":i===u.hechas?"now":""}">
                <div class="tl-dot">${real?"✓":i===u.hechas?"●":""}</div>
                <div><b>${n}</b><span>Prevista ${prev}${real?" · llegó "+real+(real>prev?' <span class="dapp-badge amber">tarde</span>':' <span class="dapp-badge green">a tiempo</span>'):""}${real&&n!=="Base"?" · 📷 foto · ✍️ firma":""}</span></div>
              </div>`).join("")}
            </div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Torre</button>
            <button class="dapp-cta" id="modoChofer">📱 Ver como el chofer</button>
          </div>`;
        root.querySelector("#back").onclick=()=>{view="torre";paint();};
        root.querySelector("#modoChofer").onclick=()=>{chofer=u;paso=0;view="chofer";paint();};
        return;
      }
      if(view==="chofer" && chofer){
        const u = chofer, i = u.hechas, [n,prev] = u.paradas[i]||["Base","—"];
        root.innerHTML =
          appHead("📱","App del chofer",u.chofer+" · "+u.u) + `
          <div class="dapp-body">
            <div class="dapp-countdown">
              <div><span>Siguiente parada</span><b style="font-size:1.25rem">${n}</b></div>
              <span class="dapp-badge violet" id="etaMin">${etaMin} min</span>
            </div>
            <div class="dapp-card">
              <div class="dapp-row"><span class="muted">Ventana de entrega</span><span>${prev} – ${horaMas(45).slice(0,5)}</span></div>
              <div class="dapp-row"><span class="muted">Contacto en sitio</span><span>Recepción · ext. 204</span></div>
              <div class="dapp-row"><span class="muted">Carga</span><span>6 tarimas · 2,400 kg</span></div>
            </div>
            ${paso===0?`<button class="dapp-cta full" id="llegue">📍 Llegué al sitio</button>`
            :paso===1?`<div class="dapp-label">Evidencia de entrega</div>
              <button class="dapp-repeat" id="foto">📷 Tomar foto de la carga entregada<small>Se guarda con hora y ubicación GPS</small></button>
              <button class="dapp-repeat" id="firma">✍️ Firma de quien recibe<small>En la pantalla del teléfono</small></button>`
            :`<div class="dapp-alert blue"><span class="ico">✅</span><div class="body"><b>Entrega registrada a las ${ahora()}</b><span>Foto, firma y GPS ya están en la torre de control y en el portal del cliente.</span></div></div>
              <button class="dapp-cta full" id="siguiente">Ir a la siguiente parada →</button>`}
            <p class="dapp-note">Sin llamadas: la torre ve cada parada en el momento, y el cliente recibe la evidencia por WhatsApp.</p>
          </div>
          <div class="dapp-bar"><button class="dapp-tab" id="back">← ${u.u}</button></div>`;
        root.querySelector("#back").onclick=()=>{sel=u;view="unidad";paint();};
        const l=root.querySelector("#llegue"); if(l) l.onclick=()=>{paso=1;toast("Llegada registrada · "+ahora(),"📍");paint();};
        let evid = 0;
        const f=root.querySelector("#foto"), fi=root.querySelector("#firma");
        const listo=()=>{ if(evid>=2){ u.paradas[i][2]=ahora(); u.hechas=Math.min(u.total,u.hechas+1); paso=2; toast("Entrega confirmada","✅"); paint(); } };
        if(f) f.onclick=()=>{ if(!f.classList.contains("is-done")){ f.classList.add("is-done"); f.querySelector("small").textContent="Foto guardada · "+ahora(); evid++; listo(); } };
        if(fi) fi.onclick=()=>{ if(!fi.classList.contains("is-done")){ fi.classList.add("is-done"); fi.querySelector("small").textContent="Firmó: recepción · "+ahora(); evid++; listo(); } };
        const sg=root.querySelector("#siguiente"); if(sg) sg.onclick=()=>{paso=0;etaMin=9+Math.floor(Math.random()*9);paint();};
        return;
      }
      root.innerHTML =
        appHead("🚛","Transportes Río Bravo","Torre de control · "+fechaLarga(0)) + `
        <div class="dapp-body">
          <div class="stat-grid">
            <div class="stat-card"><span>Entregas</span><b>${entregas()}/${totales()}</b><em>hoy</em></div>
            <div class="stat-card"><span>En ruta</span><b>${unidades.filter(u=>u.estado!=="en base").length}</b><em>unidades</em></div>
            <div class="stat-card"><span>Retrasos</span><b>${unidades.filter(u=>u.estado==="retrasado").length}</b><em class="${unidades.some(u=>u.estado==="retrasado")?"is-bad":""}">${unidades.some(u=>u.estado==="retrasado")?"cliente avisado":"ninguno"}</em></div>
          </div>
          ${mapa()}
          ${unidades.map(u=>itemRow({
            emoji: u.estado==="en base"?"🏭":"🚛",
            title: `${u.u} ${badge(u)}`,
            meta: `${u.chofer} · ${u.ruta}${u.total?" · "+u.hechas+"/"+u.total+" paradas":""}`,
            side: `<button class="dapp-tab" data-ver="${u.u}" ${u.estado==="en base"?"disabled":""}>Ver ruta</button>`
          })).join("")}
          <p class="dapp-note">La posición viene del celular del chofer cada 30 s; las alertas de retraso se calculan contra la ventana de cada cliente.</p>
        </div>`;
      root.querySelectorAll("[data-ver]").forEach(b=>b.onclick=()=>{sel=unidades.find(u=>u.u===b.dataset.ver);view="unidad";paint();});
    }
    withLoading(root, paint);
  }
},

/* ============ 3. ALMACÉN ============
   Inventario por ubicación y lote, surtido y recepción con escáner, y el
   reorden que se dispara solo al tocar el mínimo. */
almacen:{
  title:"Almacén e inventario",
  render(root){
    let items = [
      {sku:"44-118",n:"Rodamiento 6205-2RS",ub:"A-07-2",hay:320,min:150,max:800,u:"pz",lote:"L-2609",prov:"Ningbo Steelworks"},
      {sku:"44-131",n:"Banda en V A-42",ub:"A-07-3",hay:96,min:120,max:600,u:"pz",lote:"L-2588",prov:"Ningbo Steelworks"},
      {sku:"51-204",n:"Taladro percutor 1/2\"",ub:"B-02-1",hay:48,min:60,max:300,u:"pz",lote:"L-2611",prov:"Shenzhen Hengli"},
      {sku:"51-207",n:"Esmeril angular 4 1/2\"",ub:"B-02-2",hay:210,min:60,max:300,u:"pz",lote:"L-2611",prov:"Shenzhen Hengli"},
      {sku:"70-015",n:"Bomba centrífuga 5 HP",ub:"C-01-1",hay:7,min:4,max:20,u:"pz",lote:"L-2602",prov:"Houston Pump"},
      {sku:"33-402",n:"Guante nitrilo T-9 (caja)",ub:"D-11-4",hay:12,min:40,max:200,u:"caja",lote:"L-2597",prov:"Seguridad Total"},
      {sku:"33-410",n:"Casco industrial clase E",ub:"D-11-2",hay:0,min:25,max:120,u:"pz",lote:"—",prov:"Seguridad Total"}
    ];
    let surtido = {folio:"OS-"+new Date().getFullYear()+"-0417",cliente:"Maquinados del Norte",lineas:[["44-118",40,false],["51-207",6,false],["33-402",4,false],["70-015",1,false]]};
    let recepcion = {oc:"OC-2026-0301",prov:"Houston Pump Supply",lineas:[["70-015",24,24],["44-118",0,0]]};
    let tab="Existencias", q="", sel=null, view="lista";
    const find = s => items.find(i=>i.sku===s);
    const bajos = () => items.filter(i=>i.hay<i.min);
    const estado = i => i.hay===0?'<span class="dapp-badge red">Agotado</span>':i.hay<i.min?'<span class="dapp-badge amber">Bajo mínimo</span>':'<span class="dapp-badge green">OK</span>';
    const ocupacion = () => Math.round(items.reduce((s,i)=>s+i.hay/i.max,0)/items.length*100);

    function paint(){
      if(view==="item" && sel){
        const i = sel;
        root.innerHTML =
          appHead("📦",i.n,"SKU "+i.sku+" · ubicación "+i.ub) + `
          <div class="dapp-body">
            <div class="stat-grid">
              <div class="stat-card"><span>Existencia</span><b>${i.hay}</b><em>${i.u}</em></div>
              <div class="stat-card"><span>Mínimo</span><b>${i.min}</b><em>reorden</em></div>
              <div class="stat-card"><span>Máximo</span><b>${i.max}</b><em>capacidad</em></div>
            </div>
            <div class="dapp-card">
              <div class="dapp-row" style="padding:0"><span><b>Nivel</b></span><span>${estado(i)}</span></div>
              <div class="credit-bar"><div class="credit-fill${i.hay<i.min?" is-hot":""}" style="transform:scaleX(${Math.min(1,i.hay/i.max)})"></div></div>
              <span class="muted small">Lote ${i.lote} · proveedor ${i.prov}</span>
            </div>
            <div class="dapp-label">Últimos movimientos</div>
            <div class="dapp-sheet">
              <div class="dapp-row"><span>Salida · OS-${new Date().getFullYear()}-0412 · ${fechaCorta(-1)}</span><span class="is-bad">−${Math.max(2,Math.round(i.min*0.2))}</span></div>
              <div class="dapp-row"><span>Entrada · ${i.prov.split(" ")[0]} · ${fechaCorta(-6)}</span><span class="is-ok">+${Math.round(i.max*0.4)}</span></div>
              <div class="dapp-row"><span>Conteo cíclico · ${fechaCorta(-9)}</span><span>sin diferencia</span></div>
            </div>
            ${i.hay<i.min?`<div class="dapp-alert amber"><span class="ico">🤖</span><div class="body"><b>Reorden sugerido: ${i.max-i.hay} ${i.u}</b><span>Para volver al máximo · ${i.prov} entrega en ${i.prov.includes("Houston")?"8":"34"} días</span>
              <div class="approve-btns"><button class="btn-approve yes" id="reordenar">Generar OC ✓</button></div></div></div>`:""}
          </div>
          <div class="dapp-bar"><button class="dapp-tab" id="back">← Existencias</button><button class="dapp-tab" id="conteo">🔢 Conteo cíclico</button></div>`;
        root.querySelector("#back").onclick=()=>{view="lista";paint();};
        root.querySelector("#conteo").onclick=()=>toast("Conteo programado para mañana 7:00 · "+i.ub,"🔢");
        const r=root.querySelector("#reordenar"); if(r) r.onclick=()=>{ const f=nuevoFolio("OC"); toast(f+" generada a "+i.prov,"📝"); i.min=i.min; sel=null; view="lista"; paint(); };
        return;
      }
      const lista = q ? items.filter(i=>(i.sku+" "+i.n+" "+i.ub).toLowerCase().includes(q.toLowerCase())) : items;
      const pend = surtido.lineas.filter(l=>!l[2]).length;
      root.innerHTML =
        appHead("📦","Almacén Central","Industrias Monterrey · nave 2") + `
        <div class="dapp-body">
          <div class="stat-grid">
            <div class="stat-card"><span>Exactitud</span><b>99.2%</b><em>último conteo</em></div>
            <div class="stat-card"><span>Ocupación</span><b>${ocupacion()}%</b><em>de capacidad</em></div>
            <div class="stat-card"><span>Bajo mínimo</span><b>${bajos().length}</b><em class="${bajos().length?"is-bad":""}">SKU</em></div>
          </div>
          <div class="dapp-tabs">${["Existencias","Surtido","Recepción"].map(t=>`<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Surtido"&&pend?" ("+pend+")":""}</button>`).join("")}</div>
          ${tab==="Existencias"?`
            <input class="dapp-search" id="q" placeholder="📷 Escanea o escribe SKU, nombre o ubicación…" value="${q}" aria-label="Buscar en inventario">
            ${lista.length?lista.map(i=>itemRow({
              title:`${i.n} ${estado(i)}`,
              meta:`<b class="sku">${i.sku}</b> · ${i.ub} · lote ${i.lote}`,
              side:`<span class="price">${i.hay}<i>/${i.u}</i></span><button class="dapp-tab" data-ver="${i.sku}">Ver</button>`
            })).join(""):`<div class="dapp-empty"><span>🔍</span><b>Sin resultados para "${q}"</b><p>Escanea el código o busca por ubicación (A-07-2).</p></div>`}`
          :tab==="Surtido"?`
            <div class="dapp-alert blue"><span class="ico">🗂️</span><div class="body"><b>${surtido.folio} · ${surtido.cliente}</b><span>${surtido.lineas.length} líneas ordenadas por pasillo para no dar vueltas</span></div></div>
            ${surtido.lineas.map((l,ix)=>{const i=find(l[0]);return itemRow({
              emoji:l[2]?"✅":"📍",
              title:`${i.n}`,
              meta:`Ir a <b class="sku">${i.ub}</b> · tomar ${l[1]} ${i.u} · quedan ${i.hay}`,
              side:l[2]?'<span class="dapp-badge green">Tomado</span>':`<button class="dapp-tab" data-tomar="${ix}">Escanear ✓</button>`
            });}).join("")}`
          :`
            <div class="dapp-alert blue"><span class="ico">🚚</span><div class="body"><b>${recepcion.oc} · ${recepcion.prov}</b><span>Contra la orden de compra: lo que no coincide se marca solo</span></div></div>
            ${recepcion.lineas.map((l,ix)=>{const i=find(l[0]);return itemRow({
              title:`${i.n}`,
              meta:`Esperado <b>${l[1]||"no en OC"}</b> · recibido <b>${l[2]}</b>${l[1]&&l[2]!==l[1]?' <span class="dapp-badge amber">Discrepancia</span>':l[1]?' <span class="dapp-badge green">Coincide</span>':' <span class="dapp-badge red">No pedido</span>'}`,
              side:stepper("r"+ix,l[2])
            });}).join("")}`}
        </div>
        ${tab==="Surtido"?`<div class="dapp-bar"><div class="dapp-total"><span>${surtido.lineas.length-pend} de ${surtido.lineas.length} líneas</span><b>${pend?"En proceso":"Listo"}</b></div><button class="dapp-cta" id="cerrarSurtido" ${pend?"disabled":""}>Cerrar surtido</button></div>`
        :tab==="Recepción"?`<div class="dapp-bar"><div class="dapp-total"><span>${recepcion.lineas.reduce((s,l)=>s+l[2],0)} piezas</span><b>${recepcion.lineas.some(l=>l[1]&&l[2]!==l[1])?"Con discrepancias":"Completa"}</b></div><button class="dapp-cta" id="confirmarEntrada">Confirmar entrada</button></div>`:""}`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      const inp=root.querySelector("#q"); if(inp) inp.oninput=e=>{q=e.target.value;paint();keepCaret(root,"#q");};
      root.querySelectorAll("[data-ver]").forEach(b=>b.onclick=()=>{sel=find(b.dataset.ver);view="item";paint();});
      root.querySelectorAll("[data-tomar]").forEach(b=>b.onclick=()=>{const l=surtido.lineas[+b.dataset.tomar];const i=find(l[0]);l[2]=true;i.hay=Math.max(0,i.hay-l[1]);toast(i.ub+" · "+l[1]+" "+i.u+" descontadas","📷");paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{recepcion.lineas[+b.dataset.plus.slice(1)][2]++;paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{const l=recepcion.lineas[+b.dataset.minus.slice(1)];if(l[2]>0)l[2]--;paint();});
      const cs=root.querySelector("#cerrarSurtido"); if(cs) cs.onclick=()=>{toast(surtido.folio+" cerrado · embarque listo","✅");successScreen(root,"🗂️","Surtido cerrado",
        "El embarque quedó listo en andén 2 y el cliente recibió el aviso con su guía.",
        `<div class="dapp-row"><span>Orden</span><span>${surtido.folio}</span></div><div class="dapp-row"><span>Cliente</span><span>${surtido.cliente}</span></div><div class="dapp-row"><span>Líneas</span><span>${surtido.lineas.length}</span></div><div class="dapp-row total"><span>Tiempo de surtido</span><span>11 min</span></div>`);};
      const ce=root.querySelector("#confirmarEntrada"); if(ce) ce.onclick=()=>{
        recepcion.lineas.forEach(l=>{const i=find(l[0]);i.hay+=l[2];});
        const disc=recepcion.lineas.filter(l=>l[1]&&l[2]!==l[1]).length;
        toast("Entrada registrada · existencias actualizadas","✅");
        successScreen(root,"🚚","Entrada registrada",
          disc?"Las discrepancias ya le llegaron a compras para reclamarlas al proveedor.":"Todo coincidió con la orden de compra. Compras ya puede liberar el pago.",
          `<div class="dapp-row"><span>OC</span><span>${recepcion.oc}</span></div><div class="dapp-row"><span>Proveedor</span><span>${recepcion.prov}</span></div><div class="dapp-row"><span>Discrepancias</span><span>${disc}</span></div><div class="dapp-row total"><span>Piezas en existencia</span><span>+${recepcion.lineas.reduce((s,l)=>s+l[2],0)}</span></div>`);};
    }
    withLoading(root, paint);
  }
},

/* ============ 4. COTIZADOR AUTOMÁTICO ============
   Cotización B2B en segundos: precio por nivel de cliente, descuento por
   volumen, referencias en USD con el tipo de cambio del día, tiempo de
   entrega según existencia, vigencia y seguimiento hasta el pedido. */
cotizador:{
  title:"Cotizador automático",
  render(root){
    const clientes = [
      {n:"Constructora Vega",nivel:"Proyecto",desc:8},
      {n:"Herrería Industrial MTY",nivel:"Distribuidor",desc:5},
      {n:"Nuevo cliente",nivel:"Lista",desc:0}
    ];
    const cat = [
      {n:"Viga IPR 8\" × 31 lb",u:"ton",p:24800,hay:42,ent:"inmediato"},
      {n:"PTR 2\" × 2\" cal. 14",u:"ton",p:26900,hay:18,ent:"inmediato"},
      {n:"Lámina galvanizada cal. 22",u:"ton",p:29400,hay:9,ent:"3 días"},
      {n:"Tubería negra 4\" ced. 40",u:"ton",p:31200,hay:0,ent:"sobre pedido · 12 días"},
      {n:"Varilla corrugada 3/8\"",u:"ton",p:17950,hay:120,ent:"inmediato"},
      {n:"Placa A-36 1/2\" (ref. USD)",u:"ton",usd:1540,hay:6,ent:"3 días"}
    ];
    let cliente=clientes[1], qty={}, view="arma", folio=null, estado=0, pedido=null;
    const precio = it => it.usd ? Math.round(it.usd*TC) : it.p;
    const sub = () => Object.entries(qty).reduce((s,[k,v])=>s+precio(cat.find(c=>c.n===k))*v,0);
    const ton = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const descNivel = () => Math.round(sub()*cliente.desc/100);
    const descVol = () => ton()>=10 ? Math.round((sub()-descNivel())*0.03) : 0;
    const iva = () => Math.round((sub()-descNivel()-descVol())*0.16);
    const total = () => sub()-descNivel()-descVol()+iva();
    const entrega = () => Object.keys(qty).some(k=>cat.find(c=>c.n===k).hay===0)?"12 días (hay partidas sobre pedido)":Object.keys(qty).some(k=>cat.find(c=>c.n===k).ent==="3 días")?"3 días hábiles":"inmediata";

    function paint(){
      if(view==="seguimiento"){
        const pasos=[["Cotización generada","en 12 segundos · enviada por correo y WhatsApp"],["El cliente la abrió","con el enlace de seguimiento"],["Aceptada por el cliente","con firma electrónica"],["Convertida en pedido","sin volver a capturar nada"]];
        root.innerHTML =
          appHead("🧾","Cotización "+folio,cliente.n+" · vigente hasta el "+fechaCorta(7)) + `
          <div class="dapp-body">
            <div class="dapp-countdown"><div><span>Total cotizado</span><b style="font-size:1.5rem">${money(total())}</b></div><span class="dapp-badge violet">${["Enviada","Vista","Aceptada","Pedido"][estado]}</span></div>
            <div class="dapp-timeline">
              ${pasos.map(([p,s],i)=>`<div class="tl-step ${i<estado?"done":i===estado?"now":""}"><div class="tl-dot">${i<estado?"✓":i===estado?"●":""}</div><div><b>${p}</b><span>${i<=estado?s:"—"}</span></div></div>`).join("")}
            </div>
            ${estado===2?`<div class="dapp-alert blue"><span class="ico">🎉</span><div class="body"><b>El cliente aceptó</b><span>Un clic la convierte en pedido con las mismas partidas, precios y tiempo de entrega.</span>
              <div class="approve-btns"><button class="btn-approve yes" id="convertir">Convertir en pedido ✓</button></div></div></div>`
            :estado===3?`<div class="dapp-alert blue"><span class="ico">📦</span><div class="body"><b>Pedido ${pedido} creado</b><span>Entrega ${entrega()} · almacén ya tiene la orden de surtido.</span></div></div>`
            :`<p class="dapp-note">Esta pantalla se actualiza sola cuando el cliente abre o acepta la cotización.</p>`}
          </div>
          <div class="dapp-bar"><button class="dapp-tab" id="otra">+ Nueva cotización</button>${estado<2?`<button class="dapp-tab" id="recordar">📲 Recordar al cliente</button>`:""}</div>`;
        root.querySelector("#otra").onclick=()=>{qty={};view="arma";estado=0;paint();};
        const r=root.querySelector("#recordar"); if(r) r.onclick=()=>toast("Recordatorio enviado por WhatsApp","📲");
        const c=root.querySelector("#convertir"); if(c) c.onclick=()=>{pedido=nuevoFolio("PED");estado=3;toast("Pedido "+pedido+" creado","📦");paint();};
        return;
      }
      root.innerHTML =
        appHead("🧾","Aceros y Perfiles del Norte","Cotizador · TC "+TC.toFixed(2)+" · "+fechaCorta(0)) + `
        <div class="dapp-body">
          <div class="dapp-label">Cliente</div>
          <div class="dapp-chips">${clientes.map(c=>`<button class="chip ${c.n===cliente.n?'on':''}" data-cli="${c.n}">${c.n} · ${c.nivel}${c.desc?" −"+c.desc+"%":""}</button>`).join("")}</div>
          ${cat.map(it=>itemRow({
            mute: it.hay===0 && !qty[it.n],
            title: `${it.n}${it.hay===0?' <span class="dapp-badge amber">Sobre pedido</span>':it.hay<10?' <span class="dapp-badge amber">Quedan '+it.hay+' t</span>':""}`,
            meta: `${money(precio(it))}/${it.u}${it.usd?" · "+usd(it.usd)+" × "+TC.toFixed(2):""} · entrega ${it.ent}`,
            side: stepper(it.n, qty[it.n]||0, {unidad:"t"})
          })).join("")}
          ${ton()>0&&ton()<10?`<div class="dapp-alert amber"><span class="ico">💡</span><div class="body"><b>Faltan ${10-ton()} t para el −3% por volumen</b><span>Se aplica solo, encima del nivel del cliente</span></div></div>`:""}
          ${ton()>0?`<div class="dapp-sheet">
            <div class="dapp-row"><span>${ton()} t · subtotal</span><span>${money(sub())}</span></div>
            ${descNivel()?`<div class="dapp-row is-ok"><span>Nivel ${cliente.nivel} −${cliente.desc}%</span><span>−${money(descNivel())}</span></div>`:""}
            ${descVol()?`<div class="dapp-row is-ok"><span>Volumen 10 t+ −3%</span><span>−${money(descVol())}</span></div>`:""}
            <div class="dapp-row"><span>IVA 16%</span><span>${money(iva())}</span></div>
            <div class="dapp-row total"><span>Total</span><span>${money(total())}</span></div>
            <div class="dapp-row"><span class="muted">Entrega</span><span>${entrega()}</span></div>
            <div class="dapp-row"><span class="muted">Vigencia</span><span>hasta el ${fechaCorta(7)}</span></div>
          </div>`:""}
        </div>
        <div class="dapp-bar">
          <div class="dapp-total"><span>${ton()} toneladas</span><b>${money(total())}</b></div>
          <button class="dapp-cta" id="generar" ${ton()===0?"disabled":""}>Generar y enviar</button>
        </div>`;
      root.querySelectorAll("[data-cli]").forEach(b=>b.onclick=()=>{cliente=clientes.find(c=>c.n===b.dataset.cli);paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{qty[b.dataset.plus]=(qty[b.dataset.plus]||0)+1;paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{const k=b.dataset.minus;if(qty[k]){qty[k]--;if(!qty[k])delete qty[k];}paint();});
      root.querySelector("#generar").onclick=()=>{
        folio=nuevoFolio("COT"); estado=0; view="seguimiento";
        toast(folio+" generada en 12 segundos","⚡"); paint();
        /* El cliente abre y acepta mientras la persona mira la pantalla */
        dLater(()=>{ if(view==="seguimiento"&&estado===0){ estado=1; toast(cliente.n+" abrió la cotización","👀"); paint(); } },3500);
        dLater(()=>{ if(view==="seguimiento"&&estado===1){ estado=2; toast(cliente.n+" aceptó la cotización","✅"); paint(); } },7500);
      };
    }
    withLoading(root, paint);
  }
},

/* ============ 5. PORTAL B2B ============
   El cliente mayorista crea sus órdenes solo, con sus precios pactados,
   existencias reales, crédito y estado de cuenta en el mismo lugar. */
portal:{
  title:"Portal B2B de pedidos",
  render(root){
    const items = [
      {e:"🧪",n:"Sosa cáustica escamas 25 kg",p:685,hay:240,min:10,u:"saco"},
      {e:"🧴",n:"Peróxido de hidrógeno 50% · 30 kg",p:1240,hay:36,min:4,u:"garrafón"},
      {e:"🍋",n:"Ácido cítrico anhidro 25 kg",p:1120,hay:0,min:5,u:"saco"},
      {e:"🛢️",n:"Hipoclorito de sodio 13% · 200 L",p:2350,hay:18,min:2,u:"tambo"},
      {e:"🧂",n:"Carbonato de sodio 25 kg",p:410,hay:500,min:20,u:"saco"}
    ];
    const LIMITE=500000, USADO=168400;
    let facturas=[
      {f:"A-2026-1180",monto:84200,vence:12,estado:"por vencer"},
      {f:"A-2026-1152",monto:84200,vence:-3,estado:"vencida"}
    ];
    let qty={}, tab="Catálogo", ocCliente="", dir="Planta Celaya", view="cat";
    let pedidos=[{folio:"PED-"+new Date().getFullYear()+"-0498",fecha:fechaCorta(-9),total:63150,paso:3}];
    const precio = it => it;
    const total = () => items.reduce((s,it)=>s+(qty[it.n]||0)*it.p,0);
    const count = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const vencidas = () => facturas.filter(f=>f.estado==="vencida");
    const credito = () => USADO+total();
    const faltaMin = () => Object.entries(qty).filter(([k,v])=>v<items.find(i=>i.n===k).min).map(([k])=>k);
    const embarque = () => fechaCorta(proximo(new Date().getDay()<3?3:5));

    function paint(){
      if(view==="confirmar"){
        root.innerHTML =
          appHead("🏢","Confirmar orden","Química Industrial del Bajío · cliente: Distribuidora Química del Centro") + `
          <div class="dapp-body">
            <div class="dapp-sheet">
              ${Object.entries(qty).map(([k,v])=>{const it=items.find(i=>i.n===k);return `<div class="dapp-row"><span>${v} ${it.u}${v>1?"s":""} · ${k}</span><span>${money(v*it.p)}</span></div>`;}).join("")}
              <div class="dapp-row"><span>IVA 16%</span><span>${money(Math.round(total()*0.16))}</span></div>
              <div class="dapp-row total"><span>Total</span><span>${money(Math.round(total()*1.16))}</span></div>
            </div>
            <label class="dapp-label" for="ocC">Tu número de orden de compra</label>
            <input class="dapp-input" id="ocC" placeholder="Ej. OC-7731 (sale en la factura)" value="${ocCliente}">
            <div class="dapp-label">Entregar en</div>
            <div class="dapp-chips">${["Planta Celaya","Bodega Querétaro"].map(d=>`<button class="chip ${d===dir?'on':''}" data-dir="${d}">🏭 ${d}</button>`).join("")}</div>
            <div class="dapp-alert blue"><span class="ico">🗓️</span><div class="body"><b>Embarque el ${embarque()}</b><span>Siguiente salida de ruta a ${dir} · crédito a 30 días</span></div></div>
            ${vencidas().length?`<div class="dapp-alert red"><span class="ico">⚠️</span><div class="body"><b>Tienes una factura vencida</b><span>La orden se libera cuando se registre el pago de ${vencidas()[0].f}. Puedes pagarla desde Estado de cuenta.</span></div></div>`:""}
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Catálogo</button>
            <button class="dapp-cta" id="confirmar" ${vencidas().length?"disabled":""}>Confirmar orden</button>
          </div>`;
        root.querySelector("#ocC").oninput=e=>ocCliente=e.target.value;
        root.querySelectorAll("[data-dir]").forEach(b=>b.onclick=()=>{dir=b.dataset.dir;paint();});
        root.querySelector("#back").onclick=()=>{view="cat";paint();};
        root.querySelector("#confirmar").onclick=()=>{
          const folio=nuevoFolio("PED"); const t=Math.round(total()*1.16);
          pedidos.unshift({folio,fecha:"hoy",total:t,paso:0,dir,oc:ocCliente.trim()});
          qty={}; tab="Mis órdenes"; view="cat";
          toast("Orden "+folio+" recibida","📦"); paint();
          dLater(()=>{const p=pedidos.find(x=>x.folio===folio); if(p){p.paso=1; toast(folio+" en preparación en planta","🏭"); if(tab==="Mis órdenes") paint();}},3500);
          dLater(()=>{const p=pedidos.find(x=>x.folio===folio); if(p){p.paso=2; toast(folio+" embarcada · guía 7781-2210","🚛"); if(tab==="Mis órdenes") paint();}},8000);
        };
        return;
      }
      const uso = Math.min(1,credito()/LIMITE);
      root.innerHTML =
        appHead("🏢","Portal de clientes","Química Industrial del Bajío · Distribuidora Química del Centro") + `
        <div class="dapp-body">
          <div class="dapp-card">
            <b>Línea de crédito</b>
            <div class="dapp-row" style="padding:2px 0 0"><span class="muted">Usado</span><span>${money(credito())} de ${money(LIMITE)}</span></div>
            <div class="credit-bar"><div class="credit-fill${uso>0.85?" is-hot":""}" style="transform:scaleX(${uso})"></div></div>
            <span class="muted small">Disponible ${money(LIMITE-credito())} · ${vencidas().length?'<b class="is-bad">'+vencidas().length+' factura vencida</b>':"sin facturas vencidas"}</span>
          </div>
          <div class="dapp-tabs">${["Catálogo","Mis órdenes","Estado de cuenta"].map(t=>`<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Mis órdenes"?" ("+pedidos.length+")":t==="Estado de cuenta"&&vencidas().length?" ⚠️":""}</button>`).join("")}</div>
          ${tab==="Catálogo"?`
            ${items.map(it=>itemRow({
              emoji:it.e, mute:it.hay===0,
              title:`${it.n}${it.hay===0?' <span class="dapp-badge red">Sin existencia</span>':it.hay<20?' <span class="dapp-badge amber">Quedan '+it.hay+'</span>':""}`,
              meta:`${money(it.p)}/${it.u} · tu precio pactado · mínimo ${it.min} ${it.u}s`,
              side:stepper(it.n,qty[it.n]||0,{unidad:it.u.slice(0,3),tope:it.hay})
            })).join("")}
            ${faltaMin().length?`<div class="dapp-alert amber"><span class="ico">📦</span><div class="body"><b>Pedido mínimo por producto</b><span>${faltaMin().join(", ")}: sube al mínimo o quítalo de la orden.</span></div></div>`:""}`
          :tab==="Mis órdenes"?pedidos.map(p=>`
            <div class="dapp-card">
              <div class="dapp-row" style="padding:0 0 10px"><span><b>${p.folio}</b> · ${p.fecha}${p.oc?" · tu OC "+p.oc:""}</span><span class="dapp-badge ${p.paso===3?"green":"violet"}">${["Recibida","En preparación","Embarcada","Entregada"][p.paso]}</span></div>
              <div class="dapp-timeline">${["Orden recibida","En preparación","Embarcada","Entregada"].map((s,i)=>`<div class="tl-step ${i<p.paso?"done":i===p.paso?"now":""}"><div class="tl-dot">${i<p.paso?"✓":i===p.paso?"●":""}</div><div><b>${s}</b>${i===2&&p.paso>=2?"<span>Guía 7781-2210 · rastreo en vivo</span>":""}</div></div>`).join("")}</div>
              <div class="dapp-row total" style="margin-top:0"><span>Total</span><span>${money(p.total)}</span></div>
            </div>`).join("")
          :`
            ${facturas.map((f,ix)=>itemRow({
              emoji:f.estado==="pagada"?"✅":f.estado==="vencida"?"⚠️":"🧾",
              title:`${f.f} ${f.estado==="vencida"?'<span class="dapp-badge red">Vencida hace '+(-f.vence)+' días</span>':f.estado==="pagada"?'<span class="dapp-badge green">Pagada</span>':'<span class="dapp-badge amber">Vence el '+fechaCorta(f.vence)+'</span>'}`,
              meta:`${money(f.monto)} · CFDI 4.0 · <a href="#" data-cfdi="${f.f}">Descargar XML y PDF</a>`,
              side:f.estado==="pagada"?"":`<button class="dapp-tab" data-pagar="${ix}">Pagar</button>`
            })).join("")}
            <p class="dapp-note">Las facturas, complementos de pago y el saldo viven aquí: ya no hay que pedírselos a nadie por correo.</p>`}
        </div>
        ${tab==="Catálogo"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${count()} ${count()===1?"unidad":"unidades"}</span><b>${money(total())}</b></div>
          <button class="dapp-cta" id="go" ${count()===0||faltaMin().length?"disabled":""}>Revisar orden</button>
        </div>`:""}`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{const k=b.dataset.plus;const it=items.find(i=>i.n===k);qty[k]=Math.min(it.hay,(qty[k]||0)+1);paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{const k=b.dataset.minus;if(qty[k]){qty[k]--;if(!qty[k])delete qty[k];}paint();});
      root.querySelectorAll("[data-cfdi]").forEach(a=>a.onclick=e=>{e.preventDefault();toast(a.dataset.cfdi+" descargada (XML + PDF)","📄");});
      root.querySelectorAll("[data-pagar]").forEach(b=>b.onclick=()=>{const f=facturas[+b.dataset.pagar];f.estado="pagada";toast(f.f+" pagada por transferencia · complemento en camino","💳");paint();});
      const go=root.querySelector("#go"); if(go) go.onclick=()=>{view="confirmar";paint();};
    }
    withLoading(root, paint);
  }
},

/* ============ 6. PRODUCCIÓN ============
   Órdenes de producción con lista de materiales, avance por estación
   reportado desde piso, consumo de inventario y merma en tiempo real. */
produccion:{
  title:"Piso de producción",
  render(root){
    const EST = ["Corte","Soldadura","Pintura","Ensamble","Calidad"];
    const bom = {
      "Bastidor soldado BS-400":[["Perfil PTR 2\" cal. 14",2.4,"m"],["Placa A-36 1/4\"",0.6,"kg"],["Soldadura ER70S-6",0.12,"kg"],["Pintura epóxica gris",0.08,"L"]],
      "Tolva TV-120":[["Lámina galvanizada cal. 16",3.1,"m²"],["Ángulo 1 1/2\"",1.8,"m"],["Tornillería 3/8\" (juego)",1,"jgo"],["Pintura epóxica gris",0.15,"L"]],
      "Base para motor BM-5":[["Placa A-36 1/2\"",4.2,"kg"],["Perfil PTR 2\" cal. 14",1.1,"m"],["Soldadura ER70S-6",0.2,"kg"]]
    };
    let stock = {"Perfil PTR 2\" cal. 14":1480,"Placa A-36 1/4\"":820,"Placa A-36 1/2\"":610,"Soldadura ER70S-6":96,"Pintura epóxica gris":140,"Lámina galvanizada cal. 16":210,"Ángulo 1 1/2\"":300,"Tornillería 3/8\" (juego)":45};
    let ops = [
      {id:"OP-2041",prod:"Bastidor soldado BS-400",cant:400,buenas:248,rech:6,est:2,cliente:"Transformadores del Bajío",entrega:fechaCorta(4)},
      {id:"OP-2043",prod:"Tolva TV-120",cant:60,buenas:12,rech:1,est:1,cliente:"Agroindustrias Río Verde",entrega:fechaCorta(9)},
      {id:"OP-2038",prod:"Base para motor BM-5",cant:120,buenas:120,rech:3,est:4,cliente:"Bombas del Centro",entrega:fechaCorta(-1)}
    ];
    let view="lista", sel=null, estRep=null, buenas=0, rech=0, nuevaProd="Bastidor soldado BS-400", nuevaCant=50;
    const avance = o => Math.round(((o.est/EST.length)*0.6 + (o.buenas/o.cant)*0.4)*100);
    const consumo = (o,m,c) => Math.round(c*(o.buenas+o.rech)*100)/100;
    const badge = o => o.buenas>=o.cant&&o.est>=4?'<span class="dapp-badge green">Terminada</span>':o.est===4?'<span class="dapp-badge violet">En calidad</span>':'<span class="dapp-badge violet">'+EST[o.est]+'</span>';
    const faltantes = (prod,cant) => bom[prod].filter(([m,c])=>stock[m]<c*cant).map(([m,c])=>({m,falta:Math.ceil(c*cant-stock[m])}));

    /* El piso reporta solo mientras la persona mira */
    dEvery(()=>{ const o=ops[0]; if(o.buenas<o.cant){ o.buenas=Math.min(o.cant,o.buenas+4); if(view==="lista"||(view==="op"&&sel===o)) paint(); } },5000);

    function paint(){
      if(view==="op" && sel){
        const o=sel;
        root.innerHTML =
          appHead("⚙️",o.id+" · "+o.prod,miles(o.cant)+" pz · "+o.cliente+" · entrega "+o.entrega) + `
          <div class="dapp-body">
            <div class="dapp-card">
              <div class="dapp-row" style="padding:0"><span><b>Avance</b></span><span><b>${avance(o)}%</b></span></div>
              <div class="credit-bar"><div class="credit-fill" style="transform:scaleX(${avance(o)/100})"></div></div>
              <span class="muted small">${o.buenas} buenas · ${o.rech} rechazadas (${(o.rech/Math.max(1,o.buenas+o.rech)*100).toFixed(1)}% merma) · estación actual: ${EST[o.est]}</span>
            </div>
            <div class="dapp-timeline">${EST.map((e,i)=>`<div class="tl-step ${i<o.est?"done":i===o.est?"now":""}"><div class="tl-dot">${i<o.est?"✓":i===o.est?"●":""}</div><div><b>${e}</b><span>${i<o.est?"completa":i===o.est?"en proceso · turno matutino":"—"}</span></div></div>`).join("")}</div>
            <div class="dapp-label">Lista de materiales · consumo real</div>
            <div class="dapp-sheet">
              ${bom[o.prod].map(([m,c,u])=>`<div class="dapp-row"><span>${m}<small>${c} ${u}/pz · consumido ${consumo(o,m,c)} ${u}</small></span><span class="${stock[m]<c*(o.cant-o.buenas)?"is-bad":"is-ok"}">${stock[m]<c*(o.cant-o.buenas)?"falta":"ok"} · ${stock[m]} ${u}</span></div>`).join("")}
            </div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Órdenes</button>
            <button class="dapp-cta" id="reportar" ${o.buenas>=o.cant&&o.est>=4?"disabled":""}>📋 Reportar avance</button>
          </div>`;
        root.querySelector("#back").onclick=()=>{view="lista";paint();};
        root.querySelector("#reportar").onclick=()=>{estRep=o.est;buenas=20;rech=0;view="reporte";paint();};
        return;
      }
      if(view==="reporte" && sel){
        const o=sel;
        root.innerHTML =
          appHead("📋","Reportar avance",o.id+" · "+EST[estRep]+" · "+ahora()) + `
          <div class="dapp-body">
            <div class="dapp-label">Estación</div>
            <div class="dapp-chips">${EST.map((e,i)=>`<button class="chip ${i===estRep?'on':''}" data-est="${i}" ${i>o.est?"disabled":""}>${e}</button>`).join("")}</div>
            ${itemRow({title:"Piezas buenas",meta:"Pasan a la siguiente estación",side:stepper("b",buenas)})}
            ${itemRow({title:"Rechazadas",meta:"Se registran como merma con motivo",side:stepper("r",rech)})}
            ${rech?`<div class="dapp-label">Motivo del rechazo</div><div class="dapp-chips">${["Poro en soldadura","Dimensión fuera de tolerancia","Daño en pintura"].map(m=>`<button class="chip" data-mot="${m}">${m}</button>`).join("")}</div>`:""}
            <div class="dapp-alert blue"><span class="ico">📦</span><div class="body"><b>Consumo que se descuenta del almacén</b><span>${bom[o.prod].map(([m,c,u])=>m.split(" ")[0]+" "+(c*(buenas+rech)).toFixed(1)+" "+u).join(" · ")}</span></div></div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← ${o.id}</button>
            <button class="dapp-cta" id="guardar" ${buenas+rech===0?"disabled":""}>Guardar reporte</button>
          </div>`;
        root.querySelectorAll("[data-est]").forEach(b=>b.onclick=()=>{estRep=+b.dataset.est;paint();});
        root.querySelectorAll("[data-mot]").forEach(b=>b.onclick=()=>{root.querySelectorAll("[data-mot]").forEach(x=>x.classList.remove("on"));b.classList.add("on");});
        root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{ if(b.dataset.plus==="b") buenas=Math.min(o.cant-o.buenas,buenas+5); else rech+=1; paint();});
        root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{ if(b.dataset.minus==="b") buenas=Math.max(0,buenas-5); else rech=Math.max(0,rech-1); paint();});
        root.querySelector("#back").onclick=()=>{view="op";paint();};
        root.querySelector("#guardar").onclick=()=>{
          bom[o.prod].forEach(([m,c])=>{stock[m]=Math.max(0,Math.round((stock[m]-c*(buenas+rech))*100)/100);});
          o.buenas=Math.min(o.cant,o.buenas+buenas); o.rech+=rech;
          if(o.buenas>=o.cant && estRep<EST.length-1) o.est=Math.min(EST.length-1,estRep+1);
          toast("Avance guardado · inventario descontado","✅");
          view="op"; paint();
        };
        return;
      }
      if(view==="nueva"){
        const falt=faltantes(nuevaProd,nuevaCant);
        root.innerHTML =
          appHead("➕","Nueva orden de producción","Explosión de materiales contra el almacén") + `
          <div class="dapp-body">
            <div class="dapp-label">Producto</div>
            <div class="dapp-chips">${Object.keys(bom).map(p=>`<button class="chip ${p===nuevaProd?'on':''}" data-prod="${p}">${p}</button>`).join("")}</div>
            ${itemRow({title:"Cantidad a producir",meta:"Entrega estimada "+fechaCorta(Math.ceil(nuevaCant/40)+2)+" a 40 pz por turno",side:stepper("c",nuevaCant,{unidad:"pz"})})}
            <div class="dapp-label">Materiales requeridos</div>
            <div class="dapp-sheet">${bom[nuevaProd].map(([m,c,u])=>`<div class="dapp-row"><span>${m}</span><span class="${stock[m]<c*nuevaCant?"is-bad":"is-ok"}">${(c*nuevaCant).toFixed(1)} ${u} · ${stock[m]<c*nuevaCant?"faltan "+Math.ceil(c*nuevaCant-stock[m]):"hay "+stock[m]}</span></div>`).join("")}</div>
            ${falt.length?`<div class="dapp-alert amber"><span class="ico">🛒</span><div class="body"><b>Falta material para esta cantidad</b><span>Se genera la requisición a compras automáticamente al liberar la orden.</span></div></div>`
            :`<div class="dapp-alert blue"><span class="ico">✅</span><div class="body"><b>Material completo en almacén</b><span>La orden puede liberarse al piso hoy mismo.</span></div></div>`}
          </div>
          <div class="dapp-bar"><button class="dapp-tab" id="back">← Órdenes</button><button class="dapp-cta" id="liberar">Liberar orden</button></div>`;
        root.querySelectorAll("[data-prod]").forEach(b=>b.onclick=()=>{nuevaProd=b.dataset.prod;paint();});
        root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{nuevaCant+=10;paint();});
        root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{nuevaCant=Math.max(10,nuevaCant-10);paint();});
        root.querySelector("#back").onclick=()=>{view="lista";paint();};
        root.querySelector("#liberar").onclick=()=>{
          const id="OP-"+(2044+ops.length); const f=faltantes(nuevaProd,nuevaCant);
          ops.unshift({id,prod:nuevaProd,cant:nuevaCant,buenas:0,rech:0,est:0,cliente:"Stock",entrega:fechaCorta(Math.ceil(nuevaCant/40)+2)});
          toast(id+" liberada al piso"+(f.length?" · requisición enviada a compras":""),"⚙️");
          view="lista"; paint();
        };
        return;
      }
      root.innerHTML =
        appHead("⚙️","Metalmecánica Delta","Piso de producción · turno matutino",`<button class="dapp-mini" id="nueva">+ Orden</button>`) + `
        <div class="dapp-body">
          <div class="stat-grid">
            <div class="stat-card"><span>Piezas hoy</span><b>${ops.reduce((s,o)=>s+o.buenas,0)}</b><em>▲ en turno</em></div>
            <div class="stat-card"><span>Merma</span><b>${(ops.reduce((s,o)=>s+o.rech,0)/Math.max(1,ops.reduce((s,o)=>s+o.buenas+o.rech,0))*100).toFixed(1)}%</b><em>meta 2%</em></div>
            <div class="stat-card"><span>Abiertas</span><b>${ops.filter(o=>!(o.buenas>=o.cant&&o.est>=4)).length}</b><em>órdenes</em></div>
          </div>
          ${ops.map(o=>itemRow({
            emoji: o.buenas>=o.cant&&o.est>=4?"✅":"⚙️",
            title:`${o.id} ${badge(o)}`,
            meta:`${o.prod} · ${o.buenas}/${o.cant} pz · ${o.cliente} · entrega ${o.entrega}`,
            side:`<span class="price">${avance(o)}%</span><button class="dapp-tab" data-ver="${o.id}">Ver</button>`
          })).join("")}
          <p class="dapp-note">Cada reporte desde piso descuenta materiales del almacén al instante: compras ve lo que falta antes de que pare la línea.</p>
        </div>`;
      root.querySelectorAll("[data-ver]").forEach(b=>b.onclick=()=>{sel=ops.find(o=>o.id===b.dataset.ver);view="op";paint();});
      root.querySelector("#nueva").onclick=()=>{view="nueva";paint();};
    }
    withLoading(root, paint);
  }
}
};
