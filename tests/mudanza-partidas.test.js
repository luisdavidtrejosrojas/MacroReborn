// ==============================
// LA MUDANZA DE LAS PARTIDAS — tests/mudanza-partidas.test.js
// ==============================
// Al pasar los juegos de terceros a su propia dirección, lo que guardaron en
// el navegador (a nombre de la web) no se vería desde allí. La primera vez
// que alguien abre un juego después del cambio, la página lo manda a la
// dirección de los juegos, que lo guarda sin pisar nada y sin dejar entrar
// nada del sitio (specs/008-aislar-juegos, research D8 y D9;
// contracts/mensajes.md).
//
// Con los archivos de verdad, en jsdom, y con fake-indexeddb, que hace de
// IndexedDB: cada IDBFactory es el almacén de un origen.
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { IDBFactory } = require("fake-indexeddb");

const RAIZ = path.join(__dirname, "..");
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), "utf8");
const MUDANZA = leer("html", "juegos", "_mudanza.js");
const APARTE = leer("js", "motor", "juegos-aparte.js");
const esperar = (ms = 30) => new Promise((ok) => setTimeout(ok, ms));

const pedir = (peticion) => new Promise((ok, mal) => {
  peticion.onsuccess = () => ok(peticion.result);
  peticion.onerror = () => mal(peticion.error);
});

// El lado de los juegos: la página de la mudanza, sola, con su IndexedDB.
function ladoDeLosJuegos(url = "https://juegos.macroreborn.com/html/juegos/_mudanza.html") {
  const dom = new JSDOM("<!doctype html><body></body>", { url, runScripts: "outside-only" });
  const w = dom.window;
  w.indexedDB = new IDBFactory();
  w.eval(MUDANZA);
  return w;
}

// Un paquete con la forma de lo que guardan los motores de verdad.
function paquete() {
  return {
    tipo: "mr-mudanza",
    version: 1,
    claves: [
      ["ejs-settings", '{"volume":0.5}'],
      ["save1", "partida-de-flash"],
      ["macroSessionToken", "la-sesion"],
      ["usuarioActivo", '{"nombre":"ana"}'],
      ["estadisticas_ana", "{}"]
    ],
    bases: [
      {
        nombre: "/data/saves", version: 21, almacenes: [{
          nombre: "FILE_DATA", keyPath: null, autoIncrement: false,
          indices: [{ nombre: "timestamp", keyPath: "timestamp", unique: false, multiEntry: false }],
          registros: [["/data/saves/pokemon.srm", { timestamp: 5, mode: 33206, contents: new Uint8Array([1, 2, 3]) }]]
        }]
      },
      {
        nombre: "EmulatorJS-states", version: 1, almacenes: [{
          nombre: "states", keyPath: null, autoIncrement: false, indices: [],
          registros: [["pokemon.state", new Uint8Array([9, 9])], ["mario.state", new Uint8Array([7])]]
        }]
      },
      {
        nombre: "partidas-html5", version: 2, almacenes: [{
          nombre: "partidas", keyPath: "id", autoIncrement: false, indices: [],
          registros: [[1, { id: 1, nivel: 4 }]]
        }]
      }
    ]
  };
}

async function leerRegistro(fabrica, base, almacen, clave) {
  const db = await pedir(fabrica.open(base));
  try {
    return await pedir(db.transaction(almacen, "readonly").objectStore(almacen).get(clave));
  } finally {
    db.close();
  }
}

