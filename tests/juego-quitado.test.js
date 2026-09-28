// ==============================
// UN JUEGO QUE YA NO ESTÁ — tests/juego-quitado.test.js
// ==============================
// El 28/09/2026 se quitó del catálogo el 30 (The Binding of Isaac: Wrath
// of the Lamb), que no cargaba. En la base siguen su historial, sus
// favoritos y sus reseñas, y quedan enlaces viejos a su ficha. Aquí: que
// ni el catálogo ni el sitemap lo nombran, y que su ficha dice que no
// está en vez de quedarse en "Cargando..." (js/juego.js, con el catálogo
// de verdad).
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const leer = (archivo) => fs.readFileSync(path.join(__dirname, "..", archivo), "utf8");

function catalogo() {
  const contexto = {};
  vm.createContext(contexto);
  vm.runInContext(leer("js/datos-juegos.js") + "\nthis.lista = juegos;", contexto);
  return contexto.lista;
}

// La ficha de juego.html con lo que js/juego.js rellena.
function ficha(id) {
  const dom = new JSDOM(
    `<div class="juego-grande">🎮</div>
     <h1 class="nombre-juego">Cargando...</h1>
     <p class="descripcion-juego"></p>
     <button class="boton-jugar">🎮 Jugar</button>`,
    { url: "https://macroreborn.com/juego.html?id=" + id, runScripts: "outside-only" });
  dom.window.fetch = () => new Promise(() => {});   // las métricas de la ficha no hacen falta
  dom.window.eval(leer("js/datos-juegos.js") + "\n" + leer("js/juego.js"));
  const $ = (selector) => dom.window.document.querySelector(selector);
  return { nombre: $(".nombre-juego").textContent, descripcion: $(".descripcion-juego").textContent, boton: $(".boton-jugar") };
}

test("el catálogo ya no tiene el 30, y ningún número se repite", () => {
  const ids = catalogo().map(j => j.id);
  assert.ok(!ids.includes(30));
  assert.equal(new Set(ids).size, ids.length);
});

test("el sitemap solo enlaza juegos del catálogo", () => {
  const ids = new Set(catalogo().map(j => j.id));
  const enlazados = [...leer("sitemap.xml").matchAll(/juego\.html\?id=(\d+)/g)].map(m => Number(m[1]));
  assert.ok(enlazados.length > 0);
  assert.deepStrictEqual(enlazados.filter(id => !ids.has(id)), []);
});

test("su ficha dice que no está, y sin botón de jugar", () => {
  const f = ficha(30);
  assert.equal(f.nombre, "Juego no encontrado");
  assert.equal(f.descripcion, "Este juego ya no está en el catálogo.");
  assert.equal(f.boton.style.display, "none");
});

test("la de un juego que sí está, como siempre", () => {
  const f = ficha(13);
  assert.equal(f.nombre, "Mario Combat");
  assert.notEqual(f.boton.style.display, "none");
});
