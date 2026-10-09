// ==============================
// EL RANKING SEMANAL NO SE BARAJA — tests/ranking-desempate.test.js
// ==============================
// El cálculo de los lunes (api/system.js) ordenaba por la puntuación y los
// minutos, y lo demás quedaba al orden en que llegaban las cuentas, que la
// base no garantiza: las empatadas, casi todas a cero (99 de 219 el
// 08/10/2026), cambiaban de puesto al azar cada semana (punto 36 de la
// auditoría, specs/005-arreglos-rapidos/spec.md). Ahora, a igual
// puntuación y minutos, conservan el orden de la semana anterior, y las que
// no tenían puesto van detrás, de la más antigua a la más nueva.
//
// Contra el handler de verdad y una base PGlite.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");

let db, system, admin;

before(async () => {
  db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));
  system = require("../api/system");
  admin = await cuenta(null, "administrador");
});

let siguiente = 0;
async function cuenta(puesto, rol) {
  const username = "rk" + (++siguiente);
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login, rank_actual, ranking_puntuacion)
     VALUES ($1, 'x', 1, 0, 'active', now(), now(), $2, 0) RETURNING id`, [username, puesto]);
  const id = Number(r.rows[0].id);
  if (rol) await db.query("INSERT INTO badges (user_id, badge_id) VALUES ($1, $2)", [id, rol]);
  return { id, username, headers: { authorization: "Bearer " + crearToken({ id, username }) } };
}

function recalcular() {
  return new Promise((resolve) => {
    const req = { method: "POST", query: { action: "recalcular-ranking-manual" }, body: {}, headers: admin.headers };
    system(req, {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      setHeader() {},
      json(o) { resolve(o); },
      end() { resolve(null); }
    });
  });
}

async function puestos() {
  const filas = (await db.query("SELECT id, rank_actual FROM users ORDER BY id")).rows;
  return new Map(filas.map(f => [Number(f.id), f.rank_actual == null ? null : Number(f.rank_actual)]));
}

test("las empatadas conservan su orden, y las que no tenían puesto van detrás por antigüedad", async () => {
  // Todas a cero y sin jugar: un empate total. Los puestos de antes, a
  // propósito al revés del orden en que se crearon las cuentas.
  const tercera = await cuenta(3);
  const primera = await cuenta(1);
  const segunda = await cuenta(2);
  const nueva1 = await cuenta(null);
  const nueva2 = await cuenta(null);

  const r = await recalcular();
  assert.equal(r && r.success, true, JSON.stringify(r));

  const p = await puestos();
  const orden = [primera, segunda, tercera, nueva1, nueva2].map(c => p.get(c.id));
  const ordenado = [...orden].sort((x, y) => x - y);
  assert.deepStrictEqual(orden, ordenado,
    "el orden no es: las tres con puesto como estaban, y después las nuevas por antigüedad");
  assert.ok(p.get(primera.id) < p.get(segunda.id) && p.get(segunda.id) < p.get(tercera.id));
  assert.ok(p.get(tercera.id) < p.get(nueva1.id) && p.get(nueva1.id) < p.get(nueva2.id));
});

test("recalcular otra vez sin actividad nueva no cambia ningún puesto", async () => {
  const antes = await puestos();
  const r = await recalcular();
  assert.equal(r && r.success, true, JSON.stringify(r));
  assert.deepStrictEqual(await puestos(), antes);
});
