// ==============================
// EL SALDO ES DE CADA UNO — tests/saldo-privado.test.js
// ==============================
// Hasta el 04/10/2026, GET /api/users?username=X devolvía el saldo de
// monedas de cualquiera a quien lo pidiera. No salía en ninguna página,
// pero se podía leer. Ahora solo lo ven la propia cuenta y la
// moderación, como el motivo de una suspensión.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");

let db, users;
const ids = {};

async function cuenta(nombre, insignia) {
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login, monedas)
     VALUES ($1, 'hash', 1, 0, 'active', now(), now(), 777) RETURNING id`, [nombre]);
  if (insignia) await db.query("INSERT INTO badges (user_id, badge_id) VALUES ($1, $2)", [r.rows[0].id, insignia]);
  return Number(r.rows[0].id);
}

function leer(username, quien, extra) {
  return new Promise((resolve) => {
    const req = {
      method: "GET",
      query: Object.assign({ username }, extra || {}),
      body: {},
      headers: quien ? { authorization: "Bearer " + crearToken({ id: ids[quien], username: quien }) } : {}
    };
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      setHeader() {},
      json(obj) { resolve(obj); },
      end() { resolve(null); }
    };
    users(req, res);
  });
}

before(async () => {
  db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));
  users = require("../api/users");
  ids.ana = await cuenta("ana");
  ids.beto = await cuenta("beto");
  ids.jefa = await cuenta("jefa", "administrador");
});

test("quien no es la cuenta no ve su saldo, con o sin sesión", async () => {
  const sinSesion = await leer("ana");
  assert.equal(sinSesion.success, true);
  assert.ok(!("monedas" in sinSesion.user), "sin sesión se veía el saldo");

  const otro = await leer("ana", "beto");
  assert.ok(!("monedas" in otro.user), "otra cuenta veía el saldo");
  assert.equal(otro.user.username, "ana", "el resto del perfil sigue llegando");
});

test("la propia cuenta sí lo ve", async () => {
  const propia = await leer("ana", "ana");
  assert.equal(propia.user.monedas, 777);
});

test("la moderación, desde su lista, también", async () => {
  const r = await leer("ana", "jefa", { moderacion: "1" });
  assert.equal(r.user.monedas, 777);
});
