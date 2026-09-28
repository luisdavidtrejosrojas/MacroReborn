// ==============================
// EL AVISO DE MISIÓN CUMPLIDA — tests/misiones-avisos.test.js
// ==============================
// Decidido el 28/09/2026: de cada tres misiones cumplidas se cobraba una,
// porque nada avisaba y la diaria se perdía a medianoche. Ahora, en el
// momento en que se cumple la de hoy o la de la semana, llega una
// notificación (avisarSiSeCumplen, en api/_misiones.js): una sola vez, y
// nunca de lo ya cobrado. Y la cumplida espera hasta que se cobre: con
// una de antes esperando, la de hoy no se apunta ni se avisa.
//
// Primero la regla, con fechas fijas (qué misión toca depende del día):
//   - 01/10/2026: la diaria es "Tiempo de juego" (15 minutos) y la
//     semanal, "Descubridor" (6 juegos distintos);
//   - 07/10/2026: la diaria es "Explorador diario" (3 juegos).
// Después los dos sitios que la llaman, con los handlers de verdad: el
// minuto de juego (api/users.js) y el botón "Jugar" (api/content.js).
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before, describe } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");
// No abre la base al cargarse (las notificaciones las carga dentro de
// avisarSiSeCumplen), así que puede ir aquí: el skip de abajo lo usa al
// definir la prueba, antes del before.
const misiones = require("../api/_misiones");

let db;
let sql;
let usersHandler;
let contentHandler;

before(async () => {
  db = await crearBaseLocal();
  sql = crearSqlPGlite(db);
  usarSqlLocal(sql);
  usersHandler = require("../api/users");
  contentHandler = require("../api/content");
});

const OCT_1 = new Date("2026-10-01T15:00:00Z");   // 12:00 en Argentina
const OCT_7 = new Date("2026-10-07T15:00:00Z");
const OCT_8 = new Date("2026-10-08T15:00:00Z");

