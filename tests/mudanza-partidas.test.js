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

// ---------- El lado de la página ----------

const JUEGOS = "https://juegos.macroreborn.com";

function ladoDeLaPagina(url = "https://www.macroreborn.com/jugar.html") {
  const dom = new JSDOM("<!doctype html><body></body>", { url, runScripts: "outside-only" });
  const w = dom.window;
  w.indexedDB = new IDBFactory();
  w.eval(APARTE);
  return w;
}

function crearBase(fabrica, nombre, version, almacenes) {
  return new Promise((ok, mal) => {
    const p = fabrica.open(nombre, version);
    p.onupgradeneeded = () => {
      for (const a of almacenes) {
        const store = p.result.createObjectStore(a.nombre, a.opciones || {});
        for (const i of a.indices || []) store.createIndex(i.nombre, i.keyPath, { unique: false, multiEntry: false });
      }
    };
    p.onsuccess = async () => {
      const db = p.result;
      for (const a of almacenes) {
        for (const [clave, valor] of a.registros || []) {
          const store = db.transaction(a.nombre, "readwrite").objectStore(a.nombre);
          await pedir(store.keyPath === null ? store.put(valor, clave) : store.put(valor));
        }
      }
      db.close();
      ok();
    };
    p.onerror = () => mal(p.error);
  });
}

// Lo que dejaron los juegos en el navegador cuando se abrían desde la web,
// junto con lo del sitio.
async function sembrarLaWeb(w) {
  for (const [clave, valor] of [["macroSessionToken", "la-sesion"], ["usuarioActivo", '{"nombre":"ana"}'],
    ["temaMacroReborn", "oscuro"], ["mr_sonda", "1"], ["ejs-settings", '{"volume":0.5}'], ["save1", "partida-de-flash"]]) {
    w.localStorage.setItem(clave, valor);
  }
  await crearBase(w.indexedDB, "/data/saves", 21, [{ nombre: "FILE_DATA", indices: [{ nombre: "timestamp", keyPath: "timestamp" }],
    registros: [["/data/saves/pokemon.srm", { timestamp: 5, contents: new Uint8Array([1, 2, 3]) }]] }]);
  await crearBase(w.indexedDB, "EmulatorJS-states", 1, [{ nombre: "states", registros: [["pokemon.state", new Uint8Array([9, 9])]] }]);
  await crearBase(w.indexedDB, "EmulatorJS-roms", 1, [{ nombre: "rom", registros: [["pokemon.gba", new Uint8Array(2000)]] }]);
  await crearBase(w.indexedDB, "UnityCache", 1, [{ nombre: "XMLHttpRequest", registros: [["datos", new Uint8Array(2000)]] }]);
  await crearBase(w.indexedDB, "/idbfs", 21, [{ nombre: "FILE_DATA", registros: [["/idbfs/partida.dat", { contents: new Uint8Array([4]) }]] }]);
}

test("la página recoge lo que guardaron los juegos, sin lo del sitio ni las cachés", async () => {
  const w = ladoDeLaPagina();
  await sembrarLaWeb(w);
  const recogido = await w.MRJuegosAparte.recogerPartidas({ localStorage: w.localStorage, indexedDB: w.indexedDB });
  assert.deepStrictEqual([...recogido.claves.map(([c]) => c)].sort(), ["ejs-settings", "save1"]);
  assert.deepStrictEqual([...recogido.bases.map((b) => b.nombre)].sort(), ["/data/saves", "/idbfs", "EmulatorJS-states"]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(recogido.saltadas)).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [{ nombre: "EmulatorJS-roms", motivo: "cache" }, { nombre: "UnityCache", motivo: "cache" }]);
  const saves = recogido.bases.find((b) => b.nombre === "/data/saves");
  assert.equal(saves.version, 21);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(saves.almacenes[0].indices)),
    [{ nombre: "timestamp", keyPath: "timestamp", unique: false, multiEntry: false }]);
  assert.equal(saves.almacenes[0].registros[0][0], "/data/saves/pokemon.srm");
  w.close();
});

test("una base que pasa del tope no va, ni lo que pasa del tope total", async () => {
  const w = ladoDeLaPagina();
  await crearBase(w.indexedDB, "a", 1, [{ nombre: "s", registros: [["x", new Uint8Array(600)]] }]);
  await crearBase(w.indexedDB, "b", 1, [{ nombre: "s", registros: [["x", new Uint8Array(600)]] }]);
  await crearBase(w.indexedDB, "c", 1, [{ nombre: "s", registros: [["x", new Uint8Array(5000)]] }]);
  const recogido = await w.MRJuegosAparte.recogerPartidas({ localStorage: w.localStorage, indexedDB: w.indexedDB },
    { base: 1000, total: 1000 });
  assert.deepStrictEqual([...recogido.bases.map((b) => b.nombre)], ["a"]);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(recogido.saltadas)),
    [{ nombre: "b", motivo: "demasiado-grande" }, { nombre: "c", motivo: "demasiado-grande" }]);
  w.close();
});

