// ==============================
// LOS JUEGOS, EN SU PROPIA DIRECCIÓN: EL SERVIDOR — tests/juegos-aparte-servidor.test.js
// ==============================
// Los juegos de terceros se sirven desde juegos.macroreborn.com, otro
// origen, para que su código no pueda leer la sesión de la web (punto 1 de
// la auditoría, specs/008-aislar-juegos). Aquí, lo que promete
// specs/008-aislar-juegos/contracts/rutas-http.md: qué sale por cada
// dirección, con qué cabeceras, y que nada se sale de html/juegos/.
//
// Con api/_juegos-aparte.js de verdad, detrás de un servidor http de
// prueba, pidiendo con la cabecera Host de cada dirección.
//
// Correr:  npm test

const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const juegosAparte = require("../api/_juegos-aparte");
const { PRODUCCION } = juegosAparte;

const RAIZ = path.join(__dirname, "..");
const JUEGOS = path.join(RAIZ, "html", "juegos");
const WEB = "macroreborn.com";
const DE_JUEGOS = "juegos.macroreborn.com";
const SIN_ATENDER = 299;

let servidor;
let puerto;

before(async () => {
  servidor = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const atendido = juegosAparte.atender(req, res, url, {
      esDeJuegos: juegosAparte.esPeticionDeJuegos(req),
      origenJuegos: PRODUCCION.origenJuegos,
      origenesDeLaWeb: PRODUCCION.origenesDeLaWeb
    });
    if (!atendido) {
      // Lo que el módulo deja pasar lo sirve el resto del servidor.
      res.writeHead(SIN_ATENDER, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("sin atender");
    }
  });
  await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
  puerto = servidor.address().port;
});

after(() => new Promise((ok) => servidor.close(ok)));

function pedir(ruta, host, { metodo = "GET", cabeceras = {} } = {}) {
  return new Promise((ok, mal) => {
    const req = http.request(
      { host: "127.0.0.1", port: puerto, path: ruta, method: metodo, headers: { host, ...cabeceras } },
      (res) => {
        const trozos = [];
        res.on("data", (t) => trozos.push(t));
        res.on("end", () => ok({ codigo: res.statusCode, cabeceras: res.headers, cuerpo: Buffer.concat(trozos) }));
      });
    req.on("error", mal);
    req.end();
  });
}

// Los envoltorios de terceros que hay en la carpeta: todo .html que no es un
// juego del equipo ni de la dirección de los juegos (los que empiezan por _).
const ENVOLTORIOS = fs.readdirSync(JUEGOS)
  .filter((f) => f.endsWith(".html") && juegosAparte.esEnvoltorioDeTerceros(f));

test("la dirección de los juegos sirve un envoltorio de terceros, con sus cabeceras", async () => {
  const r = await pedir("/html/juegos/pvz.html", DE_JUEGOS);
  assert.equal(r.codigo, 200);
  assert.equal(r.cabeceras["content-type"], "text/html; charset=utf-8");
  assert.equal(r.cabeceras["content-security-policy"],
    "frame-ancestors https://macroreborn.com https://www.macroreborn.com");
  assert.equal(r.cabeceras["cache-control"], "no-cache");
  assert.equal(r.cabeceras["x-robots-tag"], "noindex");
  assert.equal(r.cabeceras["x-frame-options"], undefined, "X-Frame-Options impediría meter el juego en la página");
  assert.ok(r.cabeceras.etag);
  assert.ok(r.cuerpo.length > 0);
});

test("HEAD sale sin cuerpo, y con el mismo ETag, un 304", async () => {
  const cabeza = await pedir("/html/juegos/pvz.html", DE_JUEGOS, { metodo: "HEAD" });
  assert.equal(cabeza.codigo, 200);
  assert.equal(cabeza.cuerpo.length, 0);
  const otra = await pedir("/html/juegos/pvz.html", DE_JUEGOS, { cabeceras: { "if-none-match": cabeza.cabeceras.etag } });
  assert.equal(otra.codigo, 304);
});

test("en la dirección de los juegos, solo GET y HEAD", async () => {
  const r = await pedir("/html/juegos/pvz.html", DE_JUEGOS, { metodo: "POST" });
  assert.equal(r.codigo, 405);
  assert.equal(r.cabeceras.allow, "GET, HEAD");
});

test("en la dirección de los juegos, lo que no es un juego de terceros da 404, también la API", async () => {
  for (const ruta of [
    "/", "/index.html", "/jugar.html", "/js/core.js", "/api/users", "/api/users?ligero=1&username=x",
    "/.env", "/server.js", "/html/juegos/macro-snake.html", "/html/juegos/macro-snake.js",
    "/html/juegos/macro-snake.css", "/html/juegos/_puente.js", "/html/juegos/noexiste.html",
    "/html/juegos/sub/pvz.html", "/html/juegos/"
  ]) {
    const r = await pedir(ruta, DE_JUEGOS);
    assert.equal(r.codigo, 404, ruta + " tenía que dar 404 y dio " + r.codigo);
  }
});

