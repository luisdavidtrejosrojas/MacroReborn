const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// POST /api/delete-account { username, password } -> elimina la cuenta
// ==============================
// Antes de la migración a Neon, "eliminar cuenta" (js/perfil-eliminar-
// cuenta.js) comparaba la contraseña ingresada contra
// usuarioActivo.password, guardado en localStorage. Pero /api/login ya
// NO devuelve la contraseña al cliente (por seguridad, con buen
// criterio), así que ese campo siempre llegaba "undefined" y la
// comparación fallaba siempre -> "Contraseña incorrecta" aunque fuera
// la correcta. Este endpoint mueve esa validación al servidor, contra
// la base real.
//
// Si la contraseña coincide, se borra la fila de "users". Gracias a
// las FK "ON DELETE CASCADE" de la migración de Fase 1
// (migrations/001_fase1.sql), esto borra en cascada, automáticamente:
//   - achievements  (logros del usuario)
//   - badges        (insignias asignadas al usuario)
//   - friend_requests (solicitudes enviadas o recibidas)
//   - friendships   (amistades en cualquiera de las dos direcciones)
// Lo que todavía vive solo en localStorage (bio/avatar YA viven en la
// fila de "users" y se borran con ella; comentarios, favoritos,
// historial, notificaciones, likes, etc. siguen en localStorage) lo
// sigue limpiando el frontend después de que este endpoint confirme
// el borrado (ver js/perfil-eliminar-cuenta.js).

module.exports = async function handler(req, res) {

  setCors(res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "Faltan datos" });
    }

    const usuarios = await sql`
      SELECT id FROM users
      WHERE username = ${username}
      AND password = ${password};
    `;

    if (usuarios.length === 0) {
      return res.status(200).json({ success: false, error: "Contraseña incorrecta" });
    }

    await sql`DELETE FROM users WHERE id = ${usuarios[0].id};`;

    return res.status(200).json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
