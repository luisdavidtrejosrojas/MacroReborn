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
const vm = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), "utf8");
const PUENTE = leer("html", "juegos", "_puente.js");
const ACTIVIDAD = leer("js", "motor", "actividad-jugador.js");
const JUEGOS = "https://juegos.macroreborn.com";
const MINUTO = 60 * 1000;
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

// ---------- La página: qué avisos cree ----------

// La página de jugar con el vigilante de verdad, un reloj de mentira y el
// marco de un juego de terceros enganchado por el puente. jsdom no rellena
// event.source en postMessage, así que los avisos se arman a mano, como los
// recibe un navegador.
function montarPagina() {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "https://www.macroreborn.com/jugar.html", runScripts: "outside-only"
  });
  const w = dom.window;
  w.eval(ACTIVIDAD);
  let t = 1000000;
  const reloj = { ahora: () => t, pasar: (ms) => { t += ms; } };
  const vigilante = w.MRActividad.crearVigilante(w, reloj.ahora);
  const iframe = w.document.createElement("iframe");
  w.document.body.appendChild(iframe);
  vigilante.vigilarJuego(iframe, { origen: JUEGOS });
  const aviso = (datos, origen = JUEGOS, ventanaQueManda = iframe.contentWindow) =>
    w.dispatchEvent(new w.MessageEvent("message", { data: datos, origin: origen, source: ventanaQueManda }));
  return { w, iframe, vigilante, reloj, aviso };
}

test("el aviso del puente cuenta como un toque", () => {
  const { w, vigilante, reloj, aviso } = montarPagina();
  reloj.pasar(5 * MINUTO);
  assert.equal(vigilante.hayAlguien(), false);
  aviso({ tipo: "mr-actividad" });
  assert.equal(vigilante.hayAlguien(), true);
  reloj.pasar(3 * MINUTO + 1000);
  assert.equal(vigilante.hayAlguien(), false, "a los tres minutos sin avisos, deja de contar");
  w.close();
});

test("no cuenta un aviso de otra dirección, de otra ventana ni de otro tipo", () => {
  const { w, vigilante, reloj, aviso } = montarPagina();
  const otro = w.document.createElement("iframe");
  w.document.body.appendChild(otro);
  reloj.pasar(5 * MINUTO);
  aviso({ tipo: "mr-actividad" }, "https://otra.web");
  aviso({ tipo: "mr-actividad" }, "https://macroreborn.com");
  aviso({ tipo: "mr-actividad" }, JUEGOS, otro.contentWindow);
  aviso({ tipo: "mr-actividad" }, JUEGOS, null);
  aviso({ tipo: "otra-cosa" });
  aviso("mr-actividad");
  assert.equal(vigilante.hayAlguien(), false);
  w.close();
});

test("al marco puenteado no se le ponen oídos, ni le toca la regla de los diez minutos", () => {
  const { w, iframe, vigilante, reloj } = montarPagina();
  reloj.pasar(5 * MINUTO);
  // En jsdom el marco es de la misma web y se le podrían poner oídos; en el
  // navegador es de otra dirección y no. Lo que cuenta es solo el puente.
  iframe.contentWindow.dispatchEvent(new iframe.contentWindow.Event("keydown"));
  assert.equal(vigilante.hayAlguien(), false, "el marco puenteado no se escucha por dentro");
  Object.defineProperty(w.document, "activeElement", { configurable: true, get: () => iframe });
  vigilante.alPerderElFoco();
  assert.equal(vigilante.hayAlguien(), false, "entrar en un juego puenteado no da diez minutos");
  w.close();
});

test("la página de jugar engancha el puente del juego de terceros que abre", async () => {
  const catalogo = vm.runInNewContext(leer("js", "datos-juegos.js") + "\n;juegos", {});
  const pvz = catalogo.find((j) => String(j.iframe).endsWith("/pvz.html"));
  const dom = new JSDOM(leer("jugar.html"), {
    url: "https://www.macroreborn.com/jugar.html?id=" + pvz.id, runScripts: "outside-only",
    virtualConsole: new VirtualConsole()
  });
  const w = dom.window;
  let t = 1000000;
  w.Date.now = () => t;
  for (const archivo of [["js", "datos-juegos.js"], ["js", "motor", "juegos-aparte.js"],
    ["js", "motor", "actividad-jugador.js"], ["js", "jugar.js"]]) {
    w.eval(leer(...archivo));
  }
  // jugar.js deja un reloj en marcha: la página se cierra siempre, también
  // si algo falla, o el proceso de las pruebas no termina nunca.
  try {
    // Se abre después de pasar las partidas guardadas: un momento más tarde.
    let iframe = null;
    for (let i = 0; i < 200 && !iframe; i++) {
      await new Promise((ok) => setTimeout(ok, 5));
      iframe = w.document.querySelector("#contenedorJuego iframe");
    }
    t += 5 * MINUTO;
    assert.equal(w.MRActividad.hayAlguien(), false);
    w.dispatchEvent(new w.MessageEvent("message",
      { data: { tipo: "mr-actividad" }, origin: JUEGOS, source: iframe.contentWindow }));
    assert.equal(w.MRActividad.hayAlguien(), true);
  } finally {
    w.close();
  }
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
