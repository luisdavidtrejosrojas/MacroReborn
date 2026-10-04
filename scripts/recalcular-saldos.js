// ==============================
// REHACER LOS SALDOS CON LA ECONOMÍA NUEVA — scripts/recalcular-saldos.js
// ==============================
// Decidido el 04/10/2026 con el administrador (docs/ECONOMIA.md). Con la
// economía nueva cada cuenta tiene el saldo que habría juntado si las
// reglas nuevas hubieran estado siempre, y nadie pierde:
//
//   500 de bienvenida
//   + 60 por cada día que jugó antes del 25/09: lo que gana por jugar en
//     un día quien juega 30 minutos. Los minutos de antes de esa fecha no
//     valen, porque contaban cada pestaña (migración 024: había cuentas
//     con 189.885 minutos en una semana, que tiene 10.080).
//   + sus minutos desde el 25/09, uno por minuto, con 120 al día como
//     mucho (no se sabe si eran a pestaña abierta: la detección de
//     actividad llegó el 04/10), a 20 cada 10 minutos, la media del premio
//   + la racha de esos días seguidos
//   + las misiones que cobró, con los premios nuevos
//   + sus logros, salvo los de ranking (en agosto, con menos de diez
//     cuentas, cualquiera era Top 3) y los de amigos (no dan monedas)
//   + sus niveles, hasta el que da ese tiempo de juego (el XP de antes del
//     25/09 está inflado por las pestañas)
//   − lo que gastó, a los precios nuevos (va DESPUÉS de la migración 027)
//
// Si le sale menos de lo que tiene más lo que pagó de más, se queda con
// eso: a nadie le baja. Las cinco cuentas del equipo, que tenían unos mil
// millones cada una, se quedan con lo que les dé el cálculo, sin restar
// lo gastado, y con todo el catálogo regalado.
//
//   node scripts/recalcular-saldos.js                          simulacro, copia local
//   node scripts/recalcular-saldos.js --produccion             simulacro contra producción
//   node scripts/recalcular-saldos.js --produccion --aplicar   de verdad
//
// Se aplica UNA vez: deja lo que hizo, cuenta por cuenta, en
// datos-locales/recalculo-saldos-<donde>.json, y si encuentra ese archivo
// no vuelve a aplicar (--otra-vez para saltárselo a propósito). Antes, la
// copia de seguridad (~/respaldar.sh, docs/VPS.md).
//
// Cambia el saldo SUMANDO la diferencia, no escribiéndolo: lo que alguien
// gane mientras corre no se pierde.

const fs = require("fs");
const path = require("path");
const monedas = require("../api/_monedas");
const logros = require("../api/_logros");
const { MISIONES_DIARIAS, MISIONES_SEMANALES } = require("../api/_misiones");

const DESDE_MINUTOS_REALES = "2026-09-25";
const BIENVENIDA = 500;
const MINUTOS_DIA_REFERENCIA = 30;
const TOPE_MINUTOS_ATRAS = 120;
const EQUIPO = Object.freeze(["Lucass", "Azulita", "Nayzhex", "Chimmy", "soydegurime"]);
const LOGROS_SIN_MONEDAS_ATRAS = new Set(["top100", "top50", "top10", "top3", "subcampeon", "numeroUno"]);

// Lo que da en promedio el premio por jugar: (10 + 30) / 2 cada 10 minutos.
const MEDIA_PREMIO = (monedas.PREMIO_MINIMO + monedas.PREMIO_MAXIMO) / 2;
const porJugar = (minutos) => Math.floor(minutos / monedas.MINUTOS_POR_PREMIO) * MEDIA_PREMIO;

// La misma que api/users.js (xpNecesaria).
function xpNecesaria(nivel) {
  if (nivel === 1) return 50;
  if (nivel === 2) return 100;
  return 100 + (nivel - 2) * 200;
}
function nivelConXp(xp) {
  let nivel = 1, resto = xp;
  while (resto >= xpNecesaria(nivel)) { resto -= xpNecesaria(nivel); nivel++; }
  return nivel;
}

const MONEDAS_MISION = new Map([...MISIONES_DIARIAS, ...MISIONES_SEMANALES].map(m => [m.key, m.coins]));

