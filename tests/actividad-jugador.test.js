// ==============================
// ¿HAY ALGUIEN JUGANDO? — tests/actividad-jugador.test.js
// ==============================
// Desde el 04/10/2026 un minuto de juego solo cuenta si en los últimos 3
// minutos alguien tocó el teclado, el ratón o la pantalla
// (js/motor/actividad-jugador.js, docs/referencia/ECONOMIA.md). Se prueba con el
// archivo de verdad, un reloj de mentira y un iframe de verdad.
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const raiz = path.join(__dirname, "..");
const FUENTE = fs.readFileSync(path.join(raiz, "js", "motor", "actividad-jugador.js"), "utf8");
const MINUTO = 60 * 1000;

function montar() {
  const dom = new JSDOM("<!doctype html><body><button id='fuera'>x</button></body>", {
    url: "https://www.macroreborn.com/jugar.html",
    runScripts: "outside-only"
  });
  const w = dom.window;
  w.eval(FUENTE);
  let t = 1000000;
  const reloj = { ahora: () => t, pasar: (ms) => { t += ms; } };
  const vigilante = w.MRActividad.crearVigilante(w, reloj.ahora);
  return { w, d: w.document, reloj, vigilante };
}

test("recién cargada cuenta; a los 3 minutos sin nada, no; al tocar algo, vuelve", () => {
  const { w, reloj, vigilante } = montar();
  assert.equal(vigilante.hayAlguien(), true);
  reloj.pasar(3 * MINUTO);
  assert.equal(vigilante.hayAlguien(), true, "3 minutos justos todavía cuentan");
  reloj.pasar(1000);
  assert.equal(vigilante.hayAlguien(), false);

  w.dispatchEvent(new w.KeyboardEvent("keydown", { key: "a" }));
  assert.equal(vigilante.hayAlguien(), true);

  reloj.pasar(4 * MINUTO);
  w.document.body.dispatchEvent(new w.MouseEvent("mousemove", { bubbles: true }));
  assert.equal(vigilante.hayAlguien(), true, "mover el ratón también cuenta");
});

test("escucha también dentro del juego, si es de la propia web, y otra vez cada vez que carga", async () => {
  const { w, d, reloj, vigilante } = montar();
  const iframe = d.createElement("iframe");
  d.body.appendChild(iframe);
  vigilante.vigilarJuego(iframe);

  reloj.pasar(5 * MINUTO);
  assert.equal(vigilante.hayAlguien(), false);
  const dentro = iframe.contentWindow;
  dentro.dispatchEvent(new dentro.KeyboardEvent("keydown", { key: "ArrowUp" }));
  assert.equal(vigilante.hayAlguien(), true, "una tecla dentro del juego tiene que contar");

  // Al recargar el juego cambia la ventana de dentro: se vuelve a escuchar.
  reloj.pasar(5 * MINUTO);
  iframe.dispatchEvent(new w.Event("load"));
  iframe.contentWindow.dispatchEvent(new iframe.contentWindow.Event("wheel"));
  assert.equal(vigilante.hayAlguien(), true);
});

test("en un juego de otra web cuenta diez minutos desde que se entra", () => {
  const { d, reloj, vigilante } = montar();
  const iframe = d.createElement("iframe");
  d.body.appendChild(iframe);
  // Lo que hace el navegador con un iframe de otra web: no deja mirar dentro.
  Object.defineProperty(iframe, "contentWindow", { get() { throw new Error("SecurityError"); } });
  Object.defineProperty(d, "activeElement", { configurable: true, get: () => iframe });

  reloj.pasar(20 * MINUTO);
  assert.equal(vigilante.hayAlguien(), false);
  vigilante.alPerderElFoco();          // entró en el juego
  reloj.pasar(9 * MINUTO);
  assert.equal(vigilante.hayAlguien(), true);
  reloj.pasar(2 * MINUTO);
  assert.equal(vigilante.hayAlguien(), false, "pasados los diez minutos hay que volver a entrar");
});

test("la página del juego carga el vigilante antes del pulso, y el juego lo engancha", () => {
  const html = fs.readFileSync(path.join(raiz, "jugar.html"), "utf8");
  const vigilante = html.indexOf("js/motor/actividad-jugador.js");
  const pulso = html.indexOf("js/motor/xp.js");
  assert.ok(vigilante > 0 && pulso > vigilante, "actividad-jugador.js tiene que ir antes de xp.js");
  const jugar = fs.readFileSync(path.join(raiz, "js", "jugar.js"), "utf8");
  assert.match(jugar, /MRActividad\.vigilarJuego\(/);
});
