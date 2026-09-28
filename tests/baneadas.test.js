// ==============================
// LO QUE VEN LOS DEMÁS DE UNA CUENTA BANEADA — tests/baneadas.test.js
// ==============================
// La segunda parte de la moderación, decidida el 28/09/2026
// (docs/MODERACION.md, api/_sanciones.js):
//
//   - lo que escribió se tapa: chat, comentarios, reseñas (también sus
//     estrellas) y biografía, y su perfil sale sin avatar;
//   - la cuenta sale de las listas: usuarios, buscador, amigos y
//     solicitudes, favoritos, actividad, Comunidad, los rankings y el
//     equipo de moderación;
//   - el panel de moderación la sigue viendo, y solo él;
//   - levantado el baneo, vuelve todo.
//
// Contra los handlers de verdad y una base PGlite.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before, describe } = require("node:test");
const assert = require("node:assert");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { crearToken } = require("../api/_auth");
const { TAPADO } = require("../api/_sanciones");

let db, users, content, social, system, originales;

before(async () => {
  db = await crearBaseLocal();
  usarSqlLocal(crearSqlPGlite(db));
  users = require("../api/users");
  content = require("../api/content");
  social = require("../api/social");
  system = require("../api/system");
  originales = require("../api/originales-ranking");
});