test("guarda las claves y las bases de los juegos tal como eran, y nada del sitio", async () => {
  const w = ladoDeLosJuegos();
  const cuentas = await w.MRMudanza.mudar(paquete(), { localStorage: w.localStorage, indexedDB: w.indexedDB });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(cuentas)), {
    claves: { puestas: 2, yaEstaban: 0 }, registros: { puestos: 4, yaEstaban: 0 }, almacenesSaltados: 0, fallos: 0
  });
  assert.equal(w.localStorage.getItem("ejs-settings"), '{"volume":0.5}');
  assert.equal(w.localStorage.getItem("save1"), "partida-de-flash");
  for (const delSitio of ["macroSessionToken", "usuarioActivo", "estadisticas_ana"]) {
    assert.equal(w.localStorage.getItem(delSitio), null, delSitio + " no puede llegar a la dirección de los juegos");
  }
  const bases = (await w.indexedDB.databases()).map((b) => b.name + "@" + b.version).sort();
  assert.deepStrictEqual(bases, ["/data/saves@21", "EmulatorJS-states@1", "partidas-html5@2"]);
  const db = await pedir(w.indexedDB.open("/data/saves"));
  const store = db.transaction("FILE_DATA", "readonly").objectStore("FILE_DATA");
  assert.equal(store.keyPath, null);
  assert.deepStrictEqual([...store.indexNames], ["timestamp"]);
  db.close();
  const srm = await leerRegistro(w.indexedDB, "/data/saves", "FILE_DATA", "/data/saves/pokemon.srm");
  assert.deepStrictEqual([...srm.contents], [1, 2, 3]);
  assert.deepStrictEqual(await leerRegistro(w.indexedDB, "partidas-html5", "partidas", 1), { id: 1, nivel: 4 });
  w.close();
});

test("no pisa nada: lo que ya está se queda, y solo entra lo que falta", async () => {
  const w = ladoDeLosJuegos();
  // Alguien ya jugó en la dirección de los juegos antes de la mudanza.
  w.localStorage.setItem("save1", "partida-nueva");
  const db = await new Promise((ok, mal) => {
    const p = w.indexedDB.open("EmulatorJS-states", 1);
    p.onupgradeneeded = () => p.result.createObjectStore("states");
    p.onsuccess = () => ok(p.result);
    p.onerror = () => mal(p.error);
  });
  await pedir(db.transaction("states", "readwrite").objectStore("states").put(new Uint8Array([1]), "pokemon.state"));
  db.close();
  // Y una base que ya existe sin el almacén que traen.
  const otra = await new Promise((ok, mal) => {
    const p = w.indexedDB.open("partidas-html5", 2);
    p.onupgradeneeded = () => p.result.createObjectStore("otra-cosa");
    p.onsuccess = () => ok(p.result);
    p.onerror = () => mal(p.error);
  });
  otra.close();

  const cuentas = await w.MRMudanza.mudar(paquete(), { localStorage: w.localStorage, indexedDB: w.indexedDB });
  assert.equal(cuentas.claves.yaEstaban, 1);
  assert.equal(w.localStorage.getItem("save1"), "partida-nueva", "la clave que ya estaba no cambia");
  assert.equal(cuentas.registros.yaEstaban, 1);
  assert.deepStrictEqual([...await leerRegistro(w.indexedDB, "EmulatorJS-states", "states", "pokemon.state")], [1],
    "el estado que ya estaba no se pisa con el de antes");
  assert.deepStrictEqual([...await leerRegistro(w.indexedDB, "EmulatorJS-states", "states", "mario.state")], [7],
    "el que faltaba, sí entra");
  assert.equal(cuentas.almacenesSaltados, 1, "el almacén que la base no tiene se salta y se cuenta");
  w.close();
});

