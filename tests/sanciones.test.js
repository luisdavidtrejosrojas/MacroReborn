// ==============================
// ADVERTIR, SUSPENDER Y BANEAR — tests/sanciones.test.js
// ==============================
// Decidido el 28/09/2026 (docs/MODERACION.md, api/_sanciones.js). Hasta
// ese día "suspender" solo ponía una marca que el servidor no miraba, y
// la única cuenta suspendida siguió entrando y escribiendo; las
// advertencias no llegaban a nadie (puntos 16 y 17 de docs/AUDITORIA.md).
//
// Contra los handlers de verdad y una base PGlite:
//
//   - quién puede qué: moderadores advierten y suspenden, solo los
//     administradores banean y levantan baneos, y a un administrador no
//     se le toca;
//   - la suspendida entra, juega y mira, pero no escribe;
//   - la baneada no entra, y su sesión deja de valer en el acto;
//   - todo queda en el historial, y las listas dicen el estado.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before, describe } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken, obtenerAuth } = require("../api/_auth");
const sanciones = require("../api/_sanciones");

let db, sql, users, content, social, auth;
const CLAVE = "clave-de-prueba";
let hashClave;

before(async () => {
  db = await crearBaseLocal();
  sql = crearSqlPGlite(db);
  usarSqlLocal(sql);
  users = require("../api/users");
  content = require("../api/content");
  social = require("../api/social");
  auth = require("../api/auth");
  hashClave = bcrypt.hashSync(CLAVE, 4);
});

