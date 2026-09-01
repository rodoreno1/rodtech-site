/* ==================== UTILIDADES COMPARTIDAS DE LOS DEMOS ====================
   Cada demo simula un sistema real: los datos son ficticios, pero las fechas,
   los folios, los totales y los tiempos se calculan de verdad a partir del
   reloj del visitante. Un demo con "18 jul" quemado en el código se ve viejo
   a los tres días; uno que dice "entrega el jueves 4 de septiembre" se lee
   como un sistema que está corriendo ahora mismo. */

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
  return `<button class="dapp-btn-sm minus" data-minus="${key}" aria-label="Quitar uno"${valor?"":" disabled"}>−</button>
    <span class="dapp-qty" aria-live="polite">${valor}${o.unidad?`<i>${o.unidad}</i>`:""}</span>
    <button class="dapp-btn-sm" data-plus="${key}" aria-label="Agregar uno"${o.tope&&valor>=o.tope?" disabled":""}>+</button>`;
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

const DEMOS = {

/* ============ 1. RESTAURANTE ============
   Menú por QR en la mesa → revisión → comanda en vivo → cuenta.
   Realismo: tiempos de preparación por platillo, cuenta regresiva real,
   folio y hora de la comanda, división de la cuenta y ticket final. */
restaurante:{
  title:"Pedidos en mesa",
  render(root){
    const menu = {
      "Platillos":[
        {e:"🌮",n:"Tacos de pastor (orden)",d:"5 piezas con piña y cilantro",p:95,min:12,tag:"Más pedido"},
        {e:"🥘",n:"Enchiladas verdes",d:"Pollo, crema y queso fresco",p:110,min:18},
        {e:"🍔",n:"Hamburguesa de la casa",d:"Res 200 g, tocino y papas",p:145,min:20,tag:"Nuevo"},
        {e:"🥗",n:"Ensalada César",d:"Con pollo a la parrilla",p:98,min:10,dieta:"🥬"},
        {e:"🌶️",n:"Chiles rellenos (2)",d:"Queso oaxaca, caldillo de jitomate",p:132,min:22,picante:true},
        {e:"🍗",n:"Mole de la abuela",d:"Pierna de pollo y arroz",p:125,min:15,agotado:true}
      ],
      "Bebidas":[
        {e:"🍹",n:"Agua del día 1 L",d:"Hoy: horchata con nuez",p:45,min:2},
        {e:"🥤",n:"Refresco",d:"Vidrio 355 ml",p:30,min:2},
        {e:"☕",n:"Café de olla",d:"Con piloncillo y canela",p:38,min:5},
        {e:"🍋",n:"Limonada mineral",d:"Vaso 500 ml",p:42,min:3}
      ],
      "Postres":[
        {e:"🍮",n:"Flan napolitano",d:"Receta de la casa",p:55,min:2},
        {e:"🍩",n:"Churros (4)",d:"Con cajeta o chocolate",p:48,min:12},
        {e:"🍫",n:"Pastel de chocolate",d:"Rebanada",p:62,min:2}
      ]
    };
    const all = Object.values(menu).flat();
    const find = n => all.find(x=>x.n===n);

    let cart={}, tab="Platillos", q="", tip=10, note="", view="menu";
    let track=0, pago="Efectivo", sentAt="", comanda="", listoAt=0, personas=1, mesero=false;

    const subtotal = () => Object.entries(cart).reduce((s,[k,v])=>s+find(k).p*v,0);
    const count = () => Object.values(cart).reduce((a,b)=>a+b,0);
    const tipAmt = () => Math.round(subtotal()*tip/100);
    const totalCuenta = () => subtotal()+tipAmt();
    /* El tiempo estimado sale del platillo más tardado, no de un número fijo */
    const espera = () => Math.max(10, ...Object.keys(cart).map(k=>find(k).min||10));

    function restante(){
      const s = Math.max(0, Math.round((listoAt - Date.now())/1000));
      return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
    }

    /* La comanda avanza sola, como si la cocina fuera marcando pasos */
    function scheduleTrack(){
      [[3000,1],[6500,2],[10000,3]].forEach(([ms,s])=>dLater(()=>{
        if(track<s){
          track=s;
          if(view==="track"){ paint(); toast(["","Tu pedido está en la plancha","Tu pedido va en camino","¡Buen provecho!"][s], ["","🔥","🧑‍🍳","🍽️"][s]); }
        }
      },ms));
      dEvery(()=>{
        const el = root.querySelector("#cuenta");
        if(el) el.textContent = restante();
      },1000);
    }

    function paint(){
      if(view==="menu"){
        const list = q ? all.filter(it=>it.n.toLowerCase().includes(q.toLowerCase())) : menu[tab];
        root.innerHTML =
          appHead("🍽️","La Cocina de Rosa","Mesa 4 · menú digital por QR",
            `<button class="dapp-mini" id="waiter"${mesero?" disabled":""}>${mesero?"🔔 Ya viene":"🔔 Mesero"}</button>`) + `
          <div class="dapp-body">
            <input class="dapp-search" id="q" placeholder="🔍 Buscar en el menú…" value="${q}" aria-label="Buscar en el menú">
            ${q?"":`<div class="dapp-tabs">${Object.keys(menu).map(c=>
              `<button class="dapp-tab ${c===tab?'active':''}" data-tab="${c}">${c}</button>`).join("")}</div>`}
            ${list.length ? list.map(it=>itemRow({
                emoji: it.e, mute: it.agotado,
                title: `${it.n}${it.tag?` <span class="dapp-badge violet">${it.tag}</span>`:""}${it.picante?' <span class="dapp-badge red">Picante</span>':""}${it.dieta?` <span class="dapp-badge green">Ligero</span>`:""}${it.agotado?' <span class="dapp-badge red">Se agotó hoy</span>':""}`,
                meta: `${it.d} · ⏱ ${it.min} min`,
                side: `<span class="price">${money(it.p)}</span>` +
                      (it.agotado ? "" : stepper(it.n, cart[it.n]||0))
              })).join("")
              : `<div class="dapp-empty"><span>🔍</span><b>Sin resultados para "${q}"</b>
                 <p>Prueba con otra palabra o pregúntale al mesero.</p></div>`}
            <p class="dapp-note">Precios con IVA incluido. El menú lo actualiza el dueño desde su celular.</p>
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>${count()} ${count()===1?"artículo":"artículos"}</span><b>${money(subtotal())}</b></div>
            <button class="dapp-cta" id="goReview" ${count()===0?"disabled":""}>Revisar pedido</button>
          </div>`;
        const w = root.querySelector("#waiter");
        if(w) w.onclick=()=>{
          mesero=true; paint();
          toast("Lupita va en camino a tu mesa","🔔");
          dLater(()=>{ mesero=false; if(view==="menu") paint(); },8000);
        };
        root.querySelector("#q").oninput=e=>{q=e.target.value;paint();keepCaret(root,"#q");};
        root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
        root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{cart[b.dataset.plus]=(cart[b.dataset.plus]||0)+1;paint();});
        root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
          const k=b.dataset.minus; if(cart[k]){cart[k]--; if(!cart[k])delete cart[k];} paint();});
        const go = root.querySelector("#goReview");
        if(go) go.onclick=()=>{view="review";paint();};
      }

      else if(view==="review"){
        root.innerHTML =
          appHead("🧾","Revisa tu pedido","Mesa 4 · aún no se envía a cocina") + `
          <div class="dapp-body">
            <div class="dapp-sheet">
              ${Object.entries(cart).map(([k,v])=>`
                <div class="dapp-row"><span>${find(k).e} ${v}× ${k}</span><span>${money(find(k).p*v)}</span></div>`).join("")}
              <div class="dapp-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
              <div class="dapp-row"><span>Propina (${tip}%)</span><span>${money(tipAmt())}</span></div>
              <div class="dapp-row total"><span>Total</span><span>${money(totalCuenta())}</span></div>
            </div>
            <label class="dapp-label" for="nota">¿Alguna indicación para la cocina?</label>
            <textarea class="dapp-input" id="nota" placeholder="Ej. sin cebolla, salsa aparte, término tres cuartos…">${note}</textarea>
            <div class="dapp-label">Propina para el equipo</div>
            <div class="dapp-tabs">${[0,10,15,20].map(t=>
              `<button class="dapp-tab ${t===tip?'active':''}" data-tip="${t}">${t===0?"Sin propina":t+"%"}</button>`).join("")}</div>
            <div class="dapp-alert blue">
              <span>⏱️</span>
              <div><b>Tiempo estimado: ${espera()} min</b>
              <span>Lo calcula el platillo más tardado de tu pedido, no un promedio.</span></div>
            </div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Menú</button>
            <button class="dapp-cta" id="confirm">Enviar a cocina</button>
          </div>`;
        root.querySelector("#nota").oninput=e=>note=e.target.value;
        root.querySelectorAll("[data-tip]").forEach(b=>b.onclick=()=>{tip=+b.dataset.tip;paint();});
        root.querySelector("#back").onclick=()=>{view="menu";paint();};
        root.querySelector("#confirm").onclick=()=>{
          view="track"; track=0;
          sentAt = ahora();
          comanda = "C-" + String(new Date().getDate()).padStart(2,"0") + String(folioSeq++%100).padStart(2,"0");
          listoAt = Date.now() + espera()*60000;
          scheduleTrack();
          toast("Comanda "+comanda+" enviada a cocina","👨‍🍳");
          paint();
        };
      }

      else if(view==="track"){
        const pasos=[
          ["Recibido en cocina","La cocina ya lo vio en su pantalla"],
          ["Preparando tus platillos","Chef Rosa está en ello"],
          ["En camino a tu mesa","Lupita lo lleva"],
          ["Servido · ¡buen provecho!","Cualquier cosa, pide desde aquí"]
        ];
        root.innerHTML =
          appHead("👨‍🍳","Comanda "+comanda,"Mesa 4 · enviada a las "+sentAt) + `
          <div class="dapp-body">
            <div class="dapp-countdown">
              <div><span>Listo en aproximadamente</span><b id="cuenta">${restante()}</b></div>
              <span class="dapp-badge violet">En vivo</span>
            </div>
            <div class="dapp-timeline">
              ${pasos.map(([p,sub],i)=>`
                <div class="tl-step ${i<track?"done":i===track?"now":""}">
                  <div class="tl-dot">${i<track?"✓":i===track?"●":""}</div>
                  <div><b>${p}</b><span>${i<=track?sub:"—"}</span></div>
                </div>`).join("")}
            </div>
            <div class="dapp-ticket">
              <div class="ticket-head"><b>COCINA · MESA 4</b><span>${comanda} · ${sentAt}</span></div>
              ${Object.entries(cart).map(([k,v])=>`<div class="dapp-row"><span>${v}× ${k}</span><span>⏱ ${find(k).min}′</span></div>`).join("")}
              ${note?`<div class="ticket-nota">📝 ${note}</div>`:""}
            </div>
            <p class="dapp-note">La cocina recibe la comanda al instante: sin papel, sin gritos, sin errores de letra.</p>
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>Total con propina</span><b>${money(totalCuenta())}</b></div>
            <button class="dapp-cta" id="bill">💳 Pedir la cuenta</button>
          </div>`;
        root.querySelector("#bill").onclick=()=>{view="bill";paint();};
      }

      else{
        const porPersona = Math.ceil(totalCuenta()/personas);
        root.innerHTML =
          appHead("💳","Tu cuenta","Mesa 4 · comanda "+comanda) + `
          <div class="dapp-body">
            <div class="dapp-sheet">
              <div class="dapp-row"><span>Consumo</span><span>${money(subtotal())}</span></div>
              <div class="dapp-row"><span>Propina (${tip}%)</span><span>${money(tipAmt())}</span></div>
              <div class="dapp-row total"><span>Total a pagar</span><span>${money(totalCuenta())}</span></div>
            </div>
            <div class="dapp-label">¿Se divide la cuenta?</div>
            <div class="dapp-chips">
              ${[1,2,3,4].map(n=>`<button class="chip ${n===personas?'on':''}" data-per="${n}">${n===1?"No, una sola":n+" personas"}</button>`).join("")}
            </div>
            ${personas>1?`<div class="dapp-alert blue"><span>➗</span>
              <div><b>${money(porPersona)} por persona</b><span>Cada quien puede pagar por separado desde su celular</span></div></div>`:""}
            <div class="dapp-label">¿Cómo quieres pagar?</div>
            <div class="dapp-chips">
              ${[["Efectivo","💵"],["Tarjeta en mesa","💳"],["Transferencia","📲"]].map(([m,ic])=>
                `<button class="chip ${pago===m?'on':''}" data-pago="${m}">${ic} ${m}</button>`).join("")}
            </div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Comanda</button>
            <button class="dapp-cta" id="pay">Pagar ${money(personas>1?porPersona:totalCuenta())}</button>
          </div>`;
        root.querySelectorAll("[data-per]").forEach(b=>b.onclick=()=>{personas=+b.dataset.per;paint();});
        root.querySelectorAll("[data-pago]").forEach(b=>b.onclick=()=>{pago=b.dataset.pago;paint();});
        root.querySelector("#back").onclick=()=>{view="track";paint();};
        root.querySelector("#pay").onclick=()=>{
          toast("Pago registrado en caja","🧾");
          successScreen(root,"🧾","¡Gracias por tu visita!",
            "La mesa 4 quedó libre en el sistema y el ticket ya está en caja.",
            `<div class="dapp-row"><span>Comanda</span><span>${comanda}</span></div>
             <div class="dapp-row"><span>Fecha</span><span>${fechaLarga(0)} · ${ahora()}</span></div>
             <div class="dapp-row"><span>Forma de pago</span><span>${pago}</span></div>
             ${personas>1?`<div class="dapp-row"><span>Dividida entre</span><span>${personas} personas</span></div>`:""}
             <div class="dapp-row total"><span>Total</span><span>${money(totalCuenta())}</span></div>`);
        };
      }
    }
    withLoading(root, paint);
  }
},

