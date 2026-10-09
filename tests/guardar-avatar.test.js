// ==============================
// GUARDAR EL AVATAR — tests/guardar-avatar.test.js
// ==============================
// El botón Guardar del editor no miraba si el servidor había aceptado el
// avatar: si lo rechazaba, el editor se cerraba igual, no decía nada y hasta
// daba el logro "primer avatar" (punto 32 de la auditoría,
// specs/005-arreglos-rapidos/spec.md). Ahora, si falla, el editor sigue
// abierto y se dice por qué, y el logro llega solo al guardar de verdad.
//
// Se evalúan los trozos de verdad de js/perfil.js (guardarAvatar y el
// botón) sobre el perfil.html de verdad, con la ventana de js/modal.js.
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
const FUENTE = fs.readFileSync(path.join(RAIZ, "js", "perfil.js"), "utf8").replace(/\r\n/g, "\n");
const HTML = fs.readFileSync(path.join(RAIZ, "perfil.html"), "utf8");
const MODAL = fs.readFileSync(path.join(RAIZ, "js", "modal.js"), "utf8");

function trozo(desde, hasta) {
  const i = FUENTE.indexOf(desde);
  const j = FUENTE.indexOf(hasta, i);
  assert.ok(i !== -1 && j > i, "no está el trozo que empieza por " + desde);
  return FUENTE.slice(i, j);
}

const GUARDAR = trozo("async function guardarAvatar(avatar){", "// ---------- AVATAR PNG EXCLUSIVO DE ADMINISTRADOR ----------");
const BOTON = trozo("// ---------- GUARDAR AVATAR ----------", "// ---------- AVATAR ALEATORIO ----------");

const esperar = () => new Promise((ok) => setTimeout(ok, 30));

// El editor abierto, con el servidor contestando lo que diga "servidor".
function editor(servidor) {
  const dom = new JSDOM(HTML, { url: "http://localhost/perfil.html", runScripts: "outside-only", virtualConsole: new VirtualConsole() });
  const w = dom.window;
  w.eval(MODAL);
  const cuenta = { pedidas: 0, logros: 0 };
  w.fetch = async (...args) => { cuenta.pedidas++; return servidor(...args); };
  w.desbloquearLogro = () => { cuenta.logros++; };
  w.actualizarPuntosLogrosUI = () => {};
  w.renderLogros = () => {};
  w.actualizarAvatarPrincipal = () => {};
  w.eval("var datosUsuario = { nombre: 'luis', avatar: { modelo: 'tora' } };"
       + "var editorCapas = { modelo: 'tora', pelo: 'pelo-nuevo' };");
  w.eval(GUARDAR);
  w.eval(BOTON);
  w.document.getElementById("editorAvatar").style.display = "block";
  const abierto = () => w.document.getElementById("editorAvatar").style.display !== "none";
  const mensaje = () => (w.document.querySelector(".mr-modal-message") || {}).textContent || null;
  const pulsar = () => w.document.getElementById("guardarAvatar").click();
  return { w, cuenta, abierto, mensaje, pulsar };
}

const respuesta = (codigo, cuerpo) => ({ ok: codigo >= 200 && codigo < 300, status: codigo, json: async () => cuerpo });

test("si el servidor lo rechaza, el editor sigue abierto, dice el motivo y no da el logro", async () => {
  const e = editor(async () => respuesta(400, { success: false, error: 'La prenda "pelo-nuevo" no existe' }));
  e.pulsar();
  await esperar();
  assert.equal(e.abierto(), true, "el editor se cerró");
  assert.equal(e.mensaje(), 'La prenda "pelo-nuevo" no existe');
  assert.equal(e.cuenta.logros, 0, "dio el logro por un guardado que falló");
  assert.deepStrictEqual(JSON.parse(e.w.eval("JSON.stringify(datosUsuario.avatar)")), { modelo: "tora" },
    "no volvió al avatar de antes");
});

test("sin conexión, el editor sigue abierto y sale un motivo general", async () => {
  const e = editor(async () => { throw new Error("sin red"); });
  e.pulsar();
  await esperar();
  assert.equal(e.abierto(), true);
  assert.match(e.mensaje() || "", /No se pudo guardar/);
  assert.equal(e.cuenta.logros, 0);
});

test("si lo acepta, todo como siempre: se cierra el editor y llega el logro", async () => {
  const e = editor(async () => respuesta(200, { success: true, user: { avatar_compuesto: "abc" } }));
  e.pulsar();
  await esperar();
  assert.equal(e.abierto(), false, "el editor sigue abierto");
  assert.equal(e.mensaje(), null, "salió una ventana de error");
  assert.equal(e.cuenta.logros, 1);
});

test("mientras guarda, otro clic no manda otro guardado", async () => {
  let soltar;
  const e = editor(() => new Promise((ok) => { soltar = () => ok(respuesta(200, { success: true, user: {} })); }));
  e.pulsar();
  e.pulsar();
  await esperar();
  assert.equal(e.cuenta.pedidas, 1);
  soltar();
  await esperar();
  assert.equal(e.abierto(), false);
});
