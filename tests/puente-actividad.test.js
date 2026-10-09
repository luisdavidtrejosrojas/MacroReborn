// ==============================
// EL PUENTE DE LA ACTIVIDAD — tests/puente-actividad.test.js
// ==============================
// Los juegos de terceros se abren desde su propia dirección, y la página de
// jugar ya no puede escuchar dentro de ellos para saber si alguien juega
// (specs/008-aislar-juegos, research D7). Por eso cada juego lleva dentro el
// puente (html/juegos/_puente.js), que avisa a la página con
// { tipo: "mr-actividad" }, como mucho una vez cada 5 segundos.
//
// Con el archivo de verdad, dentro de un iframe de jsdom y con un reloj de
// mentira.
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
const PUENTE = fs.readFileSync(path.join(RAIZ, "html", "juegos", "_puente.js"), "utf8");
const EVENTOS = ["keydown", "pointerdown", "pointermove", "mousedown", "mousemove", "wheel", "touchstart"];
const esperar = () => new Promise((ok) => setTimeout(ok, 20));

// La página de jugar con un juego dentro; el puente corre en el juego.
function montarPuente() {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "https://www.macroreborn.com/jugar.html", runScripts: "outside-only"
  });
  const w = dom.window;
  const iframe = w.document.createElement("iframe");
  w.document.body.appendChild(iframe);
  const juego = iframe.contentWindow;
  let t = 1000000;
  juego.Date.now = () => t;
  juego.eval(PUENTE);
  const recibidos = [];
  w.addEventListener("message", (e) => recibidos.push({ datos: e.data, deDonde: e.source }));
  const tocar = (tipo = "keydown") => juego.dispatchEvent(new juego.Event(tipo));
  return { w, juego, recibidos, tocar, pasar: (ms) => { t += ms; } };
}

test("dentro de un marco, al tocar el juego avisa a la página con mr-actividad", async () => {
  // jsdom deja vacío event.source en postMessage (un navegador de verdad
  // pone la ventana del juego): quién manda el aviso lo prueban las pruebas
  // de la página, más abajo, con el MessageEvent armado a mano.
  const { w, recibidos, tocar } = montarPuente();
  tocar("keydown");
  await esperar();
  assert.equal(recibidos.length, 1);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(recibidos[0].datos)), { tipo: "mr-actividad" });
  w.close();
});

test("cada uno de los eventos de hoy cuenta: teclado, ratón, rueda y pantalla", async () => {
  for (const tipo of EVENTOS) {
    const { w, recibidos, tocar } = montarPuente();
    tocar(tipo);
    await esperar();
    assert.equal(recibidos.length, 1, tipo + " no avisó");
    w.close();
  }
});

test("como mucho un aviso cada 5 segundos", async () => {
  const { w, recibidos, tocar, pasar } = montarPuente();
  tocar("mousemove");
  tocar("mousemove");
  tocar("keydown");
  await esperar();
  assert.equal(recibidos.length, 1, "tres toques seguidos son un aviso");
  pasar(4999);
  tocar("mousemove");
  await esperar();
  assert.equal(recibidos.length, 1, "antes de 5 segundos no se repite");
  pasar(1);
  tocar("mousemove");
  await esperar();
  assert.equal(recibidos.length, 2, "a los 5 segundos, otro");
  w.close();
});

test("abierto solo, fuera de la página de jugar, no avisa a nadie", () => {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "https://juegos.macroreborn.com/html/juegos/pvz.html", runScripts: "outside-only"
  });
  const w = dom.window;
  let mandados = 0;
  w.postMessage = () => { mandados++; };
  w.eval(PUENTE);
  w.dispatchEvent(new w.Event("keydown"));
  assert.equal(mandados, 0);
  w.close();
});
