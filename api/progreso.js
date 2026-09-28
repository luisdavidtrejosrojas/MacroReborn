const { setCors } = require("./_utils");
const { obtenerSql } = require("./_db");
const { requerirAuth } = require("./_auth");

const {
  fechaLocalAR, semanaActual, MISIONES_DIARIAS, MISIONES_SEMANALES,
  pickDaily, pickWeekly, juegosDeHoy, juegosDeLaSemana,
  pendienteSinCobrar, avisarSiSeCumplen
} = require("./_misiones");

const sql = obtenerSql();

// Debe coincidir con la fórmula usada por /api/users?action=xp.
function xpNecesaria(nivel) {
  const n = Math.max(1, Number(nivel) || 1);
  if (n === 1) return 50;
  if (n === 2) return 100;
  return 100 + ((n - 2) * 200);
}

async function asegurarDesafioGlobal() {
  const hoy = new Date();
  const inicio = new Date(`${semanaActual(hoy)}T00:00:00-03:00`);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);
  const key = `global_week_${semanaActual(hoy)}`;
  const existente = await sql`SELECT * FROM macro_global_challenges WHERE challenge_key = ${key} LIMIT 1;`;
  if (existente.length) return existente[0];

  const creado = await sql`
    INSERT INTO macro_global_challenges
      (challenge_key, target_value, reward_xp, reward_coins, starts_at, ends_at)
    VALUES
      (${key}, 10000, 500, 250,
       ${inicio.toISOString()}, ${fin.toISOString()})
    ON CONFLICT (challenge_key) DO NOTHING
    RETURNING *;
  `;
  if (creado.length) return creado[0];
  const relectura = await sql`SELECT * FROM macro_global_challenges WHERE challenge_key = ${key} LIMIT 1;`;
  return relectura[0];
}

// Lo que miden las misiones. Toda misión tiene que medir algo que esté
// aquí: las de "Jugá N minutos hoy" pedían minutes_today y no estaba,
// así que valían siempre 0 (tests/progreso.test.js lo vigila ahora).
async function obtenerMetricas(userId) {
  const hoy = fechaLocalAR();
  const semana = semanaActual();

  const [juegosHoy, juegosSemana, semanaTiempo, hoyTiempo, checkins, perfil] = await Promise.all([
    // Los juegos de hoy y de la semana (api/_misiones.js).
    juegosDeHoy(sql, userId, hoy),
    juegosDeLaSemana(sql, userId, semana),
    sql`
      SELECT COALESCE(minutos_jugados,0)::int AS minutos
      FROM ranking_actividad_semanal
      WHERE user_id = ${userId} AND semana = ${semana}::date
      LIMIT 1;
    `,
    // Los minutos de hoy (migración 023), que suma el pulso de cada
    // minuto de juego (api/_racha.js).
    sql`
      SELECT minutos FROM actividad_diaria
      WHERE user_id = ${userId} AND dia = ${hoy}::date
      LIMIT 1;
    `,
    // La racha tal como se ve: si ni hoy ni ayer se jugó, ya está rota
    // aunque la fila guarde la última cifra, y se enseña 0. La fecha
    // sale como texto desde la base: un Date pasado a texto en el
    // servidor era justo lo que rompía la racha.
    sql`
      SELECT CASE WHEN last_checkin_date >= ${hoy}::date - 1 THEN current_streak ELSE 0 END AS current_streak,
             best_streak,
             to_char(last_checkin_date, 'YYYY-MM-DD') AS last_checkin_date,
             (last_checkin_date = ${hoy}::date) AS hoy_cuenta
      FROM player_streaks WHERE user_id = ${userId} LIMIT 1;
    `,
    sql`
      SELECT username, level, xp, monedas, rank_actual, ranking_puntuacion
      FROM users WHERE id = ${userId} LIMIT 1;
    `
  ]);

  return {
    hoy,
    semana,
    games_today: juegosHoy,
    games_week: juegosSemana,
    minutes_today: Number(hoyTiempo[0]?.minutos) || 0,
    minutes_week: semanaTiempo[0]?.minutos || 0,
    streak: checkins[0] || { current_streak: 0, best_streak: 0, last_checkin_date: null, hoy_cuenta: false },
    user: perfil[0] || null
  };
}

