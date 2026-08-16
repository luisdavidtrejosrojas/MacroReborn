// ==============================
// BACKFILL DE CONTRASEÑAS — scripts/migrar-passwords.js
// ==============================
// Recorre TODOS los usuarios que todavía tienen su contraseña en
// TEXTO PLANO (users.password) y la pica con bcrypt: guarda el hash en
// users.password_hash y borra el texto plano. Así no queda ni un solo
// password en claro en la base.
//
// La migración "perezosa" (en el login) ya se ocupa de los usuarios
// que entran; este script se ocupa del RESTO, para que no queden
// huecos si alguien nunca vuelve a entrar.
//
// Uso:
//   Contra la base REAL (producción):
//     DATABASE_URL="postgres://..." node scripts/migrar-passwords.js
//
//   Contra la base LOCAL (maqueta PGlite, crea usuarios de prueba):
//     node scripts/migrar-passwords.js --local
//
// Seguro de correr varias veces: los usuarios ya migrados (password
// NULL o password_hash lleno) se ignoran.

const { hashContrasena } = require("../api/_password");

async function main() {

  const esLocal = process.argv.includes("--local");

  let sql;

  if (esLocal) {
    // Modo local: maqueta PGlite con un par de usuarios "legacy" de
    // prueba, para poder ver el backfill funcionando sin riesgo.
    const { crearBaseLocal, crearSqlPGlite } = require("./pglite");
    const db = await crearBaseLocal();

    const demo = [
      ["veterano1", "clave-uno"],
      ["veterano2", "clave-dos"]
    ];
    for (const [usuario, clave] of demo) {
      await db.query(
        `INSERT INTO users (username, password, level, xp, status, created_at, last_login)
         VALUES ($1, $2, 1, 0, 'active', now(), now())
         ON CONFLICT (username) DO NOTHING`,
        [usuario, clave]
      );
    }

    sql = crearSqlPGlite(db);
  } else {
    if (!process.env.DATABASE_URL) {
      console.error("Falta DATABASE_URL. Usá: DATABASE_URL=\"...\" node scripts/migrar-passwords.js  (o agregá --local para probar en la maqueta local)");
      process.exit(1);
    }
    const { obtenerSql } = require("../api/_db");
    sql = obtenerSql();
  }

  // Todos los usuarios que todavía tienen texto plano.
  const pendientes = await sql`
    SELECT id, username, password
    FROM users
    WHERE password IS NOT NULL AND password_hash IS NULL
    ORDER BY id;
  `;

  console.log(`Encontrados ${pendientes.length} usuario(s) con contraseña en texto plano.`);

  let migrados = 0;

  for (const usuario of pendientes) {
    if (!usuario.password) continue; // defensivo: vacío no se pica

    const hash = await hashContrasena(usuario.password);

    await sql`
      UPDATE users
      SET password_hash = ${hash}, password = NULL
      WHERE id = ${usuario.id};
    `;

    migrados++;
    console.log(`  ✔ ${usuario.username} -> migrado`);
  }

  const restantes = await sql`
    SELECT COUNT(*)::int AS cantidad
    FROM users
    WHERE password IS NOT NULL;
  `;

  console.log(`\nListo: ${migrados} migrado(s). Quedan ${restantes[0].cantidad} con texto plano.`);
}

main().catch((error) => {
  console.error("Error durante el backfill:", error);
  process.exit(1);
});
