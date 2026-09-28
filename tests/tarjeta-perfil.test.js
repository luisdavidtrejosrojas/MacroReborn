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

// ==============================
// EL AVATAR ENTERO Y EL NOMBRE DENTRO (28/09/2026)
// ==============================
// La tarjeta del zip "per" recortaba el dibujo en escritorio (caja de alto
// fijo con object-fit: cover). Se decidió enseñarlo entero y llevar el
// nombre dentro de la imagen, sobre un degradado. Aquí se sujeta que esa
// sección siga siendo la última palabra de la hoja sobre la tarjeta.

const HOJA = fs.readFileSync(path.join(__dirname, "..", "css", "perfil-macrojuegos-light.css"), "utf8").replace(/\r\n/g, "\n");
// La última aparición: la cabecera de la hoja también la nombra.
const SECCION = HOJA.lastIndexOf("EL AVATAR ENTERO Y EL NOMBRE DENTRO DE LA IMAGEN");

// El cuerpo de la regla que empieza con `selector` dentro de la sección.
function regla(selector) {
  const k = HOJA.indexOf(selector + ",", SECCION);
  assert.ok(SECCION !== -1 && k !== -1, "no está la regla " + selector + " en la sección");
  return HOJA.slice(HOJA.indexOf("{", k), HOJA.indexOf("}", k));
}

test("la caja del avatar tiene la proporción del dibujo y lo enseña entero", () => {
  assert.match(regla("html .tarjeta-avatar .avatar"), /height: auto !important;[\s\S]*aspect-ratio: 327 \/ 504 !important;/);
  assert.match(regla("html .tarjeta-avatar .avatar img"), /object-fit: contain !important;/);
});

test("el nombre va dentro de la imagen, abajo, sobre un degradado", () => {
  const pie = regla("html .tarjeta-avatar-pie");
  assert.match(pie, /position: absolute !important;/);
  assert.match(pie, /bottom: 0 !important;/);
  assert.match(pie, /background: linear-gradient\(/);
  assert.match(regla("html .tarjeta-avatar-nombre"), /text-align: left !important;/);
});

test("y nada de la hoja lo pisa después: es la última regla de la tarjeta", () => {
  for (const pieza of [".tarjeta-avatar .avatar", ".tarjeta-avatar-pie", ".tarjeta-avatar-nombre"]) {
    assert.ok(HOJA.lastIndexOf(pieza) > SECCION, pieza + " se vuelve a tocar antes de la sección");
  }
  // Sin contar los comentarios, que cuentan lo que había antes.
  const reglas = HOJA.slice(HOJA.indexOf("*/", SECCION)).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/object-fit:\s*cover/.test(reglas), "hay un cover después de la sección");
  // Y la hoja se carga después de las otras que tocan la tarjeta.
  const perfil = fs.readFileSync(path.join(__dirname, "..", "perfil.html"), "utf8");
  const orden = ["css/perfil.css", "css/theme-canonical.css", "css/perfil-macrojuegos-light.css"].map(h => perfil.indexOf(h));
  assert.ok(orden.every(n => n !== -1) && orden[0] < orden[2] && orden[1] < orden[2], "perfil.html carga la hoja antes de tiempo");
});
