/* ==================== UTILIDADES COMPARTIDAS DE LOS DEMOS ==================== */
/* Temporizadores de los demos: se limpian al abrir/cerrar el modal (ver app.js) */
const demoTimers = [];
function dLater(fn, ms){ const id = setTimeout(fn, ms); demoTimers.push(id); return id; }
function clearDemoTimers(){ while(demoTimers.length) clearTimeout(demoTimers.pop()); }

/* Barra de estado tipo teléfono con la hora real */
function statusBar(){
  const hh = new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
  return `<div class="dapp-statusbar"><span>${hh}</span><span>📶 LTE&nbsp;&nbsp;🔋 82%</span></div>`;
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
  dLater(()=>{ t.classList.remove("show"); dLater(()=>t.remove(),300); },2200);
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

function successScreen(container,icon,titulo,texto){
  container.innerHTML = `
    <div class="dapp-success">
      <div class="big">${icon}</div>
      <b>${titulo}</b>
      <p>${texto}</p>
      <p class="dapp-note">Esto es una demostración. Tu versión real se conecta con tu operación y tus datos.</p>
    </div>`;
}

const DEMOS = {

/* ============ 1. RESTAURANTE: menú -> revisión -> seguimiento en vivo -> cuenta ============ */
restaurante:{
  title:"Demo · Pedidos en mesa",
  render(root){
    const menu = {
      "Platillos":[
        {e:"🌮",n:"Tacos de pastor (orden)",d:"5 piezas con piña y cilantro",p:95,tag:"Más pedido"},
        {e:"🥘",n:"Enchiladas verdes",d:"Pollo, crema y queso fresco",p:110},
        {e:"🍔",n:"Hamburguesa de la casa",d:"Res 200 g, tocino y papas",p:145,tag:"Nuevo"},
        {e:"🥗",n:"Ensalada César",d:"Con pollo a la parrilla",p:98},
        {e:"🍗",n:"Mole de la abuela",d:"Pierna de pollo y arroz",p:125,agotado:true}
      ],
      "Bebidas":[
        {e:"🍹",n:"Agua del día 1L",d:"Horchata o jamaica",p:45},
        {e:"🥤",n:"Refresco",d:"Vidrio 355 ml",p:30},
        {e:"☕",n:"Café de olla",d:"Con piloncillo y canela",p:38},
        {e:"🍋",n:"Limonada mineral",d:"Vaso 500 ml",p:42}
      ],
      "Postres":[
        {e:"🍮",n:"Flan napolitano",d:"Receta de la abuela",p:55},
        {e:"🍩",n:"Churros (4)",d:"Con cajeta o chocolate",p:48},
        {e:"🍫",n:"Pastel de chocolate",d:"Rebanada",p:62}
      ]
    };
    const all = Object.values(menu).flat();
    let cart={}, tab="Platillos", q="", tip=10, note="", view="menu", track=0, pago="Efectivo", sentAt="";
    const find = n => all.find(x=>x.n===n);
    const subtotal = () => Object.entries(cart).reduce((s,[k,v])=>s+find(k).p*v,0);
    const count = () => Object.values(cart).reduce((a,b)=>a+b,0);
    const tipAmt = () => Math.round(subtotal()*tip/100);

    /* La comanda avanza sola, como si la cocina fuera actualizando */
    function scheduleTrack(){
      [[2400,1],[5200,2],[8200,3]].forEach(([ms,s])=>dLater(()=>{
        if(track<s){ track=s; if(view==="track") paint(); }
      },ms));
    }

    function paint(){
      if(view==="menu"){
        const list = q ? all.filter(it=>it.n.toLowerCase().includes(q.toLowerCase())) : menu[tab];
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
              <div><h4>🍽️ La Cocina de Rosa</h4><small>Mesa 4 · Menú digital vía QR</small></div>
              <button class="dapp-mini" id="waiter">🔔 Mesero</button>
            </div>
          </div>
          <div class="dapp-body">
            <input class="dapp-search" id="q" placeholder="🔍 Buscar en el menú…" value="${q}">
            ${q?"":`<div class="dapp-tabs">${Object.keys(menu).map(c=>
              `<button class="dapp-tab ${c===tab?'active':''}" data-tab="${c}">${c}</button>`).join("")}</div>`}
            ${list.length?list.map(it=>`
              <div class="dapp-item"${it.agotado?' style="opacity:.55"':''}>
                <div style="display:flex;gap:12px;align-items:center;flex:1;min-width:0">
                  <div class="prod-emoji">${it.e}</div>
                  <div class="info"><b>${it.n} ${it.tag?`<span class="dapp-badge violet">${it.tag}</span>`:""}${it.agotado?'<span class="dapp-badge red">Agotado</span>':""}</b><span>${it.d}</span></div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="price">${money(it.p)}</span>
                  ${it.agotado?"":`<button class="dapp-btn-sm minus" data-minus="${it.n}">−</button>
                  <span class="dapp-qty">${cart[it.n]||0}</span>
                  <button class="dapp-btn-sm" data-plus="${it.n}">+</button>`}
                </div>
              </div>`).join(""):`<p class="dapp-note">No encontramos "${q}" en el menú</p>`}
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>${count()} artículos</span><b>${money(subtotal())}</b></div>
            <button class="dapp-cta" id="goReview" ${count()===0?"disabled":""}>Revisar pedido</button>
          </div>`;
        root.querySelector("#waiter").onclick=()=>toast("El mesero va en camino a tu mesa","🔔");
        root.querySelector("#q").oninput=e=>{q=e.target.value;paint();keepCaret(root,"#q");};
        root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
        root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{cart[b.dataset.plus]=(cart[b.dataset.plus]||0)+1;paint();});
        root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
          const k=b.dataset.minus; if(cart[k]){cart[k]--; if(!cart[k])delete cart[k];} paint();});
        const go = root.querySelector("#goReview");
        if(go) go.onclick=()=>{view="review";paint();};
      }
      else if(view==="review"){
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}<h4>🧾 Revisa tu pedido</h4><small>Mesa 4 · antes de enviar a cocina</small></div>
          <div class="dapp-body">
            ${Object.entries(cart).map(([k,v])=>`
              <div class="dapp-row"><span>${find(k).e} ${v}× ${k}</span><span>${money(find(k).p*v)}</span></div>`).join("")}
            <div class="dapp-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
            <div style="margin:14px 0 6px;font-weight:600;font-size:0.88rem">¿Alguna indicación para la cocina?</div>
            <textarea class="dapp-input" id="nota" placeholder="Ej. sin cebolla, salsa aparte…">${note}</textarea>
            <div style="margin:6px 0 6px;font-weight:600;font-size:0.88rem">Propina para el equipo</div>
            <div class="dapp-tabs">${[0,5,10,15].map(t=>
              `<button class="dapp-tab ${t===tip?'active':''}" data-tip="${t}">${t===0?"Sin propina":t+"%"}</button>`).join("")}</div>
            <div class="dapp-row"><span>Propina</span><span>${money(tipAmt())}</span></div>
            <div class="dapp-row total"><span>Total</span><span>${money(subtotal()+tipAmt())}</span></div>
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
          sentAt = new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
          scheduleTrack();
          toast("Pedido enviado a cocina","👨‍🍳");
          paint();
        };
      }
      else if(view==="track"){
        const pasos=["Recibido en cocina","Preparando tus platillos","En camino a tu mesa","Servido · ¡buen provecho!"];
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}<h4>👨‍🍳 Comanda #48</h4><small>Mesa 4 · enviada a las ${sentAt}</small></div>
          <div class="dapp-body">
            <div class="dapp-alert blue" style="margin-bottom:14px">
              <span style="font-size:1.2rem">⏱️</span>
              <div><b>Tiempo estimado: 18 min</b><span>Esta pantalla se actualiza sola, sin recargar</span></div>
            </div>
            <div class="dapp-timeline">
              ${pasos.map((p,i)=>`
                <div class="tl-step ${i<track?"done":i===track?"now":""}">
                  <div class="tl-dot">${i<track?"✓":i===track?"●":""}</div>
                  <div><b>${p}</b>${i===track?"<span>ahora mismo</span>":""}</div>
                </div>`).join("")}
            </div>
            <div style="background:#fff;border-radius:14px;padding:16px;font-family:monospace;font-size:0.85rem;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
              <div style="text-align:center;border-bottom:1.5px dashed #DDD9F0;padding-bottom:8px;margin-bottom:8px"><b>COCINA · MESA 4</b></div>
              ${Object.entries(cart).map(([k,v])=>`<div class="dapp-row"><span>${v}× ${k}</span></div>`).join("")}
              ${note?`<div style="border-top:1.5px dashed #DDD9F0;padding-top:8px;margin-top:8px;color:#B87D1E">📝 ${note}</div>`:""}
            </div>
            <p class="dapp-note">La cocina recibe la comanda al instante: sin papel, sin gritos, sin errores de letra.</p>
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>Total con propina</span><b>${money(subtotal()+tipAmt())}</b></div>
            <button class="dapp-cta" id="bill">💳 Pedir la cuenta</button>
          </div>`;
        root.querySelector("#bill").onclick=()=>{view="bill";paint();};
      }
      else{
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}<h4>💳 Tu cuenta</h4><small>Mesa 4 · Comanda #48</small></div>
          <div class="dapp-body">
            <div class="dapp-row"><span>Consumo</span><span>${money(subtotal())}</span></div>
            <div class="dapp-row"><span>Propina (${tip}%)</span><span>${money(tipAmt())}</span></div>
            <div class="dapp-row total"><span>Total a pagar</span><span>${money(subtotal()+tipAmt())}</span></div>
            <div style="margin:16px 0 8px;font-weight:600;font-size:0.88rem">¿Cómo quieres pagar?</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${["Efectivo 💵","Tarjeta en mesa 💳","Transferencia 📲"].map(m=>{
                const key=m.split(" ")[0];
                return `<button class="chip ${pago===key?'on':''}" data-pago="${key}">${m}</button>`;}).join("")}
            </div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Comanda</button>
            <button class="dapp-cta" id="pay">Pagar ${money(subtotal()+tipAmt())}</button>
          </div>`;
        root.querySelectorAll("[data-pago]").forEach(b=>b.onclick=()=>{pago=b.dataset.pago;paint();});
        root.querySelector("#back").onclick=()=>{view="track";paint();};
        root.querySelector("#pay").onclick=()=>{
          toast("Pago registrado","🧾");
          successScreen(root,"🧾","¡Gracias por tu visita!",
            "Pagaste "+money(subtotal()+tipAmt())+" ("+pago.toLowerCase()+"). El ticket se envió a caja y la mesa 4 quedó libre en el sistema.");
        };
      }
    }
    withLoading(root, paint);
  }
},

/* ============ 2. FERRETERÍA: catálogo con SKU y stock -> cotización -> historial ============ */
ferreteria:{
  title:"Demo · Cotizador",
  render(root){
    const cats = {
      "Construcción":[
        {n:"Cemento gris 50 kg",d:"CPC 30R",sku:"FER-1021",st:64,p:238},
        {n:"Varilla 3/8 pulg (pieza)",d:"12 metros",sku:"FER-1088",st:120,p:165},
        {n:"Bulto de arena 50 kg",d:"Cernida",sku:"FER-1130",st:40,p:85},
        {n:"Block 15×20×40",d:"Pieza",sku:"FER-1207",st:500,p:18}
      ],
      "Plomería":[
        {n:"Tubo PVC 4 pulg (tramo)",d:"6 m sanitario",sku:"PLO-2010",st:26,p:210},
        {n:"Llave de paso 1/2 pulg",d:"Bronce",sku:"PLO-2054",st:18,p:145},
        {n:"Cinta teflón",d:"Rollo 10 m",sku:"PLO-2101",st:90,p:12}
      ],
      "Eléctrico":[
        {n:"Cable THW cal. 12 (m)",d:"Por metro",sku:"ELE-3005",st:300,p:14},
        {n:"Contacto doble",d:"Con placa",sku:"ELE-3040",st:45,p:48},
        {n:"Pastilla térmica 20A",d:"1 polo",sku:"ELE-3077",st:22,p:135}
      ],
      "Pintura":[
        {n:"Vinílica 19L blanco",d:"Mate lavable",sku:"PIN-4001",st:12,p:1150},
        {n:"Esmalte 1L negro",d:"Brillante",sku:"PIN-4022",st:30,p:185},
        {n:"Brocha 4 pulg",d:"Cerda natural",sku:"PIN-4103",st:55,p:65}
      ]
    };
    const all = Object.values(cats).flat();
    let qty={}, cat="Construcción", q="", mainTab="Catálogo", view="cat", cliente="", obra="", folio=null;
    let historial = [
      {folio:"COT-812",fecha:"22 jul",cliente:"Constructora Hernández",total:14890,status:"Aceptada"},
      {folio:"COT-807",fecha:"18 jul",cliente:"Ing. Salas",total:3210,status:"Pendiente"}
    ];
    const find = n => all.find(x=>x.n===n);
    const subtotal = () => Object.entries(qty).reduce((s,[k,v])=>s+find(k).p*v,0);
    const count = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const desc = () => subtotal()>=3000 ? Math.round(subtotal()*0.05) : 0;
    const iva = () => Math.round((subtotal()-desc())*0.16);
    const granTotal = () => subtotal()-desc()+iva();
    const badge = s => s==="Aceptada"?"green":s==="Pendiente"?"amber":"violet";

    function enviar(medio){
      if(!cliente.trim()){ toast("Escribe el nombre del cliente","⚠️"); return; }
      historial.unshift({folio,fecha:"hoy",cliente:cliente.trim(),total:granTotal(),status:"Enviada"});
      qty={}; view="cat"; mainTab="Cotizaciones";
      toast(folio+" enviada por "+medio,"✅");
      paint();
    }

    function paint(){
      if(view==="quote"){
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}<h4>📄 Cotización ${folio}</h4><small>Vigencia: 15 días · precios con IVA</small></div>
          <div class="dapp-body">
            <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px">Cliente *</label>
            <input class="dapp-input" id="cli" placeholder="Ej. Constructora Hernández" value="${cliente}">
            <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px">Obra o referencia</label>
            <input class="dapp-input" id="obra" placeholder="Ej. Obra Av. Juárez, 2a etapa" value="${obra}">
            <div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
              ${Object.entries(qty).map(([k,v])=>`
                <div class="dapp-row"><span>${v}× ${k} <small style="color:#8A86AC">${find(k).sku}</small></span><span>${money(find(k).p*v)}</span></div>`).join("")}
              <div class="dapp-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
              ${desc()>0?`<div class="dapp-row" style="color:#178A56"><span>Descuento por volumen (5%)</span><span>−${money(desc())}</span></div>`:""}
              <div class="dapp-row"><span>IVA 16%</span><span>${money(iva())}</span></div>
              <div class="dapp-row total"><span>Total</span><span>${money(granTotal())}</span></div>
            </div>
            <p class="dapp-note">Queda guardada en tu historial y lista para convertirse en venta con un clic.</p>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Editar</button>
            <div style="display:flex;gap:8px">
              <button class="dapp-tab" id="pdf">📄 PDF</button>
              <button class="dapp-cta" id="send">Enviar por WhatsApp</button>
            </div>
          </div>`;
        root.querySelector("#cli").oninput=e=>cliente=e.target.value;
        root.querySelector("#obra").oninput=e=>obra=e.target.value;
        root.querySelector("#back").onclick=()=>{view="cat";paint();};
        root.querySelector("#send").onclick=()=>enviar("WhatsApp");
        root.querySelector("#pdf").onclick=()=>enviar("PDF");
        return;
      }
      const list = q ? all.filter(it=>(it.n+" "+it.sku).toLowerCase().includes(q.toLowerCase())) : cats[cat];
      root.innerHTML = `
        <div class="dapp-head">${statusBar()}<h4>🔩 Ferretería El Tornillo</h4><small>Cotizador para obra y contratistas</small></div>
        <div class="dapp-body">
          <div class="dapp-tabs">${["Catálogo","Cotizaciones"].map(t=>
            `<button class="dapp-tab ${t===mainTab?'active':''}" data-main="${t}">${t}${t==="Cotizaciones"?" ("+historial.length+")":""}</button>`).join("")}</div>
          ${mainTab==="Catálogo"?`
            <input class="dapp-search" id="q" placeholder="🔍 Buscar por producto, medida o código…" value="${q}">
            ${q?"":`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">${Object.keys(cats).map(c=>
              `<button class="chip ${c===cat?'on':''}" data-cat="${c}">${c}</button>`).join("")}</div>`}
            ${subtotal()>0&&subtotal()<3000?`<div class="dapp-alert amber" style="margin-bottom:12px"><span>💡</span>
              <div><b>Te faltan ${money(3000-subtotal())} para el 5% de descuento</b><span>Descuento por volumen en compras desde $3,000</span></div></div>`:""}
            ${desc()>0?`<div class="dapp-alert blue" style="margin-bottom:12px"><span>🎉</span>
              <div><b>Descuento del 5% aplicado</b><span>Ahorras ${money(desc())}</span></div></div>`:""}
            ${list.length?list.map(it=>`
              <div class="dapp-item">
                <div class="info"><b>${it.n}</b><span>${it.d} · <b style="color:#8A86AC">${it.sku}</b> · ${it.st} disp.</span></div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="price">${money(it.p)}</span>
                  <button class="dapp-btn-sm minus" data-minus="${it.n}">−</button>
                  <span class="dapp-qty">${qty[it.n]||0}</span>
                  <button class="dapp-btn-sm" data-plus="${it.n}">+</button>
                </div>
              </div>`).join(""):`<p class="dapp-note">Sin resultados para "${q}"</p>`}`
          : historial.map(h=>`
            <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:10px;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
              <div class="dapp-row" style="padding:0 0 4px"><span><b>${h.folio}</b> · ${h.fecha}</span>
                <span class="dapp-badge ${badge(h.status)}">${h.status}</span></div>
              <div class="dapp-row" style="padding:0"><span style="color:#7A76A0">${h.cliente}</span><span><b>${money(h.total)}</b></span></div>
            </div>`).join("")}
        </div>
        ${mainTab==="Catálogo"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${count()} artículos</span><b>${money(subtotal())}</b></div>
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
      if(go) go.onclick=()=>{folio="COT-"+Math.floor(815+Math.random()*80);view="quote";paint();};
    }
    withLoading(root, paint);
  }
},

/* ============ 3. FARMACIA: panel con estadísticas del día + 3 pestañas operativas ============ */
farmacia:{
  title:"Demo · Panel de farmacia",
  render(root){
    let tab = "Alertas", qc = "", prov = "Droguería Nacional";
    let alerts = [
      {tipo:"red",icon:"⏰",t:"Caduca en 12 días",d:"Amoxicilina 500 mg · 24 cajas en anaquel B3",done:false},
      {tipo:"red",icon:"⏰",t:"Caduca en 20 días",d:"Jarabe infantil · 9 piezas · lote L-2231",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Paracetamol 500 mg",d:"Quedan 6 cajas · vendes ~4 al día",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Suero oral",d:"Quedan 3 piezas · vendes ~2 al día",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Vitamina C 1g",d:"Quedan 5 tubos · temporada de gripa",done:false}
    ];
    let pedido = [
      {n:"Paracetamol 500 mg c/10",sug:20,q:20,p:12.5},
      {n:"Suero oral 625 ml",sug:12,q:12,p:18},
      {n:"Ibuprofeno 400 mg c/10",sug:15,q:15,p:15.8},
      {n:"Vitamina C 1 g c/10",sug:10,q:10,p:22}
    ];
    let clientes = [
      {n:"Don Jorge Ramírez",tel:"953 118 2201",d:"Tratamiento mensual · surtió hace 30 días",sent:false},
      {n:"Sra. Carmen López",tel:"953 105 7742",d:"Medicamento controlado · surtió hace 28 días",sent:false},
      {n:"Familia Torres",tel:"953 132 0186",d:"Vitaminas infantiles · cada 3 semanas",sent:false},
      {n:"Lic. Paola Rueda",tel:"953 121 8830",d:"Suplementos · surtió hace 21 días",sent:false}
    ];
    const totalPed = () => pedido.reduce((s,it)=>s+it.q*it.p,0);
    const pendientes = () => alerts.filter(a=>!a.done);
    const eta = () => prov==="Droguería Nacional" ? "mañana antes de las 9:00 am" : "hoy antes de las 6:00 pm";
    const iniciales = n => n.split(" ").map(w=>w[0]).slice(0,2).join("");

    function paint(){
      const listaC = qc ? clientes.filter(c=>c.n.toLowerCase().includes(qc.toLowerCase())) : clientes;
      root.innerHTML = `
        <div class="dapp-head">${statusBar()}<h4>💊 Farmacia San Miguel</h4><small>Panel de control · ${new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</small></div>
        <div class="dapp-body">
          <div class="stat-grid">
            <div class="stat-card"><span>Ventas hoy</span><b>$8,430</b><em>▲ 12%</em></div>
            <div class="stat-card"><span>Tickets</span><b>46</b><em>▲ 5</em></div>
            <div class="stat-card"><span>Por vencer</span><b>${pendientes().filter(a=>a.tipo==="red").length}</b><em style="color:#E5484D">lotes</em></div>
          </div>
          <div class="dapp-tabs">${["Alertas","Pedido","Clientes"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Alertas"?" ("+pendientes().length+")":""}</button>`).join("")}</div>
          ${tab==="Alertas" ? (pendientes().length ? alerts.map((a,i)=>a.done?"":`
            <div class="dapp-alert ${a.tipo}">
              <span style="font-size:1.3rem">${a.icon}</span>
              <div style="flex:1"><b>${a.t}</b><span>${a.d}</span>
                <div class="approve-btns"><button class="btn-approve yes" data-ok="${i}">Atender ✓</button></div>
              </div>
            </div>`).join("") : `<div class="dapp-success"><div class="big">🌟</div><b>Todo atendido</b><p>No hay alertas pendientes. El sistema vigila caducidades y stock por ti, todos los días.</p></div>`)
          : tab==="Pedido" ? `
            <div style="margin-bottom:10px;font-weight:600;font-size:0.88rem">Proveedor</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
              ${["Droguería Nacional","Farmapronto"].map(p=>
                `<button class="chip ${p===prov?'on':''}" data-prov="${p}">${p}</button>`).join("")}
            </div>
            <div class="dapp-alert blue" style="margin-bottom:12px"><span>🤖</span>
              <div><b>Pedido sugerido según tus ventas</b><span>Rotación de los últimos 30 días · entrega ${eta()}</span></div></div>
            ${pedido.map((it,i)=>`
              <div class="dapp-item">
                <div class="info"><b>${it.n}</b><span>Sugerido: ${it.sug} · ${money(it.p)} c/u</span></div>
                <div style="display:flex;align-items:center;gap:8px">
                  <button class="dapp-btn-sm minus" data-pm="${i}">−</button>
                  <span class="dapp-qty">${it.q}</span>
                  <button class="dapp-btn-sm" data-pp="${i}">+</button>
                </div>
              </div>`).join("")}
            <div class="dapp-row total"><span>Total del pedido</span><span>${money(totalPed())}</span></div>`
          : `
            <input class="dapp-search" id="qc" placeholder="🔍 Buscar cliente…" value="${qc}">
            ${listaC.map(c=>{const i=clientes.indexOf(c);return `
            <div class="dapp-item">
              <div style="display:flex;gap:12px;align-items:center;flex:1;min-width:0">
                <div class="prod-emoji" style="border-radius:50%;font-size:0.9rem;font-weight:700;color:#5B2EBF">${iniciales(c.n)}</div>
                <div class="info"><b>${c.n}</b><span>${c.d} · 📞 ${c.tel}</span></div>
              </div>
              ${c.sent?`<span class="dapp-badge green">Enviado ✓</span>`
                :`<button class="dapp-tab" data-rec="${i}">Recordar 📲</button>`}
            </div>`;}).join("")}`}
        </div>
        ${tab==="Pedido"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${pedido.length} productos</span><b>${money(totalPed())}</b></div>
          <button class="dapp-cta" id="sendOrder">Enviar pedido</button>
        </div>`:""}`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>{alerts[+b.dataset.ok].done=true;toast("Alerta atendida","✔️");paint();});
      root.querySelectorAll("[data-prov]").forEach(b=>b.onclick=()=>{prov=b.dataset.prov;paint();});
      root.querySelectorAll("[data-pp]").forEach(b=>b.onclick=()=>{pedido[+b.dataset.pp].q++;paint();});
      root.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>{const it=pedido[+b.dataset.pm];if(it.q>0)it.q--;paint();});
      root.querySelectorAll("[data-rec]").forEach(b=>b.onclick=()=>{clientes[+b.dataset.rec].sent=true;toast("Recordatorio enviado por WhatsApp","📲");paint();});
      const qcInp = root.querySelector("#qc");
      if(qcInp) qcInp.oninput=e=>{qc=e.target.value;paint();keepCaret(root,"#qc");};
      const so = root.querySelector("#sendOrder");
      if(so) so.onclick=()=>{
        const folioPed = "PED-"+Math.floor(4400+Math.random()*100);
        toast("Pedido "+folioPed+" enviado","🚚");
        successScreen(root,"🚚","Pedido enviado a "+prov,
          "Pedido "+folioPed+" por "+money(totalPed())+" con las cantidades que ajustaste. Entrega estimada: "+eta()+". Nada se capturó a mano.");
      };
    }
    withLoading(root, paint);
  }
},

/* ============ 4. DISTRIBUIDORA: portal con crédito, repetir pedido y seguimiento vivo ============ */
distribuidora:{
  title:"Demo · Portal de clientes",
  render(root){
    const items = [
      {e:"🫗",n:"Aceite vegetal 1L",d:"Caja 12 pzas",p:310},
      {e:"🌾",n:"Harina de trigo 1kg",d:"Caja 10 pzas",p:185},
      {e:"🐟",n:"Atún en agua",d:"Caja 48 latas",p:620},
      {e:"🧻",n:"Papel higiénico",d:"Paquete 32 rollos",p:265},
      {e:"🧴",n:"Detergente 5kg",d:"Caja 4 pzas",p:390}
    ];
    const LIMITE = 50000, USADO_PREVIO = 18400;
    const lastOrder = {"Aceite vegetal 1L":10,"Harina de trigo 1kg":6,"Atún en agua":4};
    let qty = {}, tab = "Catálogo", entrega = "Mañana";
    let historial = [
      {folio:"PED-3098",fecha:"18 jul",total:12750,status:"Entregado",pasos:4,entrega:"18 jul"}
    ];
    const precio = it => (qty[it.n]||0)>=10 ? Math.round(it.p*0.95) : it.p;
    const total = () => items.reduce((s,it)=>s+(qty[it.n]||0)*precio(it),0);
    const count = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const credito = () => USADO_PREVIO + total();

    function paint(){
      root.innerHTML = `
        <div class="dapp-head">${statusBar()}<h4>🚚 Distribuidora del Centro</h4><small>Portal · Abarrotes Lupita · Nivel mayorista ⭐</small></div>
        <div class="dapp-body">
          <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:14px;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
            <div class="dapp-row" style="padding:0"><span><b>Línea de crédito</b></span><span>${money(credito())} de ${money(LIMITE)}</span></div>
            <div class="credit-bar"><div class="credit-fill" style="width:${Math.min(100,credito()/LIMITE*100)}%"></div></div>
            <span style="font-size:0.75rem;color:#7A76A0">Disponible: ${money(LIMITE-credito())} · corte el día 30</span>
          </div>
          <div class="dapp-tabs">${["Catálogo","Mis pedidos"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Mis pedidos"?" ("+historial.length+")":""}</button>`).join("")}</div>
          ${tab==="Catálogo" ? `
            <button class="dapp-tab" id="repeat" style="width:100%;margin-bottom:12px">🔁 Repetir mi pedido del 18 jul</button>
            ${items.map(it=>{
              const enDesc = (qty[it.n]||0)>=10;
              return `
              <div class="dapp-item">
                <div style="display:flex;gap:12px;align-items:center;flex:1;min-width:0">
                  <div class="prod-emoji">${it.e}</div>
                  <div class="info"><b>${it.n}</b><span>${it.d} · ${enDesc?`<s>${money(it.p)}</s> <b style="color:#178A56">${money(precio(it))}</b> −5%`:money(it.p)+" · 10+ cajas −5%"}</span></div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <button class="dapp-btn-sm minus" data-minus="${it.n}">−</button>
                  <span class="dapp-qty">${qty[it.n]||0}</span>
                  <button class="dapp-btn-sm" data-plus="${it.n}">+</button>
                </div>
              </div>`;}).join("")}
            <div style="margin:14px 0 8px;font-weight:600;font-size:0.88rem">Día de entrega</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${["Mañana","Jueves","Sábado"].map(d=>
                `<button class="chip ${d===entrega?'on':''}" data-dia="${d}">🗓️ ${d}</button>`).join("")}
            </div>`
          : historial.map(h=>`
            <div style="background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
              <div class="dapp-row" style="padding:0 0 10px"><span><b>${h.folio}</b> · ${h.fecha}</span>
                <span class="dapp-badge ${h.status==="Entregado"?"green":"violet"}">${h.status}</span></div>
              <div class="dapp-timeline">
                ${["Pedido recibido","En preparación","En ruta","Entregado"].map((p,i)=>`
                  <div class="tl-step ${i<h.pasos?"done":i===h.pasos?"now":""}">
                    <div class="tl-dot">${i<h.pasos?"✓":i===h.pasos?"●":""}</div>
                    <div><b>${p}</b></div>
                  </div>`).join("")}
              </div>
              <div class="dapp-row" style="padding:0"><span>Entrega: ${h.entrega}</span><span></span></div>
              <div class="dapp-row total" style="margin-top:0"><span>Total</span><span>${money(h.total)}</span></div>
            </div>`).join("")}
        </div>
        ${tab==="Catálogo"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${count()} cajas</span><b>${money(total())}</b></div>
          <button class="dapp-cta" id="sendOrder" ${count()===0?"disabled":""}>Hacer pedido</button>
        </div>`:""}`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-dia]").forEach(b=>b.onclick=()=>{entrega=b.dataset.dia;paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{qty[b.dataset.plus]=(qty[b.dataset.plus]||0)+1;paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
        const k=b.dataset.minus; if(qty[k]){qty[k]--; if(!qty[k])delete qty[k];} paint();});
      const rep = root.querySelector("#repeat");
      if(rep) rep.onclick=()=>{qty={...lastOrder};toast("Se cargó tu pedido del 18 jul","🔁");paint();};
      const send = root.querySelector("#sendOrder");
      if(send) send.onclick=()=>{
        const folio = "PED-"+Math.floor(3100+Math.random()*100);
        historial.unshift({folio,fecha:"hoy",total:total(),status:"En preparación",pasos:1,entrega:entrega.toLowerCase()});
        qty={}; tab="Mis pedidos";
        toast("Pedido "+folio+" recibido","📦");
        /* La bodega confirma y el pedido avanza solo, como en la app real */
        dLater(()=>{
          const h = historial.find(x=>x.folio===folio);
          if(h){ h.status="En ruta"; h.pasos=2;
            if(tab==="Mis pedidos") paint();
            toast("Tu pedido "+folio+" ya va en ruta","🚚");
          }
        },3200);
        paint();
      };
    }
    withLoading(root, paint);
  }
},

