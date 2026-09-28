// ==============================
// LO CUMPLIDO Y SIN COBRAR DE LA SEMANA DEL 21/09 — scripts/rescatar-misiones.js
// ==============================
// Decidido el 28/09/2026, al hacer que las misiones cumplidas esperen
// hasta que se cobren (api/_misiones.js): lo que se cumplió del 21 al
// 27/09 y nadie cobró, también espera. A cada jugador se le guarda su
// diaria cumplida más reciente de esa semana y la semanal, si la cumplió,
// y le llega un aviso. Una sola diaria, como manda la regla: mientras una
// espera, no aparece otra.
//
// Lo que se puede saber de cada día:
//   - Las diarias de minutos, desde el 25/09: actividad_diaria empezó
//     ese día, así que las del 22 y el 24 no se pueden saber.
//   - Las de juegos, de menos: game_history guarda solo la última vez que
//     se jugó cada juego, y uno jugado ese día y otra vez después ya no
//     cuenta para ese día. Nunca de más.
//   - La semanal, entera.
//
// Una sola vez, en el servidor, después de desplegar:
//   node scripts/rescatar-misiones.js            cuenta, sin tocar nada
//   node scripts/rescatar-misiones.js --aplicar  apunta y avisa
// Repetirlo no duplica nada: cada misión tiene una sola fila, y solo se
// avisa de lo que se apunta en esa pasada.

const { pickDaily, pickWeekly } = require("../api/_misiones");

const SEMANA = "2026-09-21";
const DIAS = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"];

// Quién cumplió la diaria de ese día.
async function cumplieronElDia(sql, dia) {
  const m = pickDaily(dia);
  const filas = m.metric === "games_today"
    ? await sql`
        SELECT user_id FROM game_history
        WHERE played_at >= (${dia}::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')
          AND played_at <  ((${dia}::date + 1)::timestamp AT TIME ZONE 'America/Argentina/Buenos_Aires')
        GROUP BY user_id HAVING COUNT(*) >= ${m.target};
      `
    : await sql`
        SELECT user_id FROM actividad_diaria
        WHERE dia = ${dia}::date AND minutos >= ${m.target};
      `;
  return filas.map(f => Number(f.user_id));
}

// Quién cumplió la semanal de esa semana.
async function cumplieronLaSemana(sql, semana) {
  const m = pickWeekly(semana);
  const filas = m.metric === "minutes_week"
    ? await sql`
        SELECT user_id FROM ranking_actividad_semanal
        WHERE semana = ${semana}::date AND minutos_jugados >= ${m.target};
      `
    : await sql`
        SELECT user_id FROM ranking_juegos_semanales
        WHERE semana = ${semana}::date
        GROUP BY user_id HAVING COUNT(*) >= ${m.target};
      `;
  return filas.map(f => Number(f.user_id));
}

async function cobrada(sql, userId, key, periodo) {
  const filas = await sql`
    SELECT 1 FROM player_mission_claims
    WHERE user_id = ${userId} AND mission_key = ${key} AND period_key = ${periodo}
    LIMIT 1;
  `;
  return filas.length > 0;
}

// Lo que se le guarda a cada jugador: id de la cuenta -> [{ tipo, mision, periodo }].
async function calcular(sql) {
  const porJugador = new Map();
  const guardar = (userId, cosa) => {
    if (!porJugador.has(userId)) porJugador.set(userId, []);
    porJugador.get(userId).push(cosa);
  };

  // La diaria más reciente de cada uno: del último día al primero.
  const conDiaria = new Set();
  for (const dia of [...DIAS].reverse()) {
    const m = pickDaily(dia);
    for (const userId of await cumplieronElDia(sql, dia)) {
      if (conDiaria.has(userId) || await cobrada(sql, userId, m.key, dia)) continue;
      conDiaria.add(userId);
      guardar(userId, { tipo: "daily", mision: m, periodo: dia });
    }
  }

  const s = pickWeekly(SEMANA);
  for (const userId of await cumplieronLaSemana(sql, SEMANA)) {
    if (await cobrada(sql, userId, s.key, SEMANA)) continue;
    guardar(userId, { tipo: "weekly", mision: s, periodo: SEMANA });
  }
  return porJugador;
}

// «Veterano del día» del 26/09 (+65 XP y 🪙 45)
function nombrar(c) {
  const [, mes, dia] = c.periodo.split("-");
  const cuando = (c.tipo === "weekly" ? "de la semana del " : "del ") + dia + "/" + mes;
  return `«${c.mision.title}» ${cuando} (+${c.mision.xp} XP y 🪙 ${c.mision.coins})`;
}

function aviso(cosas) {
  return {
    titulo: cosas.length > 1 ? "🎁 Tenés misiones sin cobrar" : "🎁 Tenés una misión sin cobrar",
    mensaje: "Las misiones cumplidas ahora te esperan hasta que las cobres. En Mi día tenés " +
      cosas.map(nombrar).join(" y ") + "."
  };
}

async function rescatar(sql, opciones) {
  const aplicar = !!(opciones && opciones.aplicar);
  const porJugador = await calcular(sql);
  const resumen = { jugadores: porJugador.size, diarias: 0, semanales: 0, apuntadas: 0, avisados: 0 };
  for (const cosas of porJugador.values()) {
    for (const c of cosas) {
      if (c.tipo === "daily") resumen.diarias++; else resumen.semanales++;
    }
  }
  if (!aplicar) return resumen;

  // Aquí y no arriba: api/_notifications.js abre la conexión al cargarse.
  const { crearNotificacionServidor } = require("../api/_notifications");
  for (const [userId, cosas] of porJugador) {
    const nuevas = [];
    for (const c of cosas) {
      const fila = await sql`
        INSERT INTO player_mission_avisos (user_id, mission_key, period_key)
        VALUES (${userId}, ${c.mision.key}, ${c.periodo})
        ON CONFLICT DO NOTHING
        RETURNING user_id;
      `;
      if (fila.length) nuevas.push(c);
    }
    resumen.apuntadas += nuevas.length;
    if (!nuevas.length) continue;

    const cuenta = await sql`SELECT username FROM users WHERE id = ${userId} LIMIT 1;`;
    if (!cuenta.length) continue;
    const { titulo, mensaje } = aviso(nuevas);
    const hecho = await crearNotificacionServidor(cuenta[0].username, titulo, mensaje, null, { userId });
    if (hecho && hecho.success) resumen.avisados++;
  }
  return resumen;
}

module.exports = { rescatar, calcular, aviso, SEMANA, DIAS };

if (require.main === module) {
  (async () => {
    const aplicar = process.argv.includes("--aplicar");
    const { obtenerSql } = require("../api/_db");
    const avisos = require("../api/_avisos");
    // Con el puente de avisos, el aviso llega al momento a quien esté
    // conectado; sin él, solo a la campana (api/_avisos.js).
    if (aplicar) await avisos.arrancarBus();
    try {
      console.log(JSON.stringify(await rescatar(obtenerSql(), { aplicar })));
    } finally {
      if (aplicar) await avisos.pararBus();
    }
    process.exit(0);
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
