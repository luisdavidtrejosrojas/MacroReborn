// ==============================
// LO CUMPLIDO LA SEMANA DEL 21/09 — tests/rescatar-misiones.test.js
// ==============================
// scripts/rescatar-misiones.js se corre una vez en el servidor: guarda a
// cada jugador su diaria cumplida y sin cobrar más reciente de esa semana,
// y la semanal, y le avisa. Aquí, contra una base PGlite con jugadores de
// mentira, y viendo después Mi día con el handler de verdad.
//
// Las misiones de esos días (api/_misiones.js): el 26/09, "Veterano del
// día" (20 minutos); el 27/09, "Cambio de juego" (4 juegos); la semana del
// 21/09, "Jugador constante" (90 minutos).
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");
const { rescatar } = require("../scripts/rescatar-misiones");

let db;
let sql;
let progresoHandler;

before(async () => {
  db = await crearBaseLocal();
  await db.query("SET TIME ZONE 'UTC'");
  sql = crearSqlPGlite(db);
  usarSqlLocal(sql);
  progresoHandler = require("../api/progreso");
});

async function persona(username) {
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'hash', 1, 0, 'active', now(), now()) RETURNING id`, [username]);
  const id = Number(r.rows[0].id);
  return { id, username, headers: { authorization: "Bearer " + crearToken({ id, username }) } };
}

// n juegos distintos el 27/09, al mediodía de Argentina.
async function juegosEl27(p, n) {
  for (let i = 0; i < n; i++) {
    await db.query(
      `INSERT INTO game_history (user_id, game_id, played_at)
       VALUES ($1, $2, (('2026-09-27'::timestamp + interval '12 hours') AT TIME ZONE 'America/Argentina/Buenos_Aires'))`,
      [p.id, "j" + i]);
  }
}
const minutosEl26 = (p, minutos) => db.query(
  "INSERT INTO actividad_diaria (user_id, dia, minutos) VALUES ($1, '2026-09-26', $2)", [p.id, minutos]);
const minutosDeLaSemana = (p, minutos) => db.query(
  `INSERT INTO ranking_actividad_semanal (user_id, semana, minutos_jugados, dias_activos, ultimo_dia_registrado)
   VALUES ($1, '2026-09-21', $2, 3, '2026-09-27')`, [p.id, minutos]);
const cobrada = (p, key, periodo) => db.query(
  `INSERT INTO player_mission_claims (user_id, mission_key, period_key, reward_xp, reward_coins)
   VALUES ($1, $2, $3, 0, 0)`, [p.id, key, periodo]);

const guardadas = async (p) => (await db.query(
  "SELECT mission_key, period_key FROM player_mission_avisos WHERE user_id = $1 ORDER BY period_key", [p.id])).rows;
const avisos = async (p) => (await db.query(
  "SELECT titulo, mensaje FROM notifications WHERE user_id = $1", [p.id])).rows;

test("guarda a cada uno lo suyo, avisa una vez, y Mi día lo enseña", async () => {
  const ana = await persona("ana");        // el 26 y el 27: solo la más reciente
  await minutosEl26(ana, 25);
  await juegosEl27(ana, 4);
  const beto = await persona("beto");      // el 26 y la semanal
  await minutosEl26(beto, 20);
  await minutosDeLaSemana(beto, 120);
  const caro = await persona("caro");      // cobró la del 27: le queda la del 26
  await minutosEl26(caro, 30);
  await juegosEl27(caro, 5);
  await cobrada(caro, "daily_4_games", "2026-09-27");
  const dani = await persona("dani");      // la semanal, ya cobrada
  await minutosDeLaSemana(dani, 95);
  await cobrada(dani, "weekly_90_minutes", "2026-09-21");
  const eva = await persona("eva");        // le faltó: 3 juegos de 4, 19 minutos de 20
  await juegosEl27(eva, 3);
  await minutosEl26(eva, 19);

  // Sin --aplicar, solo cuenta.
  const cuenta = await rescatar(sql, { aplicar: false });
  assert.deepStrictEqual(cuenta, { jugadores: 3, diarias: 3, semanales: 1, apuntadas: 0, avisados: 0 });
  assert.deepStrictEqual(await guardadas(ana), []);

  const hecho = await rescatar(sql, { aplicar: true });
  assert.deepStrictEqual(hecho, { jugadores: 3, diarias: 3, semanales: 1, apuntadas: 4, avisados: 3 });

  assert.deepStrictEqual(await guardadas(ana), [{ mission_key: "daily_4_games", period_key: "2026-09-27" }]);
  assert.deepStrictEqual(await guardadas(beto), [
    { mission_key: "weekly_90_minutes", period_key: "2026-09-21" },
    { mission_key: "daily_20_minutes", period_key: "2026-09-26" }
  ]);
  assert.deepStrictEqual(await guardadas(caro), [{ mission_key: "daily_20_minutes", period_key: "2026-09-26" }]);
  assert.deepStrictEqual(await guardadas(dani), []);
  assert.deepStrictEqual(await guardadas(eva), []);

  assert.deepStrictEqual(await avisos(ana), [{
    titulo: "🎁 Tenés una misión sin cobrar",
    mensaje: "Las misiones cumplidas ahora te esperan hasta que las cobres. En Mi día tenés «Cambio de juego» del 27/09 (+50 XP y 🪙 50)."
  }]);
  assert.deepStrictEqual(await avisos(beto), [{
    titulo: "🎁 Tenés misiones sin cobrar",
    mensaje: "Las misiones cumplidas ahora te esperan hasta que las cobres. En Mi día tenés «Veterano del día» del 26/09 (+65 XP y 🪙 56) y «Jugador constante» de la semana del 21/09 (+250 XP y 🪙 225)."
  }]);

  // Otra vez: nada nuevo, ni filas ni avisos.
  const otra = await rescatar(sql, { aplicar: true });
  assert.equal(otra.apuntadas, 0);
  assert.equal(otra.avisados, 0);
  assert.equal((await avisos(beto)).length, 1);

  // Y Mi día se lo enseña a beto, con su fecha, listo para cobrar.
  const vista = await new Promise((resolve) => {
    progresoHandler({ method: "GET", query: { action: "status" }, body: {}, headers: beto.headers }, {
      status() { return this; },
      setHeader() {},
      json(o) { resolve(o); }
    });
  });
  assert.equal(vista.today.mission.key, "daily_20_minutes");
  assert.equal(vista.today.mission.periodKey, "2026-09-26");
  assert.equal(vista.today.mission.pendiente, true);
  assert.equal(vista.week.mission.key, "weekly_90_minutes");
  assert.equal(vista.week.mission.periodKey, "2026-09-21");
  assert.equal(vista.week.mission.pendiente, true);
});
