const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

module.exports = async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { username, password } = req.body;

    if(!username || !password){
      return res.status(200).json({
        success: false,
        error: "Usuario y contraseña son obligatorios"
      });
    }

    const existente = await sql`SELECT id FROM users WHERE username = ${username};`;

    if(existente.length > 0){
      return res.status(200).json({
        success: false,
        error: "Ese nombre de usuario ya existe"
      });
    }

    const user = await sql`
      INSERT INTO users (username, password, level, xp, status, created_at, last_login)
      VALUES (${username}, ${password}, 1, 0, 'active', now(), now())
      RETURNING id, username, level, xp, bio, avatar, status, created_at;
    `;

    res.status(200).json({
      success: true,
      user: user[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};