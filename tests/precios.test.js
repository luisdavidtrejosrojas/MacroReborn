// ==============================
// LOS PRECIOS POR RAREZA — tests/precios.test.js
// ==============================
// Desde el 04/10/2026 el precio de una prenda lo da su rareza
// (api/_precios.js, docs/ECONOMIA.md). La migración 027 puso la rareza a
// lo que ya estaba a la venta, por el precio que tenía, con su propia
// copia en SQL de los cortes y de los precios, porque no puede leer el
// módulo. Si alguien cambia una y no la otra, una prenda subida desde el
// panel costaría distinto que una de las de antes sin que nadie lo
// hubiera decidido. Esto lo impide, y comprueba que con esos cortes
// ninguna prenda subió de precio.
//
// Correr:  npm test

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, describe, before } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const precios = require("../api/_precios");
const { crearBaseLocal } = require("../scripts/pglite");

const MIGRACION = fs.readFileSync(path.join(__dirname, "..", "migrations", "027_rareza_de_las_prendas.sql"), "utf8");

test("cuatro rarezas, de la más barata a la más cara", () => {
  assert.deepStrictEqual([...precios.RAREZAS], ["comun", "rara", "epica", "legendaria"]);
  const lista = precios.RAREZAS.map(r => precios.PRECIO_POR_RAREZA[r]);
  assert.deepStrictEqual(lista, [50, 500, 1400, 6000]);
  for (const r of precios.RAREZAS) assert.ok(precios.NOMBRE_DE_RAREZA[r], "falta el nombre de " + r);
});

test("los precios de la migración son los del módulo", () => {
  const enSql = {};
  for (const m of MIGRACION.matchAll(/WHEN '(\w+)'\s+THEN (\d+)/g)) enSql[m[1]] = Number(m[2]);
  const otro = MIGRACION.match(/ELSE (\d+)\s+END;/);
  assert.ok(otro, "la migración ya no tiene ELSE en los precios");
  enSql.comun = Number(otro[1]);
  assert.deepStrictEqual(enSql, { ...precios.PRECIO_POR_RAREZA });
});

test("los cortes de la migración son los de rarezaPorPrecio", () => {
  const cortes = [...MIGRACION.matchAll(/WHEN precio >= (\d+)\s+THEN '(\w+)'/g)].map(m => [Number(m[1]), m[2]]);
  assert.deepStrictEqual(cortes, [[15000, "legendaria"], [3001, "epica"], [500, "rara"]]);
  for (const [desde, rareza] of cortes) {
    assert.equal(precios.rarezaPorPrecio(desde), rareza, "desde " + desde);
    assert.notEqual(precios.rarezaPorPrecio(desde - 1), rareza, "justo antes de " + desde);
  }
  assert.equal(precios.rarezaPorPrecio(499), "comun");
});

test("con esos cortes ninguna prenda sube de precio", () => {
  // Lo más barato que había a la venta costaba 50. De ahí en adelante, el
  // precio nuevo nunca pasa del de antes.
  for (let antes = 50; antes <= 60000; antes += antes < 1000 ? 1 : 7) {
    const nuevo = precios.precioDeRareza(precios.rarezaPorPrecio(antes));
    assert.ok(nuevo <= antes, `${antes} pasaría a ${nuevo}`);
  }
});

test("rarezaDelPedido: la rareza si es buena; si no, la del precio; si no hay nada, null", () => {
  assert.equal(precios.rarezaDelPedido({ rareza: "epica" }), "epica");
  assert.equal(precios.rarezaDelPedido({ rareza: "epica", precio: 50 }), "epica");
  assert.equal(precios.rarezaDelPedido({ rareza: "mitica", precio: 2500 }), "rara");
  assert.equal(precios.rarezaDelPedido({ precio: "120" }), "comun");
  assert.equal(precios.rarezaDelPedido({ precio: 18400 }), "legendaria");
  for (const nada of [{}, { precio: "" }, { precio: 0 }, { precio: -5 }, { precio: "abc" }, { rareza: "" }, null]) {
    assert.equal(precios.rarezaDelPedido(nada), null, JSON.stringify(nada));
  }
});

test("precioDeRareza: la de la tabla, o la común si no existe", () => {
  assert.equal(precios.precioDeRareza("legendaria"), 6000);
  assert.equal(precios.precioDeRareza("no-existe"), precios.PRECIO_POR_RAREZA.comun);
  assert.equal(precios.precioDeRareza("constructor"), precios.PRECIO_POR_RAREZA.comun);
});

describe("la migración 027 sobre una tienda de antes", () => {
  let db;
  const PRUEBAS = [
    ["prueba_boca1", 50, "comun", 50],
    ["prueba_mascota1", 220, "comun", 50],
    ["prueba_pelo1", 499, "comun", 50],
    ["prueba_pelo2", 500, "rara", 500],
    ["prueba_remera1", 2900, "rara", 500],
    ["prueba_remera2", 3001, "epica", 1400],
    ["prueba_pantalon1", 14240, "epica", 1400],
    ["prueba_mascota2", 15000, "legendaria", 6000],
    ["prueba_borde1", 50000, "legendaria", 6000]
  ];

  before(async () => {
    db = await crearBaseLocal();
    // La base de las pruebas ya trae la 027; se vuelve a la tienda de antes.
    await db.query("ALTER TABLE avatar_shop_items DROP COLUMN rareza");
    for (const [valor, precio] of PRUEBAS) {
      await db.query(
        `INSERT INTO avatar_shop_items (categoria, modelo, valor_capa, nombre, precio) VALUES ('pelo', 'tora', $1, $1, $2)`,
        [valor, precio]);
    }
    await db.exec(MIGRACION);
  });

  test("cada prenda toma la rareza de su precio, y el precio de su rareza", async () => {
    const filas = (await db.query("SELECT valor_capa, rareza, precio FROM avatar_shop_items WHERE valor_capa LIKE 'prueba_%' ORDER BY id")).rows;
    assert.deepStrictEqual(filas.map(f => [f.valor_capa, f.rareza, f.precio]), PRUEBAS.map(([v, , r, p]) => [v, r, p]));
  });

  test("se puede aplicar dos veces sin cambiar nada", async () => {
    const antes = (await db.query("SELECT valor_capa, rareza, precio FROM avatar_shop_items ORDER BY id")).rows;
    await db.exec(MIGRACION);
    const despues = (await db.query("SELECT valor_capa, rareza, precio FROM avatar_shop_items ORDER BY id")).rows;
    assert.deepStrictEqual(despues, antes);
  });

  test("lo que entra después sin rareza es común, y una rareza inventada no entra", async () => {
    await db.query(`INSERT INTO avatar_shop_items (categoria, modelo, valor_capa, nombre, precio) VALUES ('boca', 'tora', 'prueba_boca9', 'b', 50)`);
    const r = await db.query("SELECT rareza FROM avatar_shop_items WHERE valor_capa = 'prueba_boca9'");
    assert.equal(r.rows[0].rareza, "comun");
    await assert.rejects(db.query(
      `INSERT INTO avatar_shop_items (categoria, modelo, valor_capa, nombre, precio, rareza) VALUES ('boca', 'tora', 'prueba_boca10', 'b', 50, 'mitica')`));
  });
});