/* ============ 2. FERRETERÍA ============
   Catálogo con SKU y existencias → cotización con descuentos por volumen →
   historial que se puede convertir en venta.
   Realismo: escalones de descuento reales, vigencia calculada, clientes
   frecuentes, estados de existencia y unidades de venta. */
ferreteria:{
  title:"Cotizador de obra",
  render(root){
    const cats = {
      "Construcción":[
        {n:"Cemento gris 50 kg",d:"CPC 30R · Cruz Azul",sku:"FER-1021",st:64,u:"bulto",p:238},
        {n:"Varilla 3/8\"",d:"12 m · corrugada",sku:"FER-1088",st:120,u:"pieza",p:165},
        {n:"Arena cernida",d:"Bulto 50 kg",sku:"FER-1130",st:40,u:"bulto",p:85},
        {n:"Block 15×20×40",d:"Hueco, gris",sku:"FER-1207",st:500,u:"pieza",p:18}
      ],
      "Plomería":[
        {n:"Tubo PVC 4\"",d:"Tramo 6 m · sanitario",sku:"PLO-2010",st:26,u:"tramo",p:210},
        {n:"Llave de paso 1/2\"",d:"Bronce · nacional",sku:"PLO-2054",st:8,u:"pieza",p:145},
        {n:"Cinta teflón",d:"Rollo 10 m",sku:"PLO-2101",st:90,u:"rollo",p:12},
        {n:"Codo PVC 90° 4\"",d:"Sanitario",sku:"PLO-2144",st:0,u:"pieza",p:34}
      ],
      "Eléctrico":[
        {n:"Cable THW cal. 12",d:"Por metro · cobre",sku:"ELE-3005",st:300,u:"metro",p:14},
        {n:"Contacto doble",d:"Con placa blanca",sku:"ELE-3040",st:45,u:"pieza",p:48},
        {n:"Pastilla térmica 20 A",d:"1 polo · empotrable",sku:"ELE-3077",st:22,u:"pieza",p:135}
      ],
      "Pintura":[
        {n:"Vinílica 19 L blanco",d:"Mate lavable",sku:"PIN-4001",st:12,u:"cubeta",p:1150},
        {n:"Esmalte 1 L negro",d:"Brillante",sku:"PIN-4022",st:30,u:"lata",p:185},
        {n:"Brocha 4\"",d:"Cerda natural",sku:"PIN-4103",st:55,u:"pieza",p:65}
      ]
    };
    const all = Object.values(cats).flat();
    const find = n => all.find(x=>x.n===n);

    /* Escalones reales de descuento por volumen */
    const ESCALONES = [[20000,8],[8000,5],[3000,3]];
    const frecuentes = ["Constructora Hernández","Ing. Salas","Maestro Beto (albañilería)","Mantenimiento Plaza Norte"];

    let qty={}, cat="Construcción", q="", mainTab="Catálogo", view="cat";
    let cliente="", obra="", folio=null;
    let historial = [
      {folio:"COT-"+new Date().getFullYear()+"-0088",fecha:fechaCorta(-9),cliente:"Constructora Hernández",total:14890,status:"Aceptada"},
      {folio:"COT-"+new Date().getFullYear()+"-0084",fecha:fechaCorta(-13),cliente:"Ing. Salas",total:3210,status:"Pendiente"}
    ];

    const subtotal = () => Object.entries(qty).reduce((s,[k,v])=>s+find(k).p*v,0);
    const count = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const escalon = () => ESCALONES.find(([monto])=>subtotal()>=monto);
    const pctDesc = () => escalon() ? escalon()[1] : 0;
    const desc = () => Math.round(subtotal()*pctDesc()/100);
    const iva = () => Math.round((subtotal()-desc())*0.16);
    const granTotal = () => subtotal()-desc()+iva();
    const siguiente = () => [...ESCALONES].reverse().find(([monto])=>subtotal()<monto);
    const badge = s => s==="Aceptada"?"green":s==="Pendiente"?"amber":s==="Enviada"?"violet":"green";
    const existencia = it => it.st===0
      ? `<span class="dapp-badge red">Sobre pedido</span>`
      : it.st<=10 ? `<span class="dapp-badge amber">Quedan ${it.st}</span>`
      : `${it.st} ${it.u}s disp.`;

    function enviar(medio){
      if(!cliente.trim()){ toast("Escribe o elige el cliente","⚠️"); keepCaret(root,"#cli"); return; }
      historial.unshift({folio,fecha:"hoy",cliente:cliente.trim(),total:granTotal(),status:"Enviada"});
      const resumen = `<div class="dapp-row"><span>Folio</span><span>${folio}</span></div>
        <div class="dapp-row"><span>Cliente</span><span>${cliente.trim()}</span></div>
        ${obra.trim()?`<div class="dapp-row"><span>Obra</span><span>${obra.trim()}</span></div>`:""}
        <div class="dapp-row"><span>Vigencia</span><span>hasta el ${fechaCorta(15)}</span></div>
        <div class="dapp-row total"><span>Total</span><span>${money(granTotal())}</span></div>`;
      toast(folio+" enviada por "+medio,"✅");
      successScreen(root, medio==="WhatsApp"?"📲":"📄", "Cotización enviada",
        medio==="WhatsApp"
          ? "Le llegó al cliente por WhatsApp con el desglose y los precios vigentes."
          : "El PDF quedó guardado y listo para imprimir o mandar por correo.",
        resumen);
      qty={}; view="cat"; mainTab="Cotizaciones"; cliente=""; obra="";
    }

    function paint(){
      if(view==="quote"){
        root.innerHTML =
          appHead("📄","Cotización "+folio,"Vigencia hasta el "+fechaCorta(15)) + `
          <div class="dapp-body">
            <label class="dapp-label" for="cli">Cliente *</label>
            <input class="dapp-input" id="cli" placeholder="Nombre del cliente o de la obra" value="${cliente}">
            <div class="dapp-chips" style="margin:-4px 0 12px">
              ${frecuentes.map(f=>`<button class="chip ${cliente===f?'on':''}" data-cliente="${f}">${f}</button>`).join("")}
            </div>
            <label class="dapp-label" for="obra">Obra o referencia</label>
            <input class="dapp-input" id="obra" placeholder="Ej. Av. Juárez 214, 2a etapa" value="${obra}">
            <div class="dapp-sheet">
              ${Object.entries(qty).map(([k,v])=>`
                <div class="dapp-row"><span>${v} ${find(k).u}${v>1?"s":""} · ${k}<small>${find(k).sku}</small></span><span>${money(find(k).p*v)}</span></div>`).join("")}
              <div class="dapp-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
              ${pctDesc()>0?`<div class="dapp-row is-ok"><span>Descuento por volumen (${pctDesc()}%)</span><span>−${money(desc())}</span></div>`:""}
              <div class="dapp-row"><span>IVA 16%</span><span>${money(iva())}</span></div>
              <div class="dapp-row total"><span>Total</span><span>${money(granTotal())}</span></div>
            </div>
            <p class="dapp-note">Queda en el historial y se convierte en venta con un clic, sin volver a capturar nada.</p>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Editar</button>
            <div class="dapp-bar-actions">
              <button class="dapp-tab" id="pdf">📄 PDF</button>
              <button class="dapp-cta" id="send">Enviar por WhatsApp</button>
            </div>
          </div>`;
        root.querySelector("#cli").oninput=e=>cliente=e.target.value;
        root.querySelector("#obra").oninput=e=>obra=e.target.value;
        root.querySelectorAll("[data-cliente]").forEach(b=>b.onclick=()=>{cliente=b.dataset.cliente;paint();});
        root.querySelector("#back").onclick=()=>{view="cat";paint();};
        root.querySelector("#send").onclick=()=>enviar("WhatsApp");
        root.querySelector("#pdf").onclick=()=>enviar("PDF");
        return;
      }

      const list = q ? all.filter(it=>(it.n+" "+it.sku+" "+it.d).toLowerCase().includes(q.toLowerCase())) : cats[cat];
      const sig = siguiente();
      root.innerHTML =
        appHead("🔩","Ferretería El Tornillo","Cotizador para obra y contratistas") + `
        <div class="dapp-body">
          <div class="dapp-tabs">${["Catálogo","Cotizaciones"].map(t=>
            `<button class="dapp-tab ${t===mainTab?'active':''}" data-main="${t}">${t}${t==="Cotizaciones"?" ("+historial.length+")":""}</button>`).join("")}</div>
          ${mainTab==="Catálogo"?`
            <input class="dapp-search" id="q" placeholder="🔍 Producto, medida o código (FER-1021)…" value="${q}" aria-label="Buscar producto">
            ${q?"":`<div class="dapp-chips">${Object.keys(cats).map(c=>
              `<button class="chip ${c===cat?'on':''}" data-cat="${c}">${c}</button>`).join("")}</div>`}
            ${pctDesc()>0?`<div class="dapp-alert blue"><span>🎉</span>
              <div><b>Descuento del ${pctDesc()}% aplicado</b><span>El cliente ahorra ${money(desc())} en esta cotización</span></div></div>`:""}
            ${sig&&subtotal()>0?`<div class="dapp-alert amber"><span>💡</span>
              <div><b>Faltan ${money(sig[0]-subtotal())} para el ${sig[1]}%</b><span>Escalones por volumen: $3,000 → 3% · $8,000 → 5% · $20,000 → 8%</span></div></div>`:""}
            ${list.length?list.map(it=>itemRow({
              mute: it.st===0,
              title: it.n,
              meta: `${it.d} · <b class="sku">${it.sku}</b> · ${existencia(it)}`,
              side: `<span class="price">${money(it.p)}<i>/${it.u}</i></span>` + stepper(it.n, qty[it.n]||0)
            })).join(""):`<div class="dapp-empty"><span>📦</span><b>Sin resultados para "${q}"</b>
              <p>Busca por nombre, medida o código de producto.</p></div>`}`
          : historial.length ? historial.map(h=>`
            <div class="dapp-card">
              <div class="dapp-row" style="padding:0 0 4px"><span><b>${h.folio}</b> · ${h.fecha}</span>
                <span class="dapp-badge ${badge(h.status)}">${h.status}</span></div>
              <div class="dapp-row" style="padding:0"><span class="muted">${h.cliente}</span><span><b>${money(h.total)}</b></span></div>
            </div>`).join("")
          : `<div class="dapp-empty"><span>📄</span><b>Todavía no hay cotizaciones</b><p>Arma una desde el catálogo.</p></div>`}
        </div>
        ${mainTab==="Catálogo"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${count()} ${count()===1?"artículo":"artículos"}</span><b>${money(subtotal())}</b></div>
          <button class="dapp-cta" id="goQuote" ${count()===0?"disabled":""}>Cotizar</button>
        </div>`:""}`;
      root.querySelectorAll("[data-main]").forEach(b=>b.onclick=()=>{mainTab=b.dataset.main;paint();});
      const inp = root.querySelector("#q");
      if(inp) inp.oninput=e=>{q=e.target.value;paint();keepCaret(root,"#q");};
      root.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{cat=b.dataset.cat;paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{qty[b.dataset.plus]=(qty[b.dataset.plus]||0)+1;paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
        const k=b.dataset.minus; if(qty[k]){qty[k]--; if(!qty[k])delete qty[k];} paint();});
      const go=root.querySelector("#goQuote");
      if(go) go.onclick=()=>{folio=nuevoFolio("COT");view="quote";paint();};
    }
    withLoading(root, paint);
  }
},

/* ============ 3. FARMACIA ============
   Panel del mostrador: ventas del día, caducidades, pedido sugerido y
   clientes de tratamiento.
   Realismo: fechas de caducidad calculadas, lotes, dos droguerías con
   precios y tiempos distintos, y la gráfica de la semana. */
farmacia:{
  title:"Panel de farmacia",
  render(root){
    let tab = "Alertas", qc = "", prov = "Droguería Nacional";

    let alerts = [
      {tipo:"red",icon:"⏰",t:"Caduca el "+fechaCorta(12),d:"Amoxicilina 500 mg · lote L-4471 · 24 cajas en anaquel B3",accion:"Devolver a droguería",done:false},
      {tipo:"red",icon:"⏰",t:"Caduca el "+fechaCorta(20),d:"Jarabe infantil ambroxol · lote L-2231 · 9 piezas",accion:"Marcar para remate",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Paracetamol 500 mg",d:"Quedan 6 cajas · se venden ~4 al día · alcanza para 1 día y medio",accion:"Agregar al pedido",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Suero oral",d:"Quedan 3 piezas · se venden ~2 al día",accion:"Agregar al pedido",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Vitamina C 1 g",d:"Quedan 5 tubos · temporada de gripa, la demanda subió 40%",accion:"Agregar al pedido",done:false}
    ];

    /* Cada droguería tiene su propio precio y su propio tiempo de entrega:
       es la decisión real que toma el dueño cada mañana. */
    const provs = {
      "Droguería Nacional":{factor:1,    entrega:()=>"mañana "+fechaCorta(1)+" antes de las 9:00 am", envio:"Sin costo desde $1,500"},
      "Farmapronto":       {factor:1.06, entrega:()=>"hoy "+fechaCorta(0)+" antes de las 6:00 pm",   envio:"Envío $120"}
    };
    let pedido = [
      {n:"Paracetamol 500 mg c/10",sug:20,q:20,p:12.5},
      {n:"Suero oral 625 ml",sug:12,q:12,p:18},
      {n:"Ibuprofeno 400 mg c/10",sug:15,q:15,p:15.8},
      {n:"Vitamina C 1 g c/10",sug:10,q:10,p:22}
    ];
    let clientes = [
      {n:"Don Jorge Ramírez",tel:"953 118 2201",trat:"Metformina 850 mg",dias:30,sent:false},
      {n:"Sra. Carmen López",tel:"953 105 7742",trat:"Losartán 50 mg",dias:28,sent:false},
      {n:"Familia Torres",tel:"953 132 0186",trat:"Vitaminas infantiles",dias:21,sent:false},
      {n:"Lic. Paola Rueda",tel:"953 121 8830",trat:"Omeprazol 20 mg",dias:26,sent:false}
    ];

    const precio = it => Math.round(it.p*provs[prov].factor*100)/100;
    const totalPed = () => pedido.reduce((s,it)=>s+it.q*precio(it),0);
    const piezas = () => pedido.reduce((s,it)=>s+it.q,0);
    const pendientes = () => alerts.filter(a=>!a.done);
    const iniciales = n => n.replace(/^(Don|Sra\.|Lic\.|Familia)\s+/,"").split(" ").map(w=>w[0]).slice(0,2).join("");

    function paint(){
      const listaC = qc ? clientes.filter(c=>(c.n+" "+c.trat).toLowerCase().includes(qc.toLowerCase())) : clientes;
      root.innerHTML =
        appHead("💊","Farmacia San Miguel","Panel de mostrador · "+fechaLarga(0)) + `
        <div class="dapp-body">
          <div class="stat-grid">
            <div class="stat-card"><span>Ventas</span><b>$8,430</b><em>▲ 12%</em></div>
            <div class="stat-card"><span>Tickets</span><b>46</b><em>▲ 5</em></div>
            <div class="stat-card"><span>Caducan</span><b>${pendientes().filter(a=>a.tipo==="red").length}</b><em class="is-bad">lotes</em></div>
          </div>
          <div class="dapp-card">
            <b>Ventas de la semana</b>
            <span class="muted small" style="display:block">Últimos 7 días · cierre de caja 8:00 pm</span>
            ${sparkline([6200,7100,5400,6800,7900,9100,8430],["L","M","M","J","V","S","D"])}
          </div>
          <div class="dapp-tabs">${["Alertas","Pedido","Clientes"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Alertas"&&pendientes().length?" ("+pendientes().length+")":""}</button>`).join("")}</div>

          ${tab==="Alertas" ? (pendientes().length ? alerts.map((a,i)=>a.done?"":`
            <div class="dapp-alert ${a.tipo}">
              <span class="ico">${a.icon}</span>
              <div class="body"><b>${a.t}</b><span>${a.d}</span>
                <div class="approve-btns"><button class="btn-approve yes" data-ok="${i}">${a.accion} ✓</button></div>
              </div>
            </div>`).join("")
            : `<div class="dapp-empty"><span>🌟</span><b>Todo atendido</b>
               <p>El sistema revisa caducidades y existencias cada noche y te deja aquí solo lo que necesita tu decisión.</p></div>`)

          : tab==="Pedido" ? `
            <div class="dapp-label">Droguería</div>
            <div class="dapp-chips">
              ${Object.keys(provs).map(p=>
                `<button class="chip ${p===prov?'on':''}" data-prov="${p}">${p}</button>`).join("")}
            </div>
            <div class="dapp-alert blue"><span class="ico">🤖</span>
              <div class="body"><b>Pedido sugerido según tu rotación</b>
              <span>Calculado con las ventas de los últimos 30 días · entrega ${provs[prov].entrega()} · ${provs[prov].envio}</span></div></div>
            ${pedido.map((it,i)=>itemRow({
              title: it.n,
              meta: `Sugerido: ${it.sug} · ${money(precio(it))} c/u${prov==="Farmapronto"?' <span class="dapp-badge amber">+6%</span>':""}`,
              side: stepper(String(i), it.q)
            })).join("")}
            <div class="dapp-sheet">
              <div class="dapp-row"><span>${piezas()} piezas</span><span>${money(totalPed())}</span></div>
              <div class="dapp-row total"><span>Total del pedido</span><span>${money(totalPed())}</span></div>
            </div>`

          : `
            <input class="dapp-search" id="qc" placeholder="🔍 Buscar cliente o tratamiento…" value="${qc}" aria-label="Buscar cliente">
            ${listaC.length?listaC.map(c=>{const i=clientes.indexOf(c);return itemRow({
              emoji: `<span class="avatar">${iniciales(c.n)}</span>`,
              title: c.n,
              meta: `${c.trat} · surtió hace ${c.dias} días · 📞 ${c.tel}`,
              side: c.sent
                ? `<span class="dapp-badge green">Enviado ✓</span>`
                : `<button class="dapp-tab" data-rec="${i}">Recordar 📲</button>`
            })}).join(""):`<div class="dapp-empty"><span>🔍</span><b>Sin coincidencias</b><p>Busca por nombre o por medicamento.</p></div>`}
            <p class="dapp-note">El recordatorio sale con el nombre del cliente y su medicamento, no como mensaje masivo.</p>`}
        </div>
        ${tab==="Pedido"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${pedido.length} productos · ${piezas()} pzas</span><b>${money(totalPed())}</b></div>
          <button class="dapp-cta" id="sendOrder">Enviar pedido</button>
        </div>`:""}`;

      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>{
        const a = alerts[+b.dataset.ok];
        a.done=true; toast(a.accion+": listo","✔️"); paint();
      });
      root.querySelectorAll("[data-prov]").forEach(b=>b.onclick=()=>{prov=b.dataset.prov;paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{pedido[+b.dataset.plus].q++;paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{const it=pedido[+b.dataset.minus];if(it.q>0)it.q--;paint();});
      root.querySelectorAll("[data-rec]").forEach(b=>b.onclick=()=>{
        const c = clientes[+b.dataset.rec];
        c.sent=true;
        toast("WhatsApp a "+c.n.split(" ").slice(0,2).join(" "),"📲");
        paint();
      });
      const qcInp = root.querySelector("#qc");
      if(qcInp) qcInp.oninput=e=>{qc=e.target.value;paint();keepCaret(root,"#qc");};
      const so = root.querySelector("#sendOrder");
      if(so) so.onclick=()=>{
        const folioPed = nuevoFolio("PED");
        toast("Pedido "+folioPed+" enviado","🚚");
        successScreen(root,"🚚","Pedido enviado a "+prov,
          "Salió con las cantidades que ajustaste. Nadie capturó nada dos veces.",
          `<div class="dapp-row"><span>Folio</span><span>${folioPed}</span></div>
           <div class="dapp-row"><span>Piezas</span><span>${piezas()}</span></div>
           <div class="dapp-row"><span>Entrega</span><span>${provs[prov].entrega()}</span></div>
           <div class="dapp-row total"><span>Total</span><span>${money(totalPed())}</span></div>`);
      };
    }
    withLoading(root, paint);
  }
},

/* ============ 4. DISTRIBUIDORA ============
   Portal donde el tendero pide solo, sin llamar.
   Realismo: pedido mínimo, hora de corte por día de reparto, línea de crédito
   con fecha de corte, precios por volumen y seguimiento con repartidor. */
distribuidora:{
  title:"Portal de clientes",
  render(root){
    const items = [
      {e:"🫗",n:"Aceite vegetal 1 L",d:"Caja 12 pzas",p:310,vol:10},
      {e:"🌾",n:"Harina de trigo 1 kg",d:"Caja 10 pzas",p:185,vol:10},
      {e:"🐟",n:"Atún en agua",d:"Caja 48 latas",p:620,vol:5},
      {e:"🧻",n:"Papel higiénico",d:"Paquete 32 rollos",p:265,vol:8},
      {e:"🧴",n:"Detergente 5 kg",d:"Caja 4 pzas",p:390,vol:6},
      {e:"🥫",n:"Frijol bayo 1 kg",d:"Costal 25 kg",p:720,vol:4}
    ];
    const LIMITE = 50000, USADO_PREVIO = 18400, MINIMO = 2000;
    const lastOrder = {"Aceite vegetal 1 L":10,"Harina de trigo 1 kg":6,"Atún en agua":4};
    const fechaUltimo = fechaCorta(-14);

    /* Días de reparto reales, con su hora de corte */
    const rutas = [
      {dia:"Mañana", delta:1, corte:"hoy 4:00 pm"},
      {dia:"Jueves", delta:proximo(4), corte:"miércoles 4:00 pm"},
      {dia:"Sábado", delta:proximo(6), corte:"viernes 12:00 pm"}
    ];

    let qty = {}, tab = "Catálogo", entrega = rutas[0];
    let historial = [
      {folio:"PED-"+new Date().getFullYear()+"-0071",fecha:fechaUltimo,total:12750,status:"Entregado",pasos:4,
       entrega:fechaCorta(-13),chofer:"Beto Márquez"}
    ];

    const precio = it => (qty[it.n]||0)>=it.vol ? Math.round(it.p*0.95) : it.p;
    const total = () => items.reduce((s,it)=>s+(qty[it.n]||0)*precio(it),0);
    const count = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const credito = () => USADO_PREVIO + total();
    const falta = () => Math.max(0, MINIMO - total());

    function paint(){
      const usoPct = Math.min(1, credito()/LIMITE);
      root.innerHTML =
        appHead("🚚","Distribuidora del Centro","Abarrotes Lupita · cliente mayorista ⭐") + `
        <div class="dapp-body">
          <div class="dapp-card">
            <b>Línea de crédito</b>
            <div class="dapp-row" style="padding:2px 0 0"><span class="muted">Usado</span><span>${money(credito())} de ${money(LIMITE)}</span></div>
            <div class="credit-bar"><div class="credit-fill${usoPct>0.85?" is-hot":""}" style="transform:scaleX(${usoPct})"></div></div>
            <span class="muted small">Disponible ${money(LIMITE-credito())} · corte el ${proximoDiaMes(30)} · sin facturas vencidas</span>
          </div>
          <div class="dapp-tabs">${["Catálogo","Mis pedidos"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Mis pedidos"?" ("+historial.length+")":""}</button>`).join("")}</div>

          ${tab==="Catálogo" ? `
            <button class="dapp-repeat" id="repeat">🔁 Repetir mi pedido del ${fechaUltimo}<small>Aceite ×10 · Harina ×6 · Atún ×4</small></button>
            ${items.map(it=>{
              const enDesc = (qty[it.n]||0)>=it.vol;
              return itemRow({
                emoji: it.e,
                title: it.n,
                meta: `${it.d} · ${enDesc
                  ? `<s>${money(it.p)}</s> <b class="is-ok">${money(precio(it))}</b> −5% por volumen`
                  : `${money(it.p)} · desde ${it.vol} cajas −5%`}`,
                side: stepper(it.n, qty[it.n]||0, {unidad:"cj"})
              });
            }).join("")}
            <div class="dapp-label">Día de reparto</div>
            <div class="dapp-chips">
              ${rutas.map(r=>
                `<button class="chip ${r.dia===entrega.dia?'on':''}" data-dia="${r.dia}">🗓️ ${r.dia} ${fechaCorta(r.delta)}</button>`).join("")}
            </div>
            <p class="dapp-note">Cierre de pedidos para ${entrega.dia.toLowerCase()}: ${entrega.corte}. Después entra a la siguiente ruta.</p>
            ${falta()>0&&count()>0?`<div class="dapp-alert amber"><span class="ico">🧾</span>
              <div class="body"><b>Pedido mínimo ${money(MINIMO)}</b><span>Te faltan ${money(falta())} para que la ruta pase a tu tienda</span></div></div>`:""}`

          : historial.map(h=>`
            <div class="dapp-card">
              <div class="dapp-row" style="padding:0 0 10px"><span><b>${h.folio}</b> · ${h.fecha}</span>
                <span class="dapp-badge ${h.status==="Entregado"?"green":"violet"}">${h.status}</span></div>
              <div class="dapp-timeline">
                ${["Pedido recibido","En preparación","En ruta","Entregado"].map((p,i)=>`
                  <div class="tl-step ${i<h.pasos?"done":i===h.pasos?"now":""}">
                    <div class="tl-dot">${i<h.pasos?"✓":i===h.pasos?"●":""}</div>
                    <div><b>${p}</b>${i===h.pasos&&h.chofer?`<span>Reparte ${h.chofer}</span>`:""}</div>
                  </div>`).join("")}
              </div>
              <div class="dapp-row" style="padding:0"><span class="muted">Entrega: ${h.entrega}</span><span></span></div>
              <div class="dapp-row total" style="margin-top:0"><span>Total</span><span>${money(h.total)}</span></div>
            </div>`).join("")}
        </div>
        ${tab==="Catálogo"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${count()} ${count()===1?"caja":"cajas"}</span><b>${money(total())}</b></div>
          <button class="dapp-cta" id="sendOrder" ${count()===0||falta()>0?"disabled":""}>Hacer pedido</button>
        </div>`:""}`;

      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-dia]").forEach(b=>b.onclick=()=>{entrega=rutas.find(r=>r.dia===b.dataset.dia);paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{qty[b.dataset.plus]=(qty[b.dataset.plus]||0)+1;paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
        const k=b.dataset.minus; if(qty[k]){qty[k]--; if(!qty[k])delete qty[k];} paint();});
      const rep = root.querySelector("#repeat");
      if(rep) rep.onclick=()=>{qty={...lastOrder};toast("Se cargó tu pedido del "+fechaUltimo,"🔁");paint();};
      const send = root.querySelector("#sendOrder");
      if(send) send.onclick=()=>{
        const folio = nuevoFolio("PED");
        const monto = total();
        historial.unshift({folio,fecha:"hoy",total:monto,status:"En preparación",pasos:1,
          entrega:entrega.dia.toLowerCase()+" "+fechaCorta(entrega.delta),chofer:"Beto Márquez"});
        qty={}; tab="Mis pedidos";
        toast("Pedido "+folio+" recibido en bodega","📦");
        /* La bodega confirma y el pedido avanza solo, como en el portal real */
        dLater(()=>{
          const h = historial.find(x=>x.folio===folio);
          if(h){ h.status="En ruta"; h.pasos=2;
            if(tab==="Mis pedidos") paint();
            toast("Beto salió con tu pedido "+folio,"🚚");
          }
        },3600);
        paint();
      };
    }
    withLoading(root, paint);
  }
},

