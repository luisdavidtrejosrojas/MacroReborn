const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// /api/users
// ==============================
// Fusión de los antiguos endpoints /api/users, /api/perfil,
// /api/update-avatar, /api/update-bio, /api/heartbeat y /api/xp en un
// solo archivo, para bajar la cantidad de Serverless Functions en
// Vercel (plan Hobby: máx. 12). La lógica de cada sección es
// EXACTAMENTE la misma que tenían los archivos originales, solo
// cambia cómo se elige cuál correr.
//
// (/api/perfil quedó reemplazado hace tiempo por /api/users?username=X
// y ya no lo llamaba ningún archivo del frontend, así que no hace
// falta una acción aparte para él: su comportamiento ya está cubierto
// por la lectura de abajo.)
//
// Lecturas (GET), sin action -> se mantiene igual que el /api/users
// original para no romper nada de lo que ya lo usaba así:
//   GET /api/users            -> lista de usuarios (ranking/comunidad)
//   GET /api/users?q=texto    -> búsqueda por nombre (buscador)
//   GET /api/users?username=X -> un usuario puntual
//
// Escrituras (POST), con ?action= para elegir cuál correr:
//   POST /api/users?action=update-avatar { username, avatar }
//   POST /api/users?action=update-bio    { username, bio }
//   POST /api/users?action=heartbeat     { username }
//   POST /api/users?action=xp            { username, cantidad }
//   POST /api/users?action=suspend       { username, motivo }
//   POST /api/users?action=reactivate    { username }
//   POST /api/users?action=change-password { username, currentPassword, newPassword }
//
// (suspend/reactivate/change-password se agregaron en el cierre de la
// Fase 2: antes vivían en la clave localStorage "usuariosMacro", que
// dejó de llenarse cuando el registro/login pasaron a Neon, así que
// no tenían ningún efecto real.)
// ==============================

// XP necesaria por nivel (misma fórmula que js/motor/xp.js en el cliente).
function xpNecesaria(nivel) {
  if (nivel === 1) return 50;
  if (nivel === 2) return 100;
  return 100 + ((nivel - 2) * 200);
}

async function listarUsuarios(req, res) {
  const { q, username, limit } = req.query;
  // Tope subido de 500 a 2000: el panel de administración
  // (js/motor/permisos.js -> obtenerUsuarios()) pide la lista
  // completa de usuarios con limit=2000 para poder listarlos a todos,
  // no solo los primeros 500.
  const tope = Math.min(Number(limit) || 300, 2000);

  if (username) {
    const usuario = await sql`
      SELECT id, username, level, xp, status, bio, avatar, created_at, last_login,
             suspendido, fecha_suspension, motivo_suspension
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
      SELECT id, username, level, xp, status, bio, avatar, created_at, last_login,
             suspendido, fecha_suspension, motivo_suspension
      FROM users
      WHERE username ILIKE ${buscado}
      ORDER BY username ASC
      LIMIT ${tope};
    `;
  } else {
    usuarios = await sql`
      SELECT id, username, level, xp, status, bio, avatar, created_at, last_login,
             suspendido, fecha_suspension, motivo_suspension
      FROM users
      ORDER BY level DESC, xp DESC, username ASC
      LIMIT ${tope};
    `;
  }

  return res.status(200).json({ success: true, users: usuarios });
}

async function updateAvatar(req, res) {
  const { username, avatar } = req.body;

  const user = await sql`
    UPDATE users
    SET avatar = ${JSON.stringify(avatar)}
    WHERE username = ${username}
    RETURNING id, username, avatar;
  `;

  if (user.length === 0) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  return res.status(200).json({ success: true, user: user[0] });
}

async function updateBio(req, res) {
  const { username, bio } = req.body;

  const user = await sql`
    UPDATE users
    SET bio = ${bio}
    WHERE username = ${username}
    RETURNING id, username, bio;
  `;

  if (user.length === 0) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  return res.status(200).json({ success: true, user: user[0] });
}

async function heartbeat(req, res) {
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

  return res.status(200).json({ success: true, last_login: actualizado[0].last_login });
}

async function sumarXp(req, res) {
  const { username, cantidad } = req.body;
  const monto = Number(cantidad) || 0;

  if (!username || monto <= 0) {
    return res.status(200).json({ success: false, error: "Datos inválidos" });
  }

  const filas = await sql`SELECT id, level, xp FROM users WHERE username = ${username};`;

  if (filas.length === 0) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  let { id, level, xp } = filas[0];
  level = level || 1;
  xp = (xp || 0) + monto;

  let subioNivel = false;
  const necesario = xpNecesaria(level);

  if (xp >= necesario) {
    level += 1;
    xp = 0;
    subioNivel = true;
  }

  const actualizado = await sql`
    UPDATE users
    SET level = ${level}, xp = ${xp}
    WHERE id = ${id}
    RETURNING id, username, level, xp;
  `;

  return res.status(200).json({
    success: true,
    user: actualizado[0],
    subioNivel
  });
}

async function suspend(req, res) {
  const { username, motivo } = req.body || {};

  if (!username) {
    return res.status(400).json({ success: false, error: "Falta username" });
  }

  const usuario = await sql`
    UPDATE users
    SET suspendido = true, fecha_suspension = now(),
        motivo_suspension = ${(motivo && String(motivo).trim()) ? String(motivo).trim() : "No especificado"}
    WHERE username = ${username}
    RETURNING id, username, suspendido, fecha_suspension, motivo_suspension;
  `;

  if (usuario.length === 0) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  return res.status(200).json({ success: true, user: usuario[0] });
}

async function reactivate(req, res) {
  const { username } = req.body || {};

  if (!username) {
    return res.status(400).json({ success: false, error: "Falta username" });
  }

  const usuario = await sql`
    UPDATE users
    SET suspendido = false, fecha_suspension = NULL, motivo_suspension = NULL
    WHERE username = ${username}
    RETURNING id, username, suspendido;
  `;

  if (usuario.length === 0) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  return res.status(200).json({ success: true, user: usuario[0] });
}

async function changePassword(req, res) {
  const { username, currentPassword, newPassword } = req.body || {};

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: "Faltan datos" });
  }

  if (String(newPassword).length < 6) {
    return res.status(200).json({ success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" });
  }

  const usuarios = await sql`
    SELECT id FROM users WHERE username = ${username} AND password = ${currentPassword};
  `;

  if (usuarios.length === 0) {
    return res.status(200).json({ success: false, error: "La contraseña actual no es correcta" });
  }

  await sql`UPDATE users SET password = ${newPassword} WHERE id = ${usuarios[0].id};`;

  return res.status(200).json({ success: true });
}

module.exports = async function handler(req, res) {

  setCors(res, "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action;

  try {

    if (req.method === "GET") {
      return await listarUsuarios(req, res);
    }

    if (req.method === "POST") {
      if (action === "update-avatar") return await updateAvatar(req, res);
      if (action === "update-bio") return await updateBio(req, res);
      if (action === "heartbeat") return await heartbeat(req, res);
      if (action === "xp") return await sumarXp(req, res);
      if (action === "suspend") return await suspend(req, res);
      if (action === "reactivate") return await reactivate(req, res);
      if (action === "change-password") return await changePassword(req, res);

      return res.status(400).json({ success: false, error: "Acción inválida" });
    }

    return res.status(405).json({ success: false, error: "Método no permitido" });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
