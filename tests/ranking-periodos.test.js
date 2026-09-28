// ==============================
// EL RANKING POR HOY, SEMANA Y MES — tests/ranking-periodos.test.js
// ==============================
// El tablero del ranking de Comunidad (rediseño del zip "per" del otro
// dev, integrado el 28/09/2026) trae las pestañas Todos / Hoy / Esta
// semana / Este mes. Venían de adorno: solo cambiaban de color. Ahora
// ordenan por los minutos jugados en ese período.
//
//   - El servidor manda con cada persona minutos_hoy y minutos_mes
//     (api/users.js, de actividad_diaria), además de los de la semana.
//   - La página (js/comunidad-ranking.js) reordena con ellos, y las
//     pestañas y los modos de arriba se marcan juntos.
//
// Correr:  npm test

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");

describe("el servidor manda los minutos de hoy y del mes", () => {

  let db;
  let usersHandler;
  before(async () => {
    db = await crearBaseLocal();
    await db.query("SET TIME ZONE 'UTC'");
    usarSqlLocal(crearSqlPGlite(db));
    usersHandler = require("../api/users");
  });

  const lista = () => new Promise((resolve) => {
    usersHandler({ method: "GET", query: { limit: "500" }, body: {}, headers: {} }, {
      status() { return this; },
      setHeader() {},
      json(o) { resolve(o); },
      end() { resolve(null); }
    });
  });

  test("de actividad_diaria, con el día y el mes de Argentina", async () => {
    const fechas = (await db.query(`
      SELECT to_char(d, 'YYYY-MM-DD') AS hoy,
             to_char(date_trunc('month', d)::date, 'YYYY-MM-DD') AS primero,
             to_char(date_trunc('month', d)::date - 1, 'YYYY-MM-DD') AS mes_pasado
      FROM (SELECT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS d) x`)).rows[0];
    const persona = async (nombre) => Number((await db.query(
      `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
       VALUES ($1, 'hash', 1, 0, 'active', now(), now()) RETURNING id`, [nombre])).rows[0].id);
    const jugo = (id, dia, minutos) => db.query(
      `INSERT INTO actividad_diaria (user_id, dia, minutos) VALUES ($1, $2::date, $3)
       ON CONFLICT (user_id, dia) DO UPDATE SET minutos = actividad_diaria.minutos + EXCLUDED.minutos`,
      [id, dia, minutos]);

    const ana = await persona("ana_periodos");
    const beto = await persona("beto_periodos");
    const cata = await persona("cata_periodos");
    await jugo(ana, fechas.hoy, 30);
    await jugo(ana, fechas.primero, 20);        // el 1 del mes (o hoy mismo, si hoy es 1)
    await jugo(beto, fechas.hoy, 5);
    await jugo(beto, fechas.mes_pasado, 300);   // el mes pasado no cuenta
    await jugo(cata, fechas.mes_pasado, 200);

    const r = await lista();
    assert.equal(r.success, true);
    const de = (nombre) => r.users.find(u => u.username === nombre);
    const unoEsHoy = fechas.primero === fechas.hoy;
    assert.equal(Number(de("ana_periodos").minutos_hoy), unoEsHoy ? 50 : 30);
    assert.equal(Number(de("ana_periodos").minutos_mes), 50);
    assert.equal(Number(de("beto_periodos").minutos_hoy), 5);
    assert.equal(Number(de("beto_periodos").minutos_mes), 5);
    assert.equal(Number(de("cata_periodos").minutos_hoy), 0);
    assert.equal(Number(de("cata_periodos").minutos_mes), 0);
  });

});

