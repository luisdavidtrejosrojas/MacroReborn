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

require("./_aislar-datos");   // antes de api/: ver ese archivo

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
// antes(w) corre justo antes de jugar.js.
function paginaDeJugar(id, base = "https://www.macroreborn.com", antes) {
  const dom = new JSDOM(leer("jugar.html"), {
    url: base + "/jugar.html?id=" + id, runScripts: "outside-only", virtualConsole: new VirtualConsole()
  });
  const w = dom.window;
  w.eval(leer("js", "datos-juegos.js"));
  w.eval(FUENTE);
  if (antes) antes(w);
  w.eval(leer("js", "jugar.js"));
  return w;
}

// Los de terceros se abren después de pasar las partidas: un momento más tarde.
async function marcoDelJuego(w) {
  for (let i = 0; i < 200; i++) {
    const iframe = w.document.querySelector("#contenedorJuego iframe");
    if (iframe) return iframe;
    await new Promise((ok) => setTimeout(ok, 5));
  }
  return null;
}

async function jugar(id, base) {
  const w = paginaDeJugar(id, base);
  return { w, iframe: await marcoDelJuego(w) };
}

test("la página de jugar abre un juego de terceros en su dirección, con su marco", async () => {
  const pvz = porArchivo("pvz.html");
  const { w, iframe } = await jugar(pvz.id);
  try {
    assert.equal(iframe.getAttribute("src"), "https://juegos.macroreborn.com/html/juegos/pvz.html");
    assert.equal(iframe.getAttribute("sandbox"), w.MRJuegosAparte.SANDBOX);
    assert.equal(iframe.getAttribute("allow"), "fullscreen; gamepad; autoplay");
    assert.ok(iframe.hasAttribute("allowfullscreen"));
    // Sin nada que pasar, la mudanza se apunta como hecha sin avisar a nadie.
    assert.ok(w.localStorage.getItem("mrPartidasMudadas"));
    assert.equal(w.document.querySelector("#overlayCarga p").textContent, "Cargando juego…");
  } finally {
    w.close();
  }
  const enElPc = await jugar(pvz.id, "http://localhost:3001");
  try {
    assert.equal(enElPc.iframe.getAttribute("src"), "http://localhost:3002/html/juegos/pvz.html");
  } finally {
    enElPc.w.close();
  }
});

test("antes de abrir un juego de terceros pasa las partidas, con su aviso, y lo abre aunque falle", async () => {
  const pvz = porArchivo("pvz.html");
  const finales = {
    "no contesta": (ok) => ok({ hecho: false, motivo: "la dirección de los juegos no contestó a tiempo" }),
    "se rompe": (ok, mal) => mal(new Error("roto")),
    "no está": null
  };
  for (const [caso, final] of Object.entries(finales)) {
    let seguir = () => {};
    const w = paginaDeJugar(pvz.id, undefined, (w) => {
      w.console.warn = () => {};
      w.MRJuegosAparte.mudarPartidas = final === null ? undefined : (opciones) => {
        opciones.alEmpezar();
        return new w.Promise((ok, mal) => { seguir = () => final(ok, mal); });
      };
    });
    try {
      const aviso = w.document.querySelector("#overlayCarga p");
      if (final !== null) {
        await new Promise((ok) => setTimeout(ok, 20));
        assert.equal(aviso.textContent, "Pasando tus partidas guardadas…", caso);
        assert.equal(w.document.querySelector("#contenedorJuego iframe"), null, caso + ": el juego espera a que pasen");
      }
      seguir();
      const iframe = await marcoDelJuego(w);
      assert.ok(iframe, caso + ": el juego se abre igual");
      assert.equal(iframe.getAttribute("src"), "https://juegos.macroreborn.com/html/juegos/pvz.html", caso);
      assert.equal(aviso.textContent, "Cargando juego…", caso);
    } finally {
      w.close();
    }
  }
});

