"use strict";
/* Utilidades que comparten las funciones de /api.
   Funcionan igual en Vercel y en el servidor local (scripts/dev.js). */

async function leerJson(req){
  let cuerpo = req.body;
  if(cuerpo === undefined || cuerpo === null){
    const trozos = [];
    for await (const t of req) trozos.push(t);
    cuerpo = Buffer.concat(trozos).toString("utf8");
  }
  if(Buffer.isBuffer(cuerpo)) cuerpo = cuerpo.toString("utf8");
  if(typeof cuerpo === "string"){
    if(!cuerpo.trim()) return {};
    try{ return JSON.parse(cuerpo); }catch{ return {}; }
  }
  return (cuerpo && typeof cuerpo === "object") ? cuerpo : {};
}

function responder(res, codigo, cuerpo){
  res.statusCode = codigo;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(cuerpo));
}

function cookies(req){
  const out = {};
  (req.headers.cookie || "").split(";").forEach(par=>{
    const i = par.indexOf("=");
    if(i > 0) out[par.slice(0,i).trim()] = decodeURIComponent(par.slice(i+1).trim());
  });
  return out;
}

/* Texto de una sola línea, recortado a un máximo */
function texto(v, max){ return v == null ? "" : String(v).replace(/\s+/g," ").trim().slice(0, max); }
/* Texto de varias líneas (mensajes, notas) */
function parrafo(v, max){ return v == null ? "" : String(v).replace(/\r\n?/g,"\n").replace(/[ \t]+\n/g,"\n").trim().slice(0, max); }
function correoValido(c){ return !c || /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(c); }

module.exports = { leerJson, responder, cookies, texto, parrafo, correoValido };
