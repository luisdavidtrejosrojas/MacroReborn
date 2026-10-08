// ==============================
// LA MODERACIÓN EN EL NAVEGADOR — tests/moderacion-navegador.test.js
// ==============================
// La parte del navegador de las sanciones del 28/09/2026
// (api/_sanciones.js, docs/referencia/MODERACION.md):
//
//   - el login de una cuenta baneada dice el motivo y dónde reclamar;
//   - la franja de una cuenta suspendida dice hasta cuándo y por qué, con
//     el motivo como texto (antes iba por innerHTML);
//   - el panel manda cada acción al servidor y dice lo que contestó;
//   - los botones del panel según quién mira y a quién.
//
// Los archivos de verdad (js/login.js, js/motor/permisos.js y un trozo de
// js/admin.js) en jsdom o vm; la red es de mentira.
//
// Correr:  npm test

const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const raiz = path.join(__dirname, "..");
const leer = (...p) => fs.readFileSync(path.join(raiz, ...p), "utf8").replace(/\r\n/g, "\n");
const DISCORD = "https://discord.gg/tKjfsQ7GdG";
const esperar = async () => { for (let i = 0; i < 10; i++) await new Promise(r => setTimeout(r, 0)); };

describe("el login de una cuenta baneada", () => {

  test("dice el motivo, como texto, y dónde reclamar; y no guarda ninguna sesión", async () => {
    const dom = new JSDOM(`<div id="cardLogin"><form id="formLogin">
      <input id="usuario" value="troll"><input id="password" type="password" value="clave">
      </form><div id="mensajeLogin"></div></div>`, { url: "https://www.macroreborn.com/login.html", runScripts: "outside-only" });
    const w = dom.window;
    w.fetch = async () => ({ status: 403, json: async () => ({
      success: false, codigo: "cuenta-baneada", error: "Esta cuenta está baneada.",
      motivo: "Nombre <b>inapropiado</b>", reclamar: DISCORD }) });
    w.eval(leer("js", "login.js"));
    w.document.getElementById("formLogin").dispatchEvent(new w.Event("submit", { cancelable: true }));
    await esperar();

    const mensaje = w.document.getElementById("mensajeLogin");
    assert.match(mensaje.textContent, /^Esta cuenta está baneada\. Motivo: Nombre <b>inapropiado<\/b>\./);
    assert.equal(mensaje.querySelector("b"), null, "el motivo entró como HTML");
    assert.equal(mensaje.querySelector("a").getAttribute("href"), DISCORD);
    assert.equal(w.localStorage.getItem("macroSessionToken"), null);
    w.close();
  });

});

// js/motor/permisos.js entero, con la sesión y la red de mentira.
async function conPermisos(usuario, contestar) {
  const dom = new JSDOM("<!doctype html><body><nav class='nav-links'></nav></body>",
    { url: "https://www.macroreborn.com/perfil.html", runScripts: "outside-only" });
  const w = dom.window;
  const pedidas = [];
  w.MRSession = { get: () => ({ nombre: "ana" }) };
  w.fetch = async (url, init) => {
    pedidas.push({ url: String(url), init: init || {} });
    const cuerpo = contestar ? contestar(String(url), init) : { success: true, user: usuario };
    return { ok: true, status: 200, json: async () => cuerpo };
  };
  // Las const de primer nivel de un script se ven desde los otros en el
  // navegador, pero no fuera de este eval de jsdom: se sacan aquí.
  w.eval(leer("js", "motor", "permisos.js") +
    "\n;window.__panel = { advertirCuenta, suspenderUsuario, banearUsuario, reactivarUsuario };");
  await esperar();
  return { w, pedidas, franja: () => w.document.getElementById("avisoSuspension") };
}

describe("la franja de una cuenta suspendida", () => {

  test("dice hasta cuándo, en la hora de Argentina, el motivo como texto y dónde reclamar", async () => {
    const p = await conPermisos({ username: "ana", suspendido: true,
      suspendido_hasta: "2026-10-05T17:00:00Z", motivo_suspension: "Spam <img src=x onerror=alert(1)>" });
    const franja = p.franja();
    assert.ok(franja, "no salió la franja");
    assert.match(franja.textContent, /^🚫 Tu cuenta está suspendida hasta el 5\/10 a las 14:00 \(hora de Argentina\): podés jugar y mirar, pero no escribir\./);
    assert.match(franja.textContent, /Motivo: Spam <img src=x onerror=alert\(1\)>\./);
    assert.equal(franja.querySelector("img"), null, "el motivo entró como HTML");
    assert.equal(franja.querySelector("a").getAttribute("href"), DISCORD);
    p.w.close();
  });

  test("sin suspensión, nada", async () => {
    const p = await conPermisos({ username: "ana", suspendido: false });
    assert.equal(p.franja(), null);
    p.w.close();
  });

});

describe("lo que manda el panel", () => {

  test("cada acción va a su sitio, con lo justo, y vuelve la respuesta del servidor", async () => {
    const p = await conPermisos({ username: "ana" }, (url) =>
      url.includes("action=ban") ? { success: false, error: "Solo un administrador puede hacer esto" } : { success: true });
    const panel = p.w.__panel;
    const r1 = await panel.advertirCuenta("rafa", "insultos");
    const r2 = await panel.suspenderUsuario("rafa", "spam", 7);
    const r3 = await panel.banearUsuario("rafa", "troll");
    const r4 = await panel.reactivarUsuario("rafa");
    const enviadas = p.pedidas.filter(x => x.init.method === "POST").map(x => [x.url, JSON.parse(x.init.body)]);
    assert.deepStrictEqual(enviadas, [
      ["/api/users?action=warn", { username: "rafa", motivo: "insultos" }],
      ["/api/users?action=suspend", { username: "rafa", motivo: "spam", dias: 7 }],
      ["/api/users?action=ban", { username: "rafa", motivo: "troll" }],
      ["/api/users?action=reactivate", { username: "rafa" }]
    ]);
    assert.equal(r1.success, true);
    assert.equal(r2.success, true);
    assert.deepStrictEqual({ ...r3 }, { success: false, error: "Solo un administrador puede hacer esto" });
    assert.equal(r4.success, true);
    p.w.close();
  });

});

