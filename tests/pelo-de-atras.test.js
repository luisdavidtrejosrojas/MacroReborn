// ==============================
// EL PELO DE ATRÁS — tests/pelo-de-atras.test.js
// ==============================
// Desde el 04/10/2026 el avatar tiene dos capas de pelo: "peloatras",
// justo debajo, y "pelo", encima (docs/referencia/AVATARES.md#14-el-pelo-de-atrás-dos-capas-de-pelo).
// Lo que se sujeta aquí es lo del servidor:
//
//   - se dibuja entre la cara y el pelo: tapa la ropa y el pelo lo tapa
//     a él;
//   - los avatares de antes, que no la llevan, conservan su huella, y
//     con ella su imagen y su dirección: no hay que recomponer nada;
//   - al guardar, una prenda de pelo de atrás va en su capa y en ninguna
//     otra;
//   - en la tienda se enseña como el pelo, encima del maniquí.
//
// Correr:  npm test

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const lienzo = require("../api/_lienzo");
const compositor = require("../api/_compositor");
const { CAPAS, validarAvatar, invalidarCache } = require("../api/_avatar-catalogo");
const AC = require("../api/_avatar-compuesto");
const { puesta } = require("../api/_previsualizacion");

const ANCHO = 327, ALTO = 504;
let db, sql, usuario;
const dibujos = {};

// Un dibujo de un color en las filas [desde, hasta), transparente el resto.
function png(r, g, b, desde, hasta) {
  const rgba = Buffer.alloc(ANCHO * ALTO * 4);
  for (let y = desde; y < hasta; y++) {
    for (let x = 0; x < ANCHO; x++) {
      const i = (y * ANCHO + x) * 4;
      rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255;
    }
  }
  return lienzo.escribirRGBA8({ rgba, ancho: ANCHO, alto: ALTO });
}

function pixel(img, x, y) {
  const i = (y * img.ancho + x) * 4;
  return [img.rgba[i], img.rgba[i + 1], img.rgba[i + 2]];
}

async function sembrar(valor, capa, binario, sha) {
  dibujos[valor] = binario;
  const arch = await db.query(
    `INSERT INTO avatar_archivos (sha256, datos, ancho, alto, peso) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [sha, binario, ANCHO, ALTO, binario.length]);
  await db.query(
    `INSERT INTO avatar_prendas (valor, modelo, capa, nombre, archivo_id) VALUES ($1, 'tora', $2, $1, $3)`,
    [valor, capa, arch.rows[0].id]);
}

before(async () => {
  db = await crearBaseLocal();
  sql = crearSqlPGlite(db);
  // El cuerpo entero; la remera, de arriba abajo; el pelo de atrás, de
  // arriba abajo; el pelo, solo la mitad de arriba.
  await sembrar("tora", "modelo", png(200, 180, 160, 0, ALTO), "a".repeat(64));
  await sembrar("tora_remera90", "remera", png(220, 30, 30, 0, ALTO), "b".repeat(64));
  await sembrar("tora_peloatras1", "peloatras", png(30, 160, 60, 0, ALTO), "c".repeat(64));
  await sembrar("tora_pelo90", "pelo", png(40, 60, 200, 0, ALTO / 2), "d".repeat(64));
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ('ana', 'hash', 1, 0, 'active', now(), now()) RETURNING id`);
  usuario = Number(r.rows[0].id);
  invalidarCache();
});

test("va justo debajo del pelo, y la mascota y el marco siguen encima de todo", () => {
  assert.equal(CAPAS.indexOf("peloatras") + 1, CAPAS.indexOf("pelo"));
  assert.ok(CAPAS.indexOf("peloatras") > CAPAS.indexOf("cara"));
  assert.deepStrictEqual(CAPAS.slice(-2), ["mascota", "borde"]);
});

test("tapa la ropa, y el pelo la tapa a ella", async () => {
  const receta = await AC.recetaDe(sql, {
    pelo: "tora_pelo90", peloatras: "tora_peloatras1", remera: "tora_remera90", modelo: "tora"
  });
  assert.deepStrictEqual(receta.capas.map(c => c.capa), ["modelo", "remera", "peloatras", "pelo"]);

  const img = compositor.componer(receta.archivos);
  assert.deepStrictEqual(pixel(img, 160, 100), [40, 60, 200], "arriba manda el pelo");
  assert.deepStrictEqual(pixel(img, 160, 400), [30, 160, 60], "abajo, el pelo de atrás sobre la remera");
});

test("un avatar de antes conserva su huella: no hay que recomponer nada", async () => {
  const antes = await AC.recetaDe(sql, { modelo: "tora", pelo: "tora_pelo90" });
  const ahora = await AC.recetaDe(sql, { modelo: "tora", pelo: "tora_pelo90", peloatras: "ninguno" });
  assert.equal(ahora.huella, antes.huella);
  const conEl = await AC.recetaDe(sql, { modelo: "tora", pelo: "tora_pelo90", peloatras: "tora_peloatras1" });
  assert.notEqual(conEl.huella, antes.huella);
});

test("al guardar, va en su capa y en ninguna otra", async () => {
  const bien = await validarAvatar(sql, usuario, { modelo: "tora", peloatras: "tora_peloatras1", pelo: "tora_pelo90" });
  assert.equal(bien.ok, true, bien.error);
  assert.equal(bien.avatar.peloatras, "tora_peloatras1");

  const mal = await validarAvatar(sql, usuario, { modelo: "tora", pelo: "tora_peloatras1" });
  assert.equal(mal.ok, false);
  assert.match(mal.error, /no es una prenda de pelo/);
});

test("en la tienda se enseña como el pelo: encima del maniquí, no detrás", () => {
  const img = puesta({ base: dibujos.tora, prenda: dibujos.tora_peloatras1, capa: "peloatras" });
  assert.deepStrictEqual(pixel(img, 160, 300), [30, 160, 60]);
});
