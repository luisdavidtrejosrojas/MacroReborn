const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// /api/system?action=test-db
// ==============================
// Antes era /api/test-db. Se mantiene como diagnóstico manual (no lo
// llama ningún archivo del frontend) para poder chequear la conexión
// a Neon a mano visitando /api/system?action=test-db.
// ==============================

async function testDb(req, res) {
  const result = await sql`SELECT NOW()`;
  return res.status(200).json({
    success: true,
    time: result[0].now
  });
}

// ==============================
// /api/system?action=admin-stats
// ==============================
// Agregados para el panel de administración (pestaña Estadísticas,
// admin.html). Antes se calculaban recorriendo un montón de claves de
// localStorage (juegosJugados_<nombre>, favoritos_<nombre>,
// chatGeneral, amigos_<nombre>, reportesComentarios, logros_<nombre>,
// usuariosMacro) que dejaron de llenarse cuando esos sistemas pasaron
// a Neon, así que el panel siempre mostraba todo en cero. Ahora se
// calcula todo con SQL, del lado del servidor.
//
// "juegos.totalDisponibles" y las etiquetas (nombre/ícono) de juegos,
// logros e insignias NO viajan acá: esos catálogos viven en archivos
// JS del sitio (js/datos-juegos.js, js/motor/logros.js,
// js/motor/insignias.js), no en la base. El endpoint devuelve
// gameId/achievementId/badgeId "en crudo" y js/motor/panelEstadisticas.js
// los traduce con esos catálogos, que ya están cargados en admin.html.
// ==============================

async function adminStats(req, res) {

  const [
    usuariosTotal,
    usuariosSuspendidos,
    usuariosActivos7dias,
    usuariosNuevos30dias,
    usuariosConectadosAhora,
    rolesFilas,
    comentariosTotal,
    mensajesChatTotal,
    amistadesTotal,
    reportesPendientes,
    reportesTotales,
    juegosMasJugados,
    juegosFavoritos,
    topNivel,
    topXP,
    logrosTop,
    insigniasTop
  ] = await Promise.all([

    sql`SELECT COUNT(*)::int AS n FROM users;`,
    sql`SELECT COUNT(*)::int AS n FROM users WHERE suspendido = true;`,
    sql`SELECT COUNT(*)::int AS n FROM users WHERE last_login > now() - interval '7 days';`,
    sql`SELECT COUNT(*)::int AS n FROM users WHERE created_at > now() - interval '30 days';`,
    sql`SELECT COUNT(*)::int AS n FROM users WHERE last_login > now() - interval '5 minutes';`,

    sql`SELECT badge_id, COUNT(*)::int AS n FROM badges WHERE badge_id IN ('administrador','moderador','colaborador') GROUP BY badge_id;`,

    sql`SELECT COUNT(*)::int AS n FROM profile_comments;`,
    sql`SELECT COUNT(*)::int AS n FROM chat_messages;`,
    sql`SELECT (COUNT(*) / 2)::int AS n FROM friendships;`,

    sql`SELECT COUNT(*)::int AS n FROM comment_reports WHERE estado = 'pendiente';`,
    sql`SELECT COUNT(*)::int AS n FROM comment_reports;`,

    sql`SELECT game_id, COUNT(*)::int AS cantidad FROM games_played GROUP BY game_id ORDER BY cantidad DESC LIMIT 5;`,
    sql`SELECT game_id, COUNT(*)::int AS cantidad FROM game_favorites GROUP BY game_id ORDER BY cantidad DESC LIMIT 5;`,

    sql`SELECT username, level FROM users ORDER BY level DESC, xp DESC LIMIT 5;`,
    sql`SELECT username, xp FROM users ORDER BY xp DESC LIMIT 5;`,

    sql`SELECT achievement_id, COUNT(*)::int AS cantidad FROM achievements GROUP BY achievement_id ORDER BY cantidad DESC LIMIT 5;`,
    sql`SELECT badge_id, COUNT(*)::int AS cantidad FROM badges GROUP BY badge_id ORDER BY cantidad DESC LIMIT 5;`

  ]);

  const rolesMapa = { administrador: 0, moderador: 0, colaborador: 0 };
  rolesFilas.forEach(f => { rolesMapa[f.badge_id] = f.n; });

  return res.status(200).json({
    success: true,

    usuarios: {
      total: usuariosTotal[0].n,
      suspendidos: usuariosSuspendidos[0].n,
      activos7dias: usuariosActivos7dias[0].n,
      nuevos30dias: usuariosNuevos30dias[0].n,
      conectadosAhora: usuariosConectadosAhora[0].n
    },

    roles: {
      administradores: rolesMapa.administrador,
      moderadores: rolesMapa.moderador,
      colaboradores: rolesMapa.colaborador
    },

    juegos: {
      masJugados: juegosMasJugados,
      favoritos: juegosFavoritos
    },

    comunidad: {
      comentarios: comentariosTotal[0].n,
      mensajesChat: mensajesChatTotal[0].n,
      amigos: amistadesTotal[0].n,
      reportesPendientes: reportesPendientes[0].n,
      reportesTotales: reportesTotales[0].n
    },

    progreso: {
      topNivel: topNivel,
      topXP: topXP,
      logrosTop: logrosTop,
      insigniasTop: insigniasTop
    }

  });

}