test("ninguna ruta saca un archivo de fuera de html/juegos", async () => {
  const servidorJs = fs.readFileSync(path.join(RAIZ, "server.js"), "utf8").slice(0, 200);
  for (const ruta of [
    "/html/juegos/../../server.js", "/html/juegos/%2e%2e/%2e%2e/server.js", "/html/juegos/..%2f..%2fserver.js",
    "/html/juegos/..%5c..%5cserver.js", "/html/juegos/%2e%2e%5c%2e%2e%5cserver.js", "/html/juegos/%C0%80"
  ]) {
    const r = await pedir(ruta, DE_JUEGOS);
    assert.ok(r.codigo === 400 || r.codigo === 404, ruta + " dio " + r.codigo);
    assert.ok(!r.cuerpo.toString("utf8").includes(servidorJs), ruta + " sacó server.js");
  }
});

test("en la web, un envoltorio de terceros redirige a la dirección de los juegos, con su consulta", async () => {
  for (const host of [WEB, "www." + WEB]) {
    const r = await pedir("/html/juegos/pvz.html?modo=1", host);
    assert.equal(r.codigo, 302);
    assert.equal(r.cabeceras.location, "https://juegos.macroreborn.com/html/juegos/pvz.html?modo=1");
  }
});

test("en la web, Macro Snake sigue, y lo de la dirección de los juegos no sale", async () => {
  for (const ruta of ["/html/juegos/macro-snake.html", "/html/juegos/macro-snake.js", "/html/juegos/macro-snake.css",
    "/html/juegos/noexiste.html", "/index.html", "/jugar.html"]) {
    const r = await pedir(ruta, WEB);
    assert.equal(r.codigo, SIN_ATENDER, ruta + ": lo tiene que servir el resto del servidor, como hoy");
  }
  for (const ruta of ["/html/juegos/_mudanza.html", "/html/juegos/_mudanza.js", "/html/juegos/_puente.js"]) {
    const r = await pedir(ruta, WEB);
    assert.equal(r.codigo, 404, ruta);
  }
});

test("cada envoltorio de terceros sale en la dirección de los juegos y redirige en la web (RF-010)", async () => {
  assert.ok(ENVOLTORIOS.length >= 107, "solo hay " + ENVOLTORIOS.length + " envoltorios");
  for (const nombre of ENVOLTORIOS) {
    const ruta = "/html/juegos/" + nombre;
    const aparte = await pedir(ruta, DE_JUEGOS);
    assert.equal(aparte.codigo, 200, nombre + " en la dirección de los juegos");
    assert.match(aparte.cabeceras["content-security-policy"] || "", /^frame-ancestors /, nombre);
    const enLaWeb = await pedir(ruta, WEB);
    assert.equal(enLaWeb.codigo, 302, nombre + " en la web");
    assert.equal(enLaWeb.cabeceras.location, PRODUCCION.origenJuegos + ruta);
  }
});

test("server.js lo usa antes que todo lo demás, también antes de la API", () => {
  const codigo = fs.readFileSync(path.join(RAIZ, "server.js"), "utf8");
  assert.match(codigo, /require\("\.\/api\/_juegos-aparte"\)/);
  const llamada = codigo.indexOf("juegosAparte.atender(");
  assert.ok(llamada > 0, "server.js no llama a juegosAparte.atender");
  assert.ok(codigo.includes("esDeJuegos: juegosAparte.esPeticionDeJuegos(req)"));
  for (const despues of ["traducirRutaCanonica(url);", "avatarCompuesto.atender(", 'url.pathname.startsWith("/api/")', "resolverRutaEstatica(url.pathname)"]) {
    const i = codigo.indexOf(despues);
    assert.ok(i > llamada, despues + " tiene que ir después de juegosAparte.atender");
  }
});

test("la dirección de los juegos se reconoce por el nombre, sin el puerto ni las mayúsculas", () => {
  const es = (host) => juegosAparte.esPeticionDeJuegos({ headers: host === undefined ? {} : { host } });
  assert.equal(es("juegos.macroreborn.com"), true);
  assert.equal(es("JUEGOS.macroreborn.com:443"), true);
  assert.equal(es("macroreborn.com"), false);
  assert.equal(es("www.macroreborn.com"), false);
  assert.equal(es("juegos.macroreborn.com.otra.com"), false);
  assert.equal(es(undefined), false);
});
