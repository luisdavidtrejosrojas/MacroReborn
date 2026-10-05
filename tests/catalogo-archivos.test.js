// ==============================
// CADA JUEGO, CON SU ARCHIVO — tests/catalogo-archivos.test.js
// ==============================
// El 27 (Fairy Tail vs One Piece) no cargaba por una letra: el catálogo
// pedía html/juegos/fairytailvsonepiece.html y el archivo se llama
// fairytalevsonepiece.html (punto 22 de docs/listas/AUDITORIA.md, arreglado el
// 28/09/2026). Aquí: que todo juego del catálogo que se sirve desde el
// propio sitio tiene su archivo, y toda portada su imagen.
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const RAIZ = path.join(__dirname, "..");

function catalogo() {
  const contexto = {};
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, "js", "datos-juegos.js"), "utf8") + "\nthis.lista = juegos;", contexto);
  // Array.from: un array hecho en el contexto de vm no es deepStrictEqual
  // a uno de aquí, aunque tenga lo mismo.
  return Array.from(contexto.lista);
}

const falta = (ruta) => !fs.existsSync(path.join(RAIZ, ruta));

test("todo juego que se sirve desde el sitio tiene su archivo", () => {
  const propios = catalogo().filter(j => String(j.iframe || "").startsWith("./"));
  assert.ok(propios.length > 100);
  assert.deepStrictEqual(propios.filter(j => falta(j.iframe)).map(j => j.id + " " + j.iframe), []);
});

test("toda portada tiene su imagen", () => {
  const conPortada = catalogo().filter(j => j.imagen);
  assert.deepStrictEqual(conPortada.filter(j => falta(j.imagen)).map(j => j.id + " " + j.imagen), []);
});
