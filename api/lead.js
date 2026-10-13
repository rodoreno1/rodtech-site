"use strict";
/* Recibe el formulario de contacto de index.html y lo guarda como cliente
   "nuevo". El sitio abre WhatsApp de todos modos: esto es la copia que ve el
   panel /admin. Es pública y no pide sesión. */
const { leerJson, responder, texto, parrafo, correoValido } = require("../lib/http");
const db = require("../lib/db");

module.exports = async (req, res) => {
  if(req.method !== "POST") return responder(res, 405, { ok:false, error:"Método no permitido" });
  const b = await leerJson(req);
  /* Campo trampa del formulario: si viene lleno es un bot. Se contesta ok y no se guarda. */
  if(texto(b["bot-field"], 50)) return responder(res, 200, { ok:true });

  const c = {
    nombre:   texto(b.nombre, 120),
    empresa:  texto(b.negocio ?? b.empresa, 160),
    tamano:   texto(b.tamano, 60),
    sistemas: texto(b.sistemas, 240),
    whatsapp: texto(b.whatsapp, 40),
    correo:   texto(b.correo, 120).toLowerCase(),
    mensaje:  parrafo(b.mensaje, 3000),
    estado:   "nuevo",
    origen:   "formulario"
  };
  if(!c.nombre) return responder(res, 400, { ok:false, error:"Falta el nombre" });
  if(!c.whatsapp && !c.correo) return responder(res, 400, { ok:false, error:"Falta un WhatsApp o un correo" });
  if(!correoValido(c.correo)) return responder(res, 400, { ok:false, error:"Correo no válido" });

  try{
    const guardado = await db.crear(c);
    return responder(res, 201, { ok:true, id: guardado.id });
  }catch(e){
    console.error("api/lead:", e.message);
    return responder(res, 500, { ok:false, error:"No se pudo guardar el contacto" });
  }
};
