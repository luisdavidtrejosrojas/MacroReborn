const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// POST /api/heartbeat { username } -> refresca last_login = now()
// ==============================
// Lo llama automáticamente js/core.js (_latidoServidor) cada pocos
// minutos mientras haya una sesión iniciada con una pestaña abierta.
// Antes "last_login" solo se actualizaba al hacer login, así que
// alguien con la sesión abierta hace rato (sin volver a loguearse)
// terminaba viéndose "desconectado" en Comunidad aunque siguiera
// usando el sitio. Con este latido periódico, last_login se mantiene
// fresco y el cálculo de "conectado ahora" (ver js/comunidad.js) pasa
// a reflejar sesiones reales, sin importar el navegador/dispositivo.

module.exports = async function handler(req, res) {

  setCors(res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: "Falta username" });
    }

    const actualizado = await sql`
      UPDATE users
      SET last_login = now()
      WHERE username = ${username}
      RETURNING last_login;
    `;

    if (actualizado.length === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    res.status(200).json({ success: true, last_login: actualizado[0].last_login });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
