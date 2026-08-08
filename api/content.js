const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// /api/content?action=comments|likes|reports
// ==============================
// Fase 2 / Bloque 1: comentarios de perfil, likes (genérico) y
// reportes de comentarios/mensajes. Mismo criterio que api/social.js:
// un solo archivo por límite de Serverless Functions en Vercel.
//
// GET    /api/content?action=comments&username=X
// POST   /api/content?action=comments   { profileUsername, texto, authorUsername }
// DELETE /api/content?action=comments   { commentId }
//
// GET  /api/content?action=likes&targetType=comment&targetIds=1,2,3&username=X
// POST /api/content?action=likes        { targetType, itemId, username }
//
// GET    /api/content?action=chat
// POST   /api/content?action=chat        { username, texto }
// DELETE /api/content?action=chat        { messageId, username }
//
// GET    /api/content?action=notifications&username=X
// POST   /api/content?action=notifications          { username, titulo, mensaje }
// DELETE /api/content?action=notifications           { username }
// POST   /api/content?action=notifications-mark-read { username }
//
// GET  /api/content?action=activity&username=X
// POST /api/content?action=activity          { username, tipo, detalle }
// GET  /api/content?action=activity-friends&usernames=a,b,c
//
// GET  /api/content?action=favorites&username=X
// POST /api/content?action=favorites   { username, gameId }
//
// GET  /api/content?action=game-history&username=X
// POST /api/content?action=game-history   { username, gameId }
//
// GET  /api/content?action=reports
// POST /api/content?action=reports         { targetType, targetId, origen, contentUsername, contentTexto, reportedBy, motivo }
// POST /api/content?action=reports-resolve { reportId, resolution: "ignorar"|"eliminar" }
//
// GET    /api/content?action=reviews&gameId=X
// POST   /api/content?action=reviews    { username, gameId, calificacion, texto }
// DELETE /api/content?action=reviews    { username, gameId }
//
// GET  /api/content?action=game-ratings&gameId=X&username=Y
// POST /api/content?action=game-ratings { username, gameId, calificacion }
//
// GET  /api/content?action=game-votes&gameId=X&username=Y
// POST /api/content?action=game-votes   { username, gameId, voto: "like"|"dislike" }
//
// GET  /api/content?action=moderation-log&rol=X&accion=Y&texto=Z
// POST /api/content?action=moderation-log { moderatorUsername, moderatorRole, accion, usuarioAfectado, motivo }
// ==============================

async function getUserId(username) {
  if (!username) return null;
  const filas = await sql`SELECT id FROM users WHERE username = ${username};`;
  return filas.length ? filas[0].id : null;
}

// ============== COMMENTS ==============

