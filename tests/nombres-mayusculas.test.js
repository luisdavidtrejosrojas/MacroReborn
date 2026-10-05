// ==============================
// EL NOMBRE, CON LAS MAYÚSCULAS QUE SEA — tests/nombres-mayusculas.test.js
// ==============================
// Punto 31 de docs/AUDITORIA.md. Hasta el 05/10/2026 casi todo comparaba
// el nombre exacto: "Mateo503" no encontraba el perfil de "MATEO503", y
// dos personas que no pudieron entrar con otras mayúsculas acabaron
// registrando otra cuenta (jader/Jader, yotter/Yotter).
//
// La regla vive en cuentaPorNombre() de api/_utils.js: primero el nombre
// exacto, si no la única cuenta que coincida sin mirar mayúsculas, y si
// coinciden varias, ninguna.
//
// Contra una base PGlite, con una cuenta en mayúsculas y una de las
// parejas que solo se distinguen por mayúsculas.
//
// Correr:  npm test

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

require("./_aislar-datos");   // antes de api/: ver ese archivo

const { test, before } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcryptjs");

const { crearBaseLocal, crearSqlPGlite } = require("../scripts/pglite");
const { usarSqlLocal } = require("../api/_db");
const { cuentaPorNombre, getUserId } = require("../api/_utils");

let db, sql, users, auth;
const CLAVE = "clave-de-prueba";
const ids = {};

before(async () => {
  db = await crearBaseLocal();
  sql = crearSqlPGlite(db);
  usarSqlLocal(sql);
  users = require("../api/users");
  auth = require("../api/auth");
  const hash = bcrypt.hashSync(CLAVE, 4);
  for (const username of ["MATEO503", "jader", "Jader"]) {
    const r = await db.query(
      `INSERT INTO users (username, password_hash, level, xp, status, created_at, last_login)
       VALUES ($1, $2, 1, 0, 'active', now(), now()) RETURNING id`, [username, hash]);
    ids[username] = Number(r.rows[0].id);
  }
});

const nombreDe = async (escrito) => {
  const cuenta = await cuentaPorNombre(sql, escrito);
  return cuenta ? cuenta.username : null;
};

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

const perfil = (escrito, extra) => llamar(users, "GET", { username: escrito, ...extra });
const entrar = (escrito, clave) => llamar(auth, "POST", { action: "login" }, { username: escrito, password: clave || CLAVE });
const registrar = (escrito) => llamar(auth, "POST", { action: "register" }, { username: escrito, password: CLAVE });

test("el nombre exacto, como siempre", async () => {
  assert.equal(await nombreDe("MATEO503"), "MATEO503");
  assert.equal(await getUserId(sql, "MATEO503"), ids.MATEO503);
});

test("con otras mayúsculas, la cuenta tal como está guardada", async () => {
  for (const escrito of ["Mateo503", "mateo503", "mATEO503"]) {
    assert.equal(await nombreDe(escrito), "MATEO503", escrito);
    assert.equal(await getUserId(sql, escrito), ids.MATEO503, escrito);
  }
});

test("las parejas que ya existen siguen separadas", async () => {
  assert.equal(await nombreDe("jader"), "jader");
  assert.equal(await nombreDe("Jader"), "Jader");
  assert.equal(await getUserId(sql, "jader"), ids.jader);
  assert.equal(await getUserId(sql, "Jader"), ids.Jader);
});

test("si coinciden varias y ninguna es exacta, no se adivina", async () => {
  assert.equal(await nombreDe("JADER"), null);
  assert.equal(await getUserId(sql, "JADER"), null);
});

test("lo que no existe sigue sin existir", async () => {
  assert.equal(await nombreDe("Nadie"), null);
  assert.equal(await nombreDe(""), null);
  assert.equal(await nombreDe(null), null);
});

test("el perfil se abre con otras mayúsculas, y dice el nombre guardado", async () => {
  for (const extra of [{}, { ligero: "1" }]) {
    const r = await perfil("Mateo503", extra);
    assert.equal(r.codigo, 200, JSON.stringify(extra));
    assert.equal(r.cuerpo.user.username, "MATEO503");
    assert.equal(Number(r.cuerpo.user.id), ids.MATEO503);
  }
});

test("el perfil de cada mitad de una pareja es el suyo, y el ambiguo no abre ninguno", async () => {
  assert.equal(Number((await perfil("jader")).cuerpo.user.id), ids.jader);
  assert.equal(Number((await perfil("Jader")).cuerpo.user.id), ids.Jader);
  assert.equal((await perfil("JADER")).codigo, 404);
  assert.equal((await perfil("Nadie")).codigo, 404);
});

test("se entra con otras mayúsculas, y la sesión lleva el nombre guardado", async () => {
  const r = await entrar("mateo503");
  assert.equal(r.cuerpo.success, true, JSON.stringify(r.cuerpo));
  assert.equal(r.cuerpo.user.username, "MATEO503");
  assert.ok(r.cuerpo.token);
});

test("la contraseña sigue mandando", async () => {
  const r = await entrar("mateo503", "otra-clave");
  assert.notEqual(r.cuerpo.success, true);
});

test("cada mitad de una pareja entra a la suya, y el ambiguo no entra", async () => {
  assert.equal((await entrar("jader")).cuerpo.user.username, "jader");
  assert.equal((await entrar("Jader")).cuerpo.user.username, "Jader");
  assert.notEqual((await entrar("JADER")).cuerpo.success, true);
});

test("no se registra un nombre que ya existe con otras mayúsculas, y el aviso lo dice", async () => {
  const otra = await registrar("mateo503");
  assert.equal(otra.cuerpo.success, false);
  assert.match(otra.cuerpo.error, /mayúsculas/);

  const igual = await registrar("MATEO503");
  assert.equal(igual.cuerpo.success, false);
  assert.equal(igual.cuerpo.error, "Ese nombre de usuario ya existe");

  const cuantas = await db.query("SELECT count(*)::int AS n FROM users WHERE LOWER(username) = 'mateo503'");
  assert.equal(cuantas.rows[0].n, 1);
});

test("un nombre nuevo se registra como siempre", async () => {
  const r = await registrar("Nueva_Cuenta");
  assert.equal(r.cuerpo.success, true, JSON.stringify(r.cuerpo));
  assert.equal(r.cuerpo.user.username, "Nueva_Cuenta");
});
