/* Panel de clientes. Habla con /api/sesion y /api/clientes; sin sesión
   muestra la entrada. Todo el estado vive en memoria y se recarga del
   servidor tras cada cambio. */
(function(){
"use strict";

const ESTADOS = [
  ["nuevo",       "Nuevo"],
  ["contactado",  "Contactado"],
  ["diagnostico", "En diagnóstico"],
  ["propuesta",   "Propuesta enviada"],
  ["cliente",     "Cliente"],
  ["perdido",     "No avanzó"]
];
const NOMBRE_ESTADO = Object.fromEntries(ESTADOS);

const $ = id => document.getElementById(id);
const vistaLogin = $("vistaLogin"), vistaPanel = $("vistaPanel");
const lista = $("lista"), stats = $("stats"), buscar = $("buscar"), filtroEstado = $("filtroEstado");
const drawer = $("drawer"), drawerBg = $("drawerBg"), formCliente = $("formCliente");

let clientes = [];
let abierto  = null;      /* cliente en la ficha, o null si es nuevo */
let filtro   = "";

/* ---------- utilidades ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sinAcentos = s => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const fecha = d => new Date(d).toLocaleDateString("es-MX", { day:"numeric", month:"short", year:"numeric" });
function hace(d){
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if(m < 1) return "ahora";
  if(m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if(h < 24) return `hace ${h} h`;
  const dd = Math.round(h / 24); if(dd < 7) return `hace ${dd} día${dd === 1 ? "" : "s"}`;
  const w = Math.round(dd / 7); if(w < 5) return `hace ${w} sem`;
  return fecha(d);
}
function telWa(n){
  const d = String(n || "").replace(/\D/g, "");
  if(!d) return "";
  return d.length === 10 ? "52" + d : d;
}
let toastT;
function toast(msg){
  const t = $("toast"); t.textContent = msg; t.classList.add("is-on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-on"), 2600);
}

async function api(ruta, opts = {}){
  const r = await fetch("/api/" + ruta, Object.assign({ credentials:"same-origin", headers:{ "Content-Type":"application/json" } }, opts));
  let data = {};
  try{ data = await r.json(); }catch(_){}
  if(r.status === 401 && ruta !== "sesion"){ mostrarLogin(); throw new Error("La sesión terminó, vuelve a entrar"); }
  if(!r.ok || (data.ok === false && !opts.tolerar)) throw new Error(data.error || ("Error " + r.status));
  return data;
}

/* ---------- vistas ---------- */
function mostrarLogin(msg){
  vistaPanel.hidden = true; vistaLogin.hidden = false; cerrarFicha();
  $("loginMsg").textContent = msg || "";
  setTimeout(() => $("pass").focus(), 50);
}
function mostrarPanel(){ vistaLogin.hidden = true; vistaPanel.hidden = false; }

/* ---------- lista ---------- */
function filtrados(){
  const q = sinAcentos(buscar.value.trim());
  const est = filtroEstado.value;
  return clientes.filter(c => {
    if(est && c.estado !== est) return false;
    if(!q) return true;
    return sinAcentos([c.nombre, c.empresa, c.correo, c.whatsapp, c.sistemas, c.mensaje, c.notas, c.tamano].join(" ")).includes(q);
  });
}

function pintarStats(){
  const conteo = {};
  clientes.forEach(c => { conteo[c.estado] = (conteo[c.estado] || 0) + 1; });
  const tarjetas = [["", "Todos", clientes.length]].concat(ESTADOS.map(([k, n]) => [k, n, conteo[k] || 0]));
  stats.innerHTML = tarjetas.map(([k, n, v]) =>
    `<button type="button" class="stat${filtroEstado.value === k ? " is-on" : ""}" data-estado="${k}"><b>${v}</b><span>${esc(n)}</span></button>`).join("");
}

function pintarLista(){
  const f = filtrados();
  if(!clientes.length){
    lista.innerHTML = `<div class="vacio"><b>Todavía no hay clientes</b>Los contactos del formulario del sitio aparecerán aquí. También puedes agregar uno con «+ Nuevo».</div>`;
    return;
  }
  if(!f.length){
    lista.innerHTML = `<div class="vacio"><b>Nada coincide</b>Prueba con otra búsqueda o quita el filtro de estado.</div>`;
    return;
  }
  lista.innerHTML = `<table class="tabla"><thead><tr>
      <th>Cliente</th><th>Contacto</th><th>Proceso</th><th>Estado</th><th>Llegó</th>
    </tr></thead><tbody>` +
    f.map(c => `<tr data-id="${c.id}" tabindex="0">
      <td class="cel-nombre"><b>${esc(c.nombre)}</b>${c.empresa ? `<span>${esc(c.empresa)}</span>` : ""}</td>
      <td class="cel-contacto">${[
        c.whatsapp ? `<a href="https://wa.me/${telWa(c.whatsapp)}" target="_blank" rel="noopener">💬 ${esc(c.whatsapp)}</a>` : "",
        c.correo ? `<a href="mailto:${esc(c.correo)}">✉ ${esc(c.correo)}</a>` : ""
      ].filter(Boolean).join("<br>") || "—"}</td>
      <td class="cel-proceso"><span>${esc(c.mensaje || c.notas || "—")}</span></td>
      <td class="cel-estado"><span class="badge badge-${esc(c.estado)}">${esc(NOMBRE_ESTADO[c.estado] || c.estado)}</span></td>
      <td class="cel-fecha">${fecha(c.creado)}<small>${c.origen === "manual" ? "a mano" : "formulario"} · ${hace(c.actualizado)}</small></td>
    </tr>`).join("") + `</tbody></table>`;
}

function pintar(){ pintarStats(); pintarLista(); }

async function cargar(){
  lista.innerHTML = `<div class="vacio">Cargando…</div>`;
  try{
    const d = await api("clientes");
    clientes = d.clientes || [];
    pintar();
  }catch(e){
    if(vistaLogin.hidden){
      lista.innerHTML = `<div class="aviso"><b>No se pudo cargar la lista.</b><br>${esc(e.message)}<br><br>Si acabas de desplegar, revisa en Vercel que exista la base de datos de Neon y la variable <code>DATABASE_URL</code>.</div>`;
    }
  }
}

/* ---------- ficha ---------- */
function abrirFicha(c){
  abierto = c || null;
  const f = formCliente;
  f.reset();
  $("c-msg").textContent = "";
  $("c-id").value = c ? c.id : "";
  $("c-titulo").textContent = c ? "Ficha del cliente" : "Nuevo cliente";
  $("c-meta").textContent = c ? `Llegó ${c.origen === "manual" ? "a mano" : "por el formulario"} el ${fecha(c.creado)} · actualizado ${hace(c.actualizado)}` : "Se guarda con estado «Nuevo» salvo que elijas otro.";
  $("c-estado").value   = c ? c.estado : "nuevo";
  $("c-nombre").value   = c ? c.nombre : "";
  $("c-empresa").value  = c ? c.empresa : "";
  $("c-whatsapp").value = c ? c.whatsapp : "";
  $("c-correo").value   = c ? c.correo : "";
  $("c-tamano").value   = c ? c.tamano : "";
  if(c && c.tamano && $("c-tamano").value !== c.tamano){ /* valor que no está en la lista */
    const o = document.createElement("option"); o.textContent = c.tamano; $("c-tamano").appendChild(o); $("c-tamano").value = c.tamano;
  }
  $("c-sistemas").value = c ? c.sistemas : "";
  $("c-mensaje").value  = c ? c.mensaje : "";
  $("c-notas").value    = c ? c.notas : "";
  const wa = $("btnWa");
  if(c && telWa(c.whatsapp)){
    wa.hidden = false;
    wa.href = "https://wa.me/" + telWa(c.whatsapp) + "?text=" + encodeURIComponent(`Hola ${c.nombre.split(" ")[0]}, te escribimos de RodTech por el mensaje que nos dejaste en el sitio.`);
  }else wa.hidden = true;
  $("btnBorrar").hidden = !c;
  drawer.hidden = false; drawerBg.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => (c ? $("c-notas") : $("c-nombre")).focus(), 50);
}
function cerrarFicha(){
  drawer.hidden = true; drawerBg.hidden = true; abierto = null;
  document.body.style.overflow = "";
}

async function guardar(e){
  e.preventDefault();
  const datos = {
    nombre:   $("c-nombre").value.trim(),
    empresa:  $("c-empresa").value.trim(),
    whatsapp: $("c-whatsapp").value.trim(),
    correo:   $("c-correo").value.trim(),
    tamano:   $("c-tamano").value,
    sistemas: $("c-sistemas").value.trim(),
    mensaje:  $("c-mensaje").value.trim(),
    estado:   $("c-estado").value,
    notas:    $("c-notas").value.trim()
  };
  const msg = $("c-msg"); msg.textContent = "";
  if(!datos.nombre){ msg.textContent = "Falta el nombre."; $("c-nombre").focus(); return; }
  const btn = $("btnGuardar"); btn.disabled = true;
  try{
    if(abierto){
      const d = await api("clientes?id=" + abierto.id, { method:"PATCH", body: JSON.stringify(datos) });
      clientes = clientes.map(c => c.id === d.cliente.id ? d.cliente : c);
      toast("Cambios guardados");
    }else{
      const d = await api("clientes", { method:"POST", body: JSON.stringify(datos) });
      clientes.unshift(d.cliente);
      toast("Cliente agregado");
    }
    cerrarFicha(); pintar();
  }catch(err){ msg.textContent = err.message; }
  finally{ btn.disabled = false; }
}

async function borrar(){
  if(!abierto) return;
  if(!confirm(`¿Eliminar a ${abierto.nombre}? No se puede deshacer.`)) return;
  try{
    await api("clientes?id=" + abierto.id, { method:"DELETE" });
    clientes = clientes.filter(c => c.id !== abierto.id);
    toast("Cliente eliminado");
    cerrarFicha(); pintar();
  }catch(err){ $("c-msg").textContent = err.message; }
}

/* ---------- CSV ---------- */
function exportarCsv(){
  const cols = ["id","nombre","empresa","tamano","sistemas","whatsapp","correo","mensaje","estado","notas","origen","creado","actualizado"];
  const celda = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const filas = [cols.join(",")].concat(filtrados().map(c => cols.map(k => celda(k === "estado" ? (NOMBRE_ESTADO[c[k]] || c[k]) : c[k])).join(",")));
  const blob = new Blob(["﻿" + filas.join("\r\n")], { type:"text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "clientes-rodtech-" + new Date().toISOString().slice(0,10) + ".csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Exportados ${filas.length - 1} clientes`);
}

/* ---------- entrada ---------- */
async function entrar(e){
  e.preventDefault();
  const msg = $("loginMsg"); msg.textContent = "";
  const btn = $("btnEntrar"); btn.disabled = true;
  try{
    await api("sesion", { method:"POST", body: JSON.stringify({ password: $("pass").value }) });
    $("pass").value = "";
    mostrarPanel(); cargar();
  }catch(err){ msg.textContent = err.message; $("pass").select(); }
  finally{ btn.disabled = false; }
}
async function salir(){
  try{ await api("sesion", { method:"DELETE" }); }catch(_){}
  clientes = []; mostrarLogin();
}

/* ---------- arranque ---------- */
ESTADOS.forEach(([k, n]) => {
  filtroEstado.insertAdjacentHTML("beforeend", `<option value="${k}">${esc(n)}</option>`);
  $("c-estado").insertAdjacentHTML("beforeend", `<option value="${k}">${esc(n)}</option>`);
});

$("formLogin").addEventListener("submit", entrar);
$("btnSalir").addEventListener("click", salir);
$("btnNuevo").addEventListener("click", () => abrirFicha(null));
$("btnCsv").addEventListener("click", exportarCsv);
$("btnRecargar").addEventListener("click", cargar);
$("btnCerrar").addEventListener("click", cerrarFicha);
$("btnBorrar").addEventListener("click", borrar);
drawerBg.addEventListener("click", cerrarFicha);
formCliente.addEventListener("submit", guardar);
buscar.addEventListener("input", pintarLista);
filtroEstado.addEventListener("change", pintar);
stats.addEventListener("click", e => {
  const b = e.target.closest(".stat"); if(!b) return;
  filtroEstado.value = b.dataset.estado; pintar();
});
lista.addEventListener("click", e => {
  if(e.target.closest("a")) return;              /* los enlaces de contacto abren tal cual */
  const tr = e.target.closest("tr[data-id]"); if(!tr) return;
  const c = clientes.find(x => x.id === Number(tr.dataset.id)); if(c) abrirFicha(c);
});
lista.addEventListener("keydown", e => {
  if(e.key !== "Enter") return;
  const tr = e.target.closest("tr[data-id]"); if(!tr) return;
  const c = clientes.find(x => x.id === Number(tr.dataset.id)); if(c) abrirFicha(c);
});
document.addEventListener("keydown", e => { if(e.key === "Escape" && !drawer.hidden) cerrarFicha(); });

(async function inicio(){
  try{
    const s = await api("sesion", { tolerar:true });   /* ok:false aquí solo significa "sin sesión" */
    if(s.ok){ mostrarPanel(); cargar(); }
    else mostrarLogin(s.configurado ? "" : "Falta definir ADMIN_PASSWORD en las variables de entorno de Vercel.");
  }catch(_){ mostrarLogin("No se pudo conectar con el servidor."); }
})();
})();
