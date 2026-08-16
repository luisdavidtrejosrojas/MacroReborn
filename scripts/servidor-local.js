// ==============================
// SERVIDOR LOCAL — scripts/servidor-local.js
// ==============================
// Mini servidor para probar el sitio EN EL NAVEGADOR, todo dentro de
// esta computadora, sin tocar el servidor real del proyecto original.
//
//   - Sirve los archivos estáticos del sitio (HTML, CSS, JS, imágenes).
//   - Rutea /api/auth y /api/users contra la base local (PGlite),
//     usando los MISMOS handlers que corren en Vercel.
//
// Uso:  npm run db:local     (o: node scripts/servidor-local.js)
// Abrí http://localhost:3001
//
// Usuario de prueba ya creado:
//   usuario: demo   contraseña: demo1234
//   (está guardada en TEXTO PLANO a propósito: cuando entres, vas a
//   poder ver cómo se migra sola a hash — mirá la consola del servidor.)
//
// Nota: solo /api/auth y /api/users funcionan localmente (son los
// únicos que tocamos). El resto de los endpoints devuelve un aviso.

const http = require("http");
const fs = require("fs");
const path = require("path");

const { crearBaseLocal, crearSqlPGlite } = require("./pglite");
const { usarSqlLocal } = require("../api/_db");

const PUERTO = Number(process.env.PORT) || 3001;
const RAIZ = path.join(__dirname, "..");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8"
};

function responder(res, codigo, obj) {
  if (res.writableEnded) return;
  res.writeHead(codigo, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(obj));
}

async function main() {
  console.log("Armando la base local (PGlite) y aplicando las migraciones...");
  const db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));

  // Usuario de prueba "legacy" (contraseña en texto plano) para que se
  // pueda ver la migración perezosa en vivo.
  await db.query(
    `INSERT INTO users (username, password, level, xp, status, created_at, last_login)
     VALUES ($1, $2, 3, 120, 'active', now(), now())
     ON CONFLICT (username) DO NOTHING`,
    ["demo", "demo1234"]
  );

  const authHandler = require("../api/auth");
  const usersHandler = require("../api/users");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    // ----- API local -----
    if (url.pathname.startsWith("/api/")) {
      let cuerpo = {};
      try {
        const trozos = [];
        for await (const chunk of req) trozos.push(chunk);
        const texto = Buffer.concat(trozos).toString("utf8");
        if (texto) cuerpo = JSON.parse(texto);
      } catch (error) {
        return responder(res, 400, { success: false, error: "Body inválido" });
      }

      const handler =
        url.pathname === "/api/auth" ? authHandler :
        url.pathname === "/api/users" ? usersHandler :
        null;

      if (!handler) {
        return responder(res, 404, {
          success: false,
          error: "Este endpoint no está disponible en el modo local (solo /api/auth y /api/users)."
        });
      }

      const query = Object.fromEntries(url.searchParams.entries());
      const reqSim = { method: req.method, query, body: cuerpo, headers: req.headers };
      const resSim = {
        statusCode: 200,
        setHeader() {},
        status(codigo) { this.statusCode = codigo; return this; },
        json(obj) { this.ultimaRespuesta = obj; responder(res, this.statusCode || 200, obj); },
        end() { if (!res.writableEnded) res.end(); }
      };

      // Avísame en consola cuando un usuario legacy se migra a hash
      // (útil para ver la migración perezosa funcionando). Solo se
      // muestra si el login fue exitoso.
      const esLogin = url.pathname === "/api/auth" && query.action === "login";
      try {
        await handler(reqSim, resSim);
        if (esLogin && resSim.ultimaRespuesta && resSim.ultimaRespuesta.success && cuerpo && cuerpo.username) {
          const filas = await db.query(
            "SELECT username, password, password_hash FROM users WHERE username = $1",
            [cuerpo.username]
          );
          const u = filas.rows[0];
          if (u && u.password === null && u.password_hash) {
            console.log(`\n✔ "${u.username}" entró y su contraseña quedó migrada a hash (texto plano borrado).`);
          }
        }
      } catch (error) {
        console.error("Error en el handler local:", error);
        if (!res.writableEnded) responder(res, 500, { success: false, error: error.message });
      }
      return;
    }

    // ----- Archivos estáticos -----
    const rutaRelativa = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
    const archivo = path.join(RAIZ, rutaRelativa);

    if (!archivo.startsWith(RAIZ)) {
      res.writeHead(403);
      return res.end("Prohibido");
    }

    fs.readFile(archivo, (err, datos) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("No encontrado: " + rutaRelativa);
      }
      res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream" });
      res.end(datos);
    });
  });

  server.listen(PUERTO, () => {
    console.log("\n==========================================");
    console.log(`  Sitio local: http://localhost:${PUERTO}`);
    console.log("  Usuario de prueba: demo / demo1234");
    console.log("  (entrá con él y mirá la consola: se migra a hash)");
    console.log("==========================================\n");
  });
}

main().catch((error) => {
  console.error("No se pudo arrancar el servidor local:", error);
  process.exit(1);
});
