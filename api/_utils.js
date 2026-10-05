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
// La cuenta de un nombre, aunque llegue con otras mayúsculas: { id,
// username } con el nombre tal como está guardado, o null.
//
// Hasta el 05/10/2026 casi todo comparaba el nombre exacto: quien
// escribía "Mateo503" no encontraba el perfil de "MATEO503", y quien
// entraba como "Jader" no podía con la cuenta "jader" y acababa
// registrando otra (punto 31 de docs/AUDITORIA.md).
//
// Primero el exacto, para que las dos parejas que ya existen y solo se
// distinguen por mayúsculas (jader/Jader, yotter/Yotter) sigan entrando
// cada una a la suya. Si no hay exacto, la única que coincida sin mirar
// mayúsculas. Si coinciden varias, ninguna: no se adivina de quién es.
async function cuentaPorNombre(sql, username) {
  if (!username) return null;
  const filas = await sql`
    SELECT id, username FROM users
    WHERE LOWER(username) = LOWER(${username})
    ORDER BY (username = ${username}) DESC
    LIMIT 2;
  `;
  if (filas.length === 0) return null;
  if (filas[0].username === username || filas.length === 1) return filas[0];
  return null;
}

async function getUserId(sql, username) {
  const cuenta = await cuentaPorNombre(sql, username);
  return cuenta ? cuenta.id : null;
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
  cuentaPorNombre,
  getUserId,
  hayBloqueoEntreUsuarios,
  usuarioBloqueaA, setCors };
