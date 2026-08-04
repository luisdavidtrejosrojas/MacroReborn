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

module.exports = { setCors };
