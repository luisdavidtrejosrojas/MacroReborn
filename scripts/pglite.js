// ==============================
// BASE LOCAL DE PRÁCTICA — scripts/pglite.js
// ==============================
// Maqueta de la base de datos que corre DENTRO de esta computadora,
// usando PGlite (Postgres real compilado a WASM, sin servidor ni
// cuenta). Sirve para probar TODO localmente sin tocar la base de
// producción del proyecto original.
//
// Dos piezas:
//
//   1) crearSqlPGlite(db): adaptador que imita la interfaz del driver
//      de Neon (`sql\`...\`` con interpolaciones -> placeholders $1,
//      $2... y devuelve un array de filas). Con esto, el MISMO código
//      de la API corre contra la base local sin cambiar nada.
//
//   2) crearBaseLocal(): crea la base, arma la tabla "users" mínima
//      (igual que en producción antes de las migraciones) y le aplica
//      TODAS las migraciones de migrations/ en orden, tal como se
//      haría en Neon. Así la maqueta queda con el mismo esquema.

const { PGlite } = require("@electric-sql/pglite");
const fs = require("fs");
const path = require("path");

// Convierte el uso `sql\`...\`` (estilo Neon) en consultas de PGlite.
// Neon reemplaza cada ${valor} por un placeholder $1, $2... y devuelve
// un array de filas; acá se replica exactamente ese comportamiento.
function crearSqlPGlite(db) {

  const sql = async function (plantilla, ...valores) {
    let texto = "";
    for (let i = 0; i < plantilla.length; i++) {
      texto += plantilla[i];
      if (i < plantilla.length - 1) texto += `$${i + 1}`;
    }
    const resultado = await db.query(texto, valores);
    return resultado.rows;
  };

  // api/content.js usa sql.query(texto, parametros) en el registro de
  // moderación; se expone también por compatibilidad.
  sql.query = async (texto, valores) => {
    const resultado = await db.query(texto, valores || []);
    return resultado.rows;
  };

  return sql;
}

// Tabla "users" base, igual que en producción ANTES de la migración
// 013 (sin password_hash todavía): las migraciones 001-012 se apoyan
// en que esta tabla ya existe y solo le agregan columnas (monedas,
// rank_*, ranking_puntuacion, etc.).
const USERS_INICIAL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    bio TEXT,
    avatar TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    last_login TIMESTAMP
  );
`;

// Crea la base local (en memoria por defecto) y le aplica todas las
// migraciones de migrations/ en orden.
async function crearBaseLocal() {
  const db = new PGlite(); // en memoria
  await db.ready;
  await db.exec(USERS_INICIAL);

  const directorio = path.join(__dirname, "..", "migrations");
  const archivos = fs.readdirSync(directorio)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const archivo of archivos) {
    await db.exec(fs.readFileSync(path.join(directorio, archivo), "utf8"));
  }

  return db;
}

module.exports = { crearSqlPGlite, crearBaseLocal };