// ==============================
// /api/system?action=recalcular-ranking
// ==============================
// Recalcula la posición de TODOS los usuarios en el ranking
// (comunidad-ranking.html y todo lo que reutiliza js/ranking.js:
// perfil.html, usuario.html, admin.html). Reemplaza el criterio
// anterior (nivel*100000 + xp + puntos de logros) por uno basado en
// cuánto jugó cada usuario, qué tan seguido y qué tan variados son
// los juegos que jugó.
//
// Se dispara SOLO una vez por semana, todos los lunes a las 5:00
// (hora Argentina = 8:00 UTC), vía Vercel Cron (ver vercel.json).
// No hay ningún otro lugar del código que la llame ni que recalcule
// el ranking mientras tanto: entre lunes y lunes las posiciones
// quedan fijas a propósito.
//
// Protegida con CRON_SECRET (variable de entorno a crear en Vercel):
// Vercel manda automáticamente el header
// "Authorization: Bearer <CRON_SECRET>" en cada ejecución de cron, así
// que si no coincide se rechaza. Si no se configura CRON_SECRET en el
// proyecto, por seguridad la acción queda deshabilitada (no se ejecuta
// sin protección).
//
// ---- Cómo se puntúa cada usuario ----
//
// 1) Se toma la semana recién terminada (lunes a domingo, en horario
//    argentino) de "ranking_actividad_semanal" y
//    "ranking_juegos_semanales" (ver migración
//    011_ranking_tiempo_jugado.sql; se van llenando solas mientras el
//    usuario juega, un pulso por minuto — ver api/users.js).
//
// 2) factorFrecuencia: premia haber jugado en varios días distintos
//    de la semana en vez de todo de una sentada. 1 día = factor 1.00,
//    7 días = factor 1.48 (+8% por cada día activo extra).
//
// 3) factorDiversidad: compara los juegos jugados esta semana contra
//    los jugados en las 4 semanas previas.
//      - Si son todos juegos que NO se venían jugando: factor 1.25.
//      - Si son EXACTAMENTE los mismos juegos de siempre: factor 0.75.
//    Por eso, jugar nada más que a los mismos juegos de siempre no
//    hace subir el ranking: en el mejor de los casos, sube bastante
//    menos que alguien que varía; en la práctica termina empujando la
//    puntuación hacia abajo frente a jugadores más activos/variados.
//
// 4) puntuacionSemana = minutosJugados * factorFrecuencia * factorDiversidad
//
// 5) La puntuación final no es solo la de esta semana: se mezcla con
//    la puntuación acumulada que ya tenía (60% lo que ya tenía + 40%
//    lo de esta semana). Así el ranking refleja un hábito sostenido
//    en el tiempo, no un pico de un solo lunes, y un usuario que deja
//    de jugar va cayendo semana a semana (puntuacionSemana = 0 esa
//    semana) en vez de quedar congelado en su mejor puntuación vieja.
//
// 6) Se ordena a todos por esa puntuación final (de mayor a menor) y
//    se guarda: rank_anterior = la posición que tenían, rank_actual =
//    la posición nueva, rank_actualizado_at = ahora. Esto es lo mismo
//    que ya usaba comunidad-ranking.html para mostrar "+2 / -1" junto
//    a cada jugador (js/comunidad-ranking.js -> rkDeltaHTML()), solo
//    que ahora se recalcula acá en vez de "sola" cada ~20hs.
// ==============================

const DIAS_POR_SEMANA = 7;
const PASO_FRECUENCIA = 0.08;          // cada día activo extra suma 8%
const BONUS_DIVERSIDAD_MAX = 1.25;     // 0% de juegos repetidos
const PENALIZACION_DIVERSIDAD_MAX = 0.75; // 100% de juegos repetidos
const PESO_PUNTUACION_ANTERIOR = 0.6;
const PESO_PUNTUACION_SEMANA = 0.4;

