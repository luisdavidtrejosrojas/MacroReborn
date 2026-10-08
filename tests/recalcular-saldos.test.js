// ==============================
// REHACER LOS SALDOS — tests/recalcular-saldos.test.js
// ==============================
// Con la economía nueva (04/10/2026) cada cuenta pasa a tener lo que
// habría juntado si las reglas nuevas hubieran estado siempre, y a nadie
// le baja (scripts/recalcular-saldos.js, docs/historia/SALDOS-REHECHOS.md). Se prueba la
// cuenta regla por regla, y después el script entero contra una base
// PGlite: lo que lee, lo que escribe y que no pisa lo ganado mientras
// tanto.
//
// Correr:  npm test

require("./_aislar-datos");   // antes de api/ y scripts/: ver ese archivo

const { test, describe } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { calcular, leerCuentas, aplicarCambios } = require("../scripts/recalcular-saldos");

const SIN_PRECIOS = new Map();
const cuenta = (extra) => Object.assign({
  id: 1, nombre: "ana", nivel: 1, monedas: 500, diasAntes: 0,
  minutos: {}, misiones: [], logros: [], compras: []
}, extra);

describe("la cuenta de cada uno", () => {
  test("una cuenta sin nada se queda con la bienvenida", () => {
    const r = calcular(cuenta(), SIN_PRECIOS);
    assert.equal(r.nuevo, 500);
    assert.equal(r.diferencia, 0);
  });

  test("cada día jugado antes del 25/09 vale 60, lo de jugar media hora", () => {
    const r = calcular(cuenta({ diasAntes: 3 }), SIN_PRECIOS);
    assert.equal(r.desglose.jugarAntes, 180);
    assert.equal(r.nuevo, 680);
  });

  test("desde el 25/09, los minutos de verdad con 120 al día como mucho, y la racha", () => {
    const r = calcular(cuenta({ minutos: {
      "2026-09-24": 500,     // de antes: no vale (la tabla empezó vacía, pero por si acaso)
      "2026-09-25": 300,     // se pagan 120: 12 premios de 20
      "2026-09-26": 25,      // 2 premios
      "2026-09-28": 10       // 1 premio; se cortó la racha
    } }), SIN_PRECIOS);
    assert.equal(r.desglose.jugarDespues, 240 + 40 + 20);
    assert.equal(r.desglose.racha, 5 + 10 + 5);
    assert.equal(r.nuevo, 500 + 300 + 20);
  });

  test("la racha da como mucho 35 al día", () => {
    const minutos = {};
    for (let d = 25; d <= 30; d++) minutos[`2026-09-${d}`] = 10;
    for (let d = 1; d <= 3; d++) minutos[`2026-10-0${d}`] = 10;
    const r = calcular(cuenta({ minutos }), SIN_PRECIOS);
    assert.equal(r.desglose.racha, 5 + 10 + 15 + 20 + 25 + 30 + 35 + 35 + 35);
  });

  test("las misiones, con los premios de ahora; una que ya no existe, con un 25 % más", () => {
    const r = calcular(cuenta({ misiones: [
      { clave: "daily_3_games", monedas: 35, xp: 0 },
      { clave: "weekly_180_minutes", monedas: 300, xp: 0 },
      { clave: "una_que_ya_no_esta", monedas: 40, xp: 0 }
    ] }), SIN_PRECIOS);
    assert.equal(r.desglose.misiones, 44 + 375 + 50);
  });

  test("los logros dan sus puntos, salvo los de ranking y los de amigos", () => {
    const r = calcular(cuenta({ logros: ["primerJuego", "explorador", "top3", "numeroUno", "popular", "no_existe"] }), SIN_PRECIOS);
    assert.equal(r.desglose.logros, 10 + 25);
  });

  test("los niveles, hasta el que da el tiempo jugado, no el que tiene", () => {
    // Un día de antes son 300 de XP: nivel 3 (50 + 100 y le faltan 300).
    const r = calcular(cuenta({ nivel: 10, diasAntes: 1 }), SIN_PRECIOS);
    assert.equal(r.desglose.nivelJusto, 3);
    assert.equal(r.desglose.niveles, 15 * 2 + 15 * 3);
    // Y si tiene menos que eso, el que tiene.
    assert.equal(calcular(cuenta({ nivel: 2, diasAntes: 1 }), SIN_PRECIOS).desglose.niveles, 30);
  });

  test("lo comprado se resta al precio de hoy, y lo pagado de más se devuelve", () => {
    const precios = new Map([[1, 500], [2, 50]]);
    const r = calcular(cuenta({ monedas: 100, compras: [
      { item: 1, pagado: 1500 },   // le costó 1.500, hoy vale 500
      { item: 2, pagado: 0 },      // regalada: no cuenta
      { item: 2, pagado: null }    // de antes de apuntar precios: tampoco
    ] }), precios);
    assert.equal(r.desglose.gastado, 500);
    assert.equal(r.desglose.devolucion, 1000);
    assert.equal(r.nuevo, 1100, "lo que tenía más lo pagado de más, que es más que lo calculado (0)");
  });

  test("a nadie le baja", () => {
    const r = calcular(cuenta({ monedas: 5000 }), SIN_PRECIOS);
    assert.equal(r.nuevo, 5000);
    assert.equal(r.diferencia, 0);
  });

  test("el equipo se queda con lo calculado, sin restar lo comprado, aunque le baje", () => {
    const r = calcular(cuenta({ nombre: "Lucass", monedas: 1000000000, compras: [{ item: 1, pagado: 1500 }] }), new Map([[1, 500]]));
    assert.equal(r.equipo, true);
    assert.equal(r.nuevo, 500);
    assert.equal(r.diferencia, 500 - 1000000000);
  });
});

