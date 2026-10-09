// ==============================
// LOS JUEGOS, EN SU PROPIA DIRECCIÓN: EL NAVEGADOR — tests/juegos-aparte-navegador.test.js
// ==============================
// Los juegos de terceros se abren desde juegos.macroreborn.com, otro origen
// que la web, para que su código no pueda leer la sesión (punto 1 de la
// auditoría, specs/008-aislar-juegos). Aquí, lo que hace la página de jugar:
// dónde están los juegos, de qué tipo es cada uno y con qué marco se abre
// (specs/008-aislar-juegos/contracts/marco-del-juego.md).
//
// Con js/motor/juegos-aparte.js de verdad, en jsdom, y el catálogo de verdad.
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
const FUENTE = leer("js", "motor", "juegos-aparte.js");
const CATALOGO = vm.runInNewContext(leer("js", "datos-juegos.js") + "\n;juegos", {});

function modulo(url = "https://www.macroreborn.com/jugar.html") {
  const dom = new JSDOM("<!doctype html><body></body>", { url, runScripts: "outside-only" });
  dom.window.eval(FUENTE);
  return dom.window.MRJuegosAparte;
}

const porArchivo = (archivo) => CATALOGO.find((j) => String(j.iframe).endsWith("/" + archivo));

test("los juegos están en juegos.macroreborn.com en la web, y en el puerto siguiente en el PC", () => {
  const M = modulo();
  const origen = (url) => M.origen(new URL(url));
  assert.equal(origen("https://macroreborn.com/jugar.html?id=15"), "https://juegos.macroreborn.com");
  assert.equal(origen("https://www.macroreborn.com/jugar.html?id=15"), "https://juegos.macroreborn.com");
  assert.equal(origen("http://localhost:3001/jugar.html"), "http://localhost:3002");
  assert.equal(origen("http://127.0.0.1:3101/jugar.html"), "http://127.0.0.1:3102");
  // Sin ubicación, la de la página.
  assert.equal(modulo("http://localhost:3001/jugar.html").origen(), "http://localhost:3002");
});

test("de los 112 juegos del catálogo, 107 son de terceros, uno es propio y cuatro son de otras webs", () => {
  const M = modulo();
  const cuenta = {};
  for (const juego of CATALOGO) cuenta[M.tipo(juego)] = (cuenta[M.tipo(juego)] || 0) + 1;
  assert.deepStrictEqual({ ...cuenta }, { terceros: 107, propio: 1, "otra-web": 4 });
  assert.equal(M.tipo(porArchivo("macro-snake.html")), "propio");
});

test("la dirección de cada tipo de juego", () => {
  const M = modulo();
  const pvz = porArchivo("pvz.html");
  assert.equal(M.direccion(pvz), "https://juegos.macroreborn.com/html/juegos/pvz.html");
  assert.equal(M.direccion(pvz, new URL("http://localhost:3001/jugar.html")), "http://localhost:3002/html/juegos/pvz.html");
  const snake = porArchivo("macro-snake.html");
  assert.equal(M.direccion(snake), snake.iframe, "Macro Snake se queda en la web");
  const deOtraWeb = CATALOGO.find((j) => M.tipo(j) === "otra-web");
  assert.equal(M.direccion(deOtraWeb), deOtraWeb.iframe);
});

test("el marco: sandbox sin navegar la página, y los permisos que no se heredan", () => {
  const M = modulo();
  const esperado = ["allow-scripts", "allow-same-origin", "allow-forms", "allow-pointer-lock", "allow-popups",
    "allow-popups-to-escape-sandbox", "allow-modals", "allow-downloads", "allow-orientation-lock", "allow-presentation"];
  for (const juego of [porArchivo("pvz.html"), CATALOGO.find((j) => M.tipo(j) === "otra-web")]) {
    const marco = M.marco(juego);
    assert.deepStrictEqual(marco.sandbox.split(" ").sort(), [...esperado].sort());
    assert.ok(!/allow-top-navigation/.test(marco.sandbox), "un juego no puede llevarse la página");
    assert.equal(marco.allow, "fullscreen; gamepad; autoplay");
  }
  assert.equal(M.marco(porArchivo("macro-snake.html")), null, "Macro Snake, sin sandbox");
});