/* ============ 5. BOUTIQUE: catálogo con tallas, favoritos y apartado con datos ============ */
boutique:{
  title:"Demo · Tienda + apartados",
  render(root){
    let items = [
      {e:"👗",n:"Vestido floral",p:549,tallas:{CH:1,M:2,G:0}},
      {e:"🧥",n:"Chamarra de mezclilla",p:729,tallas:{M:3,G:1,XL:1}},
      {e:"👚",n:"Blusa de lino",p:389,tallas:{CH:1,M:1}},
      {e:"👜",n:"Bolsa artesanal",p:459,tallas:{"Única":1}},
      {e:"👠",n:"Zapatilla nude",p:679,tallas:{"23":1,"24":2,"25":0}}
    ];
    let sel = {}, fav = new Set(), plan = 1, view = "cat", nombre = "", tel = "";
    const chosen = () => Object.entries(sel).filter(([,t])=>t);
    const total = () => chosen().reduce((s,[n])=>s+items.find(i=>i.n===n).p,0);

    function paint(){
      if(view==="cat"){
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
              <div><h4>👗 Boutique Alma</h4><small>Catálogo · inventario del local en tiempo real</small></div>
              <span class="dapp-mini">♥ ${fav.size}</span>
            </div>
          </div>
          <div class="dapp-body">
            ${items.map(it=>{
              const stock = Object.values(it.tallas).reduce((a,b)=>a+b,0);
              return `
              <div class="dapp-item" style="flex-direction:column;align-items:stretch;gap:10px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div style="display:flex;gap:12px;align-items:center">
                    <div class="prod-emoji" style="font-size:1.7rem">${it.e}</div>
                    <div class="info"><b>${it.n} ${stock===1?'<span class="dapp-badge amber">Última pieza</span>':""}</b><span>${stock} en existencia</span></div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="price">${money(it.p)}</span>
                    <button class="fav-btn" data-fav="${it.n}">${fav.has(it.n)?"❤️":"🤍"}</button>
                  </div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${Object.entries(it.tallas).map(([t,st])=>`
                    <button class="chip ${sel[it.n]===t?'on':''}" data-item="${it.n}" data-talla="${t}" ${st===0?"disabled":""}>
                      ${t}${st===0?"":st===1?" · última":""}</button>`).join("")}
                </div>
              </div>`;}).join("")}
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>${chosen().length} prendas</span><b>${money(total())}</b></div>
            <button class="dapp-cta" id="goPay" ${chosen().length===0?"disabled":""}>Apartar</button>
          </div>`;
        root.querySelectorAll("[data-fav]").forEach(b=>b.onclick=()=>{
          const n=b.dataset.fav;
          if(fav.has(n)){fav.delete(n);} else {fav.add(n);toast("Guardado en favoritos","❤️");}
          paint();});
        root.querySelectorAll(".chip:not(:disabled)").forEach(b=>b.onclick=()=>{
          const {item,talla} = b.dataset;
          sel[item] = sel[item]===talla ? null : talla;
          paint();});
        const go = root.querySelector("#goPay");
        if(go) go.onclick=()=>{view="pay";paint();};
      }
      else{
        const cuota = Math.ceil(total()/plan);
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}<h4>💳 Tu apartado</h4><small>Confirma tus datos y cómo quieres pagar</small></div>
          <div class="dapp-body">
            ${chosen().map(([n,t])=>{const it=items.find(i=>i.n===n);
              return `<div class="dapp-row"><span>${it.e} ${n} · talla ${t}</span><span>${money(it.p)}</span></div>`;}).join("")}
            <div class="dapp-row total"><span>Total</span><span>${money(total())}</span></div>
            <div style="margin:16px 0 6px;font-weight:600;font-size:0.88rem">Tus datos</div>
            <input class="dapp-input" id="nom" placeholder="Tu nombre" value="${nombre}">
            <input class="dapp-input" id="tel" placeholder="WhatsApp (10 dígitos)" value="${tel}" inputmode="numeric">
            <div style="margin:10px 0 8px;font-weight:600;font-size:0.88rem">Plan de pagos</div>
            <div class="dapp-tabs">
              ${[1,2,3].map(p=>`<button class="dapp-tab ${p===plan?'active':''}" data-plan="${p}">${p===1?"Un pago":p+" quincenas"}</button>`).join("")}
            </div>
            <div class="dapp-alert blue">
              <span>📅</span>
              <div><b>${plan===1?"Pagas "+money(total())+" al recoger":plan+" pagos de "+money(cuota)}</b>
              <span>${plan===1?"Apartado por 48 horas":"Primer pago hoy · recordatorios automáticos por WhatsApp antes de cada quincena"}</span></div>
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
          if(!nombre.trim()){ toast("Escribe tu nombre","⚠️"); return; }
          if(tel.replace(/\D/g,"").length<10){ toast("Revisa tu número de WhatsApp","⚠️"); return; }
          const lista = chosen();
          lista.forEach(([n,t])=>{items.find(i=>i.n===n).tallas[t]--;});
          toast("Apartado confirmado","🛍️");
          successScreen(root,"🛍️","¡Listo, "+nombre.trim().split(" ")[0]+"! Apartado A-217",
            lista.length+" prenda(s) guardada(s) a tu nombre. "+(plan===1?"Tienes 48 horas para recogerlas.":"Programamos tus "+plan+" pagos quincenales con recordatorio por WhatsApp al "+tel+".")+" El inventario del local ya se actualizó solo.");
        };
      }
    }
    withLoading(root, paint);
  }
},

/* ============ 6. TALLER: estatus + presupuesto aprobable + fotos + chat con el mecánico ============ */
taller:{
  title:"Demo · Taller en línea",
  render(root){
    let view = "lookup", tab = "Avance", chatDraft = "";
    let extra = {n:"Cambio de bujías (recomendado)",p:480,status:"pendiente",hora:""};
    const base = [
      {n:"Cambio de balatas delanteras",p:1250},
      {n:"Rectificado de discos",p:600},
      {n:"Mano de obra",p:850}
    ];
    let msgs = [
      {me:false,t:"Buen día Sr. Méndez, recibimos su Versa a las 10:30. En cuanto tengamos el diagnóstico le aviso por aquí 👍",h:"10:34"},
      {me:false,t:"Diagnóstico listo: balatas al 10% y discos con desgaste. Le dejé el presupuesto en la pestaña de al lado.",h:"12:05"}
    ];
    const replies = [
      "¡Claro que sí! Ahorita le mando la foto 📸",
      "Vamos muy bien de tiempo, hoy mismo queda 👌",
      "Anotado, cualquier cosa le aviso por aquí 🙌"
    ];
    let ri = 0;
    const total = () => base.reduce((s,i)=>s+i.p,0) + (extra.status==="aprobado"?extra.p:0);
    const ahora = () => new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});

    function paint(){
      if(view==="lookup"){
        root.innerHTML = `
          <div class="dapp-head">${statusBar()}<h4>🔧 Taller Rodríguez</h4><small>Consulta el estatus de tu vehículo</small></div>
          <div class="dapp-body">
            <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:8px">Número de orden</label>
            <input class="dapp-input" id="folio" value="A-1042">
            <button class="dapp-cta" id="check" style="width:100%">Consultar estatus</button>
            <p class="dapp-note">Tu cliente recibe este enlace por WhatsApp al dejar su vehículo. Nadie llama a preguntar "¿ya está listo?"</p>
          </div>`;
        root.querySelector("#check").onclick=()=>{view="status";paint();};
        return;
      }
      root.innerHTML = `
        <div class="dapp-head">${statusBar()}<h4>🔧 Orden A-1042</h4><small>Nissan Versa 2019 · Placas MHZ-42-18 · Sr. Méndez</small></div>
        <div class="dapp-body">
          <div class="dapp-tabs">${["Avance","Presupuesto","Fotos","Chat"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Presupuesto"&&extra.status==="pendiente"?" ⚠️":""}</button>`).join("")}</div>
          ${tab==="Avance"?`
            <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:14px;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
              <div class="dapp-row" style="padding:0"><span><b>Avance general</b></span><span><b>70%</b></span></div>
              <div class="credit-bar"><div class="credit-fill" style="width:70%"></div></div>
              <span style="font-size:0.75rem;color:#7A76A0">Estimamos terminar hoy a las 5:00 pm</span>
            </div>
            <div class="dapp-timeline">
              <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Vehículo recibido</b><span>Lunes 10:30 am</span></div></div>
              <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Diagnóstico y presupuesto</b><span>Balatas al 10% y discos con desgaste</span></div></div>
              <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Refacciones recibidas</b><span>Martes 9:00 am · originales</span></div></div>
              <div class="tl-step now"><div class="tl-dot">●</div><div><b>En reparación · avance 70%</b><span>Frenos delanteros armados, falta prueba</span></div></div>
              <div class="tl-step"><div class="tl-dot"></div><div><b>Listo para entrega</b><span>Te avisamos por WhatsApp</span></div></div>
            </div>`
          :tab==="Presupuesto"?`
            ${base.map(i=>`<div class="dapp-row"><span>${i.n}</span><span>${money(i.p)}</span></div>`).join("")}
            ${extra.status==="aprobado"?`<div class="dapp-row" style="color:#178A56"><span>${extra.n} ✓</span><span>${money(extra.p)}</span></div>`:""}
            <div class="dapp-row total"><span>Total ${extra.status==="aprobado"?"actualizado":""}</span><span>${money(total())}</span></div>
            ${extra.status==="pendiente"?`
              <div class="dapp-alert amber" style="margin-top:14px">
                <span>🔍</span>
                <div style="flex:1"><b>El mecánico encontró algo más</b>
                  <span>${extra.n} · ${money(extra.p)}. Las actuales tienen desgaste avanzado.</span>
                  <div class="approve-btns">
                    <button class="btn-approve yes" id="apr">Aprobar</button>
                    <button class="btn-approve no" id="rej">Ahora no</button>
                  </div>
                </div>
              </div>`:extra.status==="rechazado"?`
              <div class="dapp-alert blue" style="margin-top:14px"><span>👍</span>
                <div><b>Sin cargos extra</b><span>Solo se hará el trabajo aprobado originalmente</span></div></div>`:`
              <div class="dapp-alert blue" style="margin-top:14px"><span>✅</span>
                <div><b>Trabajo adicional aprobado a las ${extra.hora}</b><span>Quedó registrado con fecha y hora — sin sorpresas al pagar</span></div></div>`}`
          :tab==="Fotos"?`
            <div class="photo-grid">
              <div class="photo">🛞<small>Balata · antes</small></div>
              <div class="photo">🔩<small>Disco · antes</small></div>
              <div class="photo">⚙️<small>Refacción nueva</small></div>
              <div class="photo">🛠️<small>Montaje</small></div>
              <div class="photo">📸<small>Prueba</small></div>
              <div class="photo">🚗<small>Casi listo</small></div>
            </div>
            <p class="dapp-note">El mecánico sube fotos del antes y después. Tu cliente ve la evidencia del trabajo, y tú te proteges de reclamos.</p>`
          :`
            <div class="chat-list">
              ${msgs.map(m=>`<div class="chat-msg ${m.me?"me":"them"}">${m.t}<small>${m.h}</small></div>`).join("")}
            </div>
            <div class="chat-input-row">
              <input class="dapp-input" id="chatInp" placeholder="Escribe un mensaje…" value="${chatDraft}">
              <button class="dapp-btn-sm" id="chatSend" style="width:42px;height:42px">➤</button>
            </div>
            <p class="dapp-note">Chat directo con el taller: sin llamadas, todo queda por escrito.</p>`}
        </div>`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      const a=root.querySelector("#apr"), r=root.querySelector("#rej");
      if(a) a.onclick=()=>{extra.status="aprobado";extra.hora=ahora();toast("Trabajo adicional aprobado","✅");paint();};
      if(r) r.onclick=()=>{extra.status="rechazado";paint();};
      const inp=root.querySelector("#chatInp"), sendB=root.querySelector("#chatSend");
      if(inp){
        inp.oninput=e=>chatDraft=e.target.value;
        const sendMsg=()=>{
          if(!chatDraft.trim()) return;
          msgs.push({me:true,t:chatDraft.trim(),h:ahora()});
          chatDraft="";
          paint();
          keepCaret(root,"#chatInp");
          /* El mecánico responde en unos segundos */
          dLater(()=>{
            msgs.push({me:false,t:replies[ri++%replies.length],h:ahora()});
            if(view==="status"&&tab==="Chat") paint();
            toast("Nuevo mensaje del taller","💬");
          },1600);
        };
        sendB.onclick=sendMsg;
        inp.onkeydown=e=>{ if(e.key==="Enter") sendMsg(); };
      }
    }
    withLoading(root, paint);
  }
}
};
