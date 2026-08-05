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

module.exports = async function handler(req, res) {

  setCors(res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action;

  try {

    if (action === "test-db") return await testDb(req, res);
    if (action === "admin-stats") return await adminStats(req, res);

    return res.status(400).json({ success: false, error: "Acción inválida" });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