/* ============ 5. BOUTIQUE ============
   Catálogo con inventario del local + apartados a plazos.
   Realismo: colores y tallas con existencias reales, fechas de las quincenas
   calculadas, validación de datos y descuento del inventario al apartar. */
boutique:{
  title:"Tienda y apartados",
  render(root){
    let items = [
      {e:"👗",n:"Vestido floral",p:549,color:"Azul cielo",tallas:{CH:1,M:2,G:0}},
      {e:"🧥",n:"Chamarra de mezclilla",p:729,color:"Índigo",tallas:{M:3,G:1,XL:1}},
      {e:"👚",n:"Blusa de lino",p:389,color:"Hueso",tallas:{CH:1,M:1}},
      {e:"👜",n:"Bolsa artesanal",p:459,color:"Tejida a mano",tallas:{"Única":1}},
      {e:"👠",n:"Zapatilla nude",p:679,color:"Nude",tallas:{"23":1,"24":2,"25":0}},
      {e:"🧣",n:"Rebozo de seda",p:890,color:"Vino",tallas:{"Única":2}}
    ];
    let sel = {}, fav = new Set(), plan = 1, view = "cat", nombre = "", tel = "";
    const chosen = () => Object.entries(sel).filter(([,t])=>t);
    const total = () => chosen().reduce((s,[n])=>s+items.find(i=>i.n===n).p,0);
    const telLimpio = () => tel.replace(/\D/g,"");
    /* Quincenas reales: día 15 y último de mes a partir de hoy */
    function quincenas(n){
      const out=[]; const d=new Date();
      while(out.length<n){
        d.setDate(d.getDate()+1);
        const ultimo = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
        if(d.getDate()===15 || d.getDate()===ultimo){
          out.push(d.toLocaleDateString("es-MX",{day:"numeric",month:"short"}).replace(".",""));
        }
      }
      return out;
    }

    function paint(){
      if(view==="cat"){
        root.innerHTML =
          appHead("👗","Boutique Alma","Catálogo · inventario del local en vivo",
            `<span class="dapp-mini" aria-label="Favoritos">♥ ${fav.size}</span>`) + `
          <div class="dapp-body">
            ${items.map(it=>{
              const stock = Object.values(it.tallas).reduce((a,b)=>a+b,0);
              return `
              <div class="dapp-item is-stacked">
                <div class="main">
                  <div class="prod-emoji lg">${it.e}</div>
                  <div class="info"><b>${it.n}${stock===1?' <span class="dapp-badge amber">Última pieza</span>':""}</b>
                    <span>${it.color} · ${stock} ${stock===1?"disponible":"disponibles"} en el local</span></div>
                </div>
                <div class="side">
                  <span class="price">${money(it.p)}</span>
                  <button class="fav-btn" data-fav="${it.n}" aria-label="${fav.has(it.n)?"Quitar de":"Guardar en"} favoritos">${fav.has(it.n)?"❤️":"🤍"}</button>
                </div>
                <div class="tallas">
                  ${Object.entries(it.tallas).map(([t,st])=>`
                    <button class="chip ${sel[it.n]===t?'on':''}" data-item="${it.n}" data-talla="${t}" ${st===0?"disabled":""}>
                      ${t}${st===0?"":st===1?" · última":""}</button>`).join("")}
                </div>
              </div>`;}).join("")}
            <p class="dapp-note">Cuando se vende una prenda en el local, desaparece del catálogo en línea al instante.</p>
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>${chosen().length} ${chosen().length===1?"prenda":"prendas"}</span><b>${money(total())}</b></div>
            <button class="dapp-cta" id="goPay" ${chosen().length===0?"disabled":""}>Apartar</button>
          </div>`;
        root.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>{
          const n=b.dataset.fav;
          if(fav.has(n)){fav.delete(n);} else {fav.add(n);toast("Guardado en favoritos","❤️");}
          paint();});
        root.querySelectorAll("[data-talla]:not(:disabled)").forEach(b=>b.onclick=()=>{
          const {item,talla} = b.dataset;
          sel[item] = sel[item]===talla ? null : talla;
          paint();});
        const go = root.querySelector("#goPay");
        if(go) go.onclick=()=>{view="pay";paint();};
      }
      else{
        const cuota = Math.ceil(total()/plan);
        const fechas = quincenas(plan);
        root.innerHTML =
          appHead("💳","Tu apartado","Confirma tus datos y cómo quieres pagar") + `
          <div class="dapp-body">
            <div class="dapp-sheet">
              ${chosen().map(([n,t])=>{const it=items.find(i=>i.n===n);
                return `<div class="dapp-row"><span>${it.e} ${n} · talla ${t}</span><span>${money(it.p)}</span></div>`;}).join("")}
              <div class="dapp-row total"><span>Total</span><span>${money(total())}</span></div>
            </div>
            <div class="dapp-label">Tus datos</div>
            <input class="dapp-input" id="nom" placeholder="Tu nombre" value="${nombre}" autocomplete="name">
            <input class="dapp-input" id="tel" placeholder="WhatsApp a 10 dígitos" value="${tel}" inputmode="numeric" autocomplete="tel">
            <div class="dapp-label">Plan de pagos</div>
            <div class="dapp-tabs">
              ${[1,2,3].map(p=>`<button class="dapp-tab ${p===plan?'active':''}" data-plan="${p}">${p===1?"Un pago":p+" quincenas"}</button>`).join("")}
            </div>
            <div class="dapp-alert blue">
              <span class="ico">📅</span>
              <div class="body"><b>${plan===1?"Pagas "+money(total())+" al recoger":plan+" pagos de "+money(cuota)}</b>
              <span>${plan===1
                ? "Te lo guardamos hasta el "+fechaCorta(2)+" a las 8:00 pm"
                : "Primer pago hoy · siguientes el "+fechas.slice(0,plan-1).join(" y el ")+" · te recordamos por WhatsApp un día antes"}</span></div>
            </div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Catálogo</button>
            <button class="dapp-cta" id="confirm">Confirmar apartado</button>
          </div>`;
        root.querySelector("#nom").oninput=e=>nombre=e.target.value;
        root.querySelector("#tel").oninput=e=>tel=e.target.value;
        root.querySelectorAll("[data-plan]").forEach(b=>b.onclick=()=>{plan=+b.dataset.plan;paint();});
        root.querySelector("#back").onclick=()=>{view="cat";paint();};
        root.querySelector("#confirm").onclick=()=>{
          if(!nombre.trim()){ toast("Escribe tu nombre","⚠️"); keepCaret(root,"#nom"); return; }
          if(telLimpio().length!==10){ toast("El WhatsApp va a 10 dígitos","⚠️"); keepCaret(root,"#tel"); return; }
          const lista = chosen();
          lista.forEach(([n,t])=>{items.find(i=>i.n===n).tallas[t]--;});
          const folio = "AP-"+String(folioSeq++%900+100);
          toast("Apartado "+folio+" confirmado","🛍️");
          successScreen(root,"🛍️","¡Listo, "+nombre.trim().split(" ")[0]+"!",
            "El inventario del local ya se actualizó solo: esas prendas dejaron de estar disponibles para alguien más.",
            `<div class="dapp-row"><span>Apartado</span><span>${folio}</span></div>
             <div class="dapp-row"><span>A nombre de</span><span>${nombre.trim()}</span></div>
             <div class="dapp-row"><span>Prendas</span><span>${lista.length}</span></div>
             <div class="dapp-row"><span>${plan===1?"Recoger antes del":"Pagos"}</span><span>${plan===1?fechaCorta(2):plan+" quincenas"}</span></div>
             <div class="dapp-row total"><span>Total</span><span>${money(total())}</span></div>`);
        };
      }
    }
    withLoading(root, paint);
  }
},