describe("los botones del panel", () => {

  // El trozo de js/admin.js con las acciones de moderación, en vm, con lo
  // que usa de mentira.
  const ADMIN = leer("js", "admin.js");
  const TROZO = ADMIN.slice(ADMIN.indexOf("  // ADVERTIR, SUSPENDER, BANEAR Y LEVANTAR"),
    ADMIN.indexOf("  // ==============================\n  // USUARIOS (solo administrador)"));
  const CORE = leer("js", "core.js");
  const MRTEXTO = CORE.slice(CORE.indexOf("const MRTexto = {"),
    CORE.indexOf("if (typeof window !== \"undefined\") window.MRTexto = MRTexto;"));

  function panel(o) {
    const llamadas = [];
    const avisos = [];
    const respuestas = [...(o.prompts || [])];
    const contexto = {
      activoAdmin: { nombre: "yo" },
      esAdmin: o.esAdmin,
      ROLES: { ADMINISTRADOR: "administrador" },
      obtenerInsignias: (n) => (n === "jefa" ? ["administrador"] : []),
      prompt: () => respuestas.shift(),
      confirm: () => o.confirmar !== false,
      alert: (t) => avisos.push(t),
      window: { MRModal: { show: (op) => op.actions.find(a => a.text === o.duracion).onClick() } },
      MRModal: { show: (op) => op.actions.find(a => a.text === o.duracion).onClick() },
      advertirCuenta: async (...a) => { llamadas.push(["advertir", ...a]); return o.respuesta || { success: true }; },
      suspenderUsuario: async (...a) => { llamadas.push(["suspender", ...a]); return o.respuesta || { success: true }; },
      banearUsuario: async (...a) => { llamadas.push(["banear", ...a]); return o.respuesta || { success: true }; },
      reactivarUsuario: async (...a) => { llamadas.push(["levantar", ...a]); return o.respuesta || { success: true }; }
    };
    vm.createContext(contexto);
    vm.runInContext(MRTEXTO + "\n" + TROZO + "\nthis.botonesSancion = botonesSancion; this.accionModeracion = accionModeracion;", contexto);
    const botones = (nombre, estado) => {
      const d = new JSDOM(`<div>${contexto.botonesSancion(nombre, estado)}</div>`).window.document;
      return [...d.querySelectorAll("button, span")].map(b => b.textContent.trim());
    };
    return { contexto, llamadas, avisos, botones };
  }

  test("un administrador ve advertir, suspender y banear; y levantar lo que haya", () => {
    const p = panel({ esAdmin: true });
    assert.deepStrictEqual(p.botones("rafa", {}), ["⚠️ Advertir", "🚫 Suspender", "⛔ Banear"]);
    assert.deepStrictEqual(p.botones("rafa", { suspendido: true }), ["⚠️ Advertir", "✅ Levantar suspensión", "⛔ Banear"]);
    assert.deepStrictEqual(p.botones("rafa", { baneado: true }), ["⚠️ Advertir", "✅ Levantar baneo"]);
  });

  test("un moderador no banea, ni levanta baneos", () => {
    const p = panel({ esAdmin: false });
    assert.deepStrictEqual(p.botones("rafa", {}), ["⚠️ Advertir", "🚫 Suspender"]);
    assert.deepStrictEqual(p.botones("rafa", { baneado: true }), ["⚠️ Advertir"]);
  });

  test("a un administrador no se le sanciona, ni a uno mismo", () => {
    const p = panel({ esAdmin: true });
    assert.deepStrictEqual(p.botones("jefa", {}), ["👑 Administrador: no se sanciona"]);
    assert.deepStrictEqual(p.botones("yo", {}), []);
  });

  test("suspender pregunta la duración y el motivo, que es obligatorio", async () => {
    const p = panel({ esAdmin: false, duracion: "7 días", prompts: ["   ", "Spam en el chat"] });
    assert.equal(await p.contexto.accionModeracion("suspender", "rafa"), true);
    assert.deepStrictEqual(p.llamadas, [["suspender", "rafa", "Spam en el chat", 7]]);
    assert.deepStrictEqual(p.avisos, ["El motivo es obligatorio: es lo que va a leer esa persona."]);
  });

  test("cancelar no manda nada", async () => {
    const p = panel({ esAdmin: true, duracion: "Cancelar" });
    assert.equal(await p.contexto.accionModeracion("suspender", "rafa"), false);
    const q = panel({ esAdmin: true, prompts: [null] });
    assert.equal(await q.contexto.accionModeracion("advertir", "rafa"), false);
    assert.deepStrictEqual([...p.llamadas, ...q.llamadas], []);
  });

  test("si el servidor dice que no, el panel lo cuenta en vez de darlo por hecho", async () => {
    const p = panel({ esAdmin: true, prompts: ["troll"], respuesta: { success: false, error: "Esa cuenta ya está baneada" } });
    assert.equal(await p.contexto.accionModeracion("banear", "rafa"), false);
    assert.deepStrictEqual(p.avisos, ["No se pudo: Esa cuenta ya está baneada."]);
  });

});
