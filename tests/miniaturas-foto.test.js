// ==============================
// LA FOTO DE PERFIL EN LAS MINIATURAS — tests/miniaturas-foto.test.js
// ==============================
// Desde el 28/09/2026 cada avatar puesto tiene su foto de perfil, la cara
// de su personaje en un cuadrado (/avatares/<id>/cara.jpg, api/_avatar-
// compuesto.js). La barra, el portal, el buscador, Explorar y Comunidad
// la usaron desde el principio; el mismo día se pasaron el resto de huecos
// pequeños, cuadrados o redondos, que metían el cuerpo entero diminuto:
//
//   - el chat, las reseñas, los comentarios y la actividad de los dos
//     perfiles, y las Ligas (que enseñaban solo la inicial).
//
// Lo que se queda con el cuerpo entero, a propósito: el avatar grande del
// perfil, las tarjetas de amigos (verticales), los diseños guardados y el
// Bazar.
//
// Correr:  npm test

const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");

const raiz = path.join(__dirname, "..");
const leer = (...p) => fs.readFileSync(path.join(raiz, ...p), "utf8").replace(/\r\n/g, "\n");
const CORE = leer("js", "core.js");
const MRTEXTO = CORE.slice(CORE.indexOf("const MRTexto = {"),
  CORE.indexOf("if (typeof window !== \"undefined\") window.MRTexto = MRTexto;"));
const esperar = async () => { for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 0)); };

const FOTO = { tipo: "foto", src: "/avatares/7/cara.jpg?v=abcdef123456" };

// Una página con su script de verdad; lo de js/core.js, de mentira, con
// fotoDeAvatar dando la foto de "pepe".
function pagina(html, url, respuesta) {
  const consola = new VirtualConsole();
  consola.on("jsdomError", (e) => { if (!/Not implemented/i.test(String(e.message))) console.error(e); });
  const w = new JSDOM(leer(html), { url, runScripts: "outside-only", virtualConsole: consola }).window;
  w.eval(MRTEXTO + "\nwindow.MRTexto = MRTexto;");
  w.MRSession = { get: () => ({ nombre: "ana" }), subscribe() {} };
  w.SILUETA_AVATAR = { tipo: "silueta", src: "imagenes/avatar.png" };
  w.fotoDeAvatar = (avatar, persona) => (persona && persona.id === 7 ? FOTO : null);
  w.imagenDeAvatar = () => { throw new Error("pidió el cuerpo entero"); };
  w.obtenerAvatarCacheado = () => ({ modelo: "tora" });
  w.obtenerPersonaCacheada = (nombre) => (nombre === "pepe" ? { id: 7, avatar_compuesto: "abcdef1234567890" } : null);
  w.fetch = async () => ({ ok: true, status: 200, json: async () => respuesta });
  return w;
}

describe("el chat y las reseñas", () => {

  test("el chat pinta la cara, que llena el hueco, y la silueta a quien no tiene", async () => {
    const w = pagina("chat.html", "https://www.macroreborn.com/chat.html", { success: true, mensajes: [
      { id: 2, usuario: "pepe", texto: "hola", created_at: "2026-09-28T12:00:00Z" },
      { id: 1, usuario: "nadie", texto: "buenas", created_at: "2026-09-28T11:00:00Z" }
    ] });
    w.eval(leer("js", "chat.js"));
    await esperar();
    const [deNadie, dePepe] = [...w.document.querySelectorAll("#mensajesChat .mensaje")];
    const cara = dePepe.querySelector(".cabecera-mensaje img");
    assert.equal(cara.getAttribute("data-src"), FOTO.src);
    assert.equal(cara.className, "avatar-chat");
    assert.equal(dePepe.querySelector(".avatar-chat-personalizado"), null, "la foto va en el marco del cuerpo entero");
    assert.equal(deNadie.querySelector(".cabecera-mensaje img").getAttribute("src"), "imagenes/avatar.png");
    w.close();
  });

  test("las reseñas, igual", async () => {
    const w = pagina("juego.html", "https://www.macroreborn.com/juego.html?id=5", { success: true, resenas: [
      { usuario: "pepe", calificacion: 4, texto: "bueno", created_at: "2026-09-28T12:00:00Z" }
    ] });
    w.eval(leer("js", "resenas.js"));
    await esperar();
    const cara = w.document.querySelector("#listaResenas .tarjeta-resena img");
    assert.equal(cara.getAttribute("data-src"), FOTO.src);
    assert.equal(cara.className, "resena-avatar-simple");
    w.close();
  });

});

