// ==============================
// LA NOTIFICACIÓN, A LA CUENTA QUE ES — tests/notificacion-cuenta.test.js
// ==============================
// crearNotificacionServidor (api/_notifications.js) buscaba la cuenta por
// el nombre, sin mayúsculas: con dos cuentas como jader y Jader (punto 31
// de docs/listas/AUDITORIA.md), la notificación de una podía acabar en la otra.
// Quien ya sabe la cuenta puede pasarla (opciones.userId), y entonces no
// se busca.
//
// Correr:  npm test

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");

let db;
let crearNotificacionServidor;

before(async () => {
  db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));
  ({ crearNotificacionServidor } = require("../api/_notifications"));
});

async function persona(username) {
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'hash', 1, 0, 'active', now(), now()) RETURNING id`, [username]);
  return Number(r.rows[0].id);
}

test("con la cuenta dada, va a esa, aunque otra se llame igual salvo mayúsculas", async () => {
  const minuscula = await persona("rafa");
  const mayuscula = await persona("Rafa");

  const r = await crearNotificacionServidor("Rafa", "Título", "Mensaje", null, { userId: mayuscula });
  assert.equal(r.success, true);

  const filas = await db.query("SELECT user_id FROM notifications WHERE titulo = 'Título'");
  assert.deepStrictEqual(filas.rows.map(f => Number(f.user_id)), [mayuscula]);
  assert.notEqual(mayuscula, minuscula);
});

test("sin ella, se sigue buscando por el nombre, como siempre", async () => {
  const id = await persona("solita");
  const r = await crearNotificacionServidor("solita", "Otra", "Mensaje");
  assert.equal(r.success, true);
  const filas = await db.query("SELECT user_id FROM notifications WHERE titulo = 'Otra'");
  assert.equal(Number(filas.rows[0].user_id), id);
});