/* ============ 6. TALLER ============
   El cliente consulta su vehículo sin llamar: avance, presupuesto que aprueba
   por escrito, fotos y chat con el mecánico.
   Realismo: folio que se valida de verdad, avance que sube con el tiempo,
   indicador de "escribiendo…" y solicitud de factura. */
taller:{
  title:"Taller en línea",
  render(root){
    const FOLIO = "A-1042";
    let view = "lookup", tab = "Avance", chatDraft = "", intento = "A-1042", error = "";
    let avance = 70, escribiendo = false, factura = false;
    let extra = {n:"Cambio de bujías",p:480,status:"pendiente",hora:""};
    const base = [
      {n:"Balatas delanteras (juego)",p:1250},
      {n:"Rectificado de discos",p:600},
      {n:"Mano de obra",p:850}
    ];
    let msgs = [
      {me:false,t:"Buen día Sr. Méndez, recibimos su Versa a las 10:30. En cuanto tengamos el diagnóstico le aviso por aquí 👍",h:horaMas(-240)},
      {me:false,t:"Diagnóstico listo: balatas al 10% y discos con desgaste. Le dejé el presupuesto en la pestaña de al lado.",h:horaMas(-95)}
    ];
    const replies = [
      "¡Claro que sí! Ahorita le mando la foto 📸",
      "Vamos bien de tiempo, hoy mismo queda 👌",
      "Anotado. Cualquier cosa le aviso por aquí 🙌"
    ];
    let ri = 0;
    const total = () => base.reduce((s,i)=>s+i.p,0) + (extra.status==="aprobado"?extra.p:0);

    function paint(){
      if(view==="lookup"){
        root.innerHTML =
          appHead("🔧","Taller Rodríguez","Consulta el estatus de tu vehículo") + `
          <div class="dapp-body">
            <label class="dapp-label" for="folio">Número de orden</label>
            <input class="dapp-input${error?" is-error":""}" id="folio" value="${intento}" autocapitalize="characters">
            ${error?`<p class="dapp-error">⚠️ ${error}</p>`:""}
            <button class="dapp-cta full" id="check">Consultar estatus</button>
            <div class="dapp-alert blue" style="margin-top:16px"><span class="ico">📲</span>
              <div class="body"><b>Tu cliente recibe este enlace al dejar su vehículo</b>
              <span>Nadie vuelve a llamar para preguntar "¿ya está listo?"</span></div></div>
          </div>`;
        const inp = root.querySelector("#folio");
        inp.oninput=e=>{intento=e.target.value;};
        inp.onkeydown=e=>{ if(e.key==="Enter") root.querySelector("#check").click(); };
        root.querySelector("#check").onclick=()=>{
          if(intento.trim().toUpperCase()!==FOLIO){
            error = "No encontramos la orden "+(intento.trim()||"vacía")+". Revisa tu comprobante — en el demo es "+FOLIO+".";
            paint(); keepCaret(root,"#folio"); return;
          }
          error=""; view="status";
          /* El avance sube solo mientras la pantalla está abierta */
          dEvery(()=>{
            if(avance<100){
              avance = Math.min(100, avance+2);
              if(view==="status" && tab==="Avance") paint();
            }
          },4000);
          paint();
        };
        return;
      }

      root.innerHTML =
        appHead("🔧","Orden "+FOLIO,"Nissan Versa 2019 · placas MHZ-42-18 · Sr. Méndez") + `
        <div class="dapp-body">
          <div class="dapp-tabs">${["Avance","Presupuesto","Fotos","Chat"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Presupuesto"&&extra.status==="pendiente"?" ⚠️":""}</button>`).join("")}</div>

          ${tab==="Avance"?`
            <div class="dapp-card">
              <div class="dapp-row" style="padding:0"><span><b>Avance general</b></span><span><b>${avance}%</b></span></div>
              <div class="credit-bar"><div class="credit-fill" style="transform:scaleX(${avance/100})"></div></div>
              <span class="muted small">${avance>=100?"Listo para entrega — te avisamos por WhatsApp":"Estimamos terminar hoy a las "+horaMas((100-avance)*3)}</span>
            </div>
            <div class="dapp-timeline">
              <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Vehículo recibido</b><span>Ayer 10:30 am · kilometraje 84,120</span></div></div>
              <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Diagnóstico y presupuesto</b><span>Balatas al 10% y discos con desgaste</span></div></div>
              <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Refacciones recibidas</b><span>Hoy 9:00 am · originales con garantía</span></div></div>
              <div class="tl-step ${avance>=100?"done":"now"}"><div class="tl-dot">${avance>=100?"✓":"●"}</div>
                <div><b>En reparación · ${avance}%</b><span>Frenos delanteros armados, falta prueba de carretera</span></div></div>
              <div class="tl-step ${avance>=100?"now":""}"><div class="tl-dot">${avance>=100?"●":""}</div>
                <div><b>Listo para entrega</b><span>${avance>=100?"Puedes pasar por él":"Te avisamos por WhatsApp"}</span></div></div>
            </div>`

          :tab==="Presupuesto"?`
            <div class="dapp-sheet">
              ${base.map(i=>`<div class="dapp-row"><span>${i.n}</span><span>${money(i.p)}</span></div>`).join("")}
              ${extra.status==="aprobado"?`<div class="dapp-row is-ok"><span>${extra.n} ✓</span><span>${money(extra.p)}</span></div>`:""}
              <div class="dapp-row total"><span>Total ${extra.status==="aprobado"?"actualizado":"autorizado"}</span><span>${money(total())}</span></div>
            </div>
            ${extra.status==="pendiente"?`
              <div class="dapp-alert amber">
                <span class="ico">🔍</span>
                <div class="body"><b>El mecánico encontró algo más</b>
                  <span>${extra.n} · ${money(extra.p)}. Las actuales tienen desgaste avanzado y hacen fallar el arranque en frío.</span>
                  <div class="approve-btns">
                    <button class="btn-approve yes" id="apr">Aprobar</button>
                    <button class="btn-approve no" id="rej">Ahora no</button>
                  </div>
                </div>
              </div>`
            :extra.status==="rechazado"?`
              <div class="dapp-alert blue"><span class="ico">👍</span>
                <div class="body"><b>Sin cargos extra</b><span>Solo se hará el trabajo que autorizaste al principio</span></div></div>`
            :`
              <div class="dapp-alert blue"><span class="ico">✅</span>
                <div class="body"><b>Trabajo adicional aprobado a las ${extra.hora}</b>
                <span>Quedó registrado con fecha y hora — sin sorpresas a la hora de pagar</span></div></div>`}
            <label class="dapp-check">
              <input type="checkbox" id="fac" ${factura?"checked":""}>
              <span>Quiero factura a nombre de mi empresa</span>
            </label>
            ${factura?`<p class="dapp-note">Te pediremos el RFC y el uso de CFDI al momento de entregar. La factura sale el mismo día.</p>`:""}`

          :tab==="Fotos"?`
            <div class="photo-grid">
              <div class="photo">🛞<small>Balata · antes</small></div>
              <div class="photo">🔩<small>Disco · antes</small></div>
              <div class="photo">⚙️<small>Refacción nueva</small></div>
              <div class="photo">🛠️<small>Montaje</small></div>
              <div class="photo">📸<small>Torque final</small></div>
              <div class="photo">🚗<small>Prueba</small></div>
            </div>
            <p class="dapp-note">El mecánico sube el antes y el después desde su celular. Tu cliente ve la evidencia y tú quedas cubierto ante un reclamo.</p>`

          :`
            <div class="chat-list" id="chatList">
              ${msgs.map(m=>`<div class="chat-msg ${m.me?"me":"them"}">${m.t}<small>${m.h}</small></div>`).join("")}
              ${escribiendo?`<div class="chat-msg them typing"><i></i><i></i><i></i></div>`:""}
            </div>
            <div class="chat-input-row">
              <input class="dapp-input" id="chatInp" placeholder="Escribe un mensaje…" value="${chatDraft}" aria-label="Mensaje para el taller">
              <button class="dapp-btn-sm send" id="chatSend" aria-label="Enviar mensaje">➤</button>
            </div>
            <p class="dapp-note">Chat directo con el taller: sin llamadas y todo queda por escrito.</p>`}
        </div>`;

      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      const a=root.querySelector("#apr"), r=root.querySelector("#rej");
      if(a) a.onclick=()=>{extra.status="aprobado";extra.hora=ahora();toast("Autorización registrada","✅");paint();};
      if(r) r.onclick=()=>{extra.status="rechazado";toast("Anotado, sin cargos extra","👍");paint();};
      const fac=root.querySelector("#fac");
      if(fac) fac.onchange=e=>{factura=e.target.checked;paint();};

      const inp=root.querySelector("#chatInp"), sendB=root.querySelector("#chatSend");
      if(inp){
        const list = root.querySelector("#chatList");
        if(list) list.scrollTop = list.scrollHeight;
        inp.oninput=e=>chatDraft=e.target.value;
        const sendMsg=()=>{
          if(!chatDraft.trim()) return;
          msgs.push({me:true,t:chatDraft.trim(),h:ahora()});
          chatDraft=""; escribiendo=false;
          paint(); keepCaret(root,"#chatInp");
          /* El mecánico "escribe" antes de contestar, como en WhatsApp */
          dLater(()=>{
            escribiendo=true;
            if(view==="status"&&tab==="Chat") paint();
            dLater(()=>{
              escribiendo=false;
              msgs.push({me:false,t:replies[ri++%replies.length],h:ahora()});
              if(view==="status"&&tab==="Chat"){ paint(); keepCaret(root,"#chatInp"); }
              else toast("Nuevo mensaje del taller","💬");
            },1500);
          },700);
        };
        sendB.onclick=sendMsg;
        inp.onkeydown=e=>{ if(e.key==="Enter") sendMsg(); };
      }
    }
    withLoading(root, paint);
  }
}
};
