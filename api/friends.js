const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

async function getUserId(username) {
  if (!username) return null;
  const filas = await sql`SELECT id FROM users WHERE username = ${username};`;
  return filas.length ? filas[0].id : null;
}

async function aceptarSolicitud(requestId, fromId, toId) {
  await sql`UPDATE friend_requests SET status = 'aceptada', responded_at = now() WHERE id = ${requestId};`;
  await sql`
    INSERT INTO friendships (user_id, friend_id) VALUES (${fromId}, ${toId})
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  `;
  await sql`
    INSERT INTO friendships (user_id, friend_id) VALUES (${toId}, ${fromId})
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  `;
}

// ==============================
// GET /api/friends?username=X
//   -> { amigos, solicitudesEntrantes, solicitudesSalientes }
//
// POST /api/friends
//   { action:"request", from, to }
//   { action:"accept",  requestId }
//   { action:"reject",  requestId }
//   { action:"cancel",  requestId }
//   { action:"remove",  username, friendUsername }
// ==============================

module.exports = async function handler(req, res) {

  setCors(res, "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    if (req.method === "GET") {

      const { username } = req.query;
      if (!username) {
        return res.status(400).json({ success: false, error: "Falta username" });
      }

      const userId = await getUserId(username);
      if (!userId) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      const amigos = await sql`
        SELECT u.username, u.level, u.xp, u.avatar
        FROM friendships f
        JOIN users u ON u.id = f.friend_id
        WHERE f.user_id = ${userId}
        ORDER BY u.username ASC;
      `;

      const solicitudesEntrantes = await sql`
        SELECT fr.id, u.username AS de, fr.created_at
        FROM friend_requests fr
        JOIN users u ON u.id = fr.from_user_id
        WHERE fr.to_user_id = ${userId} AND fr.status = 'pendiente'
        ORDER BY fr.created_at DESC;
      `;

      const solicitudesSalientes = await sql`
        SELECT fr.id, u.username AS para, fr.created_at
        FROM friend_requests fr
        JOIN users u ON u.id = fr.to_user_id
        WHERE fr.from_user_id = ${userId} AND fr.status = 'pendiente'
        ORDER BY fr.created_at DESC;
      `;

      return res.status(200).json({
        success: true,
        amigos,
        solicitudesEntrantes,
        solicitudesSalientes
      });
    }

    if (req.method === "POST") {

      const { action } = req.body || {};

      if (action === "request") {
        const { from, to } = req.body;
        const fromId = await getUserId(from);
        const toId = await getUserId(to);

        if (!fromId || !toId) {
          return res.status(404).json({ success: false, error: "Usuario no encontrado" });
        }
        if (fromId === toId) {
          return res.status(200).json({ success: false, error: "No podés agregarte a vos mismo" });
        }

        const yaAmigos = await sql`
          SELECT 1 FROM friendships WHERE user_id = ${fromId} AND friend_id = ${toId};
        `;
        if (yaAmigos.length) {
          return res.status(200).json({ success: false, error: "Ya son amigos" });
        }

        // Si el otro ya te había mandado una solicitud, se acepta directo
        // en vez de dejar dos solicitudes cruzadas pendientes.
        const inversa = await sql`
          SELECT id FROM friend_requests
          WHERE from_user_id = ${toId} AND to_user_id = ${fromId} AND status = 'pendiente';
        `;

        if (inversa.length) {
          await aceptarSolicitud(inversa[0].id, toId, fromId);
          return res.status(200).json({ success: true, aceptadaAutomaticamente: true });
        }

        await sql`
          INSERT INTO friend_requests (from_user_id, to_user_id, status)
          VALUES (${fromId}, ${toId}, 'pendiente')
          ON CONFLICT (from_user_id, to_user_id) WHERE status = 'pendiente' DO NOTHING;
        `;

        return res.status(200).json({ success: true });
      }

      if (action === "accept" || action === "reject") {
        const { requestId } = req.body;

        const filas = await sql`
          SELECT * FROM friend_requests WHERE id = ${requestId} AND status = 'pendiente';
        `;

        if (!filas.length) {
          return res.status(404).json({ success: false, error: "Solicitud no encontrada" });
        }

        const solicitud = filas[0];

        if (action === "reject") {
          await sql`UPDATE friend_requests SET status = 'rechazada', responded_at = now() WHERE id = ${requestId};`;
          return res.status(200).json({ success: true });
        }

        await aceptarSolicitud(requestId, solicitud.from_user_id, solicitud.to_user_id);
        return res.status(200).json({ success: true });
      }

      if (action === "cancel") {
        const { requestId } = req.body;
        await sql`
          UPDATE friend_requests SET status = 'cancelada', responded_at = now()
          WHERE id = ${requestId} AND status = 'pendiente';
        `;
        return res.status(200).json({ success: true });
      }

      if (action === "remove") {
        const { username, friendUsername } = req.body;
        const userId = await getUserId(username);
        const friendId = await getUserId(friendUsername);

        if (!userId || !friendId) {
          return res.status(404).json({ success: false, error: "Usuario no encontrado" });
        }

        await sql`DELETE FROM friendships WHERE user_id = ${userId} AND friend_id = ${friendId};`;
        await sql`DELETE FROM friendships WHERE user_id = ${friendId} AND friend_id = ${userId};`;

        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ success: false, error: "Acción inválida" });
    }

    return res.status(405).json({ success: false, error: "Método no permitido" });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
