// ==============================
// LA TARJETA DEL PERFIL — tests/tarjeta-perfil.test.js
// ==============================
// Del rediseño de la tarjeta del perfil (zips "Corazones" y "per" del
// otro dev, integrados el 28/09/2026): la chapa del nivel lleva solo el
// número, y la medalla del pie, los puntos de logros en corto. Se evalúa
// la sección de verdad de js/core.js ("LA CHAPA DEL NIVEL").
//
// Correr:  npm test

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const CORE = fs.readFileSync(path.join(__dirname, "..", "js", "core.js"), "utf8").replace(/\r\n/g, "\n");
const i = CORE.indexOf("// LA CHAPA DEL NIVEL");
const j = CORE.indexOf("// ESCAPAR TEXTO ANTES DE METERLO EN HTML");
const contexto = {};
vm.createContext(contexto);
vm.runInContext(CORE.slice(i, j), contexto);

// Lo justo de un elemento del DOM.
function elemento() {
  const clases = new Set();
  const atributos = {};
  return {
    textContent: "", title: "",
    classList: {
      toggle(c, si) { if (si) clases.add(c); else clases.delete(c); },
      contains: (c) => clases.has(c)
    },
    setAttribute(n, v) { atributos[n] = v; },
    atributos
  };
}

test("la chapa del nivel: solo el número, y Nivel N para quien lo lea", () => {
  const el = elemento();
  contexto.pintarChapaNivel(el, 12);
  assert.equal(el.textContent, "12");
  assert.equal(el.title, "Nivel 12");
  assert.equal(el.atributos["aria-label"], "Nivel 12");
  assert.equal(el.classList.contains("nivel-largo"), false);
});

test("con tres cifras o más, la letra baja", () => {
  const el = elemento();
  contexto.pintarChapaNivel(el, 150);
  assert.equal(el.classList.contains("nivel-largo"), true);
  contexto.pintarChapaNivel(el, 12345);
  assert.equal(el.classList.contains("nivel-muy-largo"), true);
  contexto.pintarChapaNivel(el, 7);
  assert.equal(el.classList.contains("nivel-largo"), false);
});

test("sin nivel, o con uno raro, la chapa dice 1", () => {
  const el = elemento();
  for (const raro of [undefined, null, 0, -3, "abc"]) {
    contexto.pintarChapaNivel(el, raro);
    assert.equal(el.textContent, "1", String(raro));
  }
});

test("la medalla: los puntos en corto, y enteros en el title", () => {
  const casos = [[0, "0"], [950, "950"], [1000, "1K"], [1234, "1.2K"], [1950, "2K"], [9999, "10K"], [12345, "12K"], [150000, "150K"]];
  for (const [puntos, corto] of casos) {
    const el = elemento();
    contexto.pintarMedallaLogros(el, puntos);
    assert.equal(el.textContent, corto, String(puntos));
    assert.equal(el.title, puntos + " puntos de logros");
  }
});

test("sin elemento, ninguna de las dos rompe", () => {
  contexto.pintarChapaNivel(null, 5);
  contexto.pintarMedallaLogros(null, 5);
});