test("solo cree a las direcciones de la web, y les contesta", async () => {
  const w = ladoDeLosJuegos();
  const pagina = new JSDOM("<!doctype html>", { url: "https://www.macroreborn.com/jugar.html" }).window;
  const respuestas = [];
  pagina.postMessage = (mensaje, destino) => respuestas.push({ mensaje, destino });
  const mandar = (origen, datos) =>
    w.dispatchEvent(new w.MessageEvent("message", { data: datos, origin: origen, source: pagina }));

  mandar("https://otra.web", paquete());
  mandar("https://juegos.macroreborn.com", paquete());
  mandar("https://www.macroreborn.com", { ...paquete(), version: 2 });
  await esperar(80);
  assert.equal(respuestas.length, 0);
  assert.equal(w.localStorage.getItem("ejs-settings"), null, "nada de otra dirección se guarda");

  mandar("https://www.macroreborn.com", paquete());
  for (let i = 0; i < 50 && !respuestas.length; i++) await esperar(20);
  assert.equal(respuestas.length, 1);
  assert.equal(respuestas[0].destino, "https://www.macroreborn.com", "se contesta solo a quien mandó");
  assert.equal(respuestas[0].mensaje.tipo, "mr-mudanza-hecha");
  assert.equal(respuestas[0].mensaje.claves.puestas, 2);
  assert.equal(w.localStorage.getItem("ejs-settings"), '{"volume":0.5}');
  w.close();
  pagina.close();
});

test("si no puede guardar las bases, contesta mr-mudanza-fallo con el motivo", async () => {
  const w = ladoDeLosJuegos();
  w.indexedDB = {};   // un navegador que no deja ver qué bases hay
  const pagina = new JSDOM("<!doctype html>", { url: "https://macroreborn.com/jugar.html" }).window;
  const respuestas = [];
  pagina.postMessage = (mensaje) => respuestas.push(mensaje);
  w.dispatchEvent(new w.MessageEvent("message", { data: paquete(), origin: "https://macroreborn.com", source: pagina }));
  for (let i = 0; i < 50 && !respuestas.length; i++) await esperar(20);
  assert.equal(respuestas[0].tipo, "mr-mudanza-fallo");
  assert.match(respuestas[0].motivo, /bases/);
  w.close();
  pagina.close();
});

test("en el PC cree a la web del puerto anterior, con los dos nombres", () => {
  const w = ladoDeLosJuegos("http://localhost:3002/html/juegos/_mudanza.html");
  // Con [...] para comparar arrays de Node, no los de la ventana de jsdom.
  const origenes = (url) => [...w.MRMudanza.origenesDeLaWeb(new URL(url))];
  assert.deepStrictEqual(origenes("http://localhost:3002/"), ["http://localhost:3001", "http://127.0.0.1:3001"]);
  assert.deepStrictEqual(origenes("http://127.0.0.1:3102/"), ["http://localhost:3101", "http://127.0.0.1:3101"]);
  assert.deepStrictEqual(origenes("https://juegos.macroreborn.com/"),
    ["https://macroreborn.com", "https://www.macroreborn.com"]);
  assert.deepStrictEqual(origenes("https://otra.web/"), []);
  w.close();
});

test("dentro de un marco avisa a la página de que está lista", async () => {
  const dom = new JSDOM("<!doctype html><body></body>", { url: "https://www.macroreborn.com/jugar.html", runScripts: "outside-only" });
  const pagina = dom.window;
  const recibidos = [];
  pagina.addEventListener("message", (e) => recibidos.push(e.data));
  const marco = pagina.document.createElement("iframe");
  pagina.document.body.appendChild(marco);
  marco.contentWindow.eval(MUDANZA);
  await esperar();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(recibidos)), [{ tipo: "mr-mudanza-lista", version: 1 }]);
  pagina.close();
});

test("la lista de lo que es del sitio es la misma aquí y en la página", () => {
  const w = ladoDeLosJuegos();
  const pagina = new JSDOM("<!doctype html>", { url: "https://www.macroreborn.com/jugar.html", runScripts: "outside-only" }).window;
  pagina.eval(APARTE);
  assert.deepStrictEqual([...w.MRMudanza.CLAVES_DEL_SITIO], [...pagina.MRJuegosAparte.CLAVES_DEL_SITIO]);
  assert.deepStrictEqual([...w.MRMudanza.PREFIJOS_DEL_SITIO], [...pagina.MRJuegosAparte.PREFIJOS_DEL_SITIO]);
  w.close();
  pagina.close();
});
