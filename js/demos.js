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

/* ============ 1. RESTAURANTE: menu -> revision -> confirmacion + comanda ============ */
restaurante:{
  title:"Demo · Menú digital",
  render(root){
    const menu = {
      "Platillos":[
        {n:"Tacos de pastor (orden)",d:"5 piezas con piña y cilantro",p:95},
        {n:"Enchiladas verdes",d:"Pollo, crema y queso fresco",p:110},
        {n:"Hamburguesa de la casa",d:"Res 200g, tocino y papas",p:145},
        {n:"Ensalada César",d:"Con pollo a la parrilla",p:98}
      ],
      "Bebidas":[
        {n:"Agua del día 1L",d:"Horchata o jamaica",p:45},
        {n:"Refresco",d:"Vidrio 355ml",p:30},
        {n:"Café de olla",d:"Con piloncillo y canela",p:38},
        {n:"Limonada mineral",d:"Vaso 500ml",p:42}
      ],
      "Postres":[
        {n:"Flan napolitano",d:"Receta de la abuela",p:55},
        {n:"Churros (4)",d:"Con cajeta o chocolate",p:48},
        {n:"Pastel de chocolate",d:"Rebanada",p:62}
      ]
    };
    const all = Object.values(menu).flat();
    let cart = {}, tab = "Platillos", q = "", tip = 10, view = "menu";
    const find = n => all.find(x=>x.n===n);
    const subtotal = () => Object.entries(cart).reduce((s,[k,v])=>s+find(k).p*v,0);
    const count = () => Object.values(cart).reduce((a,b)=>a+b,0);
    const tipAmt = () => Math.round(subtotal()*tip/100);

    function paint(){
      if(view==="menu"){
        const list = q ? all.filter(it=>it.n.toLowerCase().includes(q.toLowerCase())) : menu[tab];
        root.innerHTML = `
          <div class="dapp-head"><h4>🍽️ La Cocina de Rosa</h4><small>Mesa 4 · Menú digital vía QR</small></div>
          <div class="dapp-body">
            <input class="dapp-search" id="q" placeholder="🔍 Buscar en el menú…" value="${q}">
            ${q?"":`<div class="dapp-tabs">${Object.keys(menu).map(c=>
              `<button class="dapp-tab ${c===tab?'active':''}" data-tab="${c}">${c}</button>`).join("")}</div>`}
            ${list.length?list.map(it=>`
              <div class="dapp-item">
                <div class="info"><b>${it.n}</b><span>${it.d}</span></div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="price">${money(it.p)}</span>
                  <button class="dapp-btn-sm minus" data-minus="${it.n}">−</button>
                  <span class="dapp-qty">${cart[it.n]||0}</span>
                  <button class="dapp-btn-sm" data-plus="${it.n}">+</button>
                </div>
              </div>`).join(""):`<p class="dapp-note">No encontramos "${q}" en el menú</p>`}
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>${count()} artículos</span><b>${money(subtotal())}</b></div>
            <button class="dapp-cta" id="goReview" ${count()===0?"disabled":""}>Revisar pedido</button>
          </div>`;
        const inp = root.querySelector("#q");
        inp.oninput = e=>{q=e.target.value;paint();root.querySelector("#q").focus();
          const v=root.querySelector("#q");v.setSelectionRange(v.value.length,v.value.length);};
        root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
        root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{cart[b.dataset.plus]=(cart[b.dataset.plus]||0)+1;paint();});
        root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
          const k=b.dataset.minus; if(cart[k]){cart[k]--; if(!cart[k])delete cart[k];} paint();});
        const go = root.querySelector("#goReview");
        if(go) go.onclick=()=>{view="review";paint();};
      }
      else if(view==="review"){
        root.innerHTML = `
          <div class="dapp-head"><h4>🍽️ Revisa tu pedido</h4><small>Mesa 4 · antes de enviar a cocina</small></div>
          <div class="dapp-body">
            ${Object.entries(cart).map(([k,v])=>`
              <div class="dapp-row"><span>${v}× ${k}</span><span>${money(find(k).p*v)}</span></div>`).join("")}
            <div class="dapp-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
            <div style="margin:14px 0 6px;font-weight:600;font-size:0.88rem">Propina para el equipo</div>
            <div class="dapp-tabs">${[0,5,10,15].map(t=>
              `<button class="dapp-tab ${t===tip?'active':''}" data-tip="${t}">${t===0?"Sin propina":t+"%"}</button>`).join("")}</div>
            <div class="dapp-row"><span>Propina</span><span>${money(tipAmt())}</span></div>
            <div class="dapp-row total"><span>Total</span><span>${money(subtotal()+tipAmt())}</span></div>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Menú</button>
            <button class="dapp-cta" id="confirm">Enviar a cocina</button>
          </div>`;
        root.querySelectorAll("[data-tip]").forEach(b=>b.onclick=()=>{tip=+b.dataset.tip;paint();});
        root.querySelector("#back").onclick=()=>{view="menu";paint();};
        root.querySelector("#confirm").onclick=()=>{view="done";paint();};
      }
      else{
        root.innerHTML = `
          <div class="dapp-head"><h4>👨‍🍳 Comanda #48 en cocina</h4><small>Mesa 4 · ${new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}</small></div>
          <div class="dapp-body">
            <div class="dapp-alert blue" style="margin-bottom:14px">
              <span style="font-size:1.2rem">⏱️</span>
              <div><b>Tiempo estimado: 18 min</b><span>La cocina ya está preparando tu orden</span></div>
            </div>
            <div style="background:#fff;border-radius:14px;padding:16px;font-family:monospace;font-size:0.85rem;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
              <div style="text-align:center;border-bottom:1.5px dashed #DDD9F0;padding-bottom:8px;margin-bottom:8px"><b>COCINA · MESA 4</b></div>
              ${Object.entries(cart).map(([k,v])=>`<div class="dapp-row"><span>${v}× ${k}</span></div>`).join("")}
              <div style="border-top:1.5px dashed #DDD9F0;padding-top:8px;margin-top:8px;text-align:center;color:#7A76A0">Total ${money(subtotal()+tipAmt())} · propina ${tip}%</div>
            </div>
            <p class="dapp-note">Así se ve la comanda que la cocina recibe al instante: sin papel, sin gritos, sin errores de letra. Esto es una demostración.</p>
          </div>`;
      }
    }
    paint();
  }
},

