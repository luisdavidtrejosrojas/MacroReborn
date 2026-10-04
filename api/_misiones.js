// ==============================
// LAS MISIONES — api/_misiones.js
// ==============================
// Qué misión toca cada día y cada semana, y lo que miden. Vivía dentro de
// api/progreso.js; desde el 28/09/2026 está aquí porque también lo usan
// el pulso de cada minuto de juego (api/users.js) y el botón "Jugar"
// (api/content.js), para avisar en el momento en que una misión se
// cumple (avisarSiSeCumplen, abajo).
//
// El día y la semana son los de Argentina: cambian a las 00:00 de allí,
// y la semana empieza el lunes.

function fechaLocalAR(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(d);
}

function semanaActual(d = new Date()) {
  const base = new Date(`${fechaLocalAR(d)}T12:00:00-03:00`);
  const weekday = base.getDay() || 7;
  base.setDate(base.getDate() - weekday + 1);
  return base.toISOString().slice(0, 10);
}

// Las monedas de cada misión subieron un 25 % el 04/10/2026, con la
// economía nueva (docs/ECONOMIA.md): eran 25-60 las diarias y 140-300 las
// semanales. El XP no cambió.
const MISIONES_DIARIAS = [
  { key: "daily_3_games", title: "Explorador diario", description: "Jugá 3 juegos distintos hoy.", metric: "games_today", target: 3, xp: 40, coins: 44 },
  { key: "daily_15_minutes", title: "Tiempo de juego", description: "Jugá al menos 15 minutos hoy.", metric: "minutes_today", target: 15, xp: 55, coins: 50 },
  { key: "daily_2_games", title: "Entrá en calor", description: "Jugá 2 juegos distintos hoy.", metric: "games_today", target: 2, xp: 30, coins: 31 },
  { key: "daily_30_minutes", title: "Sesión larga", description: "Acumulá 30 minutos de juego hoy.", metric: "minutes_today", target: 30, xp: 85, coins: 75 },
  { key: "daily_5_games", title: "Coleccionista", description: "Probá 5 juegos distintos hoy.", metric: "games_today", target: 5, xp: 70, coins: 69 },
  { key: "daily_20_minutes", title: "Veterano del día", description: "Jugá 20 minutos hoy.", metric: "minutes_today", target: 20, xp: 65, coins: 56 },
  { key: "daily_4_games", title: "Cambio de juego", description: "Jugá 4 juegos distintos hoy.", metric: "games_today", target: 4, xp: 50, coins: 50 }
];

const MISIONES_SEMANALES = [
  { key: "weekly_6_games", title: "Descubridor", description: "Jugá 6 juegos distintos esta semana.", metric: "games_week", target: 6, xp: 180, coins: 175 },
  { key: "weekly_90_minutes", title: "Jugador constante", description: "Jugá 90 minutos esta semana.", metric: "minutes_week", target: 90, xp: 250, coins: 225 },
  { key: "weekly_180_minutes", title: "Maratón Macro", description: "Jugá 180 minutos esta semana.", metric: "minutes_week", target: 180, xp: 400, coins: 375 },
  { key: "weekly_10_games", title: "Turista del catálogo", description: "Jugá 10 juegos distintos esta semana.", metric: "games_week", target: 10, xp: 320, coins: 300 }
];

function pickDaily(dateText) {
  const day = new Date(`${dateText}T12:00:00-03:00`).getDate();
  return MISIONES_DIARIAS[day % MISIONES_DIARIAS.length];
}

function pickWeekly(weekText) {
  const day = Number(weekText.slice(-2));
  return MISIONES_SEMANALES[day % MISIONES_SEMANALES.length];
}

// Los juegos distintos de hoy: los que se abrieron con "Jugar" (cada
// juego tiene una fila en game_history, con la última vez que se jugó).
//
// De las 00:00 a las 00:00 de Argentina. El ::timestamp va ANTES del AT
// TIME ZONE. Sin él, Postgres convierte la fecha a timestamptz con la
// zona de la sesión (UTC) y el AT TIME ZONE la devuelve como hora de
// Argentina: la ventana quedaba de 21:00 a 21:00 UTC, seis horas antes,
// y lo jugado desde las 18:00 de Argentina -la hora punta- no contaba
// para la misión de hoy (punto 80 de docs/AUDITORIA.md).
async function juegosDeHoy(sql, userId, hoy) {
  const filas = await sql`
    SELECT COUNT(*)::int AS cantidad
    FROM game_history gh
    WHERE gh.user_id = ${userId}
      AND gh.played_at >= (${hoy}::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')
      AND gh.played_at <  ((${hoy}::date + 1)::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires');
  `;
  return Number(filas[0]?.cantidad) || 0;
}

// Los juegos distintos de la semana: los que tienen algún minuto jugado
// (una fila por juego en ranking_juegos_semanales).
async function juegosDeLaSemana(sql, userId, semana) {
  const filas = await sql`
    SELECT COUNT(*)::int AS cantidad
    FROM ranking_juegos_semanales
    WHERE user_id = ${userId} AND semana = ${semana}::date;
  `;
  return Number(filas[0]?.cantidad) || 0;
}

