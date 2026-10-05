// ==============================
// UNA CUENTA BANEADA, EN EL NAVEGADOR — tests/baneadas-navegador.test.js
// ==============================
// La parte del navegador de lo que ven los demás de una cuenta baneada
// (api/_sanciones.js, docs/referencia/MODERACION.md). El servidor manda lo que
// escribió ya tapado, con "autor_baneado", y aquí:
//
//   - MRTexto.escrito() (js/core.js) lo pinta en rojo, escapado;
//   - el chat y las reseñas lo enseñan así, sin botones ni estrellas;
//   - los comentarios de los dos perfiles pasan por MRTexto.escrito();
//   - usuario.html de una cuenta baneada dice "Cuenta baneada" y no
//     pinta nada más.
//
// Los archivos de verdad (js/chat.js, js/resenas.js, js/usuario.js y el
// MRTexto de js/core.js) en jsdom, con sus páginas; la red es de mentira.
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
const TAPADO = "[Este usuario fue baneado y no es posible leer este mensaje]";
const esperar = async () => { for (let i = 0; i < 20; i++) await new Promise(r => setTimeout(r, 0)); };

// Solo se callan los "no implementado" de jsdom (navegar); el resto se ve.
function consola() {
  const c = new VirtualConsole();
  c.on("jsdomError", (e) => { if (!/Not implemented/i.test(String(e.message))) console.error(e); });
  return c;
}

// La página, con MRTexto de verdad, lo que usa de js/core.js de mentira
// y la red contestando lo que diga `contestar(url)`.
function pagina(html, url, contestar) {
  const dom = new JSDOM(leer(html), { url, runScripts: "outside-only", virtualConsole: consola() });
  const w = dom.window;
  const pedidas = [];
  w.eval(MRTEXTO + "\nwindow.MRTexto = MRTexto;");
  w.MRSession = { get: () => ({ nombre: "ana" }), subscribe() {} };
  w.SILUETA_AVATAR = { tipo: "silueta", src: "imagenes/avatar.png" };
  w.imagenDeAvatar = () => null;
  w.fotoDeAvatar = () => null;
  w.obtenerAvatarCacheado = () => null;
  w.obtenerPersonaCacheada = () => null;
  w.botonLikeHTML = () => "<button class='boton-like'>👍</button>";
  w.fetch = async (u) => {
    pedidas.push(String(u));
    return { ok: true, status: 200, json: async () => contestar(String(u)) };
  };
  return { w, d: w.document, pedidas };
}

describe("MRTexto.escrito", () => {

  const contexto = vm.createContext({});
  vm.runInContext(MRTEXTO + "\nthis.MRTexto = MRTexto;", contexto);
  const { escrito } = contexto.MRTexto;

  test("lo de una cuenta baneada, en rojo; lo demás, solo escapado", () => {
    assert.equal(escrito({ texto: TAPADO, autor_baneado: true }), `<span class="texto-baneado">${TAPADO}</span>`);
    assert.equal(escrito({ texto: "<b>hola</b>", autor_baneado: false }), "&lt;b&gt;hola&lt;/b&gt;");
    assert.equal(escrito({ texto: "<b>ojo</b>", autor_baneado: true }), `<span class="texto-baneado">&lt;b&gt;ojo&lt;/b&gt;</span>`);
    assert.equal(escrito({ bio: "mi bio" }, "bio"), "mi bio");
    assert.equal(escrito(null), "");
  });

});

describe("el chat", () => {

  test("el mensaje tapado sale en rojo y sin botones; los demás, con los suyos", async () => {
    const p = pagina("chat.html", "https://www.macroreborn.com/chat.html", () => ({ success: true, mensajes: [
      { id: 2, usuario: "pepe", texto: "buenas", created_at: "2026-09-28T12:00:00Z", autor_baneado: false },
      { id: 1, usuario: "troll", texto: TAPADO, created_at: "2026-09-28T11:00:00Z", autor_baneado: true }
    ] }));
    p.w.eval(leer("js", "chat.js"));
    await esperar();

    const mensajes = [...p.d.querySelectorAll("#mensajesChat .mensaje")];
    assert.equal(mensajes.length, 2);
    const [delTroll, dePepe] = mensajes;   // de más viejo a más nuevo
    assert.equal(delTroll.querySelector(".texto-chat .texto-baneado").textContent, TAPADO);
    assert.equal(delTroll.querySelector(".acciones-chat"), null, "el mensaje tapado tiene botones");
    assert.equal(dePepe.querySelector(".texto-chat").textContent, "buenas");
    assert.equal(dePepe.querySelector(".texto-baneado"), null);
    assert.ok(dePepe.querySelector(".btn-responder") && dePepe.querySelector(".btn-reportar") && dePepe.querySelector(".boton-like"));
    p.w.close();
  });

});

