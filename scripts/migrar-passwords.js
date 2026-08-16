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
// SOLO hace esto: toca las columnas password / password_hash de la
// tabla users. No borra usuarios, no toca ninguna otra tabla, no
// cambia nada más.
//
// SEGURIDAD (a propósito, para que sea casi imposible correrlo por
// accidente contra la base real):
//
//   - Para tocar la base REAL hay que pasar la bandera --produccion
//     EXPLÍCITAMENTE y con la contraseña de conexión (DATABASE_URL).
//     Sin la bandera, el script se niega a correr.
//   - Además, al usarla pide una CONFIRMACIÓN escrita (hay que
//     tipear "SI") antes de tocar nada.
//   - Con --simular solo MUESTRA qué haría; no cambia nada.
//   - Antes de tocar la base real verifica que la migración 013 ya
//     esté aplicada (la columna password_hash debe existir); si no,
//     se detiene y avisa.
//
// Uso:
//   Maqueta local (segura, sin confirmación):
//     node scripts/migrar-passwords.js --local
//     node scripts/migrar-passwords.js --local --simular
//
//   Base REAL (exige bandera + confirmación):
//     DATABASE_URL="postgres://..." node scripts/migrar-passwords.js --produccion --simular
//     DATABASE_URL="postgres://..." node scripts/migrar-passwords.js --produccion
//
// Seguro de correr varias veces: los usuarios ya migrados (password
// NULL o password_hash lleno) se ignoran.

const readline = require("readline");
const { hashContrasena } = require("../api/_password");

// Pide una respuesta escrita en la consola y la devuelve.
function preguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      rl.close();
      resolve(respuesta.trim());
    });
  });
}

// Verifica que la columna password_hash exista (migración 013 aplicada).
async function existeColumnaPasswordHash(sql) {
  const filas = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash';
  `;
  return filas.length > 0;
}

async function main() {

  const esLocal = process.argv.includes("--local");
  const esProduccion = process.argv.includes("--produccion");
  const simular = process.argv.includes("--simular");

  // Regla de oro: sin --local ni --produccion, no se corre.
  if (!esLocal && !esProduccion) {
    console.error(
      "El script se niega a correr sin indicar el destino.\n" +
      "  - Maqueta local (segura):   node scripts/migrar-passwords.js --local\n" +
      "  - Base real (con cuidado):  DATABASE_URL=\"...\" node scripts/migrar-passwords.js --produccion"
    );
    process.exit(1);
  }

  let sql;
  let nombreDestino;

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
    nombreDestino = "MAQUETA LOCAL";
  } else {
    // Base real: exige DATABASE_URL y la bandera --produccion (ya
    // verificada arriba).
    if (!process.env.DATABASE_URL) {
      console.error("Falta DATABASE_URL. Usá:\n  DATABASE_URL=\"...\" node scripts/migrar-passwords.js --produccion");
      process.exit(1);
    }
    const { obtenerSql } = require("../api/_db");
    sql = obtenerSql();
    nombreDestino = "BASE REAL";

    if (!(await existeColumnaPasswordHash(sql))) {
      console.error(
        "La columna password_hash no existe en la base.\n" +
        "Primero hay que aplicar la migración 013 (migrations/013_hash_contrasenas.sql).\n" +
        "El script se detiene sin tocar nada."
      );
      process.exit(1);
    }
  }

  // Todos los usuarios que todavía tienen texto plano.
  const pendientes = await sql`
    SELECT id, username, password
    FROM users
    WHERE password IS NOT NULL AND password_hash IS NULL
    ORDER BY id;
  `;

  const validos = pendientes.filter((u) => u && u.password);

  console.log(`\nDestino: ${nombreDestino}`);
  console.log(`Encontrados ${pendientes.length} usuario(s) con contraseña en texto plano (${validos.length} con contraseña válida).`);

  if (simular) {
    // Modo simulación: solo informar, no tocar nada.
    console.log("\nMODO SIMULACIÓN: no se cambió nada. Se haría esto:");
    for (const usuario of validos) {
      console.log(`  · ${usuario.username} -> se picaría su contraseña y se borraría el texto plano`);
    }
    console.log(`\nFin de la simulación (${validos.length} usuario(s) pendientes).`);
    return;
  }

  if (!esLocal) {
    // Base real: confirmación escrita obligatoria.
    const respuesta = await preguntar(
      `\n⚠️  Vas a picar las contraseñas de la BASE REAL (${validos.length} usuario(s)).\n` +
      "    Es el cambio de seguridad buscado (nadie pierde acceso), pero no se puede deshacer.\n" +
      "    Escribí SI para continuar: "
    );
    if (!["SI", "SÍ"].includes(respuesta.toUpperCase())) {
      console.log("Cancelado. No se tocó nada.");
      process.exit(0);
    }
  }

  let migrados = 0;

  for (const usuario of validos) {
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
