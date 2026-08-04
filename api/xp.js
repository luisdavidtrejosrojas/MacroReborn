const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// XP NECESARIA POR NIVEL
// ==============================
// Misma fórmula que hoy usa js/motor/xp.js en el cliente, para que el
// comportamiento no cambie al migrar.

function xpNecesaria(nivel) {
  if (nivel === 1) return 50;
  if (nivel === 2) return 100;
  return 100 + ((nivel - 2) * 200);
}

// POST /api/xp  { username, cantidad }
// Suma "cantidad" de XP al usuario. Si llega (o supera) el umbral del
// nivel actual, sube de nivel y reinicia el XP a 0 (igual que el
// motor original). Devuelve el usuario actualizado y si subió de nivel,
// para que el cliente pueda seguir mostrando el toast / desbloquear
// logros de nivel sin duplicar la lógica de cálculo.

module.exports = async function handler(req, res) {

  setCors(res, "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {

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

    res.status(200).json({
      success: true,
      user: actualizado[0],
      subioNivel
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
