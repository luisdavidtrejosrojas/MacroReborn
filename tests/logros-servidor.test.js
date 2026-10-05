// ==============================
// LOS LOGROS EN EL SERVIDOR — tests/logros-servidor.test.js
// ==============================
// Desde el 04/10/2026 un logro da tantas monedas como puntos
// (docs/referencia/ECONOMIA.md), así que POST /api/social?action=achievements ya no
// guarda el que le pidan: comprueba con la base que se cumple
// (api/_logros.js). Lo que se prueba:
//   - que el catálogo del servidor dice lo mismo que el del navegador;
//   - que un logro que no existe, o que no se cumple, no se guarda;
//   - que el que se cumple se guarda, paga sus puntos una vez y lo dice
//     el aviso;
//   - que los de tener muchos amigos dan puntos pero no monedas.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");
const logros = require("../api/_logros");

let db, social;

async function cuenta(nombre, nivel) {
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'hash', $2, 0, 'active', now(), now()) RETURNING id`, [nombre, nivel || 1]);
  return Number(r.rows[0].id);
}

// "sesion" es de quién es el token; si no se dice, de "nombre".
function pedir(nombre, id, achievementId, sesion) {
  return new Promise((resolve) => {
    const req = {
      method: "POST",
      query: { action: "achievements" },
      body: { username: nombre, achievementId },
      headers: { authorization: "Bearer " + crearToken({ id, username: sesion || nombre }) }
    };
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      setHeader() {},
      json(obj) { resolve({ codigo: this.statusCode, cuerpo: obj }); },
      end(c) { resolve({ codigo: this.statusCode, cuerpo: c }); }
    };
    social(req, res);
  });
}

const saldo = async (id) => Number((await db.query("SELECT monedas FROM users WHERE id = $1", [id])).rows[0].monedas);
const loTiene = async (id, logro) => (await db.query(
  "SELECT 1 FROM achievements WHERE user_id = $1 AND achievement_id = $2", [id, logro])).rows.length === 1;

before(async () => {
  db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));
  social = require("../api/social");
});

test("el catálogo del servidor es el del navegador: mismos logros, nombres y puntos", () => {
  const fuente = fs.readFileSync(path.join(__dirname, "..", "js", "motor", "logros.js"), "utf8");
  const enNavegador = {};
  for (const m of fuente.matchAll(/id\s*:\s*"([^"]+)"[\s\S]*?nombre\s*:\s*"([^"]+)"[\s\S]*?puntos\s*:\s*(\d+)/g)) {
    enNavegador[m[1]] = { nombre: m[2], puntos: Number(m[3]) };
  }
  const enServidor = Object.fromEntries(Object.entries(logros.LOGROS).map(([id, l]) => [id, { nombre: l.nombre, puntos: l.puntos }]));
  assert.deepStrictEqual(enServidor, enNavegador);
});

test("los de tener muchos amigos no dan monedas; los demás, sus puntos", () => {
  assert.equal(logros.monedasDeLogro("popular"), 0);
  assert.equal(logros.monedasDeLogro("leyendaSocial"), 0);
  assert.equal(logros.monedasDeLogro("explorador"), 25);
  assert.equal(logros.monedasDeLogro("numeroUno"), 1000);
  assert.equal(logros.monedasDeLogro("inventado"), 0);
});

describe("pedir un logro", () => {

  test("uno que no existe se rechaza", async () => {
    const id = await cuenta("inventora");
    const r = await pedir("inventora", id, "millonario");
    assert.equal(r.codigo, 400);
    assert.match(r.cuerpo.error, /no existe/);
  });

  test("uno que no se cumple no se guarda ni paga", async () => {
    const id = await cuenta("apurada", 3);
    const r = await pedir("apurada", id, "nivel5");
    assert.equal(r.cuerpo.success, false);
    assert.equal(r.cuerpo.nuevo, false);
    assert.equal(await loTiene(id, "nivel5"), false);
    assert.equal(await saldo(id), 500);
  });

  test("uno que se cumple se guarda, paga sus puntos y lo dice el aviso; dos veces no paga dos", async () => {
    const id = await cuenta("cumplidora", 5);
    const r = await pedir("cumplidora", id, "nivel5");
    assert.equal(r.cuerpo.success, true);
    assert.equal(r.cuerpo.nuevo, true);
    assert.equal(r.cuerpo.monedas, 20);
    assert.equal(r.cuerpo.saldoNuevo, 520);
    assert.equal(await saldo(id), 520);
    const aviso = await db.query("SELECT mensaje FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 1", [id]);
    assert.equal(aviso.rows[0].mensaje, "Conseguiste «Nivel 5» y 🪙 20.");

    const otra = await pedir("cumplidora", id, "nivel5");
    assert.equal(otra.cuerpo.nuevo, false);
    assert.equal(await saldo(id), 520);
  });

  test("los de juegos miran los juegos jugados de verdad", async () => {
    const id = await cuenta("jugadora");
    assert.equal((await pedir("jugadora", id, "primerJuego")).cuerpo.success, false);
    for (const juego of ["a", "b", "c", "d", "e"]) {
      await db.query("INSERT INTO games_played (user_id, game_id) VALUES ($1, $2)", [id, juego]);
    }
    assert.equal((await pedir("jugadora", id, "primerJuego")).cuerpo.nuevo, true);
    assert.equal((await pedir("jugadora", id, "explorador")).cuerpo.nuevo, true);
    assert.equal((await pedir("jugadora", id, "coleccionista")).cuerpo.success, false);
    assert.equal(await saldo(id), 500 + 10 + 25);
  });

  test("los del ranking miran el puesto de la semana", async () => {
    const id = await cuenta("segunda");
    await db.query("UPDATE users SET rank_actual = 2 WHERE id = $1", [id]);
    assert.equal((await pedir("segunda", id, "top3")).cuerpo.nuevo, true);
    assert.equal((await pedir("segunda", id, "subcampeon")).cuerpo.nuevo, true);
    assert.equal((await pedir("segunda", id, "numeroUno")).cuerpo.success, false);
    assert.equal(await saldo(id), 500 + 450 + 700);
  });

  test("tener 50 amigos da el logro, pero no monedas", async () => {
    const id = await cuenta("sociable");
    const otros = [];
    for (let i = 0; i < 50; i++) otros.push(await cuenta("amigo" + i));
    for (const otro of otros) {
      await db.query("INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1)", [id, otro]);
    }
    const r = await pedir("sociable", id, "popular");
    assert.equal(r.cuerpo.nuevo, true);
    assert.equal(r.cuerpo.monedas, 0);
    assert.equal(await saldo(id), 500);
    const aviso = await db.query("SELECT mensaje FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 1", [id]);
    assert.equal(aviso.rows[0].mensaje, "Conseguiste «Popular».");
  });

  test("pedirlo en nombre de otra cuenta sigue sin valer", async () => {
    const id = await cuenta("ajena", 9);
    await cuenta("otra_persona", 9);
    const r = await pedir("otra_persona", id, "nivel5", "ajena");
    assert.equal(r.codigo, 403);
  });
});
