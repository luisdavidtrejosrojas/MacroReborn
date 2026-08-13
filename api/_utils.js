// ==============================
// Utilidades compartidas por las APIs
// ==============================
// Solo la usan los endpoints NUEVOS de la migración; los endpoints que
// ya funcionaban (login, register, perfil, update-bio, update-avatar)
// se dejan con su propio código para no arriesgar nada que ya andaba.

function setCors(res, metodos) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", (metodos || "GET, POST, OPTIONS"));
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
async function getUserId(sql, username) {
  if (!username) return null;
  const filas = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username});`;
  return filas.length ? filas[0].id : null;
}

async function hayBloqueoEntreUsuarios(sql, usernameA, usernameB) {
  if (!usernameA || !usernameB || usernameA.toLowerCase() === usernameB.toLowerCase()) {
    return false;
  }

  const idA = await getUserId(sql, usernameA);
  const idB = await getUserId(sql, usernameB);
  if (!idA || !idB) return false;

  const filas = await sql`
    SELECT 1
    FROM user_blocks
    WHERE (blocker_id = ${idA} AND blocked_id = ${idB})
       OR (blocker_id = ${idB} AND blocked_id = ${idA})
    LIMIT 1;
  `;
  return filas.length > 0;
}

async function usuarioBloqueaA(sql, blockerUsername, blockedUsername) {
  if (!blockerUsername || !blockedUsername || blockerUsername.toLowerCase() === blockedUsername.toLowerCase()) {
    return false;
  }

  const blockerId = await getUserId(sql, blockerUsername);
  const blockedId = await getUserId(sql, blockedUsername);
  if (!blockerId || !blockedId) return false;

  const filas = await sql`
    SELECT 1
    FROM user_blocks
    WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
    LIMIT 1;
  `;
  return filas.length > 0;
}


module.exports = {
  getUserId,
  hayBloqueoEntreUsuarios,
  usuarioBloqueaA, setCors };
