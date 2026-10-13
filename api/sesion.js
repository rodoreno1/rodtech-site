"use strict";
/* Sesión del panel /admin.
   GET     ¿hay sesión?        POST {password}  entra        DELETE  sale */
const { leerJson, responder } = require("../lib/http");
const auth = require("../lib/auth");
const espera = ms => new Promise(r => setTimeout(r, ms));

module.exports = async (req, res) => {
  if(req.method === "GET"){
    return responder(res, 200, { ok: auth.autorizado(req), configurado: auth.configurado() });
  }
  if(req.method === "POST"){
    if(!auth.configurado()) return responder(res, 503, { ok:false, error:"Falta definir ADMIN_PASSWORD en las variables de entorno" });
    const b = await leerJson(req);
    if(!auth.passwordCorrecta(b.password)){
      await espera(800);   /* frena los intentos a ciegas */
      return responder(res, 401, { ok:false, error:"Contraseña incorrecta" });
    }
    res.setHeader("Set-Cookie", auth.cookieSesion(req, auth.emitirToken()));
    return responder(res, 200, { ok:true });
  }
  if(req.method === "DELETE"){
    res.setHeader("Set-Cookie", auth.cookieSesion(req, ""));
    return responder(res, 200, { ok:true });
  }
  return responder(res, 405, { ok:false, error:"Método no permitido" });
};