describe("los perfiles", () => {

  // Un trozo de un archivo, de su "function" a su llave de cierre: la que
  // tiene la misma sangría que la palabra function (la de usuario.js va
  // dentro de otra función).
  function cuerpo(archivo, nombre) {
    const texto = leer("js", archivo);
    const i = texto.search(new RegExp("function " + nombre + "\\("));
    assert.ok(i !== -1, "no está " + nombre + " en js/" + archivo);
    const sangria = texto.slice(texto.lastIndexOf("\n", i) + 1, i);
    const fin = texto.indexOf("\n" + sangria + "}\n", i);
    assert.ok(fin !== -1, "no se encontró el final de " + nombre);
    return texto.slice(i, fin + sangria.length + 2);
  }

  const MINIATURAS = [
    ["perfil.js", "obtenerAvatarComentario"],
    ["perfil-actividad.js", "avatarMiniActividad"],
    ["usuario.js", "obtenerAvatarComentario"],
    ["usuario-actividad.js", "avatarMiniActividadUsuario"]
  ];

  for (const [archivo, nombre] of MINIATURAS) {
    test(`${archivo}: ${nombre} pinta la cara, que llena el hueco`, () => {
      const texto = cuerpo(archivo, nombre);
      assert.match(texto, /fotoDeAvatar\(obtenerAvatarCacheado\(nombre\), obtenerPersonaCacheada\(nombre\)\)/);
      assert.match(texto, /imagen\.tipo === "foto"/, "no tiene rama para la foto: saldría en el marco del cuerpo entero");
      assert.doesNotMatch(texto, /imagenDeAvatar\(|imagenAvatarPerfil\(/);
    });
  }

  test("las tarjetas de amigos siguen con el cuerpo entero: son verticales", () => {
    assert.match(leer("js", "perfil.js"), /imagenDeAvatar\(amigo\.avatar, amigo, 62, 96\)/);
    assert.match(leer("js", "usuario.js"), /imagenAvatarPerfil\(amigo\.avatar, amigo, 62, 96\)/);
    assert.match(leer("js", "amigos.js"), /imagenDeAvatar\(amigo\.avatar, amigo, 62, 96\)/);
  });

});

describe("las Ligas", () => {

  // La función de verdad, con su escape y su nombre, en vm.
  const LIGA = leer("js", "liga-global.js");
  const linea = (inicio) => {
    const i = LIGA.indexOf(inicio);
    assert.ok(i !== -1, "no está " + inicio + " en js/liga-global.js");
    return LIGA.slice(i, LIGA.indexOf("\n", i));
  };
  function avatarLiga(fotoDeAvatar) {
    const contexto = { fotoDeAvatar };
    vm.createContext(contexto);
    vm.runInContext(linea("const esc=") + "\n" + linea("const name=") + "\n" + linea("const avatarLiga=") +
      "\nthis.avatarLiga = avatarLiga;", contexto);
    return contexto.avatarLiga;
  }

  test("el círculo de cada jugador lleva su cara; sin avatar, la inicial", () => {
    const pepe = { id: 7, username: "pepe", avatar: { modelo: "tora" }, avatar_compuesto: "abc" };
    const conFoto = avatarLiga(() => FOTO)(pepe);
    assert.match(conFoto, /^<img data-src="\/avatares\/7\/cara\.jpg\?v=abcdef123456" alt="" loading="lazy" style="[^"]*object-fit:cover"/);
    assert.equal(avatarLiga(() => ({ tipo: "silueta", src: "imagenes/avatar.png" }))(pepe), "P");
    assert.equal(avatarLiga(() => null)({ username: "<b>x" }), "&lt;");
    assert.match(avatarLiga(() => ({ tipo: "png", src: "/api/users?action=avatar-png&username=jefa&v=1" }))(pepe),
      /class="avatar-png-personalizado"[^>]*object-fit:contain/);
  });

  test("y la tabla lo usa", () => {
    assert.match(LIGA, /<span class="lg-avatar">\$\{avatarLiga\(u\)\}<\/span>/);
  });

});
