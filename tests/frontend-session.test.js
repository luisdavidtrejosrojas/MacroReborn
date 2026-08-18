// ==============================
// TESTS DE SESIÓN DEL FRONTEND
// ==============================
// Ejecutan el código real de js/core.js dentro de un contexto de navegador
// mínimo. No necesitan servidor, Neon ni un navegador instalado: solo
// comprueban la transición de localStorage y el header Authorization.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const CORE = fs.readFileSync(
  path.join(__dirname, "..", "js", "core.js"),
  "utf8"
);

function crearContexto({ almacenamiento = {}, respuesta = { status: 200 } } = {}) {
  const datos = new Map(Object.entries(almacenamiento));
  const redirecciones = [];
  const peticiones = [];

  const localStorage = {
    getItem(clave) {
      return datos.has(clave) ? datos.get(clave) : null;
    },
    setItem(clave, valor) {
      datos.set(clave, String(valor));
    },
    removeItem(clave) {
      datos.delete(clave);
    }
  };

  const documento = {
    readyState: "loading",
    addEventListener() {}
  };

  const ventana = {
    location: {
      origin: "https://macroreborn.test",
      pathname: "/jugar.html",
      href: "https://macroreborn.test/jugar.html",
      replace(destino) {
        redirecciones.push(destino);
      }
    },
    fetch: async (url, opciones) => {
      peticiones.push({ url, opciones });
      return respuesta;
    }
  };

  const contexto = {
    window: ventana,
    document: documento,
    localStorage,
    console: { warn() {} },
    URL,
    Headers,
    MutationObserver: undefined,
    Image: undefined,
    setInterval() {},
    clearInterval() {}
  };

  vm.createContext(contexto);
  vm.runInContext(CORE, contexto, { filename: "js/core.js" });
  vm.runInContext(
    "globalThis.__sessionApi = { limpiarSesionLocal, guardarSesionLocal, validarSesionLocal, redirigirASesion };",
    contexto
  );

  return { contexto, datos, redirecciones, peticiones };
}

const TOKEN = "cabecera.firma";
const USUARIO = JSON.stringify({ username: "jugador", nombre: "jugador" });

test("limpia una sesión antigua sin token y redirige al login", () => {
  const entorno = crearContexto({
    almacenamiento: { usuarioActivo: USUARIO }
  });

  assert.equal(entorno.datos.has("usuarioActivo"), false);
  assert.equal(entorno.datos.has("macroSessionToken"), false);
  assert.deepEqual(entorno.redirecciones, ["/login.html?sesion=incompleta"]);
});

test("conserva una sesión completa y añade Authorization a las peticiones API", async () => {
  const entorno = crearContexto({
    almacenamiento: {
      usuarioActivo: USUARIO,
      macroSessionToken: TOKEN
    }
  });

  const respuesta = await entorno.contexto.window.fetch("/api/users?action=xp", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  assert.equal(respuesta.status, 200);
  assert.equal(entorno.peticiones.length, 1);
  assert.equal(
    new Headers(entorno.peticiones[0].opciones.headers).get("Authorization"),
    `Bearer ${TOKEN}`
  );
  assert.deepEqual(entorno.redirecciones, []);
});

test("un 401 invalida la sesión local y fuerza un nuevo login", async () => {
  const entorno = crearContexto({
    almacenamiento: {
      usuarioActivo: USUARIO,
      macroSessionToken: TOKEN
    },
    respuesta: { status: 401 }
  });

  await entorno.contexto.window.fetch("/api/users?action=xp", { method: "POST" });

  assert.equal(entorno.datos.has("usuarioActivo"), false);
  assert.equal(entorno.datos.has("macroSessionToken"), false);
  assert.deepEqual(entorno.redirecciones, ["/login.html?sesion=expirada"]);
});

test("no expulsa a un visitante que no tiene sesión local", async () => {
  const entorno = crearContexto({ respuesta: { status: 401 } });

  await entorno.contexto.window.fetch("/api/users?action=xp", { method: "POST" });

  assert.deepEqual(entorno.redirecciones, []);
  assert.equal(entorno.datos.size, 0);
});

test("guardarSesionLocal rechaza respuestas de login sin token", () => {
  const entorno = crearContexto({
    almacenamiento: { usuarioActivo: USUARIO, macroSessionToken: TOKEN }
  });

  const guardada = entorno.contexto.__sessionApi.guardarSesionLocal(
    { username: "otro", nombre: "otro" },
    null
  );

  assert.equal(guardada, false);
  assert.equal(entorno.datos.size, 0);
});