async function recalcularRanking(req, res) {

  const secreto = process.env.CRON_SECRET;

  if (!secreto) {
    return res.status(503).json({
      success: false,
      error: "Falta configurar CRON_SECRET en las variables de entorno del proyecto."
    });
  }

  if (req.headers["authorization"] !== `Bearer ${secreto}`) {
    return res.status(401).json({ success: false, error: "No autorizado" });
  }

  // Semana recién terminada (el lunes anterior al lunes de hoy),
  // calculada en horario argentino para que coincida con el
  // calendario real de los usuarios.
  const [{ semana }] = await sql`
    SELECT (
      date_trunc('week', (now() AT TIME ZONE 'America/Argentina/Buenos_Aires'))
      - interval '7 days'
    )::date AS semana;
  `;

  const [
    actividadSemana,
    juegosSemana,
    juegosHistorial,
    usuarios
  ] = await Promise.all([

    sql`
      SELECT user_id, minutos_jugados, dias_activos
      FROM ranking_actividad_semanal
      WHERE semana = ${semana};
    `,

    sql`
      SELECT user_id, game_id
      FROM ranking_juegos_semanales
      WHERE semana = ${semana};
    `,

    // Juegos distintos jugados en las 4 semanas ANTERIORES a la que
    // se está puntuando (no incluye la semana actual).
    sql`
      SELECT DISTINCT user_id, game_id
      FROM ranking_juegos_semanales
      WHERE semana < ${semana}
        AND semana >= (${semana}::date - INTERVAL '28 days');
    `,

    sql`SELECT id, rank_actual, ranking_puntuacion FROM users;`

  ]);

  if (usuarios.length === 0) {
    return res.status(200).json({ success: true, semana, usuariosActualizados: 0 });
  }

  const actividadPorUsuario = new Map();
  actividadSemana.forEach(fila => actividadPorUsuario.set(fila.user_id, fila));

  const juegosEstaSemanaPorUsuario = new Map();
  juegosSemana.forEach(fila => {
    if (!juegosEstaSemanaPorUsuario.has(fila.user_id)) {
      juegosEstaSemanaPorUsuario.set(fila.user_id, new Set());
    }
    juegosEstaSemanaPorUsuario.get(fila.user_id).add(fila.game_id);
  });

  const juegosHistorialPorUsuario = new Map();
  juegosHistorial.forEach(fila => {
    if (!juegosHistorialPorUsuario.has(fila.user_id)) {
      juegosHistorialPorUsuario.set(fila.user_id, new Set());
    }
    juegosHistorialPorUsuario.get(fila.user_id).add(fila.game_id);
  });

  const resultados = usuarios.map(usuario => {

    const actividad = actividadPorUsuario.get(usuario.id);
    const minutos = actividad ? Number(actividad.minutos_jugados) || 0 : 0;
    const dias = actividad ? Math.min(Number(actividad.dias_activos) || 0, DIAS_POR_SEMANA) : 0;

    const juegosEstaSemana = juegosEstaSemanaPorUsuario.get(usuario.id) || new Set();
    const juegosPrevios = juegosHistorialPorUsuario.get(usuario.id) || new Set();

    let ratioRepeticion = 0;
    if (juegosEstaSemana.size > 0) {
      let repetidos = 0;
      juegosEstaSemana.forEach(juego => { if (juegosPrevios.has(juego)) repetidos++; });
      ratioRepeticion = repetidos / juegosEstaSemana.size;
    }

    const factorFrecuencia = dias > 0 ? 1 + ((dias - 1) * PASO_FRECUENCIA) : 0;

    const factorDiversidadCrudo = BONUS_DIVERSIDAD_MAX - (ratioRepeticion * (BONUS_DIVERSIDAD_MAX - PENALIZACION_DIVERSIDAD_MAX));
    const factorDiversidad = Math.min(BONUS_DIVERSIDAD_MAX, Math.max(PENALIZACION_DIVERSIDAD_MAX, factorDiversidadCrudo));

    const puntuacionSemana = minutos * factorFrecuencia * factorDiversidad;

    const puntuacionAnterior = Number(usuario.ranking_puntuacion) || 0;
    const puntuacionFinal = Math.round(
      ((puntuacionAnterior * PESO_PUNTUACION_ANTERIOR) + (puntuacionSemana * PESO_PUNTUACION_SEMANA)) * 100
    ) / 100;

    return {
      id: usuario.id,
      rankAnterior: usuario.rank_actual,
      puntuacionFinal,
      minutos // para desempatar posiciones iguales de puntuación
    };

  });

  resultados.sort((a, b) => {
    if (b.puntuacionFinal !== a.puntuacionFinal) return b.puntuacionFinal - a.puntuacionFinal;
    return b.minutos - a.minutos;
  });

  // Se actualiza de a un usuario por vez (cantidad de jugadores
  // acotada, no hace falta una sola query masiva — mismo criterio que
  // ya usaba el snapshot anterior).
  for (let i = 0; i < resultados.length; i++) {
    const r = resultados[i];
    await sql`
      UPDATE users
      SET rank_anterior = ${r.rankAnterior},
          rank_actual = ${i + 1},
          rank_actualizado_at = now(),
          ranking_puntuacion = ${r.puntuacionFinal}
      WHERE id = ${r.id};
    `;
  }

  return res.status(200).json({
    success: true,
    semana,
    usuariosActualizados: resultados.length
  });

}

module.exports = async function handler(req, res) {

  setCors(res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action;

  try {

    if (action === "test-db") return await testDb(req, res);
    if (action === "admin-stats") return await adminStats(req, res);
    if (action === "recalcular-ranking") return await recalcularRanking(req, res);

    return res.status(400).json({ success: false, error: "Acción inválida" });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
