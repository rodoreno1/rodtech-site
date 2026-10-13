"use strict";
/* Clientes del panel. Todas las operaciones piden sesión.
   GET    /api/clientes          lista
   POST   /api/clientes          crea uno a mano
   PATCH  /api/clientes?id=N     actualiza los campos que vengan
   DELETE /api/clientes?id=N     elimina */
const { leerJson, responder, texto, parrafo, correoValido } = require("../lib/http");
const auth = require("../lib/auth");
const db = require("../lib/db");

function idDe(req, b){
  const n = Number((req.query && req.query.id) || (b && b.id));
  return Number.isInteger(n) && n > 0 ? n : null;
}
function limpiar(b){
  const c = {};
  if("nombre"   in b) c.nombre   = texto(b.nombre, 120);
  if("empresa"  in b) c.empresa  = texto(b.empresa, 160);
  if("tamano"   in b) c.tamano   = texto(b.tamano, 60);
  if("sistemas" in b) c.sistemas = texto(b.sistemas, 240);
  if("whatsapp" in b) c.whatsapp = texto(b.whatsapp, 40);
  if("correo"   in b) c.correo   = texto(b.correo, 120).toLowerCase();
  if("mensaje"  in b) c.mensaje  = parrafo(b.mensaje, 3000);
  if("estado"   in b) c.estado   = texto(b.estado, 20);
  if("notas"    in b) c.notas    = parrafo(b.notas, 5000);
  return c;
}

module.exports = async (req, res) => {
  if(!auth.autorizado(req)) return responder(res, 401, { ok:false, error:"Sin sesión" });
  try{
    if(req.method === "GET"){
      return responder(res, 200, { ok:true, clientes: await db.listar(), estados: db.ESTADOS });
    }
    const b = await leerJson(req);
    if(req.method === "POST"){
      const c = limpiar(b);
      if(!c.nombre) return responder(res, 400, { ok:false, error:"Falta el nombre" });
      if(!correoValido(c.correo || "")) return responder(res, 400, { ok:false, error:"Correo no válido" });
      if(c.estado && !db.ESTADOS.includes(c.estado)) return responder(res, 400, { ok:false, error:"Estado no válido" });
      return responder(res, 201, { ok:true, cliente: await db.crear({ ...c, origen:"manual" }) });
    }
    const id = idDe(req, b);
    if(!id) return responder(res, 400, { ok:false, error:"Falta el id" });
    if(req.method === "PATCH"){
      const c = limpiar(b);
      if("nombre" in c && !c.nombre) return responder(res, 400, { ok:false, error:"El nombre no puede quedar vacío" });
      if("correo" in c && !correoValido(c.correo)) return responder(res, 400, { ok:false, error:"Correo no válido" });
      if("estado" in c && !db.ESTADOS.includes(c.estado)) return responder(res, 400, { ok:false, error:"Estado no válido" });
      const cliente = await db.actualizar(id, c);
      if(!cliente) return responder(res, 404, { ok:false, error:"No existe ese cliente" });
      return responder(res, 200, { ok:true, cliente });
    }
    if(req.method === "DELETE"){
      const borrado = await db.borrar(id);
      return responder(res, borrado ? 200 : 404, borrado ? { ok:true } : { ok:false, error:"No existe ese cliente" });
    }
    return responder(res, 405, { ok:false, error:"Método no permitido" });
  }catch(e){
    console.error("api/clientes:", e.message);
    const propio = e.message.startsWith("No hay base de datos");
    return responder(res, 500, { ok:false, error: propio ? e.message : "Error en la base de datos" });
  }
};