describe("las reseñas", () => {

  test("la tapada sale en rojo, sin estrellas ni botones; las demás, enteras", async () => {
    const p = pagina("juego.html", "https://www.macroreborn.com/juego.html?id=5", () => ({ success: true, resenas: [
      { usuario: "pepe", calificacion: 4, texto: "muy bueno", created_at: "2026-09-28T12:00:00Z", autor_baneado: false },
      { usuario: "troll", calificacion: null, texto: TAPADO, created_at: "2026-09-27T12:00:00Z", autor_baneado: true }
    ] }));
    p.w.eval(leer("js", "resenas.js"));
    await esperar();

    const [dePepe, delTroll] = [...p.d.querySelectorAll("#listaResenas .tarjeta-resena")];
    assert.equal(delTroll.querySelector(".resena-texto .texto-baneado").textContent, TAPADO);
    assert.equal(delTroll.querySelector(".resena-estrellas"), null, "la tapada tiene estrellas");
    assert.equal(delTroll.querySelector("button"), null, "la tapada tiene botones");
    assert.equal(dePepe.querySelectorAll(".resena-estrella.llena").length, 4);
    assert.equal(dePepe.querySelector(".resena-texto").textContent, "muy bueno");
    assert.ok(dePepe.querySelector(".boton-responder-resena") && dePepe.querySelector(".boton-like"));
    p.w.close();
  });

});

describe("los comentarios de los perfiles", () => {

  // Los dos perfiles cargan media web; aquí basta con saber que el texto
  // de cada comentario pasa por MRTexto.escrito() y ya no por el escape a
  // secas, que lo pintaría en el color de siempre.
  test("js/perfil.js y js/usuario.js pintan el texto con MRTexto.escrito()", () => {
    const perfil = leer("js", "perfil.js");
    const usuario = leer("js", "usuario.js");
    assert.equal((perfil.match(/MRTexto\.escrito\(c\)/g) || []).length, 2, "js/perfil.js: los últimos y la lista entera");
    assert.equal((usuario.match(/MRTexto\.escrito\(c\)/g) || []).length, 1);
    for (const [nombre, fuente] of [["js/perfil.js", perfil], ["js/usuario.js", usuario]]) {
      assert.doesNotMatch(fuente, /escaparHTML\(c\.texto\)/, nombre + " vuelve a escapar el comentario a secas");
    }
  });

});

describe("el perfil de una cuenta baneada", () => {

  test("dice \"Cuenta baneada\", con el aviso en rojo, la silueta y solo la pestaña de inicio", async () => {
    const p = pagina("usuario.html", "https://www.macroreborn.com/usuario.html?usuario=troll", (url) =>
      url.startsWith("/api/users?username=")
        ? { success: true, user: { id: 9, username: "troll", level: 7, xp: 30, bio: TAPADO, avatar: null,
            avatar_compuesto: null, baneado: true, suspendido: false, created_at: "2026-09-01T00:00:00Z" } }
        : { success: true });
    p.w.eval(leer("js", "usuario.js"));
    await esperar();
    const d = p.d;
    const oculto = (el) => el.style.display === "none";

    assert.equal(d.getElementById("nombreUsuario").textContent, "troll");
    assert.equal(d.querySelector("#biografia .texto-baneado").textContent, TAPADO);
    assert.equal(d.querySelector("#avatarUsuario img").getAttribute("src"), "imagenes/avatar.png");
    for (const id of ["nivel", "perfilMetaAvatar", "agregarAmigo", "bloquearUsuario"]) {
      assert.ok(oculto(d.getElementById(id)), id + " se ve");
    }
    assert.ok(oculto(d.querySelector(".tarjeta-stats")), "se ven las estadísticas");
    const pestanas = [...d.querySelectorAll(".tab")].filter(b => !b.hidden).map(b => b.dataset.tab);
    assert.deepStrictEqual(pestanas, ["inicio"]);
    const aviso = d.getElementById("avisoPerfilBloqueado");
    assert.equal(aviso.hidden, false);
    assert.equal(aviso.textContent, "⛔ Cuenta baneada");
    // Ni amigos, ni comentarios, ni logros: no se pide nada más.
    assert.deepStrictEqual(p.pedidas, ["/api/users?username=troll"]);
    p.w.close();
  });

});