/* ============ 2. FERRETERIA: catalogo con busqueda -> cotizacion con IVA y descuento ============ */
ferreteria:{
  title:"Demo · Cotizador",
  render(root){
    const cats = {
      "Construcción":[
        {n:"Cemento gris 50kg",d:"CPC 30R",p:238},
        {n:"Varilla 3/8 pulg (pieza)",d:"12 metros",p:165},
        {n:"Bulto de arena 50kg",d:"Cernida",p:85},
        {n:"Block 15×20×40",d:"Pieza",p:18}
      ],
      "Plomería":[
        {n:"Tubo PVC 4 pulg (tramo)",d:"6 m sanitario",p:210},
        {n:"Llave de paso 1/2 pulg",d:"Bronce",p:145},
        {n:"Cinta teflón",d:"Rollo 10 m",p:12}
      ],
      "Eléctrico":[
        {n:"Cable THW cal. 12 (m)",d:"Por metro",p:14},
        {n:"Contacto doble",d:"Con placa",p:48},
        {n:"Pastilla térmica 20A",d:"1 polo",p:135}
      ],
      "Pintura":[
        {n:"Vinílica 19L blanco",d:"Mate lavable",p:1150},
        {n:"Esmalte 1L negro",d:"Brillante",p:185},
        {n:"Brocha 4 pulg",d:"Cerda natural",p:65}
      ]
    };
    const all = Object.values(cats).flat();
    let qty = {}, tab = "Construcción", q = "", view = "cat", cliente = "";
    const find = n => all.find(x=>x.n===n);
    const subtotal = () => Object.entries(qty).reduce((s,[k,v])=>s+find(k).p*v,0);
    const count = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const desc = () => subtotal()>=3000 ? Math.round(subtotal()*0.05) : 0;
    const iva = () => Math.round((subtotal()-desc())*0.16);

    function paint(){
      if(view==="cat"){
        const list = q ? all.filter(it=>it.n.toLowerCase().includes(q.toLowerCase())) : cats[tab];
        root.innerHTML = `
          <div class="dapp-head"><h4>🔩 Ferretería El Tornillo</h4><small>Cotizador para obra y contratistas</small></div>
          <div class="dapp-body">
            <input class="dapp-search" id="q" placeholder="🔍 Buscar por producto, medida o código…" value="${q}">
            ${q?"":`<div class="dapp-tabs">${Object.keys(cats).map(c=>
              `<button class="dapp-tab ${c===tab?'active':''}" data-tab="${c}">${c}</button>`).join("")}</div>`}
            ${subtotal()>0&&subtotal()<3000?`<div class="dapp-alert amber" style="margin-bottom:12px"><span>💡</span>
              <div><b>Te faltan ${money(3000-subtotal())} para el 5% de descuento</b><span>Descuento por volumen en compras desde $3,000</span></div></div>`:""}
            ${desc()>0?`<div class="dapp-alert blue" style="margin-bottom:12px"><span>🎉</span>
              <div><b>Descuento del 5% aplicado</b><span>Ahorras ${money(desc())}</span></div></div>`:""}
            ${list.length?list.map(it=>`
              <div class="dapp-item">
                <div class="info"><b>${it.n}</b><span>${it.d}</span></div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="price">${money(it.p)}</span>
                  <button class="dapp-btn-sm minus" data-minus="${it.n}">−</button>
                  <span class="dapp-qty">${qty[it.n]||0}</span>
                  <button class="dapp-btn-sm" data-plus="${it.n}">+</button>
                </div>
              </div>`).join(""):`<p class="dapp-note">Sin resultados para "${q}"</p>`}
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>${count()} artículos</span><b>${money(subtotal())}</b></div>
            <button class="dapp-cta" id="goQuote" ${count()===0?"disabled":""}>Cotizar</button>
          </div>`;
        const inp = root.querySelector("#q");
        inp.oninput = e=>{q=e.target.value;paint();const v=root.querySelector("#q");v.focus();
          v.setSelectionRange(v.value.length,v.value.length);};
        root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
        root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{qty[b.dataset.plus]=(qty[b.dataset.plus]||0)+1;paint();});
        root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
          const k=b.dataset.minus; if(qty[k]){qty[k]--; if(!qty[k])delete qty[k];} paint();});
        const go=root.querySelector("#goQuote");
        if(go) go.onclick=()=>{view="quote";paint();};
      } else {
        const folio = "COT-" + Math.floor(800+Math.random()*200);
        root.innerHTML = `
          <div class="dapp-head"><h4>📄 Cotización ${folio}</h4><small>Vigencia: 15 días · precios con IVA</small></div>
          <div class="dapp-body">
            <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:6px">Cliente / obra</label>
            <input class="dapp-input" id="cli" placeholder="Ej. Constructora Hernández — Obra Av. Juárez" value="${cliente}">
            <div style="background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
              ${Object.entries(qty).map(([k,v])=>`
                <div class="dapp-row"><span>${v}× ${k}</span><span>${money(find(k).p*v)}</span></div>`).join("")}
              <div class="dapp-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
              ${desc()>0?`<div class="dapp-row" style="color:#178A56"><span>Descuento por volumen (5%)</span><span>−${money(desc())}</span></div>`:""}
              <div class="dapp-row"><span>IVA 16%</span><span>${money(iva())}</span></div>
              <div class="dapp-row total"><span>Total</span><span>${money(subtotal()-desc()+iva())}</span></div>
            </div>
            <p class="dapp-note">Lista para enviarse por WhatsApp o correo con folio y vigencia. Esto es una demostración.</p>
          </div>
          <div class="dapp-bar">
            <button class="dapp-tab" id="back">← Editar</button>
            <button class="dapp-cta" id="send">Enviar por WhatsApp</button>
          </div>`;
        root.querySelector("#cli").oninput=e=>cliente=e.target.value;
        root.querySelector("#back").onclick=()=>{view="cat";paint();};
        root.querySelector("#send").onclick=()=>successScreen(root,"✅","Cotización enviada",
          "El presupuesto "+folio+(cliente?" para "+cliente:"")+" por "+money(subtotal()-desc()+iva())+" se envió por WhatsApp. Quedó guardado para convertirlo en venta con un clic.");
      }
    }
    paint();
  }
},