test("Macro Snake y los de otras webs no pasan partidas: se abren al momento", () => {
  for (const juego of [porArchivo("macro-snake.html"), CATALOGO.find((j) => /^https?:\/\//.test(j.iframe))]) {
    let llamadas = 0;
    const w = paginaDeJugar(juego.id, undefined, (w) => {
      w.MRJuegosAparte.mudarPartidas = async () => { llamadas++; };
    });
    try {
      assert.ok(w.document.querySelector("#contenedorJuego iframe"), juego.nombre);
      assert.equal(llamadas, 0, juego.nombre);
    } finally {
      w.close();
    }
  }
});

test("la página de jugar abre Macro Snake en la web, sin sandbox, y los de otras webs en la suya, con él", async () => {
  const snake = await jugar(porArchivo("macro-snake.html").id);
  try {
    assert.equal(snake.iframe.getAttribute("src"), "./html/juegos/macro-snake.html");
    assert.equal(snake.iframe.hasAttribute("sandbox"), false);
    assert.equal(snake.iframe.hasAttribute("allow"), false);
  } finally {
    snake.w.close();
  }
  const deOtraWeb = CATALOGO.find((j) => /^https?:\/\//.test(j.iframe));
  const otra = await jugar(deOtraWeb.id);
  try {
    assert.equal(otra.iframe.getAttribute("src"), deOtraWeb.iframe);
    assert.ok(otra.iframe.hasAttribute("sandbox"));
  } finally {
    otra.w.close();
  }
});

// ---------- Lo que guarda el sitio, que no pasa nunca en la mudanza ----------

// Lo que no es código del sitio, o no corre en la web.
const FUERA_DEL_SITIO = new Set(["node_modules", "tests", "scripts", "specs", "docs", "memoria-claude",
  "datos-locales", "sugerencias-discord", "infra", "migrations", "api", "respaldos", ".git", ".github",
  ".specify", ".claude", "revision-avatares", "revision-previsualizaciones", "revision-juegos", "revision-lienzo"]);

function codigoDelSitio(dir = RAIZ, rel = "", salida = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) {
      if (!FUERA_DEL_SITIO.has(e.name) && ruta !== "html/juegos") codigoDelSitio(path.join(dir, e.name), ruta, salida);
    } else if (/\.(js|html)$/.test(e.name)) {
      salida.push(ruta);
    }
  }
  return salida;
}

// Las claves que el sitio calcula en vez de escribirlas tal cual: en qué
// archivo, con qué expresión y qué valen. Una nueva hace fallar la prueba
// hasta que alguien mira qué vale, la añade aquí y, si hace falta, a la
// lista de js/motor/juegos-aparte.js.
const CALCULADAS = {
  "js/chat.js": { "_claveAntispamChat()": "chatAntispam_<nombre>" },
  "js/core.js": { "clave": "la que llega a guardarJSON (abajo)", "CLAVE_USUARIO": "usuarioActivo", "CLAVE_PASE": "macroSessionToken" },
  "js/motor/estadisticas.js": { "clave": "estadisticas_<nombre>", '"estadisticas_" + usuario.nombre': "estadisticas_<nombre>" },
  "js/retos-diarios.js": { "KEY": "macroRebornRetoDiario" },
  "js/session.js": { "KEY_USER": "usuarioActivo", "KEY_TOKEN": "macroSessionToken" },
  "js/tema.js": { "CLAVE_TEMA": "temaMacroReborn", "CLAVE_PALETA": "paletaMacroReborn" }
};

test("ninguna clave que guarda el sitio en el navegador se queda fuera de la lista del sitio", () => {
  const M = modulo();
  const literales = [];
  const sueltas = [];
  for (const archivo of codigoDelSitio()) {
    const texto = leer(...archivo.split("/"));
    // El argumento: una llamada sin argumentos, como _claveAntispamChat(), o
    // lo que haya hasta la coma o el paréntesis.
    for (const m of texto.matchAll(/localStorage\s*\.\s*(?:getItem|setItem|removeItem)\s*\(\s*([A-Za-z_$][\w$.]*\(\)|[^,)]+)/g)) {
      const arg = m[1].trim();
      const literal = /^(['"`])([^'"`$]*)\1$/.exec(arg);
      if (literal) literales.push([archivo, literal[2]]);
      else if (!(CALCULADAS[archivo] && arg in CALCULADAS[archivo])) sueltas.push(archivo + ": " + arg);
    }
    // guardarJSON(clave, ...) de js/core.js también escribe en localStorage.
    for (const m of texto.matchAll(/(?<!function\s)guardarJSON\(\s*([A-Za-z_$][\w$.]*\(\)|[^,)]+)/g)) {
      const arg = m[1].trim();
      const literal = /^(['"`])([^'"`$]*)\1$/.exec(arg);
      if (literal) literales.push([archivo, literal[2]]);
      else if (!(CALCULADAS[archivo] && arg in CALCULADAS[archivo]) && !(arg === "KEY_USER" && archivo === "js/session.js")) {
        sueltas.push(archivo + ": guardarJSON(" + arg);
      }
    }
    assert.ok(!/localStorage\s*\[/.test(texto), archivo + " usa localStorage[...]: que lo cubra esta prueba");
  }
  assert.deepStrictEqual(sueltas, [], "claves calculadas que la prueba no conoce: mirar qué valen y añadirlas a CALCULADAS");
  const fuera = literales.filter(([, clave]) => !M.esDelSitio(clave)).map(([a, c]) => a + ": " + c);
  assert.deepStrictEqual(fuera, [], "claves del sitio que no están en la lista de js/motor/juegos-aparte.js");
  assert.ok(literales.length >= 8, "solo encontró " + literales.length + " claves escritas tal cual");
});

test("las claves calculadas valen lo que dice la prueba, y están en la lista", () => {
  const M = modulo();
  for (const [archivo, expresiones] of Object.entries(CALCULADAS)) {
    const texto = leer(...archivo.split("/"));
    for (const [expresion, valor] of Object.entries(expresiones)) {
      if (/^[A-Z_]+$/.test(expresion)) {
        const declarada = new RegExp("\\b" + expresion + "\\s*=\\s*[\"']([^\"']+)[\"']").exec(texto);
        assert.ok(declarada, archivo + ": no encuentro el valor de " + expresion);
        assert.equal(declarada[1], valor, archivo + ": " + expresion);
      }
      if (!valor.includes(" ")) assert.ok(M.esDelSitio(valor.replace("<nombre>", "alguien")), valor);
    }
  }
  assert.match(leer("js", "chat.js"), /return\s+"chatAntispam_"\s*\+/);
  assert.match(leer("js", "motor", "estadisticas.js"), /"estadisticas_"\s*\+\s*usuario\.nombre/);
});

test("la sesión y el usuario son del sitio; lo que guardan los juegos, no", () => {
  const M = modulo();
  for (const clave of ["macroSessionToken", "usuarioActivo", "mrPartidasMudadas", "mr_sonda", "estadisticas_ana"]) {
    assert.equal(M.esDelSitio(clave), true, clave);
  }
  for (const clave of ["ejs-settings", "ejs-gba-settings", "/data/saves", "save1", "RufflePlayer"]) {
    assert.equal(M.esDelSitio(clave), false, clave);
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