describe("el script contra una base", () => {
  test("lee de cada tabla, suma la diferencia y regala el catálogo al equipo", async () => {
    const db = await crearBaseLocal();
    const sql = crearSqlPGlite(db);
    const alta = async (nombre, saldo) => Number((await db.query(
      `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login, monedas)
       VALUES ($1, 'hash', 1, 0, 'active', now(), now(), $2) RETURNING id`, [nombre, saldo])).rows[0].id);
    const ana = await alta("ana", 500);
    const beto = await alta("beto", 100);
    const equipo = await alta("Lucass", 1000000000);
    const camisa = Number((await db.query(
      `INSERT INTO avatar_shop_items (categoria, modelo, valor_capa, nombre, precio, rareza)
       VALUES ('camisa', 'm', 'prueba_camisa', 'Camisa de prueba', 500, 'rara') RETURNING id`)).rows[0].id);

    // Ana: cuatro días antes del 25/09 (de tres tablas; dos veces el mismo
    // día cuenta uno, y lo de después no cuenta), dos días de minutos, una
    // misión y dos logros.
    await db.query(`INSERT INTO activity_log (user_id, tipo, created_at) VALUES
      ($1, 'prueba', '2026-09-10 12:00'), ($1, 'prueba', '2026-09-10 18:00'),
      ($1, 'prueba', '2026-09-11 09:00'), ($1, 'prueba', '2026-09-26 10:00')`, [ana]);
    await db.query(`INSERT INTO game_history (user_id, game_id, played_at) VALUES ($1, 'x', '2026-09-20 15:00')`, [ana]);
    await db.query(`INSERT INTO originales_scores (user_id, game_id, score, created_at) VALUES ($1, 'y', 100, '2026-09-21 15:00+00')`, [ana]);
    await db.query(`INSERT INTO actividad_diaria (user_id, dia, minutos) VALUES ($1, '2026-09-25', 300), ($1, '2026-09-26', 25)`, [ana]);
    await db.query(`INSERT INTO player_mission_claims (user_id, mission_key, period_key, reward_xp, reward_coins)
                    VALUES ($1, 'daily_3_games', '2026-09-26', 40, 35)`, [ana]);
    await db.query(`INSERT INTO achievements (user_id, achievement_id) VALUES ($1, 'primerJuego'), ($1, 'top3')`, [ana]);
    // Beto y el equipo compraron la camisa cuando costaba 1.500.
    await db.query(`INSERT INTO avatar_shop_purchases (user_id, item_id, precio_pagado) VALUES ($1, $3, 1500), ($2, $3, 1500)`, [beto, equipo, camisa]);

    const { cuentas, precios } = await leerCuentas(sql);
    const deAna = cuentas.find(c => c.id === ana);
    assert.equal(deAna.diasAntes, 4);
    assert.deepEqual(deAna.minutos, { "2026-09-25": 300, "2026-09-26": 25 });
    assert.equal(precios.get(camisa), 500);

    const filas = cuentas.map(c => calcular(c, precios));
    // Mientras se calcula, Ana sigue jugando: eso no se pierde.
    await db.query("UPDATE users SET monedas = monedas + 7 WHERE id = $1", [ana]);
    await aplicarCambios(sql, filas);

    const saldo = async (id) => Number((await db.query("SELECT monedas FROM users WHERE id = $1", [id])).rows[0].monedas);
    assert.equal(await saldo(ana), 500 + 240 + 280 + 15 + 44 + 10 + 7);
    assert.equal(await saldo(beto), 1100);
    assert.equal(await saldo(equipo), 500);

    const total = Number((await db.query("SELECT COUNT(*) AS n FROM avatar_shop_items")).rows[0].n);
    const suyas = await db.query("SELECT item_id, precio_pagado FROM avatar_shop_purchases WHERE user_id = $1", [equipo]);
    assert.equal(suyas.rows.length, total, "el equipo tiene todo el catálogo");
    assert.equal(Number(suyas.rows.find(f => Number(f.item_id) === camisa).precio_pagado), 1500, "lo que ya tenía no se toca");
    const deBeto = await db.query("SELECT COUNT(*) AS n FROM avatar_shop_purchases WHERE user_id = $1", [beto]);
    assert.equal(Number(deBeto.rows[0].n), 1, "a los jugadores no se les regala nada");
    await db.close();
  });
});