async function comments(req, res) {

  if (req.method === "GET") {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Falta username" });
    }

    const profileId = await getUserId(username);
    if (!profileId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const filas = await sql`
      SELECT id, author_username AS usuario, texto, created_at
      FROM profile_comments
      WHERE profile_user_id = ${profileId}
      ORDER BY id DESC;
    `;

    return res.status(200).json({ success: true, comentarios: filas });
  }

  if (req.method === "POST") {
    const { profileUsername, texto, authorUsername } = req.body || {};

    if (!profileUsername || !texto || !texto.trim()) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const profileId = await getUserId(profileUsername);
    if (!profileId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const nombreAutor = (authorUsername && authorUsername.trim()) ? authorUsername.trim() : "Usuario";
    const authorId = await getUserId(nombreAutor);

    const filas = await sql`
      INSERT INTO profile_comments (profile_user_id, author_user_id, author_username, texto)
      VALUES (${profileId}, ${authorId}, ${nombreAutor}, ${texto.trim()})
      RETURNING id, author_username AS usuario, texto, created_at;
    `;

    return res.status(200).json({ success: true, comentario: filas[0] });
  }

  if (req.method === "DELETE") {
    const { commentId } = req.body || {};
    if (!commentId) {
      return res.status(400).json({ success: false, error: "Falta commentId" });
    }

    await sql`DELETE FROM profile_comments WHERE id = ${commentId};`;

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== LIKES ==============

async function likes(req, res) {

  if (req.method === "GET") {
    const { targetType, targetIds, username } = req.query;

    if (!targetType || !targetIds) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const ids = String(targetIds).split(",").map(s => s.trim()).filter(Boolean);
    if (!ids.length) {
      return res.status(200).json({ success: true, counts: {}, likedByMe: [] });
    }

    const filas = await sql`
      SELECT target_id, COUNT(*)::int AS cantidad
      FROM likes
      WHERE target_type = ${targetType} AND target_id = ANY(${ids})
      GROUP BY target_id;
    `;

    const counts = {};
    filas.forEach(f => { counts[f.target_id] = f.cantidad; });

    let likedByMe = [];
    if (username) {
      const propios = await sql`
        SELECT target_id FROM likes
        WHERE target_type = ${targetType} AND target_id = ANY(${ids}) AND username = ${username};
      `;
      likedByMe = propios.map(f => f.target_id);
    }

    return res.status(200).json({ success: true, counts, likedByMe });
  }

  if (req.method === "POST") {
    const { targetType, itemId, username } = req.body || {};

    if (!targetType || itemId === undefined || itemId === null || !username) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const targetId = String(itemId);

    const existente = await sql`
      SELECT id FROM likes
      WHERE target_type = ${targetType} AND target_id = ${targetId} AND username = ${username};
    `;

    let liked;
    if (existente.length) {
      await sql`DELETE FROM likes WHERE id = ${existente[0].id};`;
      liked = false;
    } else {
      await sql`
        INSERT INTO likes (target_type, target_id, username)
        VALUES (${targetType}, ${targetId}, ${username})
        ON CONFLICT (target_type, target_id, username) DO NOTHING;
      `;
      liked = true;
    }

    const cantidad = await sql`
      SELECT COUNT(*)::int AS cantidad FROM likes
      WHERE target_type = ${targetType} AND target_id = ${targetId};
    `;

    return res.status(200).json({ success: true, liked, count: cantidad[0].cantidad });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== CHAT ==============

async function chat(req, res) {

  if (req.method === "GET") {
    // Se traen los 200 mensajes más recientes (subconsulta ORDER BY id
    // DESC), pero se devuelven en orden ascendente (más viejo primero,
    // más nuevo al final) para que el chat general los pinte de arriba
    // hacia abajo como siempre, con el mensaje más nuevo abajo del todo.
    const filas = await sql`
<<<<<<< HEAD
      SELECT id, username AS usuario, texto, created_at
      FROM chat_messages
      ORDER BY id DESC
      LIMIT 200;
=======
      SELECT * FROM (
        SELECT id, username AS usuario, texto, created_at
        FROM chat_messages
        ORDER BY id DESC
        LIMIT 200
      ) recientes
      ORDER BY id ASC;
>>>>>>> 448c333 (Chat: mensajes nuevos arriba)
    `;

    return res.status(200).json({ success: true, mensajes: filas });
  }

  if (req.method === "POST") {
    const { username, texto } = req.body || {};

    if (!username || !texto || !texto.trim()) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);

    const filas = await sql`
      INSERT INTO chat_messages (user_id, username, texto)
      VALUES (${userId}, ${username}, ${texto.trim()})
      RETURNING id, username AS usuario, texto, created_at;
    `;

    return res.status(200).json({ success: true, mensaje: filas[0] });
  }

  if (req.method === "DELETE") {
    const { messageId, username } = req.body || {};

    if (!messageId) {
      return res.status(400).json({ success: false, error: "Falta messageId" });
    }

    // Solo el autor puede borrar su propio mensaje (mismo criterio que
    // ya usaba la UI, que solo mostraba el botón "Borrar" en los
    // mensajes propios).
    if (username) {
      await sql`DELETE FROM chat_messages WHERE id = ${messageId} AND username = ${username};`;
    } else {
      await sql`DELETE FROM chat_messages WHERE id = ${messageId};`;
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== NOTIFICATIONS ==============

async function notifications(req, res) {

  if (req.method === "GET") {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Falta username" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const filas = await sql`
      SELECT id, titulo, mensaje, leida, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 100;
    `;

    return res.status(200).json({ success: true, notificaciones: filas });
  }

  if (req.method === "POST") {
    const { username, titulo, mensaje } = req.body || {};

    if (!username || !titulo) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(200).json({ success: false, error: "Usuario no encontrado" });
    }

    await sql`
      INSERT INTO notifications (user_id, titulo, mensaje)
      VALUES (${userId}, ${titulo}, ${mensaje || ""});
    `;

    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    const { username } = req.body || {};
    if (!username) {
      return res.status(400).json({ success: false, error: "Falta username" });
    }

    const userId = await getUserId(username);
    if (userId) {
      await sql`DELETE FROM notifications WHERE user_id = ${userId};`;
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

async function notificationsMarkRead(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ success: false, error: "Falta username" });
  }

  const userId = await getUserId(username);
  if (userId) {
    await sql`UPDATE notifications SET leida = true WHERE user_id = ${userId} AND leida = false;`;
  }

  return res.status(200).json({ success: true });
}

// ============== ACTIVITY ==============

async function activity(req, res) {

  if (req.method === "GET") {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Falta username" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(200).json({ success: true, actividades: [] });
    }

    const filas = await sql`
      SELECT tipo, detalle, created_at
      FROM activity_log
      WHERE user_id = ${userId}
      ORDER BY id DESC
      LIMIT 20;
    `;

    return res.status(200).json({ success: true, actividades: filas });
  }

  if (req.method === "POST") {
    const { username, tipo, detalle } = req.body || {};

    if (!username || !tipo) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(200).json({ success: false, error: "Usuario no encontrado" });
    }

    await sql`
      INSERT INTO activity_log (user_id, tipo, detalle)
      VALUES (${userId}, ${tipo}, ${detalle || ""});
    `;

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

async function activityFriends(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const { usernames } = req.query;
  const lista = usernames ? String(usernames).split(",").map(s => s.trim()).filter(Boolean) : [];

  if (!lista.length) {
    return res.status(200).json({ success: true, actividades: [] });
  }

  const filas = await sql`
    SELECT u.username, a.tipo, a.detalle, a.created_at
    FROM activity_log a
    JOIN users u ON u.id = a.user_id
    WHERE u.username = ANY(${lista})
    ORDER BY a.id DESC
    LIMIT 20;
  `;

  return res.status(200).json({ success: true, actividades: filas });
}

// ============== FAVORITES ==============

async function favorites(req, res) {

  if (req.method === "GET") {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Falta username" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(200).json({ success: true, favoritos: [] });
    }

    const filas = await sql`SELECT game_id FROM game_favorites WHERE user_id = ${userId};`;

    return res.status(200).json({ success: true, favoritos: filas.map(f => f.game_id) });
  }

  if (req.method === "POST") {
    const { username, gameId } = req.body || {};

    if (!username || gameId === undefined || gameId === null) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const idTexto = String(gameId);

    const existente = await sql`
      SELECT id FROM game_favorites WHERE user_id = ${userId} AND game_id = ${idTexto};
    `;

    let favorito;
    if (existente.length) {
      await sql`DELETE FROM game_favorites WHERE id = ${existente[0].id};`;
      favorito = false;
    } else {
      await sql`
        INSERT INTO game_favorites (user_id, game_id) VALUES (${userId}, ${idTexto})
        ON CONFLICT (user_id, game_id) DO NOTHING;
      `;
      favorito = true;
    }

    return res.status(200).json({ success: true, favorito });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== GAME HISTORY (últimos jugados + juegos jugados para logros) ==============

async function gameHistory(req, res) {

  if (req.method === "GET") {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: "Falta username" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(200).json({ success: true, historial: [] });
    }

    const filas = await sql`
      SELECT game_id FROM game_history
      WHERE user_id = ${userId}
      ORDER BY played_at DESC
      LIMIT 5;
    `;

    return res.status(200).json({ success: true, historial: filas.map(f => f.game_id) });
  }

  if (req.method === "POST") {
    const { username, gameId } = req.body || {};

    if (!username || gameId === undefined || gameId === null) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const idTexto = String(gameId);

    // Últimos jugados: upsert, se actualiza la fecha si ya estaba.
    await sql`
      INSERT INTO game_history (user_id, game_id, played_at)
      VALUES (${userId}, ${idTexto}, now())
      ON CONFLICT (user_id, game_id) DO UPDATE SET played_at = now();
    `;

    // Juegos jugados para logros: nunca se borra, solo se agrega una
    // vez por juego distinto.
    const insertado = await sql`
      INSERT INTO games_played (user_id, game_id)
      VALUES (${userId}, ${idTexto})
      ON CONFLICT (user_id, game_id) DO NOTHING
      RETURNING id;
    `;

    const totalJuegosUnicos = await sql`
      SELECT COUNT(*)::int AS cantidad FROM games_played WHERE user_id = ${userId};
    `;

    return res.status(200).json({
      success: true,
      esNuevo: insertado.length > 0,
      juegosUnicos: totalJuegosUnicos[0].cantidad
    });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== REPORTS ==============

async function reports(req, res) {

  if (req.method === "GET") {
    const filas = await sql`
      SELECT id, target_type, target_id, origen, content_username AS usuario,
             content_texto AS texto, reported_by AS "reportadoPor", motivo,
             estado, created_at
      FROM comment_reports
      WHERE estado = 'pendiente'
      ORDER BY id DESC;
    `;

    return res.status(200).json({ success: true, reportes: filas });
  }

  if (req.method === "POST") {
    const { targetType, targetId, origen, contentUsername, contentTexto, reportedBy, motivo } = req.body || {};

    if (!targetType || !origen || !reportedBy) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    await sql`
      INSERT INTO comment_reports
        (target_type, target_id, origen, content_username, content_texto, reported_by, motivo)
      VALUES (
        ${targetType}, ${targetId !== undefined && targetId !== null ? String(targetId) : null},
        ${origen}, ${contentUsername || ""}, ${contentTexto || ""},
        ${reportedBy}, ${(motivo && motivo.trim()) ? motivo.trim() : "No especificado"}
      );
    `;

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

async function resolveReport(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const { reportId, resolution } = req.body || {};

  if (!reportId || !resolution) {
    return res.status(400).json({ success: false, error: "Datos incompletos" });
  }

  const filas = await sql`SELECT * FROM comment_reports WHERE id = ${reportId} AND estado = 'pendiente';`;
  if (!filas.length) {
    return res.status(404).json({ success: false, error: "Reporte no encontrado" });
  }

  const reporte = filas[0];

  if (resolution === "ignorar") {
    await sql`UPDATE comment_reports SET estado = 'ignorado', resolved_at = now() WHERE id = ${reportId};`;
    return res.status(200).json({ success: true, targetType: reporte.target_type, targetId: reporte.target_id });
  }

  if (resolution === "eliminar") {
    let eliminado = false;

    if (reporte.target_type === "comment" && reporte.target_id) {
      const borrado = await sql`DELETE FROM profile_comments WHERE id = ${reporte.target_id} RETURNING id;`;
      eliminado = borrado.length > 0;
    }

    if (reporte.target_type === "chat" && reporte.target_id) {
      const borrado = await sql`DELETE FROM chat_messages WHERE id = ${reporte.target_id} RETURNING id;`;
      eliminado = borrado.length > 0;
    }

    await sql`
      UPDATE comment_reports
      SET estado = ${eliminado ? "eliminado" : "eliminado_no_encontrado"},
          resolved_at = now()
      WHERE id = ${reportId};
    `;

    return res.status(200).json({
      success: true,
      eliminado,
      targetType: reporte.target_type,
      targetId: reporte.target_id,
      origen: reporte.origen,
      usuario: reporte.content_username
    });
  }

  return res.status(400).json({ success: false, error: "Resolución inválida" });
}

// ============== GAME REVIEWS (reseñas de juegos) ==============

async function reviews(req, res) {

  if (req.method === "GET") {
    const { gameId } = req.query;
    if (!gameId) {
      return res.status(400).json({ success: false, error: "Falta gameId" });
    }

    const filas = await sql`
      SELECT u.username AS usuario, r.calificacion, r.texto,
             r.created_at, r.updated_at, r.editado
      FROM game_reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.game_id = ${String(gameId)}
      ORDER BY r.updated_at DESC;
    `;

    return res.status(200).json({ success: true, resenas: filas });
  }

  if (req.method === "POST") {
    const { username, gameId, calificacion, texto } = req.body || {};

    const cal = Number(calificacion);
    const textoLimpio = (texto || "").trim();

    if (!username || gameId === undefined || gameId === null || !cal || !textoLimpio) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    if (cal < 1 || cal > 5) {
      return res.status(400).json({ success: false, error: "Calificación inválida" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const idTexto = String(gameId);

    const existente = await sql`
      SELECT id FROM game_reviews WHERE user_id = ${userId} AND game_id = ${idTexto};
    `;

    let filas;
    if (existente.length) {
      filas = await sql`
        UPDATE game_reviews
        SET calificacion = ${cal}, texto = ${textoLimpio}, updated_at = now(), editado = true
        WHERE id = ${existente[0].id}
        RETURNING calificacion, texto, created_at, updated_at, editado;
      `;
    } else {
      filas = await sql`
        INSERT INTO game_reviews (user_id, game_id, calificacion, texto)
        VALUES (${userId}, ${idTexto}, ${cal}, ${textoLimpio})
        RETURNING calificacion, texto, created_at, updated_at, editado;
      `;
    }

    return res.status(200).json({ success: true, resena: { usuario: username, ...filas[0] } });
  }

  if (req.method === "DELETE") {
    const { username, gameId } = req.body || {};

    if (!username || gameId === undefined || gameId === null) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    await sql`DELETE FROM game_reviews WHERE user_id = ${userId} AND game_id = ${String(gameId)};`;

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== GAME RATINGS (estrellas sueltas) ==============

async function gameRatings(req, res) {

  if (req.method === "GET") {
    const { gameId, username } = req.query;
    if (!gameId) {
      return res.status(400).json({ success: false, error: "Falta gameId" });
    }

    const idTexto = String(gameId);

    const agregado = await sql`
      SELECT COUNT(*)::int AS cantidad, COALESCE(AVG(calificacion), 0)::float AS promedio
      FROM game_ratings WHERE game_id = ${idTexto};
    `;

    let miCalificacion = 0;
    if (username) {
      const userId = await getUserId(username);
      if (userId) {
        const propia = await sql`
          SELECT calificacion FROM game_ratings WHERE user_id = ${userId} AND game_id = ${idTexto};
        `;
        miCalificacion = propia.length ? propia[0].calificacion : 0;
      }
    }

    return res.status(200).json({
      success: true,
      promedio: agregado[0].promedio,
      cantidad: agregado[0].cantidad,
      miCalificacion
    });
  }

  if (req.method === "POST") {
    const { username, gameId, calificacion } = req.body || {};
    const cal = Number(calificacion);

    if (!username || gameId === undefined || gameId === null || !cal || cal < 1 || cal > 5) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const idTexto = String(gameId);

    await sql`
      INSERT INTO game_ratings (user_id, game_id, calificacion)
      VALUES (${userId}, ${idTexto}, ${cal})
      ON CONFLICT (user_id, game_id) DO UPDATE SET calificacion = ${cal};
    `;

    const agregado = await sql`
      SELECT COUNT(*)::int AS cantidad, COALESCE(AVG(calificacion), 0)::float AS promedio
      FROM game_ratings WHERE game_id = ${idTexto};
    `;

    return res.status(200).json({
      success: true,
      promedio: agregado[0].promedio,
      cantidad: agregado[0].cantidad,
      miCalificacion: cal
    });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== GAME VOTES (like / dislike) ==============

async function gameVotes(req, res) {

  if (req.method === "GET") {
    const { gameId, username } = req.query;
    if (!gameId) {
      return res.status(400).json({ success: false, error: "Falta gameId" });
    }

    const idTexto = String(gameId);

    const filas = await sql`
      SELECT voto, COUNT(*)::int AS cantidad FROM game_votes
      WHERE game_id = ${idTexto} GROUP BY voto;
    `;

    let likes = 0, dislikes = 0;
    filas.forEach(f => {
      if (f.voto === "like") likes = f.cantidad;
      if (f.voto === "dislike") dislikes = f.cantidad;
    });

    let miVoto = null;
    if (username) {
      const userId = await getUserId(username);
      if (userId) {
        const propio = await sql`
          SELECT voto FROM game_votes WHERE user_id = ${userId} AND game_id = ${idTexto};
        `;
        miVoto = propio.length ? propio[0].voto : null;
      }
    }

    return res.status(200).json({ success: true, likes, dislikes, miVoto });
  }

  if (req.method === "POST") {
    const { username, gameId, voto } = req.body || {};

    if (!username || gameId === undefined || gameId === null || !["like", "dislike"].includes(voto)) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const userId = await getUserId(username);
    if (!userId) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const idTexto = String(gameId);

    const existente = await sql`
      SELECT id, voto FROM game_votes WHERE user_id = ${userId} AND game_id = ${idTexto};
    `;

    let miVoto;
    if (existente.length && existente[0].voto === voto) {
      // Mismo voto de nuevo -> se quita (toggle), igual que hacía la UI.
      await sql`DELETE FROM game_votes WHERE id = ${existente[0].id};`;
      miVoto = null;
    } else if (existente.length) {
      await sql`UPDATE game_votes SET voto = ${voto} WHERE id = ${existente[0].id};`;
      miVoto = voto;
    } else {
      await sql`INSERT INTO game_votes (user_id, game_id, voto) VALUES (${userId}, ${idTexto}, ${voto});`;
      miVoto = voto;
    }

    const filas = await sql`
      SELECT voto, COUNT(*)::int AS cantidad FROM game_votes
      WHERE game_id = ${idTexto} GROUP BY voto;
    `;

    let likes = 0, dislikes = 0;
    filas.forEach(f => {
      if (f.voto === "like") likes = f.cantidad;
      if (f.voto === "dislike") dislikes = f.cantidad;
    });

    return res.status(200).json({ success: true, likes, dislikes, miVoto });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

// ============== MODERATION LOG (historial de moderación) ==============

async function moderationLog(req, res) {

  if (req.method === "GET") {
    const { rol, accion, texto } = req.query;

    // Se arma el WHERE a mano (sql.query, con placeholders $1, $2...)
    // en vez de encadenar if/else por cada combinación de filtros.
    const condiciones = [];
    const valores = [];

    if (rol) {
      valores.push(rol);
      condiciones.push(`moderator_role = $${valores.length}`);
    }
    if (accion) {
      valores.push(accion);
      condiciones.push(`accion = $${valores.length}`);
    }
    if (texto && String(texto).trim()) {
      valores.push("%" + String(texto).trim() + "%");
      const p = `$${valores.length}`;
      condiciones.push(`(moderator_username ILIKE ${p} OR usuario_afectado ILIKE ${p} OR motivo ILIKE ${p})`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

    const filas = await sql.query(
      `SELECT id, moderator_username AS usuario, moderator_role AS rol, accion,
              usuario_afectado AS "usuarioAfectado", motivo, created_at
       FROM moderation_log ${where}
       ORDER BY id DESC LIMIT 500;`,
      valores
    );

    return res.status(200).json({ success: true, historial: filas });
  }

  if (req.method === "POST") {
    const { moderatorUsername, moderatorRole, accion, usuarioAfectado, motivo } = req.body || {};

    if (!moderatorUsername || !moderatorRole || !accion) {
      return res.status(400).json({ success: false, error: "Datos incompletos" });
    }

    const filas = await sql`
      INSERT INTO moderation_log (moderator_username, moderator_role, accion, usuario_afectado, motivo)
      VALUES (
        ${moderatorUsername}, ${moderatorRole}, ${accion},
        ${usuarioAfectado || null},
        ${(motivo && String(motivo).trim()) ? String(motivo).trim() : "No especificado"}
      )
      RETURNING id, moderator_username AS usuario, moderator_role AS rol, accion,
                usuario_afectado AS "usuarioAfectado", motivo, created_at;
    `;

    return res.status(200).json({ success: true, entrada: filas[0] });
  }

  return res.status(405).json({ success: false, error: "Método no permitido" });
}

module.exports = async function handler(req, res) {

  setCors(res, "GET, POST, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action;

  try {

    if (action === "comments") return await comments(req, res);
    if (action === "likes") return await likes(req, res);
    if (action === "chat") return await chat(req, res);
    if (action === "notifications") return await notifications(req, res);
    if (action === "notifications-mark-read") return await notificationsMarkRead(req, res);
    if (action === "activity") return await activity(req, res);
    if (action === "activity-friends") return await activityFriends(req, res);
    if (action === "favorites") return await favorites(req, res);
    if (action === "game-history") return await gameHistory(req, res);
    if (action === "reports") return await reports(req, res);
    if (action === "reports-resolve") return await resolveReport(req, res);
    if (action === "reviews") return await reviews(req, res);
    if (action === "game-ratings") return await gameRatings(req, res);
    if (action === "game-votes") return await gameVotes(req, res);
    if (action === "moderation-log") return await moderationLog(req, res);

    return res.status(400).json({ success: false, error: "Acción inválida" });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
