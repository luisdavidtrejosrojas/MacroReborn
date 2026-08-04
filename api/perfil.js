const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

module.exports = async function handler(req,res){

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if(req.method === "OPTIONS"){
    return res.status(200).end();
  }

  if(req.method !== "GET"){
    return res.status(405).json({
      error:"Método no permitido"
    });
  }

  try{

    const { username } = req.query;

    const usuario = await sql`
      SELECT id, username, created_at, last_login, level, xp, status, bio, avatar
      FROM users
      WHERE username=${username}
    `;

    if(usuario.length === 0){
      return res.status(404).json({
        error:"Usuario no encontrado"
      });
    }

    res.json(usuario[0]);

  }catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};