/* ============ 3. FARMACIA: panel con 3 pestañas operativas ============ */
farmacia:{
  title:"Demo · Panel de farmacia",
  render(root){
    let tab = "Alertas";
    let alerts = [
      {tipo:"red",icon:"⏰",t:"Caduca en 12 días",d:"Amoxicilina 500mg · 24 cajas en anaquel B3",done:false},
      {tipo:"red",icon:"⏰",t:"Caduca en 20 días",d:"Jarabe infantil · 9 piezas · lote L-2231",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Paracetamol 500mg",d:"Quedan 6 cajas · vendes ~4 al día",done:false},
      {tipo:"amber",icon:"📦",t:"Stock bajo: Suero oral",d:"Quedan 3 piezas · vendes ~2 al día",done:false}
    ];
    let pedido = [
      {n:"Paracetamol 500mg c/10",sug:20,q:20,p:12.5},
      {n:"Suero oral 625ml",sug:12,q:12,p:18},
      {n:"Ibuprofeno 400mg c/10",sug:15,q:15,p:15.8}
    ];
    let clientes = [
      {n:"Don Jorge Ramírez",d:"Tratamiento mensual · suele surtir esta semana",sent:false},
      {n:"Sra. Carmen López",d:"Medicamento controlado · surtió hace 28 días",sent:false},
      {n:"Familia Torres",d:"Vitaminas infantiles · cada 3 semanas",sent:false}
    ];
    const totalPed = () => pedido.reduce((s,it)=>s+it.q*it.p,0);

    function paint(){
      root.innerHTML = `
        <div class="dapp-head"><h4>💊 Farmacia San Miguel</h4><small>Panel de control · ${new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</small></div>
        <div class="dapp-body">
          <div class="dapp-tabs">${["Alertas","Pedido","Clientes"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Alertas"?" ("+alerts.filter(a=>!a.done).length+")":""}</button>`).join("")}</div>
          ${tab==="Alertas" ? (alerts.filter(a=>!a.done).length ? alerts.map((a,i)=>a.done?"":`
            <div class="dapp-alert ${a.tipo}">
              <span style="font-size:1.3rem">${a.icon}</span>
              <div style="flex:1"><b>${a.t}</b><span>${a.d}</span>
                <div class="approve-btns"><button class="btn-approve yes" data-ok="${i}">Atender ✓</button></div>
              </div>
            </div>`).join("") : `<div class="dapp-success"><div class="big">🌟</div><b>Todo atendido</b><p>No hay alertas pendientes. El sistema vigila caducidades y stock por ti, todos los días.</p></div>`)
          : tab==="Pedido" ? `
            <div class="dapp-alert blue" style="margin-bottom:12px"><span>🤖</span>
              <div><b>Pedido sugerido según tus ventas</b><span>Calculado con la rotación de los últimos 30 días — ajusta si quieres</span></div></div>
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
          : clientes.map((c,i)=>`
            <div class="dapp-item">
              <div class="info"><b>${c.n}</b><span>${c.d}</span></div>
              ${c.sent?`<span class="dapp-badge green">Recordatorio enviado ✓</span>`
                :`<button class="dapp-tab" data-rec="${i}">Recordar 📲</button>`}
            </div>`).join("")}
        </div>
        ${tab==="Pedido"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${pedido.length} productos</span><b>${money(totalPed())}</b></div>
          <button class="dapp-cta" id="sendOrder">Enviar a droguería</button>
        </div>`:""}`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>{alerts[+b.dataset.ok].done=true;paint();});
      root.querySelectorAll("[data-pp]").forEach(b=>b.onclick=()=>{pedido[+b.dataset.pp].q++;paint();});
      root.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>{const it=pedido[+b.dataset.pm];if(it.q>0)it.q--;paint();});
      root.querySelectorAll("[data-rec]").forEach(b=>b.onclick=()=>{clientes[+b.dataset.rec].sent=true;paint();});
      const so = root.querySelector("#sendOrder");
      if(so) so.onclick=()=>successScreen(root,"🚚","Pedido enviado a droguería",
        "Pedido por "+money(totalPed())+" enviado con las cantidades que ajustaste. Recibirás la confirmación de entrega. Nada se capturó a mano.");
    }
    paint();
  }
},

/* ============ 4. DISTRIBUIDORA: portal con credito, precio por volumen e historial ============ */
distribuidora:{
  title:"Demo · Portal de clientes",
  render(root){
    const items = [
      {n:"Aceite vegetal 1L",d:"Caja 12 pzas",p:310},
      {n:"Harina de trigo 1kg",d:"Caja 10 pzas",p:185},
      {n:"Atún en agua",d:"Caja 48 latas",p:620},
      {n:"Papel higiénico",d:"Paquete 32 rollos",p:265},
      {n:"Detergente 5kg",d:"Caja 4 pzas",p:390}
    ];
    const LIMITE = 50000, USADO_PREVIO = 18400;
    let qty = {}, tab = "Catálogo";
    let historial = [
      {folio:"PED-3098",fecha:"18 jul",total:12750,status:"Entregado",pasos:4},
    ];
    const precio = it => (qty[it.n]||0)>=10 ? Math.round(it.p*0.95) : it.p;
    const total = () => items.reduce((s,it)=>s+(qty[it.n]||0)*precio(it),0);
    const count = () => Object.values(qty).reduce((a,b)=>a+b,0);
    const credito = () => USADO_PREVIO + total();

    function paint(){
      root.innerHTML = `
        <div class="dapp-head"><h4>🚚 Distribuidora del Centro</h4><small>Portal · Abarrotes Lupita · Nivel mayorista ⭐</small></div>
        <div class="dapp-body">
          <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:14px;box-shadow:0 2px 10px rgba(30,20,80,0.06)">
            <div class="dapp-row" style="padding:0"><span><b>Línea de crédito</b></span><span>${money(credito())} de ${money(LIMITE)}</span></div>
            <div class="credit-bar"><div class="credit-fill" style="width:${Math.min(100,credito()/LIMITE*100)}%"></div></div>
            <span style="font-size:0.75rem;color:#7A76A0">Disponible: ${money(LIMITE-credito())} · corte el día 30</span>
          </div>
          <div class="dapp-tabs">${["Catálogo","Mis pedidos"].map(t=>
            `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Mis pedidos"?" ("+historial.length+")":""}</button>`).join("")}</div>
          ${tab==="Catálogo" ? items.map(it=>{
            const enDesc = (qty[it.n]||0)>=10;
            return `
            <div class="dapp-item">
              <div class="info"><b>${it.n}</b><span>${it.d} · ${enDesc?`<s>${money(it.p)}</s> <b style="color:#178A56">${money(precio(it))}</b> −5%`:money(it.p)+" · 10+ cajas −5%"}</span></div>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="dapp-btn-sm minus" data-minus="${it.n}">−</button>
                <span class="dapp-qty">${qty[it.n]||0}</span>
                <button class="dapp-btn-sm" data-plus="${it.n}">+</button>
              </div>
            </div>`;}).join("")
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
              <div class="dapp-row total" style="margin-top:0"><span>Total</span><span>${money(h.total)}</span></div>
            </div>`).join("")}
        </div>
        ${tab==="Catálogo"?`<div class="dapp-bar">
          <div class="dapp-total"><span>${count()} cajas</span><b>${money(total())}</b></div>
          <button class="dapp-cta" id="sendOrder" ${count()===0?"disabled":""}>Hacer pedido</button>
        </div>`:""}`;
      root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
      root.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{qty[b.dataset.plus]=(qty[b.dataset.plus]||0)+1;paint();});
      root.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{
        const k=b.dataset.minus; if(qty[k]){qty[k]--; if(!qty[k])delete qty[k];} paint();});
      const send = root.querySelector("#sendOrder");
      if(send) send.onclick=()=>{
        historial.unshift({folio:"PED-"+Math.floor(3100+Math.random()*100),fecha:"hoy",total:total(),status:"En ruta",pasos:2});
        qty={}; tab="Mis pedidos"; paint();
      };
    }
    paint();
  }
},