// ---------- El cálculo de una cuenta (puro) ----------
// cuenta: { id, nombre, nivel, monedas, diasAntes, minutos: { "AAAA-MM-DD": n },
//           misiones: [{ clave, monedas, xp }], logros: [id], compras: [{ item, pagado }] }
// precios: Map item_id -> precio de hoy
function calcular(cuenta, precios) {
  const equipo = EQUIPO.includes(cuenta.nombre);
  const fechas = Object.keys(cuenta.minutos || {}).filter(f => f >= DESDE_MINUTOS_REALES && cuenta.minutos[f] > 0).sort();

  const jugarAntes = cuenta.diasAntes * porJugar(MINUTOS_DIA_REFERENCIA);
  let jugarDespues = 0, minutosJustos = 0, racha = 0, monedasRacha = 0, anterior = null;
  for (const f of fechas) {
    const m = Math.min(Number(cuenta.minutos[f]) || 0, TOPE_MINUTOS_ATRAS);
    minutosJustos += m;
    jugarDespues += porJugar(m);
    const dia = Date.parse(f + "T00:00:00Z");
    racha = anterior !== null && dia - anterior === 86400000 ? racha + 1 : 1;
    monedasRacha += monedas.monedasPorRacha(racha);
    anterior = dia;
  }

  const misiones = (cuenta.misiones || []).reduce((s, m) =>
    s + (MONEDAS_MISION.has(m.clave) ? MONEDAS_MISION.get(m.clave) : Math.round((m.monedas || 0) * 1.25)), 0);
  const xpMisiones = (cuenta.misiones || []).reduce((s, m) => s + (m.xp || 0), 0);

  const monedasLogros = (cuenta.logros || []).reduce((s, id) =>
    s + (LOGROS_SIN_MONEDAS_ATRAS.has(id) ? 0 : logros.monedasDeLogro(id)), 0);

  const xpJusta = 10 * (cuenta.diasAntes * MINUTOS_DIA_REFERENCIA + minutosJustos) + xpMisiones;
  const nivelJusto = Math.min(cuenta.nivel || 1, nivelConXp(xpJusta));
  let monedasNiveles = 0;
  for (let l = 2; l <= nivelJusto; l++) monedasNiveles += monedas.monedasPorNivel(l);

  const pagadas = (cuenta.compras || []).filter(c => (c.pagado || 0) > 0);
  const gastado = pagadas.reduce((s, c) => s + (precios.get(c.item) || 0), 0);
  const devolucion = pagadas.reduce((s, c) => s + Math.max(0, c.pagado - (precios.get(c.item) || 0)), 0);

  const ganado = BIENVENIDA + jugarAntes + jugarDespues + monedasRacha + misiones + monedasLogros + monedasNiveles;
  const calculado = Math.round(ganado - (equipo ? 0 : gastado));
  const actual = Number(cuenta.monedas) || 0;
  const nuevo = equipo ? calculado : Math.max(actual + devolucion, calculado);

  return {
    id: cuenta.id, nombre: cuenta.nombre, equipo, actual, nuevo, diferencia: nuevo - actual,
    desglose: { jugarAntes, jugarDespues, racha: monedasRacha, misiones, logros: monedasLogros,
                niveles: monedasNiveles, nivelJusto, gastado, devolucion }
  };
}

// ---------- La base ----------

async function abrirBase(produccion) {
  if (produccion) {
    if (!process.env.DATABASE_URL) {
      console.error("Falta DATABASE_URL para trabajar contra producción.");
      process.exit(1);
    }
    const { obtenerSql } = require("../api/_db");
    return { sql: obtenerSql(), cerrar: async () => {} };
  }
  const { abrirBaseReal } = require("./base-real");
  const { crearSqlPGlite } = require("./pglite");
  const pgdata = process.env.MR_PGDATA || path.join(__dirname, "..", "datos-locales", "pgdata");
  const db = await abrirBaseReal(pgdata);
  if (!db) {
    console.error("\nNo hay copia de producción en datos-locales/pgdata.\nTráela con:  npm run db:traer\n");
    process.exit(1);
  }
  return { sql: crearSqlPGlite(db), cerrar: async () => db.close() };
}

