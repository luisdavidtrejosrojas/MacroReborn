// ==============================
// TESTS DE MONEDAS — tests/monedas.test.js
// ==============================
// Prueban el "banco" del sitio (api/_monedas.js) y su enganche en los
// handlers REALES de la API (los mismos que corren en el servidor) contra
// una base local PGlite. Cero contacto con la base de producción:
// todo vive en esta computadora.
//
// Cómo funciona: antes de cargar la API, se crea la maqueta local y se
// la inyecta con api/_db.js (usarSqlLocal). Como cada archivo de test
// corre en su propio proceso, no hay contaminación con los tests de
// contraseñas.
//
// Qué se cubre (la regla del 04/10/2026, docs/ECONOMIA.md):
//   - El premio por jugar: de 10 a 30, solo en el minuto 10, 20, 30… del
//     día; entero hasta el 120, a mitad hasta el 240 y después nada.
//   - La racha (5 por día seguido, hasta 35) y subir de nivel (15 × el
//     nivel), sumados en el mismo pulso.
//   - gastar(): rechaza compras sin saldo suficiente.
//   - El enganche real en POST /api/users?action=xp.
//   - La compra real en POST /api/content?action=avatar-shop-buy.
//
// Correr:  npm test   (o: node --test tests/)

// Los handlers de escrituras del main actual exigen una sesión firmada.
// Este secreto solo vive en el proceso de pruebas y nunca se usa en producción.
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");
const {
  PREMIO_MINIMO,
  PREMIO_MAXIMO,
  premioAlAzar,
  premioDelMinuto,
  monedasPorRacha,
  monedasPorNivel,
  MonedasService
} = require("../api/_monedas");

// Saldo con el que arranca todo usuario (migración 012).
const SALDO_INICIAL = 500;

// Un azar fijo: con 0 sale el mínimo; con 0.5, 10 + floor(0.5 × 21) = 20.
const AL_MINIMO = () => 0;
const AL_MEDIO = () => 0.5;

let db;
let sql;
let monedas;
let usersHandler;
let contentHandler;

before(async () => {
  db = await crearBaseLocal();
  sql = crearSqlPGlite(db);
  usarSqlLocal(sql);

  monedas = new MonedasService(sql);

  // La tienda solo vende lo que tiene prenda publicada, y la base de
  // las pruebas nace sin prendas: las de la migración 012 se dan de alta
  // aquí, publicadas, como están en producción.
  const archivo = await db.query(
    `INSERT INTO avatar_archivos (sha256, datos, ancho, alto, peso) VALUES ($1, $2, 1, 1, 1) RETURNING id`,
    ["8".repeat(64), Buffer.from([8])]
  );
  await db.query(
    `INSERT INTO avatar_prendas (valor, modelo, capa, nombre, archivo_id)
     SELECT valor_capa, modelo, categoria, nombre, $1 FROM avatar_shop_items`,
    [archivo.rows[0].id]
  );

  // IMPORTANTE: se cargan DESPUÉS de inyectar la base local, porque
  // los handlers resuelven su conexión al cargarse.
  usersHandler = require("../api/users");
  contentHandler = require("../api/content");
});

// Llama a un handler como lo llamaría el servidor (req/res simulados).
function llamar(handler, metodo, query, body, headers) {
  return new Promise((resolve) => {
    const req = { method: metodo, query: query || {}, body: body || {}, headers: headers || {} };
    const res = {
      status(codigo) { this.statusCode = codigo; return this; },
      json(obj) { resolve(obj); },
      end() { resolve(null); },
      setHeader() {}
    };
    handler(req, res);
  });
}

