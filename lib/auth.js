"use strict";
/* Sesión del panel: una contraseña (ADMIN_PASSWORD) y una cookie firmada.
   No hay usuarios ni tabla de sesiones: la cookie lleva su caducidad y una
   firma HMAC; si la firma no cuadra, no hay sesión. */
const crypto = require("crypto");
const { cookies } = require("./http");

const COOKIE = "rt_admin";
const DIAS   = 30;

function password(){ return (process.env.ADMIN_PASSWORD || "").trim(); }
function configurado(){ return password().length > 0; }

/* Clave de firma: ADMIN_SECRET si existe; si no, se deriva de la contraseña
   (cambiar la contraseña cierra todas las sesiones, que es lo deseable). */
function clave(){
  return crypto.createHash("sha256").update("rodtech-admin|" + (process.env.ADMIN_SECRET || password())).digest();
}
function firma(exp){ return crypto.createHmac("sha256", clave()).update(String(exp)).digest("base64url"); }
function iguales(a, b){
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function passwordCorrecta(intento){
  if(!configurado()) return false;
  const a = crypto.createHash("sha256").update(String(intento || "")).digest();
  const b = crypto.createHash("sha256").update(password()).digest();
  return crypto.timingSafeEqual(a, b);
}
function emitirToken(){ const exp = Date.now() + DIAS * 864e5; return exp + "." + firma(exp); }
function tokenValido(tok){
  if(!tok || !configurado()) return false;
  const i = tok.indexOf("."); if(i < 1) return false;
  const exp = tok.slice(0, i), f = tok.slice(i + 1);
  if(!/^\d{10,16}$/.test(exp) || Number(exp) < Date.now()) return false;
  return iguales(f, firma(exp));
}
function autorizado(req){ return tokenValido(cookies(req)[COOKIE]); }

/* token vacío = borrar la cookie */
function cookieSesion(req, token){
  const https = !!process.env.VERCEL || String(req.headers["x-forwarded-proto"] || "").includes("https");
  return `${COOKIE}=${token || ""}; Path=/; HttpOnly; SameSite=Strict` + (https ? "; Secure" : "") +
         `; Max-Age=${token ? DIAS * 86400 : 0}`;
}

module.exports = { configurado, passwordCorrecta, emitirToken, autorizado, cookieSesion };
