// ==============================
// EL PELO DE ATRÁS EN EL EDITOR — tests/editor-pelo-de-atras.test.js
// ==============================
// La capa nueva del 04/10/2026 (docs/AVATARES-SERVIDOR.md, sección 14)
// llegó sin dibujos. En el editor del perfil:
//
//   - su botón solo se ve en los personajes que ya tienen alguno, y si se
//     esconde el de la pestaña abierta se pasa a la del pelo;
//   - el avatar aleatorio elige por la capa de cada prenda: por el
//     nombre, "tora_peloatras1" pasaba por un pelo ("tora_pelo..."), y
//     salía puesto de pelo;
//   - y solo pone pelo de atrás la mitad de las veces.
//
// Se evalúan los trozos de verdad de js/perfil.js sobre el perfil.html de
// verdad, como tests/editor-tienda.test.js.
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
// Sin los CR: en Windows la copia de trabajo está en CRLF.
const FUENTE = fs.readFileSync(path.join(RAIZ, "js", "perfil.js"), "utf8").replace(/\r\n/g, "\n");
const CORE = fs.readFileSync(path.join(RAIZ, "js", "core.js"), "utf8");
const HTML = fs.readFileSync(path.join(RAIZ, "perfil.html"), "utf8");

function trozo(desde, hasta) {
  const i = FUENTE.indexOf(desde);
  const j = FUENTE.indexOf(hasta, i);
  assert.ok(i !== -1 && j > i, "no está el trozo que empieza por " + desde);
  return FUENTE.slice(i, j);
}

// En el orden del archivo, con el avatar aleatorio.
const TROZOS = [
  trozo("// ---------- PESTAÑAS ----------", "// ---------- PERFIL ----------"),
  trozo("let CATALOGO = null;", "// ---------- AVATAR (Neon: users.avatar) ----------"),
  trozo("// ---------- CENTRO DE AVATARES (tienda) ----------", "// ---------- PREVIEW EDITOR ----------"),
  trozo("// ---------- FILTRAR OPCIONES SEGÚN EL MODELO ELEGIDO ----------", "// ---------- GUARDAR AVATAR ----------"),
  trozo("// ---------- AVATAR ALEATORIO ----------", "// ---------- OPCIONES EDITOR (con toggle para deseleccionar) ----------"),
  trozo("// ---------- OPCIONES EDITOR (con toggle para deseleccionar) ----------", "// ---------- INICIO ----------")
];

// La lista de capas, de js/core.js.
const ORDEN = (() => {
  const k = CORE.indexOf("const ORDEN_CAPAS_AVATAR");
  return CORE.slice(k, CORE.indexOf("];", k)).match(/"[a-z]+"/g).map(s => s.slice(1, -1));
})();

const prenda = (valor, modelo, capa) => ({
  valor, modelo, capa, nombre: valor, precio: null,
  previsualizacion: "/previsualizaciones/" + valor + ".jpg?v=aaaaaaaaaaaa"
});

// Tora tiene pelo y pelo de atrás; cereza, solo pelo.
const CATALOGO = {
  success: true,
  version: 1,
  capas: ORDEN,
  modelos: [prenda("tora", "tora", "modelo"), prenda("cereza", "cereza", "modelo")],
  prendas: [
    prenda("tora_pelo1", "tora", "pelo"),
    prenda("tora_peloatras1", "tora", "peloatras"),
    prenda("cereza_pelo1", "cereza", "pelo")
  ]
};

// Nada a la venta: todo se puede poner.
const TIENDA = { success: true, items: [], comprados: [], monedas: 500 };

async function montar() {
  const dom = new JSDOM(HTML, { url: "https://www.macroreborn.com/perfil.html", runScripts: "outside-only" });
  const direccion = { search: "", pathname: "/perfil.html", hash: "", href: "https://www.macroreborn.com/perfil.html" };

  const contexto = {
    document: dom.window.document,
    window: { location: direccion, addEventListener() {} },
    location: direccion,
    history: { replaceState() {} },
    URLSearchParams,
    console: { warn() {}, error() {}, log() {} },
    confirm: () => false,
    fetch: async (url) => ({
      ok: true,
      status: 200,
      json: async () => url.includes("avatar-catalogo-completo") ? CATALOGO : TIENDA
    }),
    ORDEN_CAPAS_AVATAR: ORDEN,
    cargarAvatar: () => ({ modelo: "tora" }),
    avatarEsPNG: () => false,
    actualizarPreview: () => {},
    actualizarAvatarPrincipal: () => {}
  };
  vm.createContext(contexto);
  for (const t of TROZOS) vm.runInContext(t, contexto);
  await new Promise(r => setTimeout(r, 20));

  const d = dom.window.document;
  d.getElementById("botonCrearAvatar").click();

  return {
    d,
    boton: () => d.querySelector('.cat-btn[data-cat="peloatras"]'),
    pestana: () => d.querySelector(".cat-btn.activa-cat").dataset.cat,
    elegir: (valor) => d.querySelector(`.opcion-item[data-valor="${valor}"]`).click(),
    capas: () => vm.runInContext("({ ...editorCapas })", contexto),
    // Lo que irá devolviendo Math.random, en orden; después, 0.99.
    azar: (valores) => vm.runInContext(
      `Math.random = (() => { const cola = ${JSON.stringify(valores)}; return () => cola.length ? cola.shift() : 0.99; })();`,
      contexto)
  };
}

test("el botón solo se ve en un personaje que ya tiene alguno", async () => {
  const e = await montar();
  assert.equal(e.boton().hidden, false, "tora tiene uno");
  e.elegir("cereza");
  assert.equal(e.boton().hidden, true, "cereza todavía no");
  e.elegir("tora");
  assert.equal(e.boton().hidden, false);
});

test("si se esconde con su pestaña abierta, se pasa a la del pelo", async () => {
  const e = await montar();
  e.boton().click();
  assert.equal(e.pestana(), "peloatras");
  e.elegir("cereza");
  assert.equal(e.boton().hidden, true);
  assert.equal(e.pestana(), "pelo");
});

test("se pone y se quita como cualquier capa, sin tocar el pelo", async () => {
  const e = await montar();
  e.elegir("tora_pelo1");
  e.elegir("tora_peloatras1");
  assert.equal(e.capas().peloatras, "tora_peloatras1");
  assert.equal(e.capas().pelo, "tora_pelo1");
  e.elegir("tora_peloatras1");
  assert.equal(e.capas().peloatras, "ninguno");
  assert.equal(e.capas().pelo, "tora_pelo1");
});

test("el avatar aleatorio no pone un pelo de atrás de pelo", async () => {
  const e = await montar();
  // Tora; después, siempre la última opción, y con pelo de atrás.
  e.azar([0]);
  e.d.getElementById("avatarAleatorio").click();
  const c = e.capas();
  assert.equal(c.modelo, "tora");
  assert.equal(c.pelo, "tora_pelo1");
  assert.equal(c.peloatras, "tora_peloatras1");
});

test("y el pelo de atrás solo sale la mitad de las veces", async () => {
  const e = await montar();
  // Tora; y al llegar al pelo de atrás, un 0.2: esa vez no.
  e.azar([0, 0.2]);
  e.d.getElementById("avatarAleatorio").click();
  const c = e.capas();
  assert.equal(c.peloatras, "ninguno");
  assert.equal(c.pelo, "tora_pelo1");
});