// ==============================
// LA MISIÓN CUMPLIDA ESPERA HASTA QUE SE COBRE
// ==============================
// Decidido el 28/09/2026: una misión cumplida ya no se pierde a
// medianoche (la diaria) ni al acabar la semana (la semanal). Se queda en
// Mi día y en Progreso, con su fecha, hasta que se cobre, los días que
// haga falta. Mientras tanto no aparece otra del mismo tipo; al cobrarla
// aparece la de ese día o esa semana, y si lo que pide ya se jugó, se
// puede cobrar en el acto (api/progreso.js).
//
// Qué se cumplió lo dice player_mission_avisos: la fila que se apunta al
// avisar (abajo). La que espera es una de un período anterior que no se
// cobró. Si hubiera más de una -solo pasa con lo rescatado de la semana
// del 21/09 (scripts/rescatar-misiones.js)-, primero la más antigua.
async function pendienteSinCobrar(sql, userId, tipo, periodoActual) {
  const filas = await sql`
    SELECT a.mission_key, a.period_key
    FROM player_mission_avisos a
    WHERE a.user_id = ${userId}
      AND a.mission_key LIKE ${tipo === "weekly" ? "weekly_%" : "daily_%"}
      AND a.period_key < ${periodoActual}
      AND NOT EXISTS (
        SELECT 1 FROM player_mission_claims c
        WHERE c.user_id = a.user_id AND c.mission_key = a.mission_key AND c.period_key = a.period_key
      )
    ORDER BY a.period_key;
  `;
  // Una misión que ya no está en las listas no puede quedarse esperando.
  const lista = tipo === "weekly" ? MISIONES_SEMANALES : MISIONES_DIARIAS;
  for (const fila of filas) {
    const mision = lista.find(m => m.key === fila.mission_key);
    if (mision) return { mision, periodo: fila.period_key };
  }
  return null;
}

// ==============================
// AVISAR AL CUMPLIRLA
// ==============================
// Decidido el 28/09/2026: de cada tres misiones cumplidas se cobraba una.
// Para cobrar hay que entrar en "Mi día" o "Progreso", casi nadie entra y
// nada avisaba.
//
// Los eventos que mueven lo que miden las misiones -el minuto de juego
// (api/users.js) y abrir un juego con "Jugar" (api/content.js)- llaman
// aquí con los valores que acaban de quedar. Si con ellos se cumple la
// misión de hoy o la de esta semana, llega una notificación: a la
// campana, y con su aviso emergente aunque se esté jugando
// (js/realtime.js). Una sola vez: player_mission_avisos (migración 025)
// lo apunta, y de lo ya cobrado no se avisa.
//
// "ahora" existe para las pruebas: qué misión toca depende del día.

// Lo que miden, en este momento, la misión de hoy y la de la semana. Quien
// llama solo calcula lo que puede avisar de algo.
function metricasEnJuego(ahora) {
  const cuando = ahora || new Date();
  return new Set([pickDaily(fechaLocalAR(cuando)).metric, pickWeekly(semanaActual(cuando)).metric]);
}

async function avisarSiSeCumplen(sql, userId, username, valores, ahora) {
  // Aquí y no arriba: api/_notifications.js abre la conexión al cargarse.
  const { crearNotificacionServidor } = require("./_notifications");

  const cuando = ahora || new Date();
  const hoy = fechaLocalAR(cuando);
  const semana = semanaActual(cuando);
  const candidatas = [
    { tipo: "daily", mision: pickDaily(hoy), periodo: hoy },
    { tipo: "weekly", mision: pickWeekly(semana), periodo: semana }
  ];

  for (const { tipo, mision, periodo } of candidatas) {
    const valor = valores[mision.metric];
    if (valor === undefined || valor === null || Number(valor) < mision.target) continue;

    // Con una de antes esperando a que se cobre, esta ni se ve: no se
    // apunta. Al cobrar aquella se vuelve a mirar (api/progreso.js).
    if (await pendienteSinCobrar(sql, userId, tipo, periodo)) continue;

    const nueva = await sql`
      INSERT INTO player_mission_avisos (user_id, mission_key, period_key)
      SELECT ${userId}, ${mision.key}, ${periodo}
      WHERE NOT EXISTS (
        SELECT 1 FROM player_mission_claims
        WHERE user_id = ${userId} AND mission_key = ${mision.key} AND period_key = ${periodo}
      )
      ON CONFLICT DO NOTHING
      RETURNING user_id;
    `;
    if (!nueva.length) continue;

    await crearNotificacionServidor(
      username,
      tipo === "daily" ? "🎯 ¡Misión cumplida!" : "🏆 ¡Misión semanal cumplida!",
      `«${mision.title}»: cobrá +${mision.xp} XP y 🪙 ${mision.coins} en Mi día. Te espera hasta que la cobres.`,
      null,
      { userId }
    );
  }
}

module.exports = {
  fechaLocalAR,
  semanaActual,
  MISIONES_DIARIAS,
  MISIONES_SEMANALES,
  pickDaily,
  pickWeekly,
  juegosDeHoy,
  juegosDeLaSemana,
  pendienteSinCobrar,
  metricasEnJuego,
  avisarSiSeCumplen
};
