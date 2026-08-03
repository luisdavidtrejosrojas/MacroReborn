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
    return res.status(405).json({
      success: false,
      error: "Método no permitido"
    });
  }

  try {

    const { username, bio } = req.body;


    const user = await sql`
      UPDATE users
      SET bio = ${bio}
      WHERE username = ${username}
      RETURNING id, username, bio;
    `;


    if(user.length === 0){
      return res.status(404).json({
        success:false,
        error:"Usuario no encontrado"
      });
    }


    res.status(200).json({
      success:true,
      user:user[0]
    });


  } catch(error){

    res.status(500).json({
      success:false,
      error:error.message
    });

  }

};