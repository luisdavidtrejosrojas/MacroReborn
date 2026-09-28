// ==============================
// LA RACHA Y LAS MISIONES — tests/progreso.test.js
// ==============================
// Reporte de la comunidad del 25/09/2026: "la racha no rachea y las
// misiones diarias, aunque las cumplas, no se validan". Eran tres cosas:
//
//   - La racha nunca pasaba de 1: el servidor pasaba a texto una fecha
//     que la base devuelve como Date ("Thu Sep 24" frente a
//     "2026-09-24"), así que nunca era "ayer". Desde ese día se cuenta
//     sola al jugar (api/_racha.js), y las fechas se comparan en la base.
//   - Las misiones de "Jugá N minutos hoy" medían minutes_today, que el
//     servidor no calculaba: valían siempre 0. Ahora sale de
//     actividad_diaria (migración 023).
//   - Cobrar apuntaba y pagaba en dos pasos sueltos; ahora van juntos.
//
// Contra los handlers de verdad (api/users.js para el pulso de cada
// minuto de juego, api/progreso.js para el resto) y una base PGlite.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before, describe } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");

let db;
let usersHandler;
let progresoHandler;
let internas;
let hoy;

before(async () => {
  db = await crearBaseLocal();
  // En UTC, como la base de producción. PGlite toma la zona de la
  // máquina, y con otra el fallo de la ventana de "hoy" no se ve.
  await db.query("SET TIME ZONE 'UTC'");
  usarSqlLocal(crearSqlPGlite(db));
  usersHandler = require("../api/users");
  progresoHandler = require("../api/progreso");
  internas = progresoHandler.paraPruebas;
  hoy = internas.fechaLocalAR();
});

function llamar(handler, metodo, query, body, headers) {
  return new Promise((resolve) => {
    const req = { method: metodo, query: query || {}, body: body || {}, headers: headers || {} };
    const res = {
      status(codigo) { this.statusCode = codigo; return this; },
      json(obj) { resolve({ codigo: this.statusCode || 200, cuerpo: obj }); },
      end() { resolve({ codigo: this.statusCode || 200, cuerpo: null }); },
      setHeader() {}
    };
    handler(req, res);
  });
}