let siguiente = 0;
async function cuenta(rol) {
  const username = "persona" + (++siguiente) + (rol ? "_" + rol.slice(0, 3) : "");
  const r = await db.query(
    `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
     VALUES ($1, 'x', 1, 0, 'active', now(), now()) RETURNING id`, [username]);
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

const leer = async (handler, query, headers) => (await llamar(handler, "GET", query, null, headers)).cuerpo;
const moderar = (quien, accion, body) => llamar(users, "POST", { action: accion }, body, quien.headers);

let admin;
async function banear(c) {
  if (!admin) admin = await cuenta("administrador");
  const r = await moderar(admin, "ban", { username: c.username, motivo: "troll" });
  assert.equal(r.cuerpo.success, true, JSON.stringify(r.cuerpo));
}
async function levantar(c) {
  const r = await moderar(admin, "reactivate", { username: c.username });
  assert.equal(r.cuerpo.success, true, JSON.stringify(r.cuerpo));
}

const nombres = (lista, campo = "username") => lista.map(f => f[campo]);

describe("lo que escribió se tapa", () => {

  test("chat, comentarios y reseñas: el aviso en lugar del texto, sin estrellas; lo de los demás, intacto", async () => {
    const b = await cuenta();
    const otra = await cuenta();
    await db.query("INSERT INTO chat_messages (user_id, username, texto) VALUES ($1, $2, 'hola chat'), ($3, $4, 'buenas')",
      [b.id, b.username, otra.id, otra.username]);
    await db.query(`INSERT INTO profile_comments (profile_user_id, author_user_id, author_username, texto)
                    VALUES ($1, $2, $3, 'feo perfil'), ($1, $1, $4, 'gracias')`, [otra.id, b.id, b.username, otra.username]);
    await db.query(`INSERT INTO game_reviews (user_id, game_id, calificacion, texto)
                    VALUES ($1, 'juego-tapado', 1, 'malisimo'), ($2, 'juego-tapado', 5, 'genial')`, [b.id, otra.id]);
    await banear(b);

    const chat = (await leer(content, { action: "chat" })).mensajes;
    const deB = chat.find(m => m.usuario === b.username);
    assert.equal(deB.texto, TAPADO);
    assert.equal(deB.autor_baneado, true);
    const deOtra = chat.find(m => m.usuario === otra.username);
    assert.deepStrictEqual([deOtra.texto, deOtra.autor_baneado], ["buenas", false]);

    const comentarios = (await leer(content, { action: "comments", username: otra.username })).comentarios;
    assert.deepStrictEqual(comentarios.map(c => [c.usuario, c.texto, c.autor_baneado]),
      [[otra.username, "gracias", false], [b.username, TAPADO, true]]);

    const resenas = (await leer(content, { action: "reviews", gameId: "juego-tapado" })).resenas;
    const resenaB = resenas.find(r => r.usuario === b.username);
    assert.deepStrictEqual([resenaB.texto, resenaB.calificacion, resenaB.autor_baneado], [TAPADO, null, true]);
    const resenaOtra = resenas.find(r => r.usuario === otra.username);
    assert.deepStrictEqual([resenaOtra.texto, resenaOtra.calificacion], ["genial", 5]);
  });

  test("su perfil sale con el aviso en lugar de la biografía, sin avatar, y dice que está baneada", async () => {
    const b = await cuenta();
    await db.query(`UPDATE users SET bio = 'mi bio', avatar = '{"cabeza":"gorra"}'::jsonb, avatar_compuesto = 'huella1'
                    WHERE id = $1`, [b.id]);
    await banear(b);
    for (const query of [{ username: b.username }, { username: b.username, ligero: "1" }]) {
      const u = (await leer(users, query)).user;
      assert.deepStrictEqual([u.baneado, u.bio, u.avatar, u.avatar_compuesto], [true, TAPADO, null, null]);
    }
  });

  test("levantado el baneo, vuelve todo tal cual: nada se borró", async () => {
    const b = await cuenta();
    await db.query("UPDATE users SET bio = 'sigo aqui' WHERE id = $1", [b.id]);
    await db.query("INSERT INTO chat_messages (user_id, username, texto) VALUES ($1, $2, 'volvi')", [b.id, b.username]);
    await banear(b);
    await levantar(b);
    const chat = (await leer(content, { action: "chat" })).mensajes;
    assert.equal(chat.find(m => m.usuario === b.username).texto, "volvi");
    const u = (await leer(users, { username: b.username })).user;
    assert.deepStrictEqual([u.baneado, u.bio], [false, "sigo aqui"]);
    assert.ok(nombres((await leer(users, { limit: "2000" })).users).includes(b.username));
  });

});

describe("sale de las listas", () => {

  test("la de usuarios y el buscador", async () => {
    const b = await cuenta();
    await banear(b);
    assert.ok(!nombres((await leer(users, { limit: "2000" })).users).includes(b.username));
    assert.deepStrictEqual((await leer(users, { q: b.username })).users, []);
  });

  test("los amigos, las solicitudes y los favoritos de los demás; y su lista sale vacía", async () => {
    const a = await cuenta();
    const b = await cuenta();
    const c = await cuenta();
    const d = await cuenta();
    await db.query("INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($2, $1), ($1, $3), ($3, $1)", [a.id, b.id, c.id]);
    await db.query("INSERT INTO friend_favorites (user_id, friend_id) VALUES ($1, $2), ($1, $3)", [a.id, b.id, c.id]);
    await db.query("INSERT INTO friend_requests (from_user_id, to_user_id) VALUES ($1, $2), ($3, $2), ($2, $1)",
      [b.id, a.id, d.id]);
    await banear(b);

    const deA = await leer(social, { action: "friends", username: a.username });
    assert.deepStrictEqual(nombres(deA.amigos), [c.username]);
    assert.deepStrictEqual(nombres(deA.solicitudesEntrantes, "de"), [d.username]);
    assert.deepStrictEqual(nombres(deA.solicitudesSalientes, "para"), []);
    assert.deepStrictEqual((await leer(social, { action: "favoriteFriends", username: a.username })).favoritos, [c.username]);

    const deB = await leer(social, { action: "friends", username: b.username });
    assert.deepStrictEqual([deB.amigos, deB.solicitudesEntrantes, deB.solicitudesSalientes], [[], [], []]);
  });

  test("la actividad: la de su perfil, la de amigos, las menciones y el feed de Comunidad", async () => {
    const a = await cuenta();
    const b = await cuenta();
    const c = await cuenta();
    await db.query(`INSERT INTO activity_log (user_id, tipo, detalle)
                    VALUES ($1, 'comentario', $3), ($1, 'logro', 'primerAmigo'), ($2, 'comentario', $3), ($2, 'logro', 'primerAmigo')`,
      [b.id, c.id, "hola @" + a.username]);
    await banear(b);

    assert.deepStrictEqual((await leer(content, { action: "activity", username: b.username })).actividades, []);
    const deAmigos = (await leer(content, { action: "activity-friends", usernames: b.username + "," + c.username })).actividades;
    assert.deepStrictEqual([...new Set(nombres(deAmigos))], [c.username]);
    const menciones = (await leer(content, { action: "mentions-received", username: a.username }, a.headers)).menciones;
    assert.deepStrictEqual(nombres(menciones, "autor"), [c.username]);
    const feed = (await leer(content, { action: "community-feed", limit: "60" })).actividades;
    assert.ok(!nombres(feed).includes(b.username), "la actividad de la baneada salió en Comunidad");
    assert.ok(nombres(feed).includes(c.username));
  });

  test("Comunidad: los recién llegados y el equipo de moderación", async () => {
    const b = await cuenta("moderador");
    await db.query("UPDATE users SET created_at = now() + interval '1 minute' WHERE id = $1", [b.id]);
    const antes = await leer(system, { action: "community-stats" });
    assert.equal(antes.recienLlegados[0].username, b.username, "la prueba no mira lo que cree");
    await banear(b);
    assert.ok(!nombres((await leer(system, { action: "community-stats" })).recienLlegados).includes(b.username));
    assert.ok(!nombres((await leer(system, { action: "moderators-status" })).staff).includes(b.username));
  });

  test("los rankings: el semanal la deja sin puesto y los demás corren uno; y el de los originales", async () => {
    const b = await cuenta();
    const c = await cuenta();
    await db.query("INSERT INTO originales_scores (user_id, game_id, score) VALUES ($1, '113', 999), ($2, '113', 5)", [b.id, c.id]);
    await banear(b);

    const r = await llamar(system, "POST", { action: "recalcular-ranking-manual" }, {}, admin.headers);
    assert.equal(r.cuerpo.success, true, JSON.stringify(r.cuerpo));
    const filas = (await db.query(`
      SELECT u.rank_actual, EXISTS (SELECT 1 FROM sanciones s WHERE s.user_id = u.id AND s.tipo = 'baneo'
                                    AND s.levantada_en IS NULL) AS baneada
      FROM users u`)).rows;
    assert.ok(filas.filter(f => f.baneada).every(f => f.rank_actual === null), "una baneada tiene puesto");
    const puestos = filas.filter(f => !f.baneada).map(f => f.rank_actual).sort((x, y) => x - y);
    assert.deepStrictEqual(puestos, puestos.map((_, i) => i + 1), "los puestos tienen huecos");

    const top = (await leer(originales, { action: "leaderboard", gameId: "113" })).top;
    assert.deepStrictEqual(nombres(top), [c.username]);
  });

  test("su galería de avatares sale vacía", async () => {
    const b = await cuenta();
    await db.query(`INSERT INTO saved_avatars (user_id, slot, avatar) VALUES ($1, 1, '{"cabeza":"gorra"}'::jsonb)`, [b.id]);
    await banear(b);
    const slots = (await leer(content, { action: "avatar-gallery", username: b.username })).slots;
    assert.ok(slots.length > 0);
    assert.ok(slots.every(s => s.id === null), "se ven los avatares guardados de la baneada");
  });

});

describe("el panel de moderación la sigue viendo, y solo él", () => {

  test("con ?moderacion=1 la lista trae a las baneadas, con su estado y sin el motivo del baneo", async () => {
    const b = await cuenta();
    await banear(b);
    const lista = (await leer(users, { limit: "2000", moderacion: "1" }, admin.headers)).users;
    const enLista = lista.find(u => u.username === b.username);
    assert.equal(enLista.baneado, true);
    assert.ok(!Object.values(enLista).includes("troll"), "el motivo del baneo salió en la lista");
  });

  test("un moderador también; sin sesión no, ni con una cuenta cualquiera", async () => {
    const moderador = await cuenta("moderador");
    const cualquiera = await cuenta();
    assert.equal((await llamar(users, "GET", { moderacion: "1" }, null, moderador.headers)).codigo, 200);
    assert.equal((await llamar(users, "GET", { moderacion: "1" }, null, {})).codigo, 401);
    assert.equal((await llamar(users, "GET", { moderacion: "1" }, null, cualquiera.headers)).codigo, 403);
  });

  test("el motivo de una suspensión lo ven la cuenta y la moderación; los demás, solo que lo está", async () => {
    if (!admin) admin = await cuenta("administrador");
    const s = await cuenta();
    await moderar(admin, "suspend", { username: s.username, motivo: "spam", dias: 3 });
    const otra = await cuenta();

    for (const headers of [{}, otra.headers]) {
      const u = (await leer(users, { username: s.username }, headers)).user;
      assert.deepStrictEqual([u.suspendido, !!u.suspendido_hasta, u.motivo_suspension], [true, true, null]);
      const enLista = (await leer(users, { limit: "2000" }, headers)).users.find(x => x.username === s.username);
      assert.equal(enLista.motivo_suspension, null);
    }
    assert.equal((await leer(users, { username: s.username }, s.headers)).user.motivo_suspension, "spam");
    const delPanel = (await leer(users, { limit: "2000", moderacion: "1" }, admin.headers)).users.find(x => x.username === s.username);
    assert.equal(delPanel.motivo_suspension, "spam");
  });

});
