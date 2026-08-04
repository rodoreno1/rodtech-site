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
   Arranque
   -------------------------------------------------------------------------- */
function startDemo(DEMO) {
  document.title = DEMO.negocio + " — Demo RodTech";

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
  function refrescar() { pintar(); }

  pintar();
}