describe("las pestañas del tablero ordenan el ranking", () => {

  const RAIZ = path.join(__dirname, "..");
  const leer = (...p) => fs.readFileSync(path.join(RAIZ, ...p), "utf8");

  // Cuatro personas: por puesto general, ana, beto, cata, dani; cada
  // período tiene otro primero.
  const usuarios = [
    { id: 1, username: "ana", rank_actual: 1, minutos_hoy: 0, minutos_semana_actual: 40, dias_activos_semana_actual: 2, minutos_mes: 100 },
    { id: 2, username: "beto", rank_actual: 2, minutos_hoy: 25, minutos_semana_actual: 10, dias_activos_semana_actual: 1, minutos_mes: 30 },
    { id: 3, username: "cata", rank_actual: 3, minutos_hoy: 5, minutos_semana_actual: 90, dias_activos_semana_actual: 4, minutos_mes: 95 },
    { id: 4, username: "dani", rank_actual: 4, minutos_hoy: 1, minutos_semana_actual: 0, dias_activos_semana_actual: 0, minutos_mes: 400 }
  ].map(u => ({ level: 1, xp: 0, status: "active", avatar: null, last_login: null, ...u }));

  async function montar() {
    const consola = new VirtualConsole();
    consola.on("jsdomError", (e) => { if (!/navigation|Not implemented/i.test(String(e.message))) console.error(e); });
    const dom = new JSDOM(leer("comunidad-ranking.html"), {
      url: "https://www.macroreborn.com/comunidad-ranking.html", runScripts: "outside-only", virtualConsole: consola
    });
    const w = dom.window;
    w.fetch = async (url) => {
      let cuerpo = { success: true };
      if (String(url).startsWith("/api/users?limit=")) cuerpo = { success: true, users: usuarios };
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => cuerpo, clone() { return this; } };
    };
    w.eval(leer("js", "core.js") + "\n" + leer("js", "comunidad-ranking.js"));
    for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 0));
    const d = w.document;
    return {
      w,
      podio: () => [...d.querySelectorAll("#podioTop6 .rk-podio-nombre")].map(e => e.textContent),
      stat: () => d.querySelector("#podioTop6 .rk-podio-stat")?.textContent || "",
      pestana: (texto) => [...d.querySelectorAll(".rk-board-tab")].find(b => b.textContent.trim() === texto),
      modo: (modo) => d.querySelector(`.rk-modo[data-ranking-modo="${modo}"]`),
      titulo: () => d.querySelector(".rk-ranking-board-title span").textContent
    };
  }

  test("Todos: el puesto general, como siempre", async () => {
    const p = await montar();
    assert.deepStrictEqual(p.podio(), ["ana", "beto", "cata"]);
    assert.equal(p.titulo(), "Ranking general");
    p.w.close();
  });

  test("Hoy: por los minutos de hoy", async () => {
    const p = await montar();
    p.pestana("Hoy").click();
    assert.deepStrictEqual(p.podio(), ["beto", "cata", "dani"]);
    assert.match(p.stat(), /25 min hoy/);
    assert.equal(p.titulo(), "Ranking de hoy");
    assert.equal(p.pestana("Hoy").classList.contains("activo"), true);
    assert.equal(p.pestana("Todos").classList.contains("activo"), false);
    p.w.close();
  });

  test("Este mes: por los minutos del mes", async () => {
    const p = await montar();
    p.pestana("Este mes").click();
    assert.deepStrictEqual(p.podio(), ["dani", "ana", "cata"]);
    assert.match(p.stat(), /400 min este mes/);
    p.w.close();
  });

  test("Esta semana: la misma en el tablero y en los modos de arriba", async () => {
    const p = await montar();
    p.pestana("Esta semana").click();
    assert.deepStrictEqual(p.podio(), ["cata", "ana", "beto"]);
    assert.equal(p.modo("semana").classList.contains("activo"), true, "el modo de arriba no se enteró");

    p.modo("general").click();
    assert.deepStrictEqual(p.podio(), ["ana", "beto", "cata"]);
    assert.equal(p.pestana("Todos").classList.contains("activo"), true);
    assert.equal(p.pestana("Esta semana").classList.contains("activo"), false);
    p.w.close();
  });

});