/* ============ 5. BOUTIQUE: tallas, stock real y plan de pagos ============ */
boutique:{
  title:"Demo · Catálogo en línea",
  render(root){
    let items = [
      {n:"Vestido floral",p:549,e:"👗",tallas:{CH:1,M:2,G:0}},
      {n:"Chamarra de mezclilla",p:729,e:"🧥",tallas:{M:3,G:1,XL:1}},
      {n:"Blusa de lino",p:389,e:"👚",tallas:{CH:1,M:1}},
      {n:"Bolsa artesanal",p:459,e:"👜",tallas:{Única:1}}
    ];
    let sel = {}; // {nombre: talla}
    let plan = 1, view = "cat";
    const chosen = () => Object.entries(sel).filter(([,t])=>t);
    const total = () => chosen().reduce((s,[n])=>s+items.find(i=>i.n===n).p,0);

    function paint(){
      if(view==="cat"){
        root.innerHTML = `
          <div class="dapp-head"><h4>👗 Boutique Alma</h4><small>Catálogo · inventario del local en tiempo real</small></div>
          <div class="dapp-body">
            ${items.map(it=>`
              <div class="dapp-item" style="flex-direction:column;align-items:stretch;gap:10px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div style="display:flex;gap:12px;align-items:center">
                    <span style="font-size:1.8rem">${it.e}</span>
                    <div class="info"><b>${it.n}</b><span>${Object.values(it.tallas).reduce((a,b)=>a+b,0)} en existencia</span></div>
                  </div>
                  <span class="price">${money(it.p)}</span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${Object.entries(it.tallas).map(([t,st])=>`
                    <button class="chip ${sel[it.n]===t?'on':''}" data-item="${it.n}" data-talla="${t}" ${st===0?"disabled":""}>
                      ${t}${st===0?"":st===1?" · última":""}</button>`).join("")}
                </div>
              </div>`).join("")}
          </div>
          <div class="dapp-bar">
            <div class="dapp-total"><span>${chosen().length} prendas</span><b>${money(total())}</b></div>
            <button class="dapp-cta" id="goPay" ${chosen().length===0?"disabled":""}>Apartar</button>
          </div>`;
        root.querySelectorAll(".chip:not(:disabled)").forEach(b=>b.onclick=()=>{
          const {item,talla} = b.dataset;
          sel[item] = sel[item]===talla ? null : talla;
          paint();});
        const go = root.querySelector("#goPay");
        if(go) go.onclick=()=>{view="pay";paint();};
      }
      else if(view==="pay"){
        const cuota = Math.ceil(total()/plan);
        root.innerHTML = `
          <div class="dapp-head"><h4>💳 Tu apartado</h4><small>Elige cómo quieres pagar</small></div>
          <div class="dapp-body">
            ${chosen().map(([n,t])=>{const it=items.find(i=>i.n===n);
              return `<div class="dapp-row"><span>${it.e} ${n} · talla ${t}</span><span>${money(it.p)}</span></div>`;}).join("")}
            <div class="dapp-row total"><span>Total</span><span>${money(total())}</span></div>
            <div style="margin:16px 0 8px;font-weight:600;font-size:0.88rem">Plan de pagos</div>
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
        root.querySelectorAll("[data-plan]").forEach(b=>b.onclick=()=>{plan=+b.dataset.plan;paint();});
        root.querySelector("#back").onclick=()=>{view="cat";paint();};
        root.querySelector("#confirm").onclick=()=>{
          chosen().forEach(([n,t])=>{items.find(i=>i.n===n).tallas[t]--;});
          successScreen(root,"🛍️","¡Apartado A-217 confirmado!",
            chosen().length+" prendas guardadas a tu nombre. "+(plan===1?"Tienes 48 horas para recogerlas.":"Programamos tus "+plan+" pagos quincenales con recordatorio por WhatsApp.")+" El inventario del local ya se actualizó solo.");
        };
      }
    }
    paint();
  }
},

/* ============ 6. TALLER: estatus + presupuesto aprobable + fotos ============ */
taller:{
  title:"Demo · Estatus de reparación",
  render(root){
    let view = "lookup", tab = "Avance";
    let extra = {n:"Cambio de bujías (recomendado)",p:480,status:"pendiente"};
    const base = [
      {n:"Cambio de balatas delanteras",p:1250},
      {n:"Rectificado de discos",p:600},
      {n:"Mano de obra",p:850}
    ];
    const total = () => base.reduce((s,i)=>s+i.p,0) + (extra.status==="aprobado"?extra.p:0);

    function paint(){
      if(view==="lookup"){
        root.innerHTML = `
          <div class="dapp-head"><h4>🔧 Taller Rodríguez</h4><small>Consulta el estatus de tu vehículo</small></div>
          <div class="dapp-body">
            <label style="font-size:0.85rem;font-weight:600;display:block;margin-bottom:8px">Número de orden</label>
            <input class="dapp-input" id="folio" value="A-1042">
            <button class="dapp-cta" id="check" style="width:100%">Consultar estatus</button>
            <p class="dapp-note">Tu cliente recibe este enlace por WhatsApp al dejar su vehículo. Nadie llama a preguntar "¿ya está listo?"</p>
          </div>`;
        root.querySelector("#check").onclick=()=>{view="status";paint();};
      } else {
        root.innerHTML = `
          <div class="dapp-head"><h4>🔧 Orden A-1042</h4><small>Nissan Versa 2019 · Sr. Méndez</small></div>
          <div class="dapp-body">
            <div class="dapp-tabs">${["Avance","Presupuesto","Fotos"].map(t=>
              `<button class="dapp-tab ${t===tab?'active':''}" data-tab="${t}">${t}${t==="Presupuesto"&&extra.status==="pendiente"?" ⚠️":""}</button>`).join("")}</div>
            ${tab==="Avance"?`
              <div class="dapp-timeline">
                <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Vehículo recibido</b><span>Lunes 10:30 am</span></div></div>
                <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Diagnóstico y presupuesto</b><span>Balatas al 10% y discos con desgaste</span></div></div>
                <div class="tl-step done"><div class="tl-dot">✓</div><div><b>Refacciones recibidas</b><span>Martes 9:00 am · originales</span></div></div>
                <div class="tl-step now"><div class="tl-dot">●</div><div><b>En reparación · avance 70%</b><span>Estimamos terminar hoy a las 5:00 pm</span></div></div>
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
                  <div><b>Trabajo adicional aprobado</b><span>Quedó registrado con fecha y hora — sin sorpresas al pagar</span></div></div>`}`
            :`
              <div class="photo-grid">
                <div class="photo">🛞</div><div class="photo">🔩</div><div class="photo">⚙️</div>
                <div class="photo">🛠️</div><div class="photo">📸</div><div class="photo">🚗</div>
              </div>
              <p class="dapp-note">El mecánico sube fotos del antes y después. Tu cliente ve la evidencia del trabajo, y tú te proteges de reclamos.</p>`}
          </div>`;
        root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;paint();});
        const a=root.querySelector("#apr"), r=root.querySelector("#rej");
        if(a) a.onclick=()=>{extra.status="aprobado";paint();};
        if(r) r.onclick=()=>{extra.status="rechazado";paint();};
      }
    }
    paint();
  }
}
};
