const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// /api/auth?action=login|register|delete-account
// ==============================
// Fusión de los antiguos endpoints /api/login, /api/register y
// /api/delete-account en un solo archivo, para bajar la cantidad de
// Serverless Functions en Vercel (plan Hobby: máx. 12). La lógica de
// cada acción es EXACTAMENTE la misma que tenían los archivos
// originales, solo cambia cómo se elige cuál correr.
//
// POST /api/auth?action=login           { username, password }
// POST /api/auth?action=register        { username, password }
// POST /api/auth?action=delete-account  { username, password }
// ==============================

async function login(req, res) {
  const { username, password } = req.body;

  const usuarios = await sql`
    SELECT id, username, level, xp, created_at, bio, avatar, status
    FROM users
    WHERE username = ${username}
    AND password = ${password};
  `;

  if (usuarios.length === 0) {
    return res.status(200).json({
      success: false,
      error: "Usuario o contraseña incorrectos"
    });
  }

  const actualizado = await sql`
    UPDATE users
    SET last_login = now()
    WHERE id = ${usuarios[0].id}
    RETURNING last_login;
  `;

  return res.status(200).json({
    success: true,
    user: { ...usuarios[0], last_login: actualizado[0].last_login }
  });
}

async function register(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(200).json({
      success: false,
      error: "Usuario y contraseña son obligatorios"
    });
  }

  const existente = await sql`SELECT id FROM users WHERE username = ${username};`;

  if (existente.length > 0) {
    return res.status(200).json({
      success: false,
      error: "Ese nombre de usuario ya existe"
    });
  }

  // FIX: last_login arrancaba en now() al registrarse, como si la
  // persona ya hubiera iniciado sesión. Eso hacía que un usuario recién
  // registrado (que todavía nunca inició sesión) apareciera "En línea"
  // en Comunidad y con "Última conexión" reciente en su perfil. Queda
  // en NULL hasta el primer login real (login() más arriba sí lo
  // actualiza a now()). Se agrega también a RETURNING para que el
  // frontend (perfil.js) pueda leerlo igual que hace con el de login.
  const user = await sql`
    INSERT INTO users (username, password, level, xp, status, created_at, last_login)
    VALUES (${username}, ${password}, 1, 0, 'active', now(), NULL)
    RETURNING id, username, level, xp, bio, avatar, status, created_at, last_login;
  `;

  return res.status(200).json({
    success: true,
    user: user[0]
  });
}

async function deleteAccount(req, res) {
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

  // Gracias a las FK "ON DELETE CASCADE" de migrations/001_fase1.sql,
  // migrations/002_fase2_comentarios_likes_reportes.sql,
  // migrations/003_fase2_chat.sql, migrations/004_fase2_notificaciones_actividad.sql,
  // migrations/005_fase2_favoritos_historial.sql y
  // migrations/006_fase2_resenas_moderacion.sql, esto borra en
  // cascada: achievements, badges, friend_requests, friendships,
  // profile_comments, chat_messages, notifications, activity_log,
  // game_favorites, game_history, games_played, game_reviews,
  // game_ratings y game_votes del usuario.
  // "likes" y "moderation_log" no tienen FK (guardan el username tal
  // cual, igual que "comment_reports"), así que "likes" se limpia a
  // mano acá. "moderation_log" queda intacto a propósito: es un
  // historial de auditoría y debe sobrevivir aunque se borre la cuenta
  // del moderador o del usuario afectado.
  await sql`DELETE FROM likes WHERE username = ${username};`;

  await sql`DELETE FROM users WHERE id = ${usuarios[0].id};`;

  return res.status(200).json({ success: true });
}

module.exports = async function handler(req, res) {

  setCors(res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const action = req.query.action;

  try {

    if (action === "login") return await login(req, res);
    if (action === "register") return await register(req, res);
    if (action === "delete-account") return await deleteAccount(req, res);

    return res.status(400).json({ success: false, error: "Acción inválida" });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
