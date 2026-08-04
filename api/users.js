const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// GET /api/users            -> lista de usuarios (para ranking/comunidad)
// GET /api/users?q=texto    -> búsqueda por nombre de usuario (buscador)
// GET /api/users?username=X -> un usuario puntual (equivalente a /api/perfil)
// ==============================
// Reemplaza a la vieja clave localStorage "usuariosMacro", que en la
// práctica nunca se llegaba a llenar (login/registro solo hablaban con
// Neon), así que comunidad.html, ranking.html, usuario.html y el
// buscador quedaban vacíos. Con este endpoint pasan a leer siempre de
// la base real.

module.exports = async function handler(req, res) {

  setCors(res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {

    const { q, username, limit } = req.query;
    const tope = Math.min(Number(limit) || 300, 500);

    if (username) {
      const usuario = await sql`
        SELECT id, username, level, xp, status, bio, avatar, created_at, last_login
        FROM users
        WHERE username = ${username};
      `;

      if (usuario.length === 0) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      return res.status(200).json({ success: true, user: usuario[0] });
    }

    let usuarios;

    if (q && String(q).trim() !== "") {
      const buscado = "%" + String(q).trim() + "%";
      usuarios = await sql`
        SELECT id, username, level, xp, status, bio, avatar, created_at, last_login
        FROM users
        WHERE username ILIKE ${buscado}
        ORDER BY username ASC
        LIMIT ${tope};
      `;
    } else {
      usuarios = await sql`
        SELECT id, username, level, xp, status, bio, avatar, created_at, last_login
        FROM users
        ORDER BY level DESC, xp DESC, username ASC
        LIMIT ${tope};
      `;
    }

    res.status(200).json({ success: true, users: usuarios });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