let siguiente = 0;
async function persona() {
  const username = "jugador" + (++siguiente);
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'hash', 5, 0, 'active', now(), now()) RETURNING id`, [username]);
  const id = Number(r.rows[0].id);
  return { id, username, headers: { authorization: "Bearer " + crearToken({ id, username }) } };
}

const avisos = async (p) => (await db.query(
  "SELECT titulo, mensaje FROM notifications WHERE user_id = $1 ORDER BY id", [p.id])).rows;

const avisar = (p, valores, ahora) => misiones.avisarSiSeCumplen(sql, p.id, p.username, valores, ahora);

describe("la regla", () => {

  test("qué miden las misiones de un día", () => {
    assert.deepStrictEqual([...misiones.metricasEnJuego(OCT_1)].sort(), ["games_week", "minutes_today"]);
  });

  test("antes de la meta, nada", async () => {
    const p = await persona();
    await avisar(p, { minutes_today: 14 }, OCT_1);
    assert.deepStrictEqual(await avisos(p), []);
  });

  test("al llegar, un aviso con la recompensa, que espera hasta que se cobre; y solo uno", async () => {
    const p = await persona();
    await avisar(p, { minutes_today: 15 }, OCT_1);
    await avisar(p, { minutes_today: 16 }, OCT_1);
    const lista = await avisos(p);
    assert.equal(lista.length, 1);
    assert.equal(lista[0].titulo, "🎯 ¡Misión cumplida!");
    assert.equal(lista[0].mensaje, "«Tiempo de juego»: cobrá +55 XP y 🪙 40 en Mi día. Te espera hasta que la cobres.");
  });

  test("la semanal, con su propio aviso", async () => {
    const p = await persona();
    await avisar(p, { games_week: 6 }, OCT_1);
    const lista = await avisos(p);
    assert.equal(lista.length, 1);
    assert.equal(lista[0].titulo, "🏆 ¡Misión semanal cumplida!");
    assert.equal(lista[0].mensaje, "«Descubridor»: cobrá +180 XP y 🪙 140 en Mi día. Te espera hasta que la cobres.");
  });

  test("de lo que no miden las misiones de ese día, nada", async () => {
    const p = await persona();
    await avisar(p, { games_today: 10, minutes_week: 999 }, OCT_1);
    assert.deepStrictEqual(await avisos(p), []);
  });

  test("de lo ya cobrado no se avisa", async () => {
    const p = await persona();
    await db.query(
      `INSERT INTO player_mission_claims (user_id, mission_key, period_key, reward_xp, reward_coins)
       VALUES ($1, 'daily_15_minutes', '2026-10-01', 55, 40)`, [p.id]);
    await avisar(p, { minutes_today: 15 }, OCT_1);
    assert.deepStrictEqual(await avisos(p), []);
  });

  // Desde el 28/09/2026 una misión cumplida espera hasta que se cobre, y
  // mientras espera no aparece otra del mismo tipo: la de hoy ni se ve,
  // así que no se apunta ni se avisa (la del 28/09 es "Explorador diario").
  const cumplidaEl = (p, key, periodo) => db.query(
    "INSERT INTO player_mission_avisos (user_id, mission_key, period_key) VALUES ($1, $2, $3)", [p.id, key, periodo]);

  test("con una diaria de antes sin cobrar, la de hoy ni se apunta ni avisa", async () => {
    const p = await persona();
    await cumplidaEl(p, "daily_3_games", "2026-09-28");
    await avisar(p, { minutes_today: 15 }, OCT_1);
    assert.deepStrictEqual(await avisos(p), []);
    const filas = await db.query("SELECT period_key FROM player_mission_avisos WHERE user_id = $1", [p.id]);
    assert.deepStrictEqual(filas.rows.map(f => f.period_key), ["2026-09-28"]);
  });

  test("cobrada aquella, la de hoy sí", async () => {
    const p = await persona();
    await cumplidaEl(p, "daily_3_games", "2026-09-28");
    await db.query(
      `INSERT INTO player_mission_claims (user_id, mission_key, period_key, reward_xp, reward_coins)
       VALUES ($1, 'daily_3_games', '2026-09-28', 40, 35)`, [p.id]);
    await avisar(p, { minutes_today: 15 }, OCT_1);
    assert.equal((await avisos(p)).length, 1);
  });

  test("la diaria que espera no frena la semanal, ni al revés", async () => {
    const p = await persona();
    await cumplidaEl(p, "daily_3_games", "2026-09-28");
    await avisar(p, { minutes_today: 15, games_week: 6 }, OCT_1);
    assert.deepStrictEqual((await avisos(p)).map(a => a.titulo), ["🏆 ¡Misión semanal cumplida!"]);

    const q = await persona();
    await cumplidaEl(q, "weekly_90_minutes", "2026-09-21");
    await avisar(q, { minutes_today: 15, games_week: 6 }, OCT_1);
    assert.deepStrictEqual((await avisos(q)).map(a => a.titulo), ["🎯 ¡Misión cumplida!"]);
  });

  test("una misión que ya no existe no se queda esperando", async () => {
    const p = await persona();
    await cumplidaEl(p, "daily_que_ya_no_existe", "2026-09-28");
    await avisar(p, { minutes_today: 15 }, OCT_1);
    assert.equal((await avisos(p)).length, 1);
  });

  test("otro día, otra misión; y la misma misión otro día vuelve a avisar", async () => {
    const p = await persona();
    // Cobrando cada una en su día: sin cobrar, la primera esperaría y
    // frenaría las demás (arriba).
    const cobrar = (key, periodo) => db.query(
      `INSERT INTO player_mission_claims (user_id, mission_key, period_key, reward_xp, reward_coins)
       VALUES ($1, $2, $3, 0, 0)`, [p.id, key, periodo]);
    await avisar(p, { minutes_today: 15 }, OCT_1);
    await cobrar("daily_15_minutes", "2026-10-01");
    await avisar(p, { games_today: 3 }, OCT_7);
    await cobrar("daily_3_games", "2026-10-07");
    await avisar(p, { minutes_today: 15 }, OCT_8);   // el 8 vuelve a tocar "Tiempo de juego"
    const titulos = (await avisos(p)).map(a => a.mensaje.split("»")[0]);
    assert.deepStrictEqual(titulos, ["«Tiempo de juego", "«Explorador diario", "«Tiempo de juego"]);
  });

});

describe("dónde se avisa", () => {

  function llamar(handler, query, body, headers) {
    return new Promise((resolve) => {
      handler({ method: "POST", query, body, headers }, {
        status(c) { this.codigo = c; return this; },
        setHeader() {},
        json(o) { resolve(o); },
        end() { resolve(null); }
      });
    });
  }
  const pulso = (p, gameId) => llamar(usersHandler, { action: "xp" }, { username: p.username, cantidad: 10, gameId }, p.headers);
  const jugar = (p, gameId) => llamar(contentHandler, { action: "game-history" }, { username: p.username, gameId }, p.headers);

  // La misión de esta semana, sea cual sea, se cumple con minutos de
  // juego: o mide minutos, o mide juegos con algún minuto jugado.
  test("el minuto de juego que cumple la semanal avisa", async () => {
    const p = await persona();
    const semana = misiones.semanaActual();
    const m = misiones.pickWeekly(semana);
    if (m.metric === "minutes_week") {
      await db.query(
        `INSERT INTO ranking_actividad_semanal (user_id, semana, minutos_jugados, dias_activos, ultimo_dia_registrado)
         VALUES ($1, $2::date, $3, 1, $2::date)`, [p.id, semana, m.target - 1]);
    } else {
      for (let i = 1; i < m.target; i++) {
        await db.query(
          `INSERT INTO ranking_juegos_semanales (user_id, semana, game_id, minutos) VALUES ($1, $2::date, $3, 5)`,
          [p.id, semana, "antes-" + i]);
      }
    }
    const r = await pulso(p, "juego-nuevo");
    assert.equal(r.success, true);
    const lista = await avisos(p);
    assert.equal(lista.length, 1, "no llegó el aviso");
    assert.equal(lista[0].titulo, "🏆 ¡Misión semanal cumplida!");
    assert.ok(lista[0].mensaje.startsWith("«" + m.title + "»"));
  });

  const hoy = () => misiones.fechaLocalAR();
  const diariaDeJuegos = () => misiones.pickDaily(hoy()).metric === "games_today";

  test("pulsar Jugar en el juego que cumple la diaria avisa", { skip: !diariaDeJuegos() && "hoy la diaria no es de juegos" }, async () => {
    const p = await persona();
    const m = misiones.pickDaily(hoy());
    for (let i = 1; i < m.target; i++) {
      await db.query("INSERT INTO game_history (user_id, game_id, played_at) VALUES ($1, $2, now())", [p.id, "antes-" + i]);
    }
    const r = await jugar(p, "juego-nuevo");
    assert.equal(r.success, true);
    const lista = await avisos(p);
    assert.equal(lista.length, 1, "no llegó el aviso");
    assert.equal(lista[0].titulo, "🎯 ¡Misión cumplida!");
  });

  test("si el aviso falla, el minuto se cuenta igual", async () => {
    const p = await persona();
    const avisoOriginal = console.warn;
    console.warn = () => {};
    await db.query("ALTER TABLE player_mission_avisos RENAME TO player_mission_avisos_fuera");
    try {
      const r = await pulso(p, "juego-1");
      assert.equal(r.success, true);
      const minutos = await db.query("SELECT minutos FROM actividad_diaria WHERE user_id = $1", [p.id]);
      assert.equal(minutos.rows[0].minutos, 1);
    } finally {
      await db.query("ALTER TABLE player_mission_avisos_fuera RENAME TO player_mission_avisos");
      console.warn = avisoOriginal;
    }
  });

});
