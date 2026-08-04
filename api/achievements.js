const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// GET  /api/achievements?username=X                  -> lista de logros desbloqueados
// GET  /api/achievements?usernames=a,b,c              -> logros de varios (bulk)
// POST /api/achievements { username, achievementId }  -> desbloquear (idempotente)
// ==============================
// El catálogo de logros (nombre, ícono, puntos) sigue viviendo en
// js/motor/logros.js tal cual está; acá solo se guarda QUÉ logros tiene
// cada usuario y CUÁNDO los desbloqueó.

module.exports = async function handler(req, res) {

  setCors(res, "GET, POST, OPTIONS");

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
          SELECT u.username, a.achievement_id, a.unlocked_at
          FROM achievements a
          JOIN users u ON u.id = a.user_id
          WHERE u.username = ANY(${lista});
        `;

        const porUsuario = {};
        lista.forEach(n => { porUsuario[n] = []; });
        filas.forEach(f => {
          if (!porUsuario[f.username]) porUsuario[f.username] = [];
          porUsuario[f.username].push({ achievement_id: f.achievement_id, unlocked_at: f.unlocked_at });
        });

        return res.status(200).json({ success: true, porUsuario });
      }

      if (!username) {
        return res.status(400).json({ success: false, error: "Falta username" });
      }

      const filas = await sql`
        SELECT a.achievement_id, a.unlocked_at
        FROM achievements a
        JOIN users u ON u.id = a.user_id
        WHERE u.username = ${username}
        ORDER BY a.unlocked_at ASC;
      `;

      return res.status(200).json({ success: true, logros: filas });
    }

    if (req.method === "POST") {
      const { username, achievementId } = req.body;

      if (!username || !achievementId) {
        return res.status(400).json({ success: false, error: "Datos incompletos" });
      }

      const usuarios = await sql`SELECT id FROM users WHERE username = ${username};`;
      if (!usuarios.length) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      const yaExiste = await sql`
        SELECT 1 FROM achievements WHERE user_id = ${usuarios[0].id} AND achievement_id = ${achievementId};
      `;

      if (yaExiste.length) {
        return res.status(200).json({ success: true, nuevo: false });
      }

      await sql`
        INSERT INTO achievements (user_id, achievement_id)
        VALUES (${usuarios[0].id}, ${achievementId})
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
      `;

      return res.status(200).json({ success: true, nuevo: true });
    }

    return res.status(405).json({ success: false, error: "Método no permitido" });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
