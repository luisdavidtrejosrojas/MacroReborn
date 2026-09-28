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

const MISIONES_DIARIAS = [
  { key: "daily_3_games", title: "Explorador diario", description: "Jugá 3 juegos distintos hoy.", metric: "games_today", target: 3, xp: 40, coins: 35 },
  { key: "daily_15_minutes", title: "Tiempo de juego", description: "Jugá al menos 15 minutos hoy.", metric: "minutes_today", target: 15, xp: 55, coins: 40 },
  { key: "daily_2_games", title: "Entrá en calor", description: "Jugá 2 juegos distintos hoy.", metric: "games_today", target: 2, xp: 30, coins: 25 },
  { key: "daily_30_minutes", title: "Sesión larga", description: "Acumulá 30 minutos de juego hoy.", metric: "minutes_today", target: 30, xp: 85, coins: 60 },
  { key: "daily_5_games", title: "Coleccionista", description: "Probá 5 juegos distintos hoy.", metric: "games_today", target: 5, xp: 70, coins: 55 },
  { key: "daily_20_minutes", title: "Veterano del día", description: "Jugá 20 minutos hoy.", metric: "minutes_today", target: 20, xp: 65, coins: 45 },
  { key: "daily_4_games", title: "Cambio de juego", description: "Jugá 4 juegos distintos hoy.", metric: "games_today", target: 4, xp: 50, coins: 40 }
];

const MISIONES_SEMANALES = [
  { key: "weekly_6_games", title: "Descubridor", description: "Jugá 6 juegos distintos esta semana.", metric: "games_week", target: 6, xp: 180, coins: 140 },
  { key: "weekly_90_minutes", title: "Jugador constante", description: "Jugá 90 minutos esta semana.", metric: "minutes_week", target: 90, xp: 250, coins: 180 },
  { key: "weekly_180_minutes", title: "Maratón Macro", description: "Jugá 180 minutos esta semana.", metric: "minutes_week", target: 180, xp: 400, coins: 300 },
  { key: "weekly_10_games", title: "Turista del catálogo", description: "Jugá 10 juegos distintos esta semana.", metric: "games_week", target: 10, xp: 320, coins: 240 }
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

module.exports = {
  fechaLocalAR,
  semanaActual,
  MISIONES_DIARIAS,
  MISIONES_SEMANALES,
  pickDaily,
  pickWeekly,
  juegosDeHoy,
  juegosDeLaSemana
};