async function estado(req, res, auth) {
  const metricas = await obtenerMetricas(auth.sub);
  const daily = pickDaily(metricas.hoy);
  const weekly = pickWeekly(metricas.semana);
  const global = await asegurarDesafioGlobal();

  const [claims, progresoGlobal, diariaQueEspera, semanalQueEspera] = await Promise.all([
    sql`
      SELECT mission_key, period_key
      FROM player_mission_claims
      WHERE user_id = ${auth.sub}
        AND period_key IN (${metricas.hoy}, ${metricas.semana});
    `,
    sql`
      SELECT COALESCE(SUM(r.minutos_jugados),0)::int AS valor
      FROM ranking_actividad_semanal r
      WHERE r.semana = ${metricas.semana}::date;
    `,
    pendienteSinCobrar(sql, auth.sub, "daily", metricas.hoy),
    pendienteSinCobrar(sql, auth.sub, "weekly", metricas.semana)
  ]);

  const claimed = new Set(claims.map(c => `${c.mission_key}:${c.period_key}`));
  const mapMission = (mission, periodKey) => {
    const value = Number(metricas[mission.metric] || 0);
    const completed = value >= mission.target;
    return {
      ...mission,
      periodKey,
      value: Math.min(value, mission.target),
      completed,
      claimed: claimed.has(`${mission.key}:${periodKey}`),
      pendiente: false
    };
  };
  // Una cumplida de antes que espera a que se cobre (api/_misiones.js):
  // se enseña ella, con su fecha, en lugar de la de ahora.
  const mapQueEspera = ({ mision, periodo }) => ({
    ...mision,
    periodKey: periodo,
    value: mision.target,
    completed: true,
    claimed: false,
    pendiente: true
  });

  return res.status(200).json({
    success: true,
    today: { date: metricas.hoy, mission: diariaQueEspera ? mapQueEspera(diariaQueEspera) : mapMission(daily, metricas.hoy) },
    week: { start: metricas.semana, mission: semanalQueEspera ? mapQueEspera(semanalQueEspera) : mapMission(weekly, metricas.semana) },
    streak: metricas.streak,
    global: {
      key: global.challenge_key,
      value: progresoGlobal[0]?.valor || 0,
      target: Number(global.target_value),
      rewardXp: Number(global.reward_xp),
      rewardCoins: Number(global.reward_coins),
      endsAt: global.ends_at
    },
    user: metricas.user
  });
}

// Aquí vivía checkin(), el botón "Registrar mi día". Desde el 25/09/2026
// la racha se cuenta sola al jugar (api/_racha.js), y el botón se quitó.

