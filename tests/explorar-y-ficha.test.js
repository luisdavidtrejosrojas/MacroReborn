// ==============================
// EXPLORAR Y LOS BOTONES DE LA FICHA — tests/explorar-y-ficha.test.js
// ==============================
// js/explorar.js y js/juego.js buscan el catálogo como window.juegos, y
// js/datos-juegos.js lo declaraba con un const de primer nivel, que no
// cuelga de window. Explorar salía vacía para todos, y los botones
// Anterior, Más de esta categoría y Siguiente de la ficha de cada juego
// llevaban a "#" (puntos 20 y 92 de la auditoría,
// specs/005-arreglos-rapidos/spec.md). Se cargan las páginas de verdad con
// sus scripts de verdad.
//
// Correr:  npm test

const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), "utf8");
const esperar = () => new Promise((ok) => setTimeout(ok, 30));

// La página, sin ejecutar sus <script>: los que importan se evalúan a mano.
// El resumen de juegos contesta vacío, o falla si se pide.
function pagina(html, url, { resumenFalla = false } = {}) {
  const dom = new JSDOM(leer(html), { url, runScripts: "outside-only", virtualConsole: new VirtualConsole() });
  const w = dom.window;
  w.fetch = async () => {
    if (resumenFalla) throw new Error("sin red");
    return { ok: true, json: async () => ({ success: true, juegos: {} }) };
  };
  return w;
}

const catalogo = (() => {
  const w = pagina("explorar.html", "http://localhost/explorar.html");
  w.eval(leer("js", "datos-juegos.js"));
  return w.juegos;
})();

const porCategoria = new Map();
for (const j of catalogo || []) {
  const c = String(j.categoria || "");
  porCategoria.set(c, (porCategoria.get(c) || []).concat(j));
}

test("el catálogo cuelga de window", () => {
  assert.ok(Array.isArray(catalogo) && catalogo.length > 100, "window.juegos no es el catálogo");
});

test("Explorar enseña juegos en sus secciones, y las categorías", async () => {
  const w = pagina("explorar.html", "http://localhost/explorar.html");
  w.eval(leer("js", "datos-juegos.js"));
  w.eval(leer("js", "explorar.js"));
  await esperar();
  for (const id of ["explorarTrending", "explorarNuevos"]) {
    const el = w.document.getElementById(id);
    assert.ok(el, "falta #" + id);
    assert.ok(el.querySelectorAll(".explorar-card").length > 0, "#" + id + " sin tarjetas");
    assert.equal(el.querySelector(".explorar-vacio"), null, "#" + id + " dice que no hay juegos");
  }
  assert.ok(w.document.querySelectorAll("#explorarCategorias [data-cat]").length > 0, "sin categorías");
});

describe("los botones de la ficha de un juego", () => {
  async function ficha(id, opciones) {
    const w = pagina("juego.html", "http://localhost/juego.html?id=" + id, opciones);
    w.eval(leer("js", "datos-juegos.js"));
    w.eval(leer("js", "juego.js"));
    await esperar();
    const $ = (sel) => w.document.getElementById(sel);
    return { anterior: $("juegoAnterior"), siguiente: $("juegoSiguiente"), categoria: $("juegoCategoria") };
  }

  const idDe = (enlace) => Number(new URL(enlace.href, "http://localhost/").searchParams.get("id"));

  for (const resumenFalla of [false, true]) {
    test("con varios juegos en su categoría, los tres llevan a su sitio" +
      (resumenFalla ? ", aunque falle el resumen" : ""), async () => {
      const [categoria, juegos] = [...porCategoria].find(([, lista]) => lista.length >= 3);
      const juego = juegos[1];
      const { anterior, siguiente, categoria: enlace } = await ficha(juego.id, { resumenFalla });

      for (const [nombre, boton] of [["Anterior", anterior], ["Siguiente", siguiente]]) {
        assert.equal(boton.hidden, false, nombre + " está escondido");
        const destino = catalogo.find((j) => j.id === idDe(boton));
        assert.ok(destino, nombre + " lleva a un juego que no existe: " + boton.getAttribute("href"));
        assert.notEqual(destino.id, juego.id, nombre + " lleva al mismo juego");
        assert.equal(String(destino.categoria), categoria, nombre + " sale de la categoría");
      }
      assert.equal(enlace.getAttribute("href"), "categoria.html?categoria=" + encodeURIComponent(categoria));
    });
  }

  test("solo en su categoría, Anterior y Siguiente no se ven", async (t) => {
    const sola = [...porCategoria].find(([, lista]) => lista.length === 1);
    if (!sola) return t.skip("el catálogo no tiene ninguna categoría con un solo juego");
    const { anterior, siguiente, categoria } = await ficha(sola[1][0].id);
    assert.equal(anterior.hidden, true);
    assert.equal(siguiente.hidden, true);
    assert.equal(categoria.getAttribute("href"), "categoria.html?categoria=" + encodeURIComponent(sola[0]));
  });
});