async function leerCuentas(sql) {
  const usuarios = await sql`SELECT id, username, level, monedas FROM users ORDER BY id;`;
  const dias = await sql`
    SELECT user_id, COUNT(DISTINCT d)::int AS dias FROM (
      SELECT user_id, created_at::date AS d FROM activity_log WHERE created_at < ${DESDE_MINUTOS_REALES}::date
      UNION SELECT user_id, played_at::date FROM game_history WHERE played_at < ${DESDE_MINUTOS_REALES}::date
      UNION SELECT user_id, (created_at AT TIME ZONE 'UTC')::date FROM originales_scores WHERE created_at < ${DESDE_MINUTOS_REALES}::date
    ) x WHERE user_id IS NOT NULL GROUP BY user_id;`;
  const minutos = await sql`SELECT user_id, to_char(dia, 'YYYY-MM-DD') AS dia, minutos FROM actividad_diaria;`;
  const misiones = await sql`SELECT user_id, mission_key, reward_coins, reward_xp FROM player_mission_claims;`;
  const conseguidos = await sql`SELECT user_id, achievement_id FROM achievements;`;
  const compras = await sql`SELECT user_id, item_id, precio_pagado FROM avatar_shop_purchases;`;
  const catalogo = await sql`SELECT id, precio FROM avatar_shop_items;`;

  const porId = new Map(usuarios.map(u => [Number(u.id), {
    id: Number(u.id), nombre: u.username, nivel: Number(u.level) || 1, monedas: Number(u.monedas) || 0,
    diasAntes: 0, minutos: {}, misiones: [], logros: [], compras: []
  }]));
  const de = (id) => porId.get(Number(id));
  for (const f of dias) if (de(f.user_id)) de(f.user_id).diasAntes = Number(f.dias) || 0;
  for (const f of minutos) if (de(f.user_id)) de(f.user_id).minutos[f.dia] = Number(f.minutos) || 0;
  for (const f of misiones) if (de(f.user_id)) de(f.user_id).misiones.push({ clave: f.mission_key, monedas: Number(f.reward_coins) || 0, xp: Number(f.reward_xp) || 0 });
  for (const f of conseguidos) if (de(f.user_id)) de(f.user_id).logros.push(f.achievement_id);
  for (const f of compras) if (de(f.user_id)) de(f.user_id).compras.push({ item: Number(f.item_id), pagado: f.precio_pagado === null ? null : Number(f.precio_pagado) });

  return { cuentas: [...porId.values()], precios: new Map(catalogo.map(c => [Number(c.id), Number(c.precio) || 0])) };
}

// Todo o nada: el saldo de cada cuenta y el catálogo del equipo.
async function aplicarCambios(sql, filas) {
  await sql.transaccion(async (tx) => {
    for (const f of filas) {
      if (f.diferencia === 0) continue;
      await tx`UPDATE users SET monedas = monedas + ${f.diferencia}::int WHERE id = ${f.id}::int;`;
    }
    for (const f of filas.filter(f => f.equipo)) {
      await tx`
        INSERT INTO avatar_shop_purchases (user_id, item_id, precio_pagado)
        SELECT ${f.id}::int, s.id, 0 FROM avatar_shop_items s
        ON CONFLICT (user_id, item_id) DO NOTHING;
      `;
    }
  });
}

async function main() {
  const produccion = process.argv.includes("--produccion");
  const aplicar = process.argv.includes("--aplicar");
  const donde = produccion ? "produccion" : "local";
  const marca = path.join(__dirname, "..", "datos-locales", `recalculo-saldos-${donde}.json`);

  if (aplicar && fs.existsSync(marca) && !process.argv.includes("--otra-vez")) {
    console.error(`Ya se aplicó (${marca}). Aplicarlo otra vez devolvería dos veces lo pagado de más.`);
    process.exit(1);
  }

  const { sql, cerrar } = await abrirBase(produccion);
  try {
    const { cuentas, precios } = await leerCuentas(sql);
    const filas = cuentas.map(c => calcular(c, precios));
    const jugadores = filas.filter(f => !f.equipo);
    const suben = jugadores.filter(f => f.diferencia > 0);
    console.log(`${donde}: ${filas.length} cuentas, ${filas.length - jugadores.length} del equipo`);
    console.log(`  a ${suben.length} jugadores les sube, a ${jugadores.length - suben.length} se les queda igual`);
    console.log(`  devoluciones: ${jugadores.filter(f => f.desglose.devolucion > 0).length} jugadores, ${jugadores.reduce((s, f) => s + f.desglose.devolucion, 0)} monedas`);
    for (const f of filas.filter(f => f.equipo)) console.log(`  equipo: ${f.nombre}: ${f.actual} -> ${f.nuevo}`);

    if (!aplicar) {
      console.log("\nSimulacro: no se escribió nada. Para hacerlo: --aplicar");
      return;
    }

    await aplicarCambios(sql, filas);

    fs.mkdirSync(path.dirname(marca), { recursive: true });
    fs.writeFileSync(marca, JSON.stringify({ aplicado: new Date().toISOString(), filas }, null, 1));
    console.log(`\nAplicado. Lo hecho, cuenta por cuenta, en ${marca}`);
  } finally {
    await cerrar();
  }
}

if (require.main === module) {
  // exit: la conexión de producción tardaría 30 s en soltarse sola.
  main().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
}

module.exports = { calcular, leerCuentas, aplicarCambios, EQUIPO, DESDE_MINUTOS_REALES, TOPE_MINUTOS_ATRAS };
