#!/usr/bin/env node
"use strict";
/* Servidor local que imita a Vercel: sirve los archivos del sitio y ejecuta
   las funciones de /api con Node. Sin DATABASE_URL usa un Postgres embebido
   (PGlite) guardado en .data/.      Uso:  npm run dev  →  http://localhost:3000 */
const http = require("http"), fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");

/* .env opcional: DATABASE_URL, ADMIN_PASSWORD, PORT */
const envPath = path.join(RAIZ, ".env");
if(fs.existsSync(envPath)){
  for(const linea of fs.readFileSync(envPath, "utf8").split("\n")){
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if(m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if(!process.env.DATABASE_URL && !process.env.POSTGRES_URL){
  fs.mkdirSync(path.join(RAIZ, ".data"), { recursive:true });
  process.env.RT_DB_LOCAL = path.join(RAIZ, ".data", "pglite");
  console.log("Sin DATABASE_URL: se usa un Postgres embebido en .data/pglite");
}
if(!process.env.ADMIN_PASSWORD){
  process.env.ADMIN_PASSWORD = "admin";
  console.log("Sin ADMIN_PASSWORD: la contraseña del panel en local es «admin»");
}
const PUERTO = Number(process.env.PORT) || 3000;
const MIME = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp",
  ".ico":"image/x-icon", ".txt":"text/plain; charset=utf-8", ".xml":"application/xml; charset=utf-8",
  ".webmanifest":"application/manifest+json; charset=utf-8", ".woff2":"font/woff2" };

async function funcion(req, res, nombre, url){
  const archivo = path.join(RAIZ, "api", nombre + ".js");
  if(!/^[a-z0-9-]+$/.test(nombre) || !fs.existsSync(archivo)){ res.statusCode = 404; return res.end("Función no encontrada"); }
  req.query = Object.fromEntries(url.searchParams);
  try{ await require(archivo)(req, res); }
  catch(e){
    console.error(e);
    if(!res.headersSent){ res.statusCode = 500; res.setHeader("Content-Type", "application/json"); }
    res.end(JSON.stringify({ ok:false, error:"Error interno" }));
  }
}
function estatico(res, ruta){
  const limpia = decodeURIComponent(ruta).replace(/\/+$/, "") || "/";
  let archivo = path.resolve(RAIZ, "." + limpia);
  const fuera = archivo !== RAIZ && !archivo.startsWith(RAIZ + path.sep);
  const privado = /[\\/](\.|node_modules|lib|api|scripts)/.test(archivo.slice(RAIZ.length));
  if(fuera || privado){ res.statusCode = 404; return res.end("No encontrado"); }
  if(fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, "index.html");
  if(!fs.existsSync(archivo)){ res.statusCode = 404; return res.end("No encontrado"); }
  res.setHeader("Content-Type", MIME[path.extname(archivo)] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  fs.createReadStream(archivo).pipe(res);
}
http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const m = url.pathname.match(/^\/api\/([^/]+)\/?$/);
  if(m) return funcion(req, res, m[1], url);
  if(req.method !== "GET" && req.method !== "HEAD"){ res.statusCode = 405; return res.end(); }
  estatico(res, url.pathname);
}).listen(PUERTO, () => console.log(`Sitio en http://localhost:${PUERTO}  ·  panel en http://localhost:${PUERTO}/admin`));