test("la ida y vuelta entera: lo de los juegos llega a su dirección sin pisar nada, lo del sitio no, y la marca lleva las cuentas", async () => {
  const web = ladoDeLaPagina();
  await sembrarLaWeb(web);
  const juegos = ladoDeLosJuegos();
  // Una partida más nueva, jugada ya desde la dirección de los juegos: no se pisa.
  juegos.localStorage.setItem("save1", "partida-nueva");
  // Lo que haría el marco invisible: el paquete viaja copiado, como con postMessage.
  const conversar = async (paquete) => ({
    tipo: "mr-mudanza-hecha", version: 1,
    ...(await juegos.MRMudanza.mudar(structuredClone(paquete), { localStorage: juegos.localStorage, indexedDB: juegos.indexedDB }))
  });
  let empezo = false;
  const resultado = await web.MRJuegosAparte.mudarPartidas({ ventana: web, conversar, alEmpezar: () => { empezo = true; } });
  assert.equal(resultado.hecho, true);
  assert.equal(empezo, true, "con algo que pasar, se avisa para el aviso de carga");
  assert.equal(juegos.localStorage.getItem("ejs-settings"), '{"volume":0.5}');
  assert.equal(juegos.localStorage.getItem("save1"), "partida-nueva", "lo que ya estaba no se pisa");
  for (const delSitio of ["macroSessionToken", "usuarioActivo", "temaMacroReborn", "mr_sonda"]) {
    assert.equal(juegos.localStorage.getItem(delSitio), null, delSitio);
  }
  const bases = (await juegos.indexedDB.databases()).map((b) => b.name).sort();
  assert.deepStrictEqual(bases, ["/data/saves", "/idbfs", "EmulatorJS-states"]);
  const srm = await leerRegistro(juegos.indexedDB, "/data/saves", "FILE_DATA", "/data/saves/pokemon.srm");
  assert.deepStrictEqual([...srm.contents], [1, 2, 3]);
  const marca = JSON.parse(web.localStorage.getItem("mrPartidasMudadas"));
  assert.equal(marca.version, 1);
  assert.equal(marca.claves, 1, "solo cuenta lo que entró");
  assert.equal(marca.registros, 3);
  assert.equal(marca.saltadas.length, 2);
  assert.equal(web.localStorage.getItem("save1"), "partida-de-flash", "lo de la web no se borra");
  web.close();
  juegos.close();
});

test("con la marca puesta no hace nada, y sin nada que pasar pone la marca sin hablar con nadie", async () => {
  let llamadas = 0;
  const conversar = async () => { llamadas++; return { tipo: "mr-mudanza-hecha", version: 1, claves: { puestas: 0 }, registros: { puestos: 0 } }; };
  const conMarca = ladoDeLaPagina();
  conMarca.localStorage.setItem("mrPartidasMudadas", "{}");
  conMarca.localStorage.setItem("save1", "x");
  assert.equal((await conMarca.MRJuegosAparte.mudarPartidas({ ventana: conMarca, conversar })).yaEstaba, true);
  const vacia = ladoDeLaPagina();
  vacia.localStorage.setItem("macroSessionToken", "la-sesion");
  assert.equal((await vacia.MRJuegosAparte.mudarPartidas({ ventana: vacia, conversar })).nadaQuePasar, true);
  assert.ok(vacia.localStorage.getItem("mrPartidasMudadas"), "sin nada que pasar, la marca se pone igual");
  assert.equal(llamadas, 0);
  conMarca.close();
  vacia.close();
});

test("si la mudanza falla o no contesta, no pone la marca: se probará la próxima vez", async () => {
  for (const respuesta of [{ tipo: "mr-mudanza-fallo", version: 1, motivo: "sin sitio" }, null]) {
    const w = ladoDeLaPagina();
    w.localStorage.setItem("save1", "x");
    const resultado = await w.MRJuegosAparte.mudarPartidas({ ventana: w, conversar: async () => respuesta });
    assert.equal(resultado.hecho, false);
    assert.equal(w.localStorage.getItem("mrPartidasMudadas"), null);
    w.close();
  }
});

test("la conversación por el marco: espera a que esté lista, manda solo a la dirección de los juegos y quita el marco", async () => {
  const w = ladoDeLaPagina();
  const paquete = { tipo: "mr-mudanza", version: 1, claves: [["save1", "x"]], bases: [], saltadas: [] };
  const conversacion = w.MRJuegosAparte.hablarConLaMudanza(w, JUEGOS, paquete, 5000);
  const marco = w.document.querySelector("iframe");
  assert.equal(marco.getAttribute("src"), JUEGOS + "/html/juegos/_mudanza.html");
  assert.equal(marco.style.display, "none");
  const mandados = [];
  marco.contentWindow.postMessage = (mensaje, destino) => mandados.push({ mensaje, destino });
  const llega = (datos, origen = JUEGOS, desde = marco.contentWindow) =>
    w.dispatchEvent(new w.MessageEvent("message", { data: datos, origin: origen, source: desde }));

  llega({ tipo: "mr-mudanza-lista", version: 1 }, "https://otra.web");
  llega({ tipo: "mr-mudanza-lista", version: 1 }, JUEGOS, null);
  assert.equal(mandados.length, 0, "otra dirección u otra ventana no cuentan");
  llega({ tipo: "mr-mudanza-lista", version: 1 });
  assert.equal(mandados.length, 1);
  assert.equal(mandados[0].destino, JUEGOS, "el paquete va solo a la dirección de los juegos");
  assert.equal(mandados[0].mensaje, paquete);
  llega({ tipo: "mr-mudanza-hecha", version: 1, claves: { puestas: 1, yaEstaban: 0 }, registros: { puestos: 0, yaEstaban: 0 } });
  const respuesta = await conversacion;
  assert.equal(respuesta.tipo, "mr-mudanza-hecha");
  assert.equal(w.document.querySelector("iframe"), null, "el marco se quita al terminar");
  w.close();
});

test("sin respuesta en el plazo, la conversación acaba en nada y quita el marco", async () => {
  const w = ladoDeLaPagina();
  const respuesta = await w.MRJuegosAparte.hablarConLaMudanza(w, JUEGOS, { tipo: "mr-mudanza", version: 1 }, 50);
  assert.equal(respuesta, null);
  assert.equal(w.document.querySelector("iframe"), null);
  w.close();
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
