// ==============================
// UN ARCHIVO, UNA VERSIÓN — tests/versiones.test.js
// ==============================
// Las páginas piden sus hojas y scripts con ?v=<fecha>: cuando un cambio no
// puede convivir con la copia que el navegador ya tiene, se sube esa fecha y
// la dirección cambia (docs/referencia/VPS.md, «Caché del navegador»). Se
// sube en todas las páginas que piden el archivo. Una página que lo pide con
// otra fecha suele ser una copia vieja que alguien subió encima: el
// 06/10/2026, comunidad-ranking.html volvió a las versiones del 18 y el
// 21/09 (specs/002-fundir-arreglo-barra/spec.md). Esto la señala, con la
// página y el archivo. Un archivo que pide una sola página no tiene con qué
// compararse: de las siete versiones que bajó esa copia, esto ve cinco.
//
// Solo las páginas del sitio, en la raíz: los juegos de html/juegos/ traen
// sus propios archivos. Lo que se pide de fuera (fuentes, CDN) no cuenta.
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");

// archivo -> versión -> páginas que lo piden con ella
function versionesPorArchivo() {
  const archivos = new Map();
  const paginas = fs.readdirSync(RAIZ).filter((nombre) => nombre.endsWith(".html")).sort();
  for (const pagina of paginas) {
    const html = fs.readFileSync(path.join(RAIZ, pagina), "utf8");
    for (const [, ruta, version] of html.matchAll(/(?:src|href)="([^"?#]+)\?v=([^"&#]+)"/g)) {
      if (/^(?:[a-z]+:)?\/\//i.test(ruta)) continue;
      // "/css/x.css" y "css/x.css" son el mismo archivo desde la raíz.
      const archivo = ruta.replace(/^\.?\//, "");
      if (!archivos.has(archivo)) archivos.set(archivo, new Map());
      const versiones = archivos.get(archivo);
      if (!versiones.has(version)) versiones.set(version, []);
      versiones.get(version).push(pagina);
    }
  }
  return archivos;
}

test("las páginas piden sus hojas y scripts con versión", () => {
  // Si la búsqueda dejara de ver las versiones, la prueba de abajo pasaría sin mirar nada.
  assert.ok(versionesPorArchivo().size >= 50, "se esperaban al menos 50 archivos con ?v=");
});

test("cada archivo se pide con la misma versión en todas las páginas", () => {
  const distintos = [];
  for (const [archivo, versiones] of versionesPorArchivo()) {
    if (versiones.size < 2) continue;
    // La versión que piden más páginas es la de referencia; se nombran las otras.
    const [[referencia, conReferencia], ...otras] = [...versiones].sort((a, b) => b[1].length - a[1].length);
    for (const [version, paginas] of otras) {
      distintos.push(`${archivo}: ?v=${version} en ${paginas.join(", ")}; ` +
        `?v=${referencia} en las otras ${conReferencia.length}`);
    }
  }
  assert.deepStrictEqual(distintos, [], "\n" + distintos.join("\n"));
});
