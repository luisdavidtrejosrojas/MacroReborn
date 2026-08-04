const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// GET    /api/badges?username=X                          -> insignias del usuario
// GET    /api/badges?usernames=a,b,c                      -> insignias de varios (bulk)
// POST   /api/badges { username, badgeId, assignedBy }    -> asignar
// DELETE /api/badges { username, badgeId }                -> quitar
// ==============================
// badgeId: "administrador" | "moderador" | "colaborador" (los mismos
// ids que ya usa js/motor/insignias.js). El rol de un usuario sale de
// tener o no la insignia correspondiente, igual que hoy en
// js/motor/permisos.js — no se agrega una columna de "rol" aparte.

module.exports = async function handler(req, res) {

  setCors(res, "GET, POST, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {

    if (req.method === "GET") {
      const { username, usernames } = req.query;

      if (usernames) {
        const lista = String(usernames).split(",").map(n => n.trim()).filter(Boolean);
        if (!lista.length) {
          return res.status(200).json({ success: true, porUsuario: {} });
        }

        const filas = await sql`
          SELECT u.username, b.badge_id
          FROM badges b
          JOIN users u ON u.id = b.user_id
          WHERE u.username = ANY(${lista});
        `;

        const porUsuario = {};
        lista.forEach(n => { porUsuario[n] = []; });
        filas.forEach(f => {
          if (!porUsuario[f.username]) porUsuario[f.username] = [];
          porUsuario[f.username].push(f.badge_id);
        });

        return res.status(200).json({ success: true, porUsuario });
      }

      if (!username) {
        return res.status(400).json({ success: false, error: "Falta username" });
      }

      const filas = await sql`
        SELECT b.badge_id, b.assigned_at
        FROM badges b
        JOIN users u ON u.id = b.user_id
        WHERE u.username = ${username};
      `;

      return res.status(200).json({
        success: true,
        insignias: filas.map(f => f.badge_id),
        detalle: filas
      });
    }

    if (req.method === "POST") {
      const { username, badgeId, assignedBy } = req.body;

      if (!username || !badgeId) {
        return res.status(400).json({ success: false, error: "Datos incompletos" });
      }

      const usuarios = await sql`SELECT id FROM users WHERE username = ${username};`;
      if (!usuarios.length) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      let assignedById = null;
      if (assignedBy) {
        const admin = await sql`SELECT id FROM users WHERE username = ${assignedBy};`;
        if (admin.length) assignedById = admin[0].id;
      }

      await sql`
        INSERT INTO badges (user_id, badge_id, assigned_by)
        VALUES (${usuarios[0].id}, ${badgeId}, ${assignedById})
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { username, badgeId } = req.body || {};

      if (!username || !badgeId) {
        return res.status(400).json({ success: false, error: "Datos incompletos" });
      }

      const usuarios = await sql`SELECT id FROM users WHERE username = ${username};`;
      if (!usuarios.length) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      await sql`DELETE FROM badges WHERE user_id = ${usuarios[0].id} AND badge_id = ${badgeId};`;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Método no permitido" });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
