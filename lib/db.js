"use strict";
/* Base de datos de clientes.
   - En Vercel: Postgres de Neon, con la URL en DATABASE_URL (la pone sola la
     integración de Neon desde el Marketplace de Vercel).
   - En local (npm run dev): sin DATABASE_URL, PGlite guarda un Postgres
     embebido en .data/ para poder probar sin cuenta de nada. */

const ESQUEMA = [
`CREATE TABLE IF NOT EXISTS clientes (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  empresa     TEXT NOT NULL DEFAULT '',
  tamano      TEXT NOT NULL DEFAULT '',
  sistemas    TEXT NOT NULL DEFAULT '',
  whatsapp    TEXT NOT NULL DEFAULT '',
  correo      TEXT NOT NULL DEFAULT '',
  mensaje     TEXT NOT NULL DEFAULT '',
  estado      TEXT NOT NULL DEFAULT 'nuevo',
  notas       TEXT NOT NULL DEFAULT '',
  origen      TEXT NOT NULL DEFAULT 'formulario',
  creado      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado TIMESTAMPTZ NOT NULL DEFAULT now()
)`,
`CREATE INDEX IF NOT EXISTS clientes_creado ON clientes (creado DESC)`
];

const ESTADOS   = ["nuevo","contactado","diagnostico","propuesta","cliente","perdido"];
const EDITABLES = ["nombre","empresa","tamano","sistemas","whatsapp","correo","mensaje","estado","notas"];

let motor = null;   /* promesa de  (texto, params) => filas */
async function crearMotor(){
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if(url){
    const { neon } = require("@neondatabase/serverless");
    const sql = neon(url);
    return (texto, params = []) => sql.query(texto, params);
  }
  if(process.env.RT_DB_LOCAL){
    const paquete = "@electric-sql/pglite";   /* en variable: Vercel no lo empaqueta */
    const { PGlite } = await import(paquete);
    const db = await PGlite.create(process.env.RT_DB_LOCAL);
    return async (texto, params = []) => (await db.query(texto, params)).rows;
  }
  throw new Error("No hay base de datos: define DATABASE_URL (en local, usa `npm run dev`).");
}

let esquema = null;
async function consulta(texto, params){
  if(!motor) motor = crearMotor().catch(e => { motor = null; throw e; });
  const q = await motor;
  if(!esquema) esquema = (async()=>{ for(const s of ESQUEMA) await q(s); })().catch(e => { esquema = null; throw e; });
  await esquema;
  return q(texto, params);
}

function limpiarEstado(e){ return ESTADOS.includes(e) ? e : "nuevo"; }

async function listar(){
  return consulta("SELECT * FROM clientes ORDER BY creado DESC LIMIT 2000");
}
async function obtener(id){
  const f = await consulta("SELECT * FROM clientes WHERE id = $1", [Number(id)]);
  return f[0] || null;
}
async function crear(c){
  const f = await consulta(
    `INSERT INTO clientes (nombre, empresa, tamano, sistemas, whatsapp, correo, mensaje, estado, notas, origen)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [c.nombre, c.empresa || "", c.tamano || "", c.sistemas || "", c.whatsapp || "", c.correo || "",
     c.mensaje || "", limpiarEstado(c.estado), c.notas || "", c.origen === "manual" ? "manual" : "formulario"]);
  return f[0];
}
async function actualizar(id, cambios){
  const sets = [], vals = [];
  for(const k of EDITABLES) if(k in cambios){
    vals.push(k === "estado" ? limpiarEstado(cambios[k]) : cambios[k]);
    sets.push(`${k} = $${vals.length}`);
  }
  if(!sets.length) return obtener(id);
  sets.push("actualizado = now()");
  vals.push(Number(id));
  const f = await consulta(`UPDATE clientes SET ${sets.join(", ")} WHERE id = $${vals.length} RETURNING *`, vals);
  return f[0] || null;
}
async function borrar(id){
  const f = await consulta("DELETE FROM clientes WHERE id = $1 RETURNING id", [Number(id)]);
  return f.length > 0;
}

module.exports = { ESTADOS, listar, obtener, crear, actualizar, borrar };