// Crea un usuario de prueba y devuelve su id.
async function crearUsuario(username) {
  const filas = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'hash-de-prueba', 1, 0, 'active', now(), now())
     RETURNING id`,
    [username]
  );
  return filas.rows[0].id;
}

async function headersParaUsuario(username) {
  const filas = await db.query("SELECT id FROM users WHERE username = $1", [username]);
  assert.equal(filas.rows.length, 1, `debe existir el usuario ${username}`);
  return {
    authorization: `Bearer ${crearToken({ id: filas.rows[0].id, username })}`
  };
}

// Lee el saldo de un usuario.
async function estadoMonedas(userId) {
  const filas = await db.query("SELECT monedas FROM users WHERE id = $1", [userId]);
  return filas.rows[0];
}

// Un pulso de juego de "username", como el que manda js/motor/xp.js.
async function pulso(username, extra) {
  const headers = await headersParaUsuario(username);
  return llamar(usersHandler, "POST", { action: "xp" },
    Object.assign({ username, cantidad: 10, gameId: "juego-de-prueba" }, extra || {}), headers);
}

// Deja preparado el siguiente minuto: el servidor no cuenta dos en menos
// de 55 segundos (migración 024), y "minutos" son los que ya lleva hoy.
async function prepararSiguienteMinuto(username, minutos) {
  await db.query("UPDATE users SET ultimo_minuto_jugado = now() - interval '1 minute' WHERE username = $1", [username]);
  if (minutos !== undefined) {
    await db.query(
      `UPDATE actividad_diaria SET minutos = $2
       WHERE user_id = (SELECT id FROM users WHERE username = $1)
         AND dia = (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`,
      [username, minutos]);
  }
}

// ==============================
// LA REGLA, PIEZA POR PIEZA
// ==============================

test("el premio al azar siempre cae entre 10 y 30 monedas, incluidos los extremos", () => {
  // 2000 tiradas: suficiente para que un rango mal calculado (un
  // extremo que nunca sale, o uno que se pasa) aparezca.
  const vistos = new Set();
  for (let i = 0; i < 2000; i++) {
    const m = premioAlAzar();
    assert.ok(Number.isInteger(m), "el premio debe ser entero");
    assert.ok(m >= PREMIO_MINIMO && m <= PREMIO_MAXIMO, "fuera de rango: " + m);
    vistos.add(m);
  }
  assert.ok(vistos.has(PREMIO_MINIMO), "el mínimo tiene que poder salir");
  assert.ok(vistos.has(PREMIO_MAXIMO), "el máximo tiene que poder salir");
  assert.equal(premioAlAzar(AL_MINIMO), 10);
  assert.equal(premioAlAzar(() => 0.9999), 30);
});

test("el premio solo cae en el minuto 10, 20, 30… del día", () => {
  for (const sin of [0, 1, 9, 11, 19, 21, 119, -10, NaN]) {
    assert.equal(premioDelMinuto(sin, AL_MEDIO), 0, "minuto " + sin);
  }
  for (const con of [10, 20, 60, 120]) {
    assert.equal(premioDelMinuto(con, AL_MEDIO), 20, "minuto " + con);
  }
});

test("las 2 primeras horas pagan entero, de 2 a 4 la mitad, y después nada", () => {
  assert.equal(premioDelMinuto(120, AL_MEDIO), 20);
  assert.equal(premioDelMinuto(130, AL_MEDIO), 10);
  assert.equal(premioDelMinuto(240, AL_MEDIO), 10);
  assert.equal(premioDelMinuto(250, AL_MEDIO), 0);
  assert.equal(premioDelMinuto(600, AL_MEDIO), 0);
  // A mitad se redondea: 21 / 2 = 10,5 -> 11.
  assert.equal(premioDelMinuto(130, () => 11 / 21), 11);
});

test("la racha: 5 por cada día seguido, hasta 35 desde el séptimo", () => {
  assert.deepStrictEqual([0, 1, 2, 3, 6, 7, 8, 30].map(monedasPorRacha), [0, 5, 10, 15, 30, 35, 35, 35]);
});

test("subir de nivel: 15 × el nivel al que se sube", () => {
  assert.deepStrictEqual([0, 1, 2, 10, 25, 100].map(monedasPorNivel), [0, 0, 30, 150, 375, 1500]);
});

// ==============================
// OTORGAMIENTO
// ==============================

test("otorgar suma y devuelve el saldo; 0 o menos no toca nada; sin cuenta, null", async () => {
  const id = await crearUsuario("receptor");
  assert.equal(await monedas.otorgar(id, 40), SALDO_INICIAL + 40);
  assert.equal(await monedas.otorgar(id, 0), SALDO_INICIAL + 40);
  assert.equal(await monedas.otorgar(id, -500), SALDO_INICIAL + 40, "otorgar no puede quitar");
  assert.equal(await monedas.otorgar(999999, 40), null);
});

test("otorgarPorMinuto junta el premio, la racha y el nivel en una sola suma", async () => {
  const id = await crearUsuario("minuto_completo");
  const r = await monedas.otorgarPorMinuto(id, { minutoDelDia: 10, rachaDeHoy: 3, nivelNuevo: 4 }, AL_MINIMO);
  assert.deepStrictEqual(r.desglose, { jugar: 10, racha: 15, nivel: 60 });
  assert.equal(r.monto, 85);
  assert.equal(r.otorgado, true);
  assert.equal(r.razon, null);
  assert.equal(r.saldoNuevo, SALDO_INICIAL + 85);
  assert.equal((await estadoMonedas(id)).monedas, SALDO_INICIAL + 85);
});

test("un minuto sin premio no toca el saldo y dice por qué", async () => {
  const id = await crearUsuario("minuto_vacio");
  const antes = await monedas.otorgarPorMinuto(id, { minutoDelDia: 7 });
  assert.equal(antes.otorgado, false);
  assert.equal(antes.monto, 0);
  assert.equal(antes.saldoNuevo, SALDO_INICIAL);
  assert.equal(antes.razon, "aun-no-pasaron-10-minutos");

  const tarde = await monedas.otorgarPorMinuto(id, { minutoDelDia: 250 });
  assert.equal(tarde.razon, "pasadas-las-4-horas");
  assert.equal((await estadoMonedas(id)).monedas, SALDO_INICIAL);
});

test("otorgar a un usuario que no existe no explota: devuelve la razón correspondiente", async () => {
  const resultado = await monedas.otorgarPorMinuto(999999, { minutoDelDia: 10 });
  assert.equal(resultado.otorgado, false);
  assert.equal(resultado.monto, 0);
  assert.equal(resultado.razon, "usuario-no-encontrado");
});

// ==============================
// GASTO
// ==============================

test("(f) gastar rechaza la compra cuando no alcanza el saldo, y no toca las monedas", async () => {
  const id = await crearUsuario("comprador_pelado");

  const saldo = (await estadoMonedas(id)).monedas;

  const gasto = await monedas.gastar(id, saldo + 1);

  assert.equal(gasto.ok, false);
  assert.equal(gasto.error, "No te alcanzan las monedas", "el mensaje que ve el usuario no cambió");
  assert.equal((await estadoMonedas(id)).monedas, saldo, "el saldo no se debe tocar");
});

test("gastar descuenta el precio exacto y permite gastar hasta el último peso", async () => {
  const id = await crearUsuario("comprador_justo");
  const saldo = (await estadoMonedas(id)).monedas;

  const gasto = await monedas.gastar(id, 120);
  assert.equal(gasto.ok, true);
  assert.equal(gasto.saldoNuevo, saldo - 120);
  assert.equal((await estadoMonedas(id)).monedas, saldo - 120);

  // Gastar exactamente lo que queda debe funcionar (no es "no alcanza").
  const resto = gasto.saldoNuevo;
  const gastoTotal = await monedas.gastar(id, resto);
  assert.equal(gastoTotal.ok, true);
  assert.equal(gastoTotal.saldoNuevo, 0);

  // Y con 0 ya no alcanza para nada.
  const sinSaldo = await monedas.gastar(id, 1);
  assert.equal(sinSaldo.ok, false);
  assert.equal(sinSaldo.error, "No te alcanzan las monedas");
});

test("gastar un monto negativo no puede usarse para ganar saldo", async () => {
  const id = await crearUsuario("comprador_tramposo");
  const saldo = (await estadoMonedas(id)).monedas;

  const gasto = await monedas.gastar(id, -1000);

  assert.equal(gasto.ok, false);
  assert.equal(gasto.error, "Monto inválido");
  assert.equal((await estadoMonedas(id)).monedas, saldo, "el saldo no se debe mover");
});

test("consultarSaldo devuelve el saldo, y null si el usuario no existe", async () => {
  const id = await crearUsuario("consultante");
  assert.equal(await monedas.consultarSaldo(id), SALDO_INICIAL);
  assert.equal(await monedas.consultarSaldo(999999), null);
});

// ==============================
// ENGANCHE REAL EN LOS HANDLERS
// ==============================

test("POST /api/users?action=xp: el primer minuto del día paga la racha, y sigue devolviendo todo lo de antes", async () => {
  await crearUsuario("pulso_jugando");
  const resp = await pulso("pulso_jugando");

  // La forma vieja de la respuesta no cambió.
  assert.equal(resp.success, true);
  assert.ok(resp.user, "debe seguir devolviendo user");
  assert.equal(resp.user.username, "pulso_jugando");
  assert.equal(resp.user.xp, 10, "el XP se sumó igual que siempre");
  assert.equal(resp.subioNivel, false, "debe seguir devolviendo subioNivel");

  // Primer minuto del día y primer día de racha: 5 monedas.
  assert.ok(resp.monedas, "la respuesta debe incluir el campo monedas");
  assert.deepStrictEqual(resp.monedas.desglose, { jugar: 0, racha: 5, nivel: 0 });
  assert.equal(resp.monedas.otorgado, true);
  assert.equal(resp.monedas.saldoNuevo, SALDO_INICIAL + 5);

  // El segundo minuto ya no paga la racha, y todavía no toca el premio.
  await prepararSiguienteMinuto("pulso_jugando");
  const resp2 = await pulso("pulso_jugando");
  assert.equal(resp2.user.xp, 20, "el XP sigue sumando en cada pulso");
  assert.equal(resp2.monedas.otorgado, false, "las monedas no se otorgan cada minuto");
  assert.equal(resp2.monedas.monto, 0);
  assert.equal(resp2.monedas.saldoNuevo, SALDO_INICIAL + 5, "el saldo quedó igual");
  assert.equal(resp2.monedas.razon, "aun-no-pasaron-10-minutos");
});

test("el décimo minuto del día paga el premio, de 10 a 30", async () => {
  await crearUsuario("pulso_diez");
  await pulso("pulso_diez");                         // minuto 1: la racha
  await prepararSiguienteMinuto("pulso_diez", 9);    // como si llevara 9
  const resp = await pulso("pulso_diez");             // el décimo

  assert.equal(resp.monedas.desglose.racha, 0, "la racha ya se pagó hoy");
  assert.ok(resp.monedas.desglose.jugar >= 10 && resp.monedas.desglose.jugar <= 30);
  assert.equal(resp.monedas.saldoNuevo, SALDO_INICIAL + 5 + resp.monedas.desglose.jugar);
});

test("pasadas las 4 horas del día, el minuto ya no paga", async () => {
  await crearUsuario("pulso_tarde");
  await pulso("pulso_tarde");
  await prepararSiguienteMinuto("pulso_tarde", 249);
  const resp = await pulso("pulso_tarde");            // el 250
  assert.equal(resp.monedas.monto, 0);
  assert.equal(resp.monedas.razon, "pasadas-las-4-horas");
});

test("subir de nivel paga 15 × el nivel, y lo dice el aviso", async () => {
  const id = await crearUsuario("pulso_nivel");
  await db.query("UPDATE users SET xp = 45 WHERE id = $1", [id]);   // el nivel 2 pide 50
  const resp = await pulso("pulso_nivel");

  assert.equal(resp.subioNivel, true);
  assert.equal(resp.user.level, 2);
  assert.equal(resp.monedas.desglose.nivel, 30);
  const aviso = await db.query(
    "SELECT mensaje FROM notifications WHERE user_id = $1 AND titulo = $2 ORDER BY id DESC LIMIT 1", [id, "⭐ Nuevo nivel"]);
  assert.match(aviso.rows[0].mensaje, /nivel 2.*🪙 30/);
});

test("una recompensa sin juego no cuenta minuto: solo puede dar la del nivel", async () => {
  await crearUsuario("pulso_sin_juego");
  const resp = await pulso("pulso_sin_juego", { gameId: undefined });

  assert.equal(resp.success, true);
  assert.equal(resp.user.xp, 10, "el XP se suma igual");
  assert.deepStrictEqual(resp.monedas.desglose, { jugar: 0, racha: 0, nivel: 0 });
  assert.equal(resp.monedas.otorgado, false);
});

test("si falla el servicio de monedas, el pulso de XP igual responde correctamente", async () => {
  await crearUsuario("pulso_con_falla_monedas");

  const otorgarOriginal = MonedasService.prototype.otorgarPorMinuto;
  const warnOriginal = console.warn;

  MonedasService.prototype.otorgarPorMinuto = async () => {
    throw new Error("falla simulada del banco");
  };
  console.warn = () => {};

  try {
    const resp = await pulso("pulso_con_falla_monedas");

    assert.equal(resp.success, true);
    assert.equal(resp.user.xp, 10, "el XP no debe perderse por una falla de monedas");
    assert.equal(resp.subioNivel, false);
    assert.deepEqual(resp.monedas, {
      otorgado: false,
      monto: 0,
      saldoNuevo: null,
      razon: "error-al-otorgar"
    });
  } finally {
    MonedasService.prototype.otorgarPorMinuto = otorgarOriginal;
    console.warn = warnOriginal;
  }
});

test("comprar en la tienda de avatares descuenta el saldo y rechaza si no alcanza", async () => {
  const id = await crearUsuario("comprador_tienda");
  const headers = await headersParaUsuario("comprador_tienda");

  const items = await sql`SELECT id, precio, nombre FROM avatar_shop_items ORDER BY precio ASC LIMIT 1;`;
  const item = items[0];

  const compra = await llamar(contentHandler, "POST", { action: "avatar-shop-buy" }, {
    username: "comprador_tienda",
    itemId: item.id
  }, headers);

  assert.equal(compra.success, true);
  assert.equal(compra.itemComprado, item.nombre);
  assert.equal(compra.monedas, SALDO_INICIAL - item.precio, "el saldo devuelto es el nuevo");
  assert.equal((await estadoMonedas(id)).monedas, SALDO_INICIAL - item.precio);

  // Comprar la misma prenda dos veces sigue rechazándose igual.
  const repetida = await llamar(contentHandler, "POST", { action: "avatar-shop-buy" }, {
    username: "comprador_tienda",
    itemId: item.id
  }, headers);
  assert.equal(repetida.success, false);
  assert.equal(repetida.error, "Ya tenés esta prenda");

  // Sin saldo, la compra se rechaza con el mensaje de siempre y no
  // queda registrada.
  await db.query("UPDATE users SET monedas = 0 WHERE id = $1", [id]);

  const otros = await sql`
    SELECT id FROM avatar_shop_items WHERE id <> ${item.id} ORDER BY precio ASC LIMIT 1;
  `;

  const sinSaldo = await llamar(contentHandler, "POST", { action: "avatar-shop-buy" }, {
    username: "comprador_tienda",
    itemId: otros[0].id
  }, headers);

  assert.equal(sinSaldo.success, false);
  assert.equal(sinSaldo.error, "No te alcanzan las monedas");
  assert.equal((await estadoMonedas(id)).monedas, 0, "el saldo no quedó en negativo");

  const compras = await db.query(
    "SELECT COUNT(*)::int AS cantidad FROM avatar_shop_purchases WHERE user_id = $1",
    [id]
  );
  assert.equal(compras.rows[0].cantidad, 1, "la compra rechazada no debe registrarse");
});

test("el catálogo de la tienda devuelve el saldo de quien tiene la sesión", async () => {
  await crearUsuario("mirona_de_vidrieras");
  const headers = await headersParaUsuario("mirona_de_vidrieras");

  const resp = await llamar(contentHandler, "GET", { action: "avatar-shop", username: "mirona_de_vidrieras" }, null, headers);

  assert.equal(resp.success, true);
  assert.ok(resp.items.length > 0, "el catálogo debe tener prendas");
  assert.deepEqual(resp.comprados, [], "todavía no compró nada");
  assert.equal(resp.monedas, SALDO_INICIAL);
});

test("cada prenda de la tienda trae la dirección de su previsualización, o null", async () => {
  // La tienda enseña la previsualizacion. Antes buscaba el dibujo en el
  // indice publico, que solo trae lo que alguien lleva puesto, y lo que
  // nadie llevaba salia como una caja vacia con precio.
  const [item] = await sql`SELECT id, valor_capa FROM avatar_shop_items ORDER BY id LIMIT 1;`;
  const archivo = await db.query(
    `INSERT INTO avatar_archivos (sha256, datos, ancho, alto, peso) VALUES ($1, $2, 1, 1, 1) RETURNING id`,
    ["9".repeat(64), Buffer.from([1])]
  );
  const prenda = await db.query(
    `INSERT INTO avatar_prendas (valor, modelo, capa, nombre, archivo_id, previsualizacion)
     VALUES ($1, 'tora', 'remera', 'Con previsualizacion', $2, $3)
     ON CONFLICT (valor) DO UPDATE SET previsualizacion = EXCLUDED.previsualizacion
     RETURNING id`,
    [item.valor_capa, archivo.rows[0].id, "a1".repeat(32)]
  );

  const resp = await llamar(contentHandler, "GET", { action: "avatar-shop" });
  const conPrevia = resp.items.find(i => i.id === item.id);
  assert.equal(conPrevia.previsualizacion,
    "/previsualizaciones/" + prenda.rows[0].id + ".jpg?v=" + "a1".repeat(6));
  assert.ok(!("prendaId" in conPrevia), "se colo el id interno de la prenda");
  const sinPrevia = resp.items.filter(i => i.id !== item.id);
  assert.ok(sinPrevia.length > 0 && sinPrevia.every(i => i.previsualizacion === null),
    "una prenda sin previsualizacion tiene que llegar con null");
});