test("la lista de juegos propios es la misma en el navegador y en el servidor", () => {
  const { PROPIOS } = require("../api/_juegos-aparte");
  assert.deepStrictEqual([...modulo().PROPIOS], [...PROPIOS]);
});

// La página de jugar de verdad, con sus scripts de verdad, sin red.
function jugar(id, base = "https://www.macroreborn.com") {
  const dom = new JSDOM(leer("jugar.html"), {
    url: base + "/jugar.html?id=" + id, runScripts: "outside-only", virtualConsole: new VirtualConsole()
  });
  const w = dom.window;
  w.eval(leer("js", "datos-juegos.js"));
  w.eval(FUENTE);
  w.eval(leer("js", "jugar.js"));
  return { w, iframe: w.document.querySelector("#contenedorJuego iframe") };
}

test("la página de jugar abre un juego de terceros en su dirección, con su marco", () => {
  const pvz = porArchivo("pvz.html");
  const { w, iframe } = jugar(pvz.id);
  try {
    assert.equal(iframe.getAttribute("src"), "https://juegos.macroreborn.com/html/juegos/pvz.html");
    assert.equal(iframe.getAttribute("sandbox"), w.MRJuegosAparte.SANDBOX);
    assert.equal(iframe.getAttribute("allow"), "fullscreen; gamepad; autoplay");
    assert.ok(iframe.hasAttribute("allowfullscreen"));
  } finally {
    w.close();
  }
  const enElPc = jugar(pvz.id, "http://localhost:3001");
  try {
    assert.equal(enElPc.iframe.getAttribute("src"), "http://localhost:3002/html/juegos/pvz.html");
  } finally {
    enElPc.w.close();
  }
});

test("la página de jugar abre Macro Snake en la web, sin sandbox, y los de otras webs en la suya, con él", () => {
  const snake = jugar(porArchivo("macro-snake.html").id);
  try {
    assert.equal(snake.iframe.getAttribute("src"), "./html/juegos/macro-snake.html");
    assert.equal(snake.iframe.hasAttribute("sandbox"), false);
    assert.equal(snake.iframe.hasAttribute("allow"), false);
  } finally {
    snake.w.close();
  }
  const deOtraWeb = CATALOGO.find((j) => /^https?:\/\//.test(j.iframe));
  const otra = jugar(deOtraWeb.id);
  try {
    assert.equal(otra.iframe.getAttribute("src"), deOtraWeb.iframe);
    assert.ok(otra.iframe.hasAttribute("sandbox"));
  } finally {
    otra.w.close();
  }
});

test("Macro Snake no carga nada de otras webs: se queda en la web, con la sesión", () => {
  // Si cargara código de fuera, ese código correría en la web, que es
  // justo lo que esta spec saca de allí (research D2).
  const DE_FUERA = /(?:\b(?:src|href|action)\s*=\s*["']?|url\(\s*["']?|\b(?:fetch|import|importScripts)\s*\(\s*["'`]|\bfrom\s+["'])(?:https?:)?\/\//i;
  for (const archivo of ["macro-snake.html", "macro-snake.js", "macro-snake.css"]) {
    const texto = leer("html", "juegos", archivo);
    assert.ok(!DE_FUERA.test(texto), archivo + " carga algo de otra web");
    assert.ok(!/https?:\/\//i.test(texto), archivo + " nombra una dirección de otra web");
  }
});

test("jugar.html carga el módulo después del catálogo y antes de jugar.js", () => {
  const html = leer("jugar.html");
  const catalogo = html.indexOf("js/datos-juegos.js");
  const aparte = html.indexOf("js/motor/juegos-aparte.js");
  const jugarJs = html.indexOf("js/jugar.js");
  assert.ok(catalogo > 0 && aparte > catalogo && jugarJs > aparte,
    "el orden tiene que ser datos-juegos.js, juegos-aparte.js y jugar.js");
});