let siguiente = 0;
async function cuenta(rol) {
  const username = "cuenta" + (++siguiente) + (rol ? "_" + rol : "");
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, $2, 1, 0, 'active', now(), now()) RETURNING id`, [username, hashClave]);
  const id = Number(r.rows[0].id);
  if (rol) await db.query("INSERT INTO badges (user_id, badge_id) VALUES ($1, $2)", [id, rol]);
  return { id, username, headers: { authorization: "Bearer " + crearToken({ id, username }) } };
}

function llamar(handler, metodo, query, body, headers) {
  return new Promise((resolve) => {
    const req = { method: metodo, query: query || {}, body: body || {}, headers: headers || {} };
    handler(req, {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      setHeader() {},
      json(o) { resolve({ codigo: this.statusCode, cuerpo: o }); },
      end() { resolve({ codigo: this.statusCode, cuerpo: null }); }
    });
  });
}

const moderar = (quien, accion, body) => llamar(users, "POST", { action: accion }, body, quien.headers);
const entrar = (c) => llamar(auth, "POST", { action: "login" }, { username: c.username, password: CLAVE });
const bio = (c) => llamar(users, "POST", { action: "update-bio" }, { username: c.username, bio: "hola" }, c.headers);
const notificaciones = async (c) => (await db.query(
  "SELECT titulo, mensaje FROM notifications WHERE user_id = $1 ORDER BY id", [c.id])).rows;
const historial = async (c) => (await db.query(
  "SELECT moderator_role AS rol, accion, motivo FROM moderation_log WHERE usuario_afectado = $1 ORDER BY id", [c.username])).rows;

describe("quién puede qué", () => {

  test("un colaborador no sanciona", async () => {
    const colaborador = await cuenta("colaborador");
    const otra = await cuenta();
    const r = await moderar(colaborador, "warn", { username: otra.username, motivo: "spam" });
    assert.equal(r.codigo, 403);
  });

  test("un moderador advierte: le llega la notificación y queda en el historial", async () => {
    const moderador = await cuenta("moderador");
    const otra = await cuenta();
    const r = await moderar(moderador, "warn", { username: otra.username, motivo: "Insultos en el chat." });
    assert.equal(r.cuerpo.success, true);
    const avisos = await notificaciones(otra);
    assert.equal(avisos.length, 1);
    assert.equal(avisos[0].titulo, "⚠️ Advertencia de la moderación");
    assert.match(avisos[0].mensaje, /^Insultos en el chat\. .*discord\.gg\/tKjfsQ7GdG$/);
    assert.deepStrictEqual(await historial(otra), [{ rol: "moderador", accion: "advertir_usuario", motivo: "Insultos en el chat." }]);
  });

  test("sin motivo no hay sanción, y la suspensión es de 1, 3, 7 o 30 días", async () => {
    const moderador = await cuenta("moderador");
    const otra = await cuenta();
    assert.equal((await moderar(moderador, "warn", { username: otra.username, motivo: "   " })).codigo, 400);
    assert.equal((await moderar(moderador, "suspend", { username: otra.username, motivo: "spam", dias: 2 })).codigo, 400);
    const r = await moderar(moderador, "suspend", { username: otra.username, motivo: "spam", dias: 7 });
    assert.equal(r.cuerpo.success, true);
    const dias = (Date.parse(r.cuerpo.hasta) - Date.now()) / 86400000;
    assert.ok(dias > 6.9 && dias <= 7, "hasta: " + r.cuerpo.hasta);
  });

  test("a un administrador no lo sanciona nadie, ni otro administrador; y nadie se sanciona a sí mismo", async () => {
    const admin = await cuenta("administrador");
    const otroAdmin = await cuenta("administrador");
    const moderador = await cuenta("moderador");
    assert.equal((await moderar(moderador, "suspend", { username: admin.username, motivo: "x", dias: 1 })).codigo, 403);
    assert.equal((await moderar(otroAdmin, "ban", { username: admin.username, motivo: "x" })).codigo, 403);
    assert.equal((await moderar(moderador, "warn", { username: moderador.username, motivo: "x" })).codigo, 400);
  });

  test("banear es de administradores, y levantar un baneo también", async () => {
    const admin = await cuenta("administrador");
    const moderador = await cuenta("moderador");
    const otra = await cuenta();
    assert.equal((await moderar(moderador, "ban", { username: otra.username, motivo: "troll" })).codigo, 403);
    assert.equal((await moderar(admin, "ban", { username: otra.username, motivo: "troll" })).cuerpo.success, true);
    assert.equal((await moderar(moderador, "reactivate", { username: otra.username })).codigo, 403);
    assert.equal((await moderar(admin, "reactivate", { username: otra.username })).cuerpo.success, true);
  });

});

describe("la cuenta suspendida", () => {

  async function suspendida() {
    const moderador = await cuenta("moderador");
    const c = await cuenta();
    await moderar(moderador, "suspend", { username: c.username, motivo: "Spam en comentarios", dias: 3 });
    return { moderador, c };
  }

  test("no escribe: chat, comentarios, reseñas, notificaciones, solicitudes de amistad ni biografía", async () => {
    const { c } = await suspendida();
    const intentos = [
      llamar(content, "POST", { action: "chat" }, { username: c.username, mensaje: "hola" }, c.headers),
      llamar(content, "POST", { action: "comments" }, { username: c.username, texto: "hola" }, c.headers),
      llamar(content, "POST", { action: "reviews" }, { username: c.username, texto: "hola" }, c.headers),
      llamar(content, "POST", { action: "notifications" }, { username: c.username, titulo: "hola" }, c.headers),
      llamar(social, "POST", { action: "friends" }, { action: "request", from: c.username, to: "otra" }, c.headers),
      bio(c)
    ];
    for (const r of await Promise.all(intentos)) {
      assert.equal(r.codigo, 403);
      assert.equal(r.cuerpo.codigo, "cuenta-suspendida");
      assert.equal(r.cuerpo.motivo, "Spam en comentarios");
      assert.equal(r.cuerpo.reclamar, sanciones.DISCORD);
      assert.match(r.cuerpo.error, /^Tu cuenta está suspendida hasta el \d+\/\d+ a las \d\d:\d\d/);
    }
  });

  test("pero entra, juega y mira: el login, el minuto de juego y Jugar siguen", async () => {
    const { c } = await suspendida();
    assert.equal((await entrar(c)).cuerpo.success, true);
    const pulso = await llamar(users, "POST", { action: "xp" }, { username: c.username, cantidad: 10, gameId: "juego-1" }, c.headers);
    assert.equal(pulso.cuerpo.success, true);
    const jugar = await llamar(content, "POST", { action: "game-history" }, { username: c.username, gameId: "juego-1" }, c.headers);
    assert.equal(jugar.cuerpo.success, true);
  });

  test("le llega la notificación con hasta cuándo, el motivo y dónde reclamar", async () => {
    const { c } = await suspendida();
    const [aviso] = await notificaciones(c);
    assert.equal(aviso.titulo, "🚫 Tu cuenta está suspendida");
    assert.match(aviso.mensaje, /^Hasta el \d+\/\d+ a las \d\d:\d\d \(hora de Argentina\) no podés escribir/);
    assert.match(aviso.mensaje, /Motivo: Spam en comentarios\. .*discord\.gg/);
  });

  test("levantada, vuelve a escribir, y se le dice", async () => {
    const { moderador, c } = await suspendida();
    assert.equal((await moderar(moderador, "reactivate", { username: c.username })).cuerpo.success, true);
    assert.equal((await bio(c)).cuerpo.success, true);
    const titulos = (await notificaciones(c)).map(a => a.titulo);
    assert.deepStrictEqual(titulos, ["🚫 Tu cuenta está suspendida", "✅ Tu suspensión terminó"]);
  });

  test("se levanta sola al acabar el plazo", async () => {
    const { c } = await suspendida();
    assert.equal((await bio(c)).codigo, 403);
    await db.query("UPDATE sanciones SET hasta = now() - interval '1 minute' WHERE user_id = $1", [c.id]);
    await sanciones.recargar(sql);
    assert.equal((await bio(c)).cuerpo.success, true);
  });

  test("una suspensión nueva sustituye a la anterior", async () => {
    const { moderador, c } = await suspendida();
    await moderar(moderador, "suspend", { username: c.username, motivo: "Otra vez", dias: 30 });
    const enPie = (await db.query(
      "SELECT motivo FROM sanciones WHERE user_id = $1 AND tipo = 'suspension' AND levantada_en IS NULL", [c.id])).rows;
    assert.deepStrictEqual(enPie.map(f => f.motivo), ["Otra vez"]);
  });

});

describe("la cuenta baneada", () => {

  async function baneada() {
    const admin = await cuenta("administrador");
    const c = await cuenta();
    await moderar(admin, "ban", { username: c.username, motivo: "Nombre inapropiado" });
    return { admin, c };
  }

  test("su sesión deja de valer en el acto, y se le dice por qué y dónde reclamar", async () => {
    const { c } = await baneada();
    const r = await bio(c);
    assert.equal(r.codigo, 403);
    assert.deepStrictEqual(r.cuerpo, {
      success: false, codigo: "cuenta-baneada", error: "Esta cuenta está baneada.",
      motivo: "Nombre inapropiado", reclamar: sanciones.DISCORD
    });
    // Lo que no pide sesión la trata como si no la trajera.
    assert.equal(obtenerAuth({ headers: c.headers }), null);
  });

  test("no entra: el login dice por qué", async () => {
    const { c } = await baneada();
    const r = await entrar(c);
    assert.equal(r.codigo, 403);
    assert.equal(r.cuerpo.codigo, "cuenta-baneada");
    assert.equal(r.cuerpo.motivo, "Nombre inapropiado");
    assert.ok(!r.cuerpo.token, "le dio un pase");
  });

  test("banear sustituye a la suspensión, y no se banea dos veces", async () => {
    const admin = await cuenta("administrador");
    const moderador = await cuenta("moderador");
    const c = await cuenta();
    await moderar(moderador, "suspend", { username: c.username, motivo: "spam", dias: 1 });
    await moderar(admin, "ban", { username: c.username, motivo: "reincidente" });
    assert.equal((await moderar(admin, "ban", { username: c.username, motivo: "otra" })).codigo, 409);
    const enPie = (await db.query(
      "SELECT tipo FROM sanciones WHERE user_id = $1 AND levantada_en IS NULL ORDER BY id", [c.id])).rows;
    assert.deepStrictEqual(enPie.map(f => f.tipo), ["baneo"]);
  });

  test("levantado el baneo, vuelve a entrar", async () => {
    const { admin, c } = await baneada();
    await moderar(admin, "reactivate", { username: c.username });
    assert.equal((await entrar(c)).cuerpo.success, true);
    assert.equal((await bio(c)).cuerpo.success, true);
  });

});

describe("el historial y las listas", () => {

  test("cada sanción queda en el historial, con quién y su rol", async () => {
    const admin = await cuenta("administrador");
    const moderador = await cuenta("moderador");
    const c = await cuenta();
    await moderar(moderador, "warn", { username: c.username, motivo: "aviso" });
    await moderar(moderador, "suspend", { username: c.username, motivo: "spam", dias: 1 });
    await moderar(moderador, "reactivate", { username: c.username });
    await moderar(admin, "ban", { username: c.username, motivo: "troll" });
    await moderar(admin, "reactivate", { username: c.username });
    assert.deepStrictEqual(await historial(c), [
      { rol: "moderador", accion: "advertir_usuario", motivo: "aviso" },
      { rol: "moderador", accion: "suspender_usuario", motivo: "spam (1 día)" },
      { rol: "moderador", accion: "reactivar_usuario", motivo: "Suspensión levantada" },
      { rol: "administrador", accion: "banear_usuario", motivo: "troll" },
      { rol: "administrador", accion: "levantar_baneo", motivo: "Baneo levantado" }
    ]);
  });

  test("las listas de usuarios dicen el estado, sin el motivo del baneo", async () => {
    const admin = await cuenta("administrador");
    const s = await cuenta();
    const b = await cuenta();
    await moderar(admin, "suspend", { username: s.username, motivo: "spam", dias: 3 });
    await moderar(admin, "ban", { username: b.username, motivo: "troll" });
    const una = async (c) => (await llamar(users, "GET", { username: c.username }, null, {})).cuerpo.user;
    const suspendida = await una(s);
    assert.equal(suspendida.suspendido, true);
    assert.equal(suspendida.motivo_suspension, "spam");
    assert.ok(suspendida.suspendido_hasta);
    assert.equal(suspendida.baneado, false);
    const baneada = await una(b);
    assert.equal(baneada.baneado, true);
    assert.equal(baneada.suspendido, false);
    assert.ok(!Object.values(baneada).includes("troll"), "el motivo del baneo salió en la lista");

    const lista = (await llamar(users, "GET", { limit: "500" }, null, {})).cuerpo.users;
    assert.equal(lista.find(u => u.username === b.username).baneado, true);
  });

});
