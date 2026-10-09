// ==============================
// LOS JUEGOS, EN SU PROPIA DIRECCIÓN — api/_juegos-aparte.js
// ==============================
// Hasta el 09/10/2026 los juegos de terceros se abrían desde la propia web
// (html/juegos/<nombre>.html, en un iframe de jugar.html), y para el
// navegador eso es la misma web: el código de cada juego podía leer la
// sesión (macroSessionToken) y tocar la página. 75 de esos 107 juegos
// cargan código de cuentas de GitHub ajenas, desde ramas que su dueño
// cambia cuando quiere: bastaba con que una cambiara para llevarse las
// cuentas de quien jugara, administradores incluidos (punto 1 de
// docs/listas/AUDITORIA.md, specs/008-aislar-juegos).
//
// Ahora se sirven desde otra dirección, juegos.macroreborn.com, con la
// misma ruta. Es otro origen: el navegador no deja a su código leer lo que
// guarda la web ni tocar la página que lo contiene.
//
// Este módulo decide qué sale por cada dirección. Lo usan server.js (por el
// nombre de la petición) y scripts/servidor-local.js (por el puerto), para
// que los dos hagan exactamente lo mismo, como api/_prendas-ruta.js:
//
//   - En la dirección de los juegos lo atiende TODO: solo los envoltorios
//     de terceros y los archivos de la mudanza de las partidas; lo demás,
//     también /api/, da 404. Sin X-Frame-Options, que impediría meter el
//     juego en la página; en su lugar, frame-ancestors con las direcciones
//     de la web. Y X-Robots-Tag: noindex, porque son páginas de terceros
//     sin nada propio, como jugar.html (docs/referencia/SEO.md).
//   - En la web, un envoltorio de terceros responde 302 a la dirección de
//     los juegos: un enlace viejo sigue llevando al juego, y la web no lo
//     ejecuta nunca. 302 y no 301, que se queda guardado en el navegador
//     para siempre y estorbaría si hubiera que volver atrás.
//
// Macro Snake, del equipo, se queda en la web: no carga nada de fuera y
// necesita la sesión para guardar los récords.

const fs = require("fs");
const path = require("path");

const { resolverRutaEstatica } = require("./_ruta-estatica");

const RAIZ = path.join(__dirname, "..");
const CARPETA = "html/juegos";

const PRODUCCION = Object.freeze({
  hostJuegos: "juegos.macroreborn.com",
  origenJuegos: "https://juegos.macroreborn.com",
  origenesDeLaWeb: Object.freeze(["https://macroreborn.com", "https://www.macroreborn.com"])
});

// Los juegos del equipo, que se quedan en la web. La misma lista está en
// js/motor/juegos-aparte.js, y una prueba vigila que coincidan.
const PROPIOS = Object.freeze(["macro-snake"]);

// Lo que sirve la dirección de los juegos y no es un juego: la página de la
// mudanza de las partidas. Los archivos de html/juegos/ que empiezan por "_"
// son de la dirección de los juegos, no juegos.
const ARCHIVOS_DE_LA_MUDANZA = Object.freeze(["_mudanza.html", "_mudanza.js"]);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

// Solo nombres sencillos, directamente en la carpeta. La ruta ya llega
// decodificada y normalizada (api/_ruta-estatica.js), pero en Windows una
// barra invertida también separa carpetas: "..\..\server.js" pasaría la
// normalización de las URL y saldría de html/juegos al abrir el archivo.
const NOMBRE_VALIDO = /^[A-Za-z0-9_][A-Za-z0-9_.-]*\.(html|js)$/;

function nombreEnLaCarpeta(ruta) {
  const partes = String(ruta).split("/").filter(Boolean);
  if (partes.length !== 3 || partes[0] !== "html" || partes[1] !== "juegos") return null;
  const nombre = partes[2];
  return NOMBRE_VALIDO.test(nombre) && !nombre.includes("..") ? nombre : null;
}

function esEnvoltorioDeTerceros(nombre) {
  return /\.html$/.test(nombre) && !nombre.startsWith("_") &&
    !PROPIOS.includes(nombre.replace(/\.html$/, ""));
}

// Por el nombre de la petición, sin el puerto. Es lo que usa producción,
// donde nginx manda las dos direcciones al mismo proceso.
function esPeticionDeJuegos(req, config = PRODUCCION) {
  const host = String((req.headers && req.headers.host) || "").toLowerCase().replace(/:\d+$/, "");
  return host === config.hostJuegos;
}

function noEncontrado(res, ruta) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("No encontrado: " + ruta);
}

function servirEnLaDireccionDeJuegos(req, res, url, opciones) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", "Allow": "GET, HEAD" });
    return res.end("Método no permitido");
  }

  const resuelta = resolverRutaEstatica(url.pathname);
  if (!resuelta.ok) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Petición mal formada");
  }

  const nombre = nombreEnLaCarpeta(resuelta.ruta);
  if (!nombre || !(esEnvoltorioDeTerceros(nombre) || ARCHIVOS_DE_LA_MUDANZA.includes(nombre))) {
    return noEncontrado(res, resuelta.ruta);
  }

  const archivo = path.join(RAIZ, CARPETA, nombre);
  fs.stat(archivo, (errStat, datos) => {
    if (errStat || !datos.isFile()) return noEncontrado(res, resuelta.ruta);

    const etag = '"j-' + datos.size.toString(16) + "-" + Math.floor(datos.mtimeMs).toString(16) + '"';
    res.setHeader("Content-Type", TIPOS[path.extname(nombre)]);
    res.setHeader("Content-Security-Policy", "frame-ancestors " + opciones.origenesDeLaWeb.join(" "));
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Robots-Tag", "noindex");
    res.setHeader("ETag", etag);

    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304);
      return res.end();
    }

    fs.readFile(archivo, (errLeer, contenido) => {
      if (errLeer) {
        console.error("Juegos aparte: no se pudo leer " + archivo + ":", errLeer.message);
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("Error interno del servidor");
      }
      res.writeHead(200);
      res.end(req.method === "HEAD" ? undefined : contenido);
    });
  });
}

// Devuelve si atendió la petición.
//   opciones.esDeJuegos       si la petición es para la dirección de los juegos
//   opciones.origenJuegos     a dónde redirige la web, "https://juegos.macroreborn.com"
//   opciones.origenesDeLaWeb  quién puede meter un juego en un marco
function atender(req, res, url, opciones) {
  if (opciones.esDeJuegos) {
    servirEnLaDireccionDeJuegos(req, res, url, opciones);
    return true;
  }

  const resuelta = resolverRutaEstatica(url.pathname);
  if (!resuelta.ok) return false;
  const nombre = nombreEnLaCarpeta(resuelta.ruta);
  if (!nombre) return false;

  if (nombre.startsWith("_")) {
    noEncontrado(res, resuelta.ruta);
    return true;
  }

  if (esEnvoltorioDeTerceros(nombre) && fs.existsSync(path.join(RAIZ, CARPETA, nombre))) {
    res.writeHead(302, {
      "Location": opciones.origenJuegos + resuelta.ruta + url.search,
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Este juego se abre desde " + opciones.origenJuegos);
    return true;
  }

  return false;
}

module.exports = {
  PRODUCCION,
  PROPIOS,
  ARCHIVOS_DE_LA_MUDANZA,
  esPeticionDeJuegos,
  esEnvoltorioDeTerceros,
  nombreEnLaCarpeta,
  atender
};