async function reclamar(req, res, auth) {
  const body = req.body || {};
  const missionKey = String(body.missionKey || "");
  const periodKey = String(body.periodKey || "");
  const tipo = body.tipo === "weekly" ? "weekly" : "daily";
  const actual = tipo === "weekly" ? semanaActual() : fechaLocalAR();

  // La que está a la vista: una cumplida de antes que espera a que se
  // cobre, si la hay (api/_misiones.js); si no, la de hoy o la de esta
  // semana.
  const queEspera = await pendienteSinCobrar(sql, auth.sub, tipo, actual);
  const mission = queEspera ? queEspera.mision : (tipo === "weekly" ? pickWeekly(actual) : pickDaily(actual));
  const esperado = queEspera ? queEspera.periodo : actual;

  if (!missionKey || missionKey !== mission.key || periodKey !== esperado) {
    // La que se acaba de cobrar, pedida otra vez (dos clics, dos
    // pestañas): como con la de hoy, se dice que ya estaba cobrada.
    const cobrada = missionKey ? await sql`
      SELECT 1 FROM player_mission_claims
      WHERE user_id = ${auth.sub} AND mission_key = ${missionKey} AND period_key = ${periodKey}
      LIMIT 1;
    ` : [];
    if (cobrada.length) return res.status(200).json({ success: true, alreadyClaimed: true });
    return res.status(400).json({ success: false, error: "Misión no válida para este período" });
  }

  // La que espera ya se cumplió: tiene su fila. La de ahora se mide.
  const metricas = await obtenerMetricas(auth.sub);
  const value = Number(metricas[mission.metric] || 0);
  if (!queEspera && value < mission.target) {
    return res.status(400).json({ success: false, error: "Todavía no completaste la misión" });
  }

  const existe = await sql`SELECT 1 FROM users WHERE id = ${auth.sub} LIMIT 1;`;
  if (!existe.length) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  // Apuntar el cobro y pagarlo van juntos o no va ninguno
  // (sql.transaccion, en api/_pg.js). Eran dos pasos sueltos: si el pago
  // fallaba, la misión quedaba cobrada y sin recompensa. El FOR UPDATE
  // hace que el nivel y el XP que se leen no cambien por debajo hasta
  // que se escriben.
  const pago = await sql.transaccion(async (tx) => {
    const creada = await tx`
      INSERT INTO player_mission_claims (user_id, mission_key, period_key, reward_xp, reward_coins)
      VALUES (${auth.sub}, ${mission.key}, ${esperado}, ${mission.xp}, ${mission.coins})
      ON CONFLICT (user_id, mission_key, period_key) DO NOTHING
      RETURNING id;
    `;
    if (!creada.length) return null;   // ya estaba cobrada

    const filas = await tx`SELECT level, xp FROM users WHERE id = ${auth.sub} FOR UPDATE;`;

    // Aplicamos XP + monedas en la misma actualización lógica.
    // El cálculo de nivel sigue la misma idea que /api/users?action=xp,
    // pero en bucle: las recompensas de misión (hasta 400 XP de una
    // sola vez) pueden superar de sobra el umbral de más de un nivel,
    // algo que no pasa con el pulso normal (siempre +10). Si se subiera
    // un solo nivel y se descartara el resto como hacía el pulso normal,
    // el sobrante de XP se perdería en vez de acreditarse. Acá se sube
    // de a un nivel por vez, restando el umbral en lugar de resetear a
    // 0, hasta que el XP que queda ya no alcance para el siguiente nivel.
    let level = Math.max(1, Number(filas[0].level) || 1);
    let xp = Math.max(0, Number(filas[0].xp) || 0) + Number(mission.xp);
    let subioNivel = false;

    while (xp >= xpNecesaria(level)) {
      xp -= xpNecesaria(level);
      level += 1;
      subioNivel = true;
    }

    const actualizado = await tx`
      UPDATE users
      SET level = ${level},
          xp = ${xp},
          monedas = COALESCE(monedas, 0) + ${mission.coins}
      WHERE id = ${auth.sub}
      RETURNING username, level, xp, monedas, rank_actual, ranking_puntuacion;
    `;
    return { subioNivel, user: actualizado[0] || null };
  });

  if (!pago) {
    return res.status(200).json({ success: true, alreadyClaimed: true });
  }

  // Cobrada la que esperaba, aparece la de ahora, y lo jugado hoy (o esta
  // semana) cuenta aunque no estuviera a la vista. Si ya está cumplida,
  // se apunta y se avisa aquí, para que también espere: si no, se
  // perdería al cambiar de día sin haber jugado otro minuto.
  if (queEspera) {
    try {
      await avisarSiSeCumplen(sql, Number(auth.sub), auth.username, metricas);
    } catch (error) {
      console.warn("MacroReborn: no se pudo mirar la misión que aparece al cobrar.", error);
    }
  }

  return res.status(200).json({
    success: true,
    alreadyClaimed: false,
    reward: { xp: mission.xp, coins: mission.coins },
    subioNivel: pago.subioNivel,
    user: pago.user
  });
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  try {
    const auth = requerirAuth(req, res);
    if (!auth) return;
    const action = String(req.query.action || "status");
    if (req.method === "GET" && action === "status") return await estado(req, res, auth);
    if (req.method === "POST" && action === "claim") return await reclamar(req, res, auth);
    return res.status(400).json({ success: false, error: "Acción no válida" });
  } catch (error) {
    console.error("/api/progreso", error);
    return res.status(500).json({ success: false, error: "No se pudo cargar el progreso" });
  }
};

// Para tests/progreso.test.js: qué mide cada misión y qué misión toca
// cada día, sin depender de la fecha en que corran las pruebas.
module.exports.paraPruebas = {
  MISIONES_DIARIAS, MISIONES_SEMANALES, pickDaily, pickWeekly, obtenerMetricas, fechaLocalAR
};
