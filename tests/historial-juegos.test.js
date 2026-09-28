// ==============================
// EL HISTORIAL AL PULSAR "JUGAR" — tests/historial-juegos.test.js
// ==============================
// POST /api/content?action=game-history apunta el juego en "últimos
// jugados" (game_history), que es también lo que cuentan las misiones de
// "N juegos distintos hoy". Buscaba la cuenta por el nombre, sin
// mayúsculas: con dos cuentas como jader y Jader, el juego podía quedar
// apuntado a la otra. Ahora la cuenta es la de la sesión.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");

let db;
let handler;

before(async () => {
  db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));
  handler = require("../api/content");
});

async function persona(username) {
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'hash', 1, 0, 'active', now(), now()) RETURNING id`, [username]);
  const id = Number(r.rows[0].id);
  return { id, username, headers: { authorization: "Bearer " + crearToken({ id, username }) } };
}

function jugar(p, gameId, username) {
  return new Promise((resolve) => {
    handler({ method: "POST", query: { action: "game-history" },
              body: { username: username || p.username, gameId }, headers: p.headers }, {
      status(c) { this.codigo = c; return this; },
      setHeader() {},
      json(o) { resolve({ codigo: this.codigo || 200, cuerpo: o }); },
      end() { resolve({ codigo: this.codigo || 200, cuerpo: null }); }
    });
  });
}

const juegosDe = async (p) => (await db.query(
  "SELECT game_id FROM game_history WHERE user_id = $1 ORDER BY game_id", [p.id])).rows.map(f => f.game_id);

test("apunta el juego a quien tiene la sesión", async () => {
  const p = await persona("jugona");
  const r = await jugar(p, 42);
  assert.equal(r.cuerpo.success, true);
  assert.deepStrictEqual(await juegosDe(p), ["42"]);
});

test("aunque otra cuenta se llame igual salvo mayúsculas", async () => {
  const minuscula = await persona("nico");
  const mayuscula = await persona("Nico");
  await jugar(mayuscula, 7, "nico");
  assert.deepStrictEqual(await juegosDe(mayuscula), ["7"]);
  assert.deepStrictEqual(await juegosDe(minuscula), []);
});
