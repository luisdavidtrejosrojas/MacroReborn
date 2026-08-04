const { neon } = require("@neondatabase/serverless");
const { setCors } = require("./_utils");

const sql = neon(process.env.DATABASE_URL);

// ==============================
// /api/system?action=test-db
// ==============================
// Antes era /api/test-db. Se mantiene como diagnóstico manual (no lo
// llama ningún archivo del frontend) para poder chequear la conexión
// a Neon a mano visitando /api/system?action=test-db.
// ==============================

async function testDb(req, res) {
  const result = await sql`SELECT NOW()`;
  return res.status(200).json({
    success: true,
    time: result[0].now
  });
}

module.exports = async function handler(req, res) {

  setCors(res, "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action;

  try {

    if (action === "test-db") return await testDb(req, res);

    return res.status(400).json({ success: false, error: "Acción inválida" });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
