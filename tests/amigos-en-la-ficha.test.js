// ==============================
// LOS AMIGOS EN LA FICHA DE UN JUEGO — tests/amigos-en-la-ficha.test.js
// ==============================
// El panel "Tus amigos jugaron este juego" (portal-growth.js) busca el juego
// de la ficha en window.macroRebornJuegoActual, que solo definía una copia
// vieja de juego.js en la raíz, sin cargar en ninguna página: no salía
// nunca (punto 28 de la auditoría, specs/005-arreglos-rapidos/spec.md). Se
// prueba que js/juego.js lo expone, y que con él el panel enseña a los
// amigos que tienen el juego entre sus últimos.
//
// Correr:  npm test

const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const RAIZ = path.join(__dirname, "..");
const leer = (...partes) => fs.readFileSync(path.join(RAIZ, ...partes), "utf8");
const esperar = () => new Promise((ok) => setTimeout(ok, 30));

function ficha(id, respuestas = {}) {
  const dom = new JSDOM(leer("juego.html"), {
    url: "http://localhost/juego.html?id=" + id,
    runScripts: "outside-only",
    virtualConsole: new VirtualConsole()
  });
  const w = dom.window;
  w.fetch = async (url) => {
    const u = new URL(url, "http://localhost/");
    const clave = u.searchParams.get("action") + (u.searchParams.get("username") ? ":" + u.searchParams.get("username") : "");
    const cuerpo = clave in respuestas ? respuestas[clave] : { success: true, juegos: {} };
    return { ok: true, json: async () => cuerpo };
  };
  return w;
}

test("js/juego.js expone el juego de la ficha", () => {
  const w = ficha(5);
  w.eval(leer("js", "datos-juegos.js"));
  w.eval(leer("js", "juego.js"));
  assert.ok(w.macroRebornJuegoActual, "no hay window.macroRebornJuegoActual");
  assert.equal(w.macroRebornJuegoActual.id, 5);
});

describe("el panel de los amigos", () => {
  async function panel(respuestas, sesion = { username: "luis", nombre: "luis" }) {
    const w = ficha(5, respuestas);
    if (sesion) w.localStorage.setItem("usuarioActivo", JSON.stringify(sesion));
    w.eval(leer("js", "datos-juegos.js"));
    w.eval(leer("js", "juego.js"));
    w.eval(leer("portal-growth.js"));
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    await esperar();
    return w.document.getElementById("mrJuegoAmigos");
  }

  test("enseña a los amigos que lo tienen entre sus últimos juegos, y solo a ellos", async () => {
    const host = await panel({
      "friends:luis": { success: true, amigos: [{ username: "ana", level: 7 }, { username: "beto", level: 2 }] },
      "game-history:ana": { success: true, historial: [9, 5, 1] },
      "game-history:beto": { success: true, historial: [9, 3] }
    });
    assert.match(host.textContent, /Tus amigos jugaron este juego/);
    assert.match(host.textContent, /@ana/);
    assert.match(host.textContent, /Nivel 7/);
    assert.doesNotMatch(host.textContent, /@beto/);
  });

  test("si ninguno lo jugó, lo dice", async () => {
    const host = await panel({
      "friends:luis": { success: true, amigos: [{ username: "beto", level: 2 }] },
      "game-history:beto": { success: true, historial: [9] }
    });
    assert.match(host.textContent, /Ninguno de tus amigos lo tiene entre sus últimos juegos/);
  });

  test("sin amigos, invita a agregarlos; sin sesión, no sale", async () => {
    const sinAmigos = await panel({ "friends:luis": { success: true, amigos: [] } });
    assert.match(sinAmigos.textContent, /Agregá amigos/);
    const sinSesion = await panel({}, null);
    assert.equal(sinSesion.textContent.trim(), "");
  });
});
