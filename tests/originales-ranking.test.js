// ==============================
// EL TOP DE MACRO SNAKE — tests/originales-ranking.test.js
// ==============================
// El top sacaba las mejores partidas y después quitaba las repetidas: con
// unas pocas personas copando las mejores, el "top 20" enseñaba cinco
// (punto 33 de la auditoría, specs/005-arreglos-rapidos/spec.md). Ahora es
// la mejor partida de cada persona, y de esas, las mejores.
//
// Contra el handler de verdad y una base PGlite. Lo de las cuentas
// baneadas lo sujeta tests/baneadas.test.js.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before, beforeEach } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");

let db, originales;

before(async () => {
  db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));
  originales = require("../api/originales-ranking");
});

beforeEach(async () => {
  await db.query("DELETE FROM originales_scores");
});

let siguiente = 0;
async function persona(...partidas) {
  const username = "snake" + (++siguiente);
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'x', 1, 0, 'active', now(), now()) RETURNING id`, [username]);
  const id = Number(r.rows[0].id);
  for (const p of partidas) {
    const [score, cuando] = Array.isArray(p) ? p : [p, null];
    await db.query(
      "INSERT INTO originales_scores (user_id, game_id, score, created_at) VALUES ($1, '113', $2, COALESCE($3::timestamptz, now()))",
      [id, score, cuando]);
  }
  return username;
}

function top(query = {}) {
  return new Promise((resolve) => {
    const req = { method: "GET", query: { action: "leaderboard", gameId: "113", ...query }, body: {}, headers: {} };
    originales(req, {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      setHeader() {},
      json(o) { resolve(o.top); },
      end() { resolve(null); }
    });
  });
}

test("quien tiene muchas de las mejores partidas sale una vez, con la mejor", async () => {
  const a = await persona(1000, 990, 980, 970, 960);
  const b = await persona(950);
  const c = await persona(940, 10);
  const d = await persona(5);
  const filas = await top();
  assert.deepStrictEqual(filas.map(f => f.username), [a, b, c, d]);
  assert.deepStrictEqual(filas.map(f => f.score), [1000, 950, 940, 5]);
  assert.deepStrictEqual(filas.map(f => f.posicion), [1, 2, 3, 4]);
});

test("llega a 20 personas distintas aunque una sola tenga las 30 mejores partidas", async () => {
  const copa = await persona(...Array.from({ length: 30 }, (_, i) => 1000 - i));
  const demas = [];
  for (let i = 0; i < 24; i++) demas.push(await persona(900 - i));
  const filas = await top();
  assert.equal(filas.length, 20);
  assert.equal(new Set(filas.map(f => f.username)).size, 20, "hay personas repetidas");
  assert.deepStrictEqual(filas.map(f => f.username), [copa, ...demas.slice(0, 19)]);
});

test("en empate de la mejor puntuación va primero la partida más antigua", async () => {
  const tarde = await persona([500, "2026-01-02T10:00:00Z"]);
  const temprano = await persona([500, "2026-01-01T10:00:00Z"], [500, "2026-01-03T10:00:00Z"]);
  const filas = await top();
  assert.deepStrictEqual(filas.map(f => f.username), [temprano, tarde]);
  assert.equal(new Date(filas[0].createdAt).toISOString(), "2026-01-01T10:00:00.000Z",
    "de las dos partidas empatadas de la misma persona, cuenta la primera");
});

test("respeta el limit que se pide", async () => {
  await persona(30);
  await persona(20);
  await persona(10);
  const filas = await top({ limit: 2 });
  assert.equal(filas.length, 2);
  assert.deepStrictEqual(filas.map(f => f.score), [30, 20]);
});