async function persona(username) {
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'hash', 1, 0, 'active', now(), now()) RETURNING id`, [username]);
  const id = Number(r.rows[0].id);
  return { id, username, headers: { authorization: "Bearer " + crearToken({ id, username }) } };
}

// Un minuto de juego: el pulso que manda jugar.html cada 60 segundos.
const pulso = (p, gameId) => llamar(usersHandler, "POST", { action: "xp" },
  { username: p.username, cantidad: 10, gameId: gameId === undefined ? "juego-1" : gameId }, p.headers);

// Que pase un minuto: el servidor no cuenta dos en menos de 55 segundos
// (migración 024).
const pasaUnMinuto = (p) => db.query(
  "UPDATE users SET ultimo_minuto_jugado = ultimo_minuto_jugado - interval '1 minute' WHERE id = $1", [p.id]);

const estado = async (p) => (await llamar(progresoHandler, "GET", { action: "status" }, null, p.headers)).cuerpo;

// La racha guardada, como si el último día jugado fuera hace "dias" días.
async function rachaGuardada(p, actual, mejor, dias) {
  await db.query(
    `INSERT INTO player_streaks (user_id, current_streak, best_streak, last_checkin_date)
     VALUES ($1, $2, $3, $4::date - $5::int)`,
    [p.id, actual, mejor, hoy, dias]);
}

describe("la racha se cuenta sola al jugar", () => {

  test("el primer minuto del día la empieza", async () => {
    const p = await persona("nueva");
    await pulso(p);
    const { streak } = await estado(p);
    assert.deepStrictEqual(streak, { current_streak: 1, best_streak: 1, last_checkin_date: hoy, hoy_cuenta: true });
  });

  test("más minutos el mismo día no la suben", async () => {
    const p = await persona("insistente");
    for (let i = 0; i < 3; i++) { await pulso(p); await pasaUnMinuto(p); }
    assert.equal((await internas.obtenerMetricas(p.id)).minutes_today, 3);
    assert.equal((await estado(p)).streak.current_streak, 1);
  });

  test("si ayer jugó, hoy suma uno, y la mejor lo sigue", async () => {
    // Es el fallo del reporte: con el código de antes esto daba 1.
    const p = await persona("constante");
    await rachaGuardada(p, 4, 4, 1);
    await pulso(p);
    const { streak } = await estado(p);
    assert.equal(streak.current_streak, 5);
    assert.equal(streak.best_streak, 5);
  });

  test("si faltó un día, vuelve a empezar en 1, y la mejor se queda", async () => {
    const p = await persona("despistada");
    await rachaGuardada(p, 7, 9, 3);
    await pulso(p);
    const { streak } = await estado(p);
    assert.equal(streak.current_streak, 1);
    assert.equal(streak.best_streak, 9);
  });

  test("rota se ve como 0 hasta volver a jugar; viva, con su cifra", async () => {
    const rota = await persona("rota");
    await rachaGuardada(rota, 3, 3, 2);
    const a = (await estado(rota)).streak;
    assert.equal(a.current_streak, 0);
    assert.equal(a.best_streak, 3);
    assert.equal(a.hoy_cuenta, false);

    // Jugó ayer y hoy todavía no: la racha sigue viva.
    const viva = await persona("viva");
    await rachaGuardada(viva, 3, 3, 1);
    const b = (await estado(viva)).streak;
    assert.equal(b.current_streak, 3);
    assert.equal(b.hoy_cuenta, false);
  });

  test("la fecha sale como texto, no como Date", async () => {
    const p = await persona("fechada");
    await pulso(p);
    assert.match((await estado(p)).streak.last_checkin_date, /^\d{4}-\d{2}-\d{2}$/);
  });

  test("un pulso sin juego no cuenta: abrir el sitio no suma racha", async () => {
    const p = await persona("mirona");
    await pulso(p, null);
    const r = await db.query("SELECT count(*)::int AS n FROM player_streaks WHERE user_id = $1", [p.id]);
    assert.equal(r.rows[0].n, 0);
    assert.equal((await estado(p)).streak.current_streak, 0);
  });

  test("el botón de registrar el día ya no existe", async () => {
    const p = await persona("botonera");
    const r = await llamar(progresoHandler, "POST", { action: "checkin" }, {}, p.headers);
    assert.equal(r.codigo, 400);
  });

});

describe("las misiones", () => {

  test("toda misión mide algo que el servidor calcula", async () => {
    // La causa del fallo: tres diarias pedían minutes_today y no estaba.
    const p = await persona("medida");
    const metricas = await internas.obtenerMetricas(p.id);
    for (const m of [...internas.MISIONES_DIARIAS, ...internas.MISIONES_SEMANALES]) {
      assert.equal(typeof metricas[m.metric], "number", m.key + " mide " + m.metric + ", que no existe");
    }
  });

  test("los juegos de hoy van de medianoche a medianoche de Argentina", async () => {
    // Con el fallo, "hoy" iba de 21:00 a 21:00 UTC: lo jugado desde las
    // 18:00 de Argentina, la hora punta, no contaba.
    const p = await persona("nocturna");
    const jugado = (juego, horasDesdeMedianoche) => db.query(
      `INSERT INTO game_history (user_id, game_id, played_at)
       VALUES ($1, $2, (($3::timestamp + $4 * interval '1 hour') AT TIME ZONE 'America/Argentina/Buenos_Aires'))`,
      [p.id, juego, hoy, horasDesdeMedianoche]);

    await jugado("madrugada", 0.5);    // 00:30 de hoy
    await jugado("noche", 20);         // 20:00 de hoy
    await jugado("casi-manana", 23.9); // 23:54 de hoy
    await jugado("anoche", -0.5);      // 23:30 de ayer: no cuenta

    assert.equal((await internas.obtenerMetricas(p.id)).games_today, 3);
  });

  test("los minutos de hoy los suman los pulsos de juego", async () => {
    const p = await persona("minutera");
    for (let i = 0; i < 4; i++) { await pulso(p); await pasaUnMinuto(p); }
    assert.equal((await internas.obtenerMetricas(p.id)).minutes_today, 4);
  });

  test("las de minutos se cumplen: 14 días de cada 31 dejaban de ser imposibles", () => {
    const deMinutos = [];
    for (let dia = 1; dia <= 31; dia++) {
      const m = internas.pickDaily("2026-10-" + String(dia).padStart(2, "0"));
      if (m.metric === "minutes_today") deMinutos.push(dia);
    }
    assert.equal(deMinutos.length, 14);
  });

  test("la misión de hoy, cumplida, se cobra una sola vez", async () => {
    const p = await persona("cobradora");
    const m = internas.pickDaily(hoy);

    // Se cumple la de hoy, sea de juegos o de minutos.
    if (m.metric === "games_today") {
      for (let i = 0; i < m.target; i++) {
        await db.query("INSERT INTO game_history (user_id, game_id, played_at) VALUES ($1, $2, now())", [p.id, "g" + i]);
      }
    } else {
      await db.query("INSERT INTO actividad_diaria (user_id, dia, minutos) VALUES ($1, $2::date, $3)", [p.id, hoy, m.target]);
    }

    const antes = (await estado(p)).today.mission;
    assert.equal(antes.completed, true);
    assert.equal(antes.claimed, false);

    const saldo = async () => Number((await db.query("SELECT monedas FROM users WHERE id = $1", [p.id])).rows[0].monedas);
    const monedasAntes = await saldo();

    const cobro = await llamar(progresoHandler, "POST", { action: "claim" },
      { missionKey: m.key, periodKey: hoy, tipo: "daily" }, p.headers);
    assert.equal(cobro.cuerpo.success, true);
    assert.equal(cobro.cuerpo.alreadyClaimed, false);
    assert.deepStrictEqual(cobro.cuerpo.reward, { xp: m.xp, coins: m.coins });
    assert.equal(await saldo(), monedasAntes + m.coins);

    const otra = await llamar(progresoHandler, "POST", { action: "claim" },
      { missionKey: m.key, periodKey: hoy, tipo: "daily" }, p.headers);
    assert.equal(otra.cuerpo.alreadyClaimed, true);
    assert.equal(await saldo(), monedasAntes + m.coins, "se pagó dos veces");
    assert.equal((await estado(p)).today.mission.claimed, true);
  });

  test("sin cumplirla no se cobra", async () => {
    const p = await persona("apurada");
    const m = internas.pickDaily(hoy);
    const r = await llamar(progresoHandler, "POST", { action: "claim" },
      { missionKey: m.key, periodKey: hoy, tipo: "daily" }, p.headers);
    assert.equal(r.codigo, 400);
    assert.match(r.cuerpo.error, /completaste/);
  });

});

// Desde el 28/09/2026 una misión cumplida espera hasta que se cobre, los
// días que haga falta (api/_misiones.js). Qué se cumplió lo dice la fila
// que apunta el aviso (player_mission_avisos).
describe("la cumplida espera hasta que se cobre", () => {

  const DIA = "2026-09-20";         // la diaria de ese día: "Cambio de juego"
  const SEMANA = "2026-09-14";      // la semanal: "Maratón Macro"
  const cumplidaEl = (p, key, periodo) => db.query(
    "INSERT INTO player_mission_avisos (user_id, mission_key, period_key) VALUES ($1, $2, $3)", [p.id, key, periodo]);
  const cobrar = (p, missionKey, periodKey, tipo) => llamar(progresoHandler, "POST", { action: "claim" },
    { missionKey, periodKey, tipo: tipo || "daily" }, p.headers);
  const saldo = async (p) => Number((await db.query("SELECT monedas FROM users WHERE id = $1", [p.id])).rows[0].monedas);

  // Que lo que pide la diaria de hoy ya esté jugado, sea de juegos o de minutos.
  async function jugadoHoy(p) {
    const m = internas.pickDaily(hoy);
    if (m.metric === "games_today") {
      for (let i = 0; i < m.target; i++) {
        await db.query("INSERT INTO game_history (user_id, game_id, played_at) VALUES ($1, $2, now())", [p.id, "hoy" + i]);
      }
    } else {
      await db.query("INSERT INTO actividad_diaria (user_id, dia, minutos) VALUES ($1, $2::date, $3)", [p.id, hoy, m.target]);
    }
    return m;
  }

  test("las claves dicen de qué tipo es cada misión: así se buscan", () => {
    for (const m of internas.MISIONES_DIARIAS) assert.ok(m.key.startsWith("daily_"), m.key);
    for (const m of internas.MISIONES_SEMANALES) assert.ok(m.key.startsWith("weekly_"), m.key);
  });

  test("se ve ella, con su fecha, en lugar de la de hoy", async () => {
    const p = await persona("esperada");
    const m = internas.pickDaily(DIA);
    await cumplidaEl(p, m.key, DIA);
    const vista = (await estado(p)).today.mission;
    assert.equal(vista.key, m.key);
    assert.equal(vista.periodKey, DIA);
    assert.equal(vista.pendiente, true);
    assert.equal(vista.completed, true);
    assert.equal(vista.claimed, false);
    assert.equal(vista.value, m.target);
  });

  test("se cobra cuando sea, una sola vez, y entonces aparece la de hoy", async () => {
    const p = await persona("tardia");
    const m = internas.pickDaily(DIA);
    await cumplidaEl(p, m.key, DIA);
    const antes = await saldo(p);

    const r = await cobrar(p, m.key, DIA);
    assert.equal(r.cuerpo.success, true);
    assert.equal(r.cuerpo.alreadyClaimed, false);
    assert.deepStrictEqual(r.cuerpo.reward, { xp: m.xp, coins: m.coins });
    assert.equal(await saldo(p), antes + m.coins);

    // Dos clics, o dos pestañas: la segunda dice que ya estaba cobrada.
    const otra = await cobrar(p, m.key, DIA);
    assert.equal(otra.cuerpo.success, true);
    assert.equal(otra.cuerpo.alreadyClaimed, true);
    assert.equal(await saldo(p), antes + m.coins, "se pagó dos veces");

    const vista = (await estado(p)).today.mission;
    assert.equal(vista.periodKey, hoy);
    assert.equal(vista.pendiente, false);
  });

  test("mientras espera, la de hoy no se cobra aunque ya esté jugada", async () => {
    const p = await persona("impaciente");
    await cumplidaEl(p, internas.pickDaily(DIA).key, DIA);
    const m = await jugadoHoy(p);
    const r = await cobrar(p, m.key, hoy);
    assert.equal(r.codigo, 400);
  });

  test("lo jugado hoy mientras esperaba cuenta: al cobrarla, la de hoy se apunta, se avisa y se cobra", async () => {
    const p = await persona("aprovechada");
    await cumplidaEl(p, internas.pickDaily(DIA).key, DIA);
    const m = await jugadoHoy(p);
    await cobrar(p, internas.pickDaily(DIA).key, DIA);

    // Apuntada: si no, se perdería a medianoche sin haber jugado otro minuto.
    const apuntada = await db.query(
      "SELECT 1 FROM player_mission_avisos WHERE user_id = $1 AND mission_key = $2 AND period_key = $3", [p.id, m.key, hoy]);
    assert.equal(apuntada.rows.length, 1);
    const titulos = (await db.query("SELECT titulo FROM notifications WHERE user_id = $1", [p.id])).rows.map(f => f.titulo);
    assert.deepStrictEqual(titulos, ["🎯 ¡Misión cumplida!"]);

    assert.equal((await estado(p)).today.mission.completed, true);
    const r = await cobrar(p, m.key, hoy);
    assert.equal(r.cuerpo.alreadyClaimed, false);
  });

  test("sin su fila, una de otro día no se cobra", async () => {
    const p = await persona("colada");
    const r = await cobrar(p, internas.pickDaily(DIA).key, DIA);
    assert.equal(r.codigo, 400);
    assert.match(r.cuerpo.error, /no válida/);
  });

  test("cobrada, deja de esperar", async () => {
    const p = await persona("cumplidora");
    const m = internas.pickDaily(DIA);
    await cumplidaEl(p, m.key, DIA);
    await db.query(
      `INSERT INTO player_mission_claims (user_id, mission_key, period_key, reward_xp, reward_coins)
       VALUES ($1, $2, $3, $4, $5)`, [p.id, m.key, DIA, m.xp, m.coins]);
    assert.equal((await estado(p)).today.mission.periodKey, hoy);
  });

  test("con dos esperando, primero la más antigua", async () => {
    const p = await persona("acumuladora");
    const antes = "2026-09-19";
    await cumplidaEl(p, internas.pickDaily(DIA).key, DIA);
    await cumplidaEl(p, internas.pickDaily(antes).key, antes);
    assert.equal((await estado(p)).today.mission.periodKey, antes);
    await cobrar(p, internas.pickDaily(antes).key, antes);
    assert.equal((await estado(p)).today.mission.periodKey, DIA);
    await cobrar(p, internas.pickDaily(DIA).key, DIA);
    assert.equal((await estado(p)).today.mission.periodKey, hoy);
  });

  test("la semanal, igual", async () => {
    const p = await persona("semanera");
    const m = internas.pickWeekly(SEMANA);
    await cumplidaEl(p, m.key, SEMANA);
    const vista = (await estado(p)).week.mission;
    assert.equal(vista.key, m.key);
    assert.equal(vista.periodKey, SEMANA);
    assert.equal(vista.pendiente, true);
    // La diaria no se entera.
    assert.equal((await estado(p)).today.mission.pendiente, false);

    const r = await cobrar(p, m.key, SEMANA, "weekly");
    assert.equal(r.cuerpo.success, true);
    assert.equal(r.cuerpo.alreadyClaimed, false);
    assert.deepStrictEqual(r.cuerpo.reward, { xp: m.xp, coins: m.coins });
    assert.equal((await estado(p)).week.mission.pendiente, false);
  });

});
