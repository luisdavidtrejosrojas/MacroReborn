// ==============================
// LA PÁGINA DEL BAZAR — tests/bazar-pagina.test.js
// ==============================
// bazar.html con su js/bazar.js de verdad y el escape de verdad (MRTexto,
// de js/core.js). La red y la sesión son de mentira. El Bazar es la
// tienda de prendas desde el 28/09/2026 (diseño del zip del otro dev, del
// 22/09); tienda.html redirige aquí.
//
// Qué se prueba: lo que ve quien no tiene sesión y quien sí; los filtros;
// que todo lo que llega se escape; el camino de una compra, la buena y
// las que fallan; el enlace a una prenda (bazar.html?prenda=...); el
// "Ver más", y que tienda.html lleve al Bazar con la misma prenda.
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
const HTML = leer("bazar.html");
const BAZAR = leer("js", "bazar.js");
const CORE = leer("js", "core.js");
const MRTEXTO = CORE.slice(CORE.indexOf("const MRTexto = {"),
  CORE.indexOf("if (typeof window !== \"undefined\") window.MRTexto = MRTexto;"));

const DIA = 24 * 60 * 60 * 1000;
const hace = (dias) => new Date(Date.now() - dias * DIA).toISOString();
const cifra = (n) => n.toLocaleString("es-AR");

// Del servidor llegan de lo más nuevo a lo más viejo.
const CATALOGO = [
  { id: 1, categoria: "pelo", modelo: "tora", valorCapa: "tora_pelo1", nombre: "Melena <b>larga</b>",
    precio: 120, creadoEl: hace(2), previsualizacion: "/previsualizaciones/1.jpg?v=aaaaaaaaaaaa" },
  { id: 2, categoria: "remera", modelo: "tora", valorCapa: "tora_remera2", nombre: "Remera azul",
    precio: 100, creadoEl: hace(20), previsualizacion: "/previsualizaciones/2.jpg?v=bbbbbbbbbbbb" },
  { id: 3, categoria: "mascota", modelo: "tora", valorCapa: "tora_mascota3", nombre: "Dragón",
    precio: 900, creadoEl: hace(30), previsualizacion: null },
  { id: 4, categoria: "pelo", modelo: "cereza", valorCapa: "cereza_pelo4", nombre: "Coletas",
    precio: 150, creadoEl: hace(40), previsualizacion: "/previsualizaciones/4.jpg?v=cccccccccccc" }
];

const esperar = (ms) => new Promise(r => setTimeout(r, ms || 5));

// Solo se callan los "no implementado" de jsdom (navegar); el resto se ve.
function consola() {
  const c = new VirtualConsole();
  c.on("jsdomError", (e) => { if (!/Not implemented/i.test(String(e.message))) console.error(e); });
  return c;
}

// opciones: url, sesion (el usuario de MRSession, o null), monedas y
// comprados (lo que contesta el servidor), items, compra ({ status,
// cuerpo }) y sinRed (el catálogo no llega).
async function montar(opciones) {
  const o = opciones || {};
  const dom = new JSDOM(HTML, {
    url: o.url || "https://www.macroreborn.com/bazar.html",
    runScripts: "outside-only",
    virtualConsole: consola()
  });
  const w = dom.window;
  const pedidas = [];
  const sesion = o.sesion === undefined ? null : o.sesion;

  // La barra de navegación la pone js/navbar.js; aquí basta su saldo.
  const barra = w.document.createElement("span");
  barra.id = "navMonedas";
  w.document.body.appendChild(barra);

  w.eval(MRTEXTO + "\nwindow.MRTexto = MRTexto;");
  w.MRSession = {
    get: () => sesion,
    isLogged: () => !!sesion,
    update: (cambios) => Object.assign(sesion, cambios)
  };
  w.fetch = async (url, init) => {
    pedidas.push({ url, init });
    if (url.includes("action=avatar-shop-buy")) {
      const r = o.compra || { status: 200, cuerpo: { success: false, error: "sin respuesta preparada" } };
      return { ok: (r.status || 200) < 400, status: r.status || 200, json: async () => r.cuerpo };
    }
    if (o.sinRed) throw new Error("sin red");
    return {
      ok: true, status: 200,
      json: async () => ({
        success: true,
        items: o.items || CATALOGO,
        comprados: o.comprados || [],
        monedas: o.monedas === undefined ? null : o.monedas
      })
    };
  };
  w.eval(BAZAR);
  await esperar(20);

  const d = w.document;
  const $ = (id) => d.getElementById(id);
  return {
    w, d, $, pedidas, sesion, barra,
    tarjetas: () => [...d.querySelectorAll("#bazarGrid .bazar-card")],
    nombres: () => [...d.querySelectorAll("#bazarGrid .bazar-card h3")].map(h => h.textContent),
    tarjeta: (id) => d.querySelector(`#bazarGrid .bazar-card[data-id="${id}"]`),
    modalAbierto: () => $("bazarModalBackdrop").classList.contains("abierto"),
    cambiar: async (id, valor) => {
      const control = $(id);
      if (control.type === "checkbox") control.checked = valor; else control.value = valor;
      control.dispatchEvent(new w.Event(control.type === "search" ? "input" : "change"));
      await esperar(control.type === "search" ? 200 : 5);
    },
    cerrar: () => w.close()
  };
}

describe("sin sesión", () => {

  test("se ve el catálogo, sin saldo, y cada prenda invita a entrar y volver al Bazar", async () => {
    const p = await montar();
    assert.deepStrictEqual(p.nombres(), ["Melena <b>larga</b>", "Remera azul", "Dragón", "Coletas"]);
    assert.equal(p.$("bazarSaldo").textContent, "🪙 0");
    assert.equal(p.$("bazarSaldoNota").textContent, "Iniciá sesión para comprar");
    const enlaces = [...p.d.querySelectorAll("#bazarGrid .bazar-login")];
    assert.equal(enlaces.length, 4);
    assert.ok(enlaces.every(a => a.getAttribute("href") === "login.html?volver=bazar.html"));
    assert.equal(p.d.querySelectorAll("[data-comprar-id]").length, 0);
    p.cerrar();
  });

  test("si hay sesión en el navegador pero el servidor no la reconoce, avisa de que caducó", async () => {
    const p = await montar({ sesion: { nombre: "ana" }, monedas: null });
    assert.match(p.$("bazarSaldoNota").textContent, /caducó/);
    p.cerrar();
  });

  test("si el catálogo no llega, lo dice", async () => {
    const p = await montar({ sinRed: true });
    assert.match(p.$("bazarGrid").textContent, /No pudimos cargar el Bazar/);
    p.cerrar();
  });

});

describe("con sesión", () => {

  const conSesion = (extra) => montar(Object.assign({ sesion: { nombre: "ana", monedas: 500 }, monedas: 500, comprados: [2] }, extra));

  test("cada prenda dice qué se puede hacer, y lo comprado se esconde hasta pedirlo", async () => {
    const p = await conSesion();
    assert.equal(p.$("bazarSaldo").textContent, "🪙 " + cifra(500));
    assert.deepStrictEqual(p.nombres(), ["Melena <b>larga</b>", "Dragón", "Coletas"]);
    assert.equal(p.tarjeta(1).querySelector("[data-comprar-id]").textContent, "Comprar ahora");
    const caro = p.tarjeta(3).querySelector("button");
    assert.equal(caro.disabled, true);
    assert.equal(caro.textContent, "Te faltan 🪙 " + cifra(400));

    await p.cambiar("bazarMostrarCompradas", true);
    const mia = p.tarjeta(2).querySelector(".bazar-ver-perfil");
    assert.equal(mia.getAttribute("href"), "perfil.html?ponerse=tora_remera2");
    assert.match(mia.textContent, /Ponértela/);
    p.cerrar();
  });

  test("la última llegada es la más nueva, y nueva es solo lo de la última semana", async () => {
    const p = await conSesion();
    assert.equal(p.d.querySelector("#bazarDestacado h2").textContent, "Melena <b>larga</b>");
    assert.equal(p.tarjeta(1).classList.contains("nueva"), true);
    assert.equal(p.tarjeta(4).classList.contains("nueva"), false);
    p.cerrar();
  });

  test("todo lo que llega del servidor se escapa", async () => {
    const p = await conSesion();
    assert.equal(p.d.querySelectorAll("#bazarGrid b, #bazarDestacado b").length, 0);
    p.cerrar();
  });

  test("filtra por categoría, personaje y texto", async () => {
    const p = await conSesion();
    await p.cambiar("bazarCategoria", "pelo");
    assert.deepStrictEqual(p.nombres(), ["Melena <b>larga</b>", "Coletas"]);
    await p.cambiar("bazarModelo", "cereza");
    assert.deepStrictEqual(p.nombres(), ["Coletas"]);
    await p.cambiar("bazarCategoria", "");
    await p.cambiar("bazarModelo", "");
    await p.cambiar("bazarBuscar", "drag");
    assert.deepStrictEqual(p.nombres(), ["Dragón"]);
    await p.cambiar("bazarBuscar", "nada de nada");
    assert.match(p.$("bazarGrid").textContent, /No encontramos prendas/);
    p.cerrar();
  });

});

describe("comprar", () => {

  const comprando = (compra) => montar({
    sesion: { nombre: "ana", monedas: 500 }, monedas: 500, comprados: [], compra
  });

  test("pregunta, compra mandando solo la prenda y ofrece ponérsela", async () => {
    const p = await comprando({ status: 200, cuerpo: { success: true, monedas: 380, prenda: { id: 1 } } });
    p.tarjeta(1).querySelector("[data-comprar-id]").click();
    assert.equal(p.modalAbierto(), true);
    assert.match(p.$("bazarModalConfirmacion").textContent, /te quedarán 🪙 380/);

    p.$("bazarModalConfirmar").click();
    await esperar(10);
    const compra = p.pedidas.find(x => x.url.includes("avatar-shop-buy"));
    assert.deepStrictEqual(JSON.parse(compra.init.body), { itemId: 1 });

    assert.equal(p.$("bazarSaldo").textContent, "🪙 380");
    assert.equal(p.barra.textContent, "🪙 380");
    assert.equal(p.sesion.monedas, 380);
    assert.equal(p.modalAbierto(), true);
    assert.equal(p.$("bazarModalTitulo").textContent, "¡Es tuya!");
    assert.equal(p.$("bazarModalConfirmar").textContent, "Ponértela ahora");
    assert.equal(p.$("bazarModalCerrar").textContent, "Seguir mirando");
    p.cerrar();
  });

  test("cancelar no compra nada", async () => {
    const p = await comprando();
    p.tarjeta(1).querySelector("[data-comprar-id]").click();
    p.$("bazarModalCerrar").click();
    assert.equal(p.modalAbierto(), false);
    assert.equal(p.pedidas.filter(x => x.url.includes("avatar-shop-buy")).length, 0);
    p.cerrar();
  });

  test("si el servidor dice que no, lo cuenta y no toca el saldo", async () => {
    const p = await comprando({ status: 200, cuerpo: { success: false, error: "No te alcanzan las monedas" } });
    p.tarjeta(1).querySelector("[data-comprar-id]").click();
    p.$("bazarModalConfirmar").click();
    await esperar(10);
    assert.equal(p.$("bazarToast").textContent, "No te alcanzan las monedas");
    assert.equal(p.$("bazarSaldo").textContent, "🪙 500");
    assert.equal(p.modalAbierto(), false);
    p.cerrar();
  });

  test("con la sesión caducada, pide volver a iniciarla", async () => {
    const p = await comprando({ status: 401, cuerpo: { success: false, error: "Sesión no válida" } });
    p.tarjeta(1).querySelector("[data-comprar-id]").click();
    p.$("bazarModalConfirmar").click();
    await esperar(10);
    assert.match(p.$("bazarToast").textContent, /sesión caducó/);
    p.cerrar();
  });

  test("si ya la tenía (otra pestaña), la marca como suya", async () => {
    const p = await comprando({ status: 200, cuerpo: { success: false, error: "Ya tenés esta prenda" } });
    p.tarjeta(1).querySelector("[data-comprar-id]").click();
    p.$("bazarModalConfirmar").click();
    await esperar(10);
    assert.equal(p.tarjeta(1), null, "sigue a la venta");
    p.cerrar();
  });

});

describe("una prenda enlazada (bazar.html?prenda=...)", () => {

  test("se enseña con sus filtros, se destaca y se pregunta si comprarla", async () => {
    const p = await montar({ url: "https://www.macroreborn.com/bazar.html?prenda=cereza_pelo4",
      sesion: { nombre: "ana" }, monedas: 500 });
    assert.equal(p.$("bazarCategoria").value, "pelo");
    assert.equal(p.$("bazarModelo").value, "cereza");
    assert.equal(p.tarjeta(4).classList.contains("destacada"), true);
    assert.equal(p.modalAbierto(), true);
    assert.equal(p.$("bazarModalTitulo").textContent, "Coletas");
    assert.equal(p.w.location.search, "", "la prenda sigue en la dirección");
    p.cerrar();
  });

  test("sin sesión, se enseña pero no se pregunta", async () => {
    const p = await montar({ url: "https://www.macroreborn.com/bazar.html?prenda=cereza_pelo4" });
    assert.equal(p.tarjeta(4).classList.contains("destacada"), true);
    assert.equal(p.modalAbierto(), false);
    p.cerrar();
  });

  test("si ya no está a la venta, lo dice", async () => {
    const p = await montar({ url: "https://www.macroreborn.com/bazar.html?prenda=no_existe", sesion: { nombre: "ana" }, monedas: 500 });
    assert.match(p.$("bazarToast").textContent, /ya no está a la venta/);
    p.cerrar();
  });

  test("aunque esté más allá de la primera página", async () => {
    const muchas = Array.from({ length: 60 }, (_, i) => ({
      id: 100 + i, categoria: "pelo", modelo: "tora", valorCapa: "tora_pelo" + (100 + i), nombre: "Pelo " + i,
      precio: 10, creadoEl: hace(10 + i), previsualizacion: null
    }));
    const p = await montar({ url: "https://www.macroreborn.com/bazar.html?prenda=tora_pelo150",
      sesion: { nombre: "ana" }, monedas: 500, items: muchas });
    assert.ok(p.tarjeta(150), "no se pintó");
    assert.equal(p.tarjeta(150).classList.contains("destacada"), true);
    p.cerrar();
  });

});

test("se pinta de 24 en 24, y Ver más añade las siguientes", async () => {
  const muchas = Array.from({ length: 60 }, (_, i) => ({
    id: 100 + i, categoria: "pelo", modelo: "tora", valorCapa: "tora_pelo" + (100 + i), nombre: "Pelo " + i,
    precio: 10, creadoEl: hace(10 + i), previsualizacion: null
  }));
  const p = await montar({ items: muchas });
  assert.equal(p.tarjetas().length, 24);
  assert.equal(p.$("bazarVerMas").hidden, false);
  assert.match(p.$("bazarVerMas").textContent, /36/);
  p.$("bazarVerMas").click();
  assert.equal(p.tarjetas().length, 48);
  p.$("bazarVerMas").click();
  assert.equal(p.tarjetas().length, 60);
  assert.equal(p.$("bazarVerMas").hidden, true);
  // Un filtro vuelve a empezar de 24.
  await p.cambiar("bazarCategoria", "pelo");
  assert.equal(p.tarjetas().length, 24);
  p.cerrar();
});

test("el Bazar nunca pide el dibujo suelto de una prenda, solo su previsualización", async () => {
  const p = await montar({ sesion: { nombre: "ana" }, monedas: 500 });
  const fuentes = [...p.d.querySelectorAll("#bazarGrid img, #bazarDestacado img")].map(i => i.getAttribute("src"));
  assert.ok(fuentes.length > 0);
  assert.ok(fuentes.every(s => s.startsWith("/previsualizaciones/")), fuentes.join(", "));
  // Ninguna dirección de /prendas/ en el código (en los comentarios sí se nombra).
  assert.ok(!/["'`]\/prendas\//.test(BAZAR), "js/bazar.js arma una dirección de /prendas/");
  p.cerrar();
});

test("tienda.html lleva al Bazar, con la misma prenda", () => {
  const html = leer("tienda.html");
  const script = html.slice(html.indexOf("<script>") + 8, html.indexOf("</script>"));
  const ubicacion = { search: "?prenda=tora_pelo3", hash: "", replace(u) { this.fue = u; } };
  vm.runInNewContext(script, { location: ubicacion });
  assert.equal(ubicacion.fue, "bazar.html?prenda=tora_pelo3");
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.macroreborn\.com\/bazar\.html">/);
});

test("el pelo de atrás sale con su nombre, en el filtro y en la tarjeta", async () => {
  // La capa del 04/10/2026 (docs/AVATARES-SERVIDOR.md, sección 14).
  const items = [...CATALOGO, { id: 5, categoria: "peloatras", modelo: "tora", valorCapa: "tora_peloatras1",
    nombre: "Colas largas", precio: 500, rareza: "rara", creadoEl: hace(50),
    previsualizacion: "/previsualizaciones/5.jpg?v=dddddddddddd" }];
  const p = await montar({ items });
  const opcion = [...p.$("bazarCategoria").options].find(o => o.value === "peloatras");
  assert.equal(opcion.textContent, "Pelo de atrás");
  assert.match(p.tarjeta(5).querySelector(".bazar-descriptor").textContent, /^Pelo de atrás · /);
  p.cerrar();
});

describe("la rareza", () => {
  // Desde el 04/10/2026 el precio de una prenda lo da su rareza
  // (api/_precios.js, docs/ECONOMIA.md). El Bazar la enseña en cada
  // prenda y deja filtrar por ella. Una sin rareza es común.
  const CON_RAREZA = CATALOGO.map(item =>
    item.id === 3 ? { ...item, rareza: "legendaria", precio: 6000 } :
    item.id === 2 ? { ...item, rareza: "epica", precio: 1400 } : item);

  test("cada prenda lleva su etiqueta y el marco de su rareza", async () => {
    const p = await montar({ items: CON_RAREZA });
    const etiqueta = (id) => p.tarjeta(id).querySelector(".bazar-rareza").textContent;
    assert.equal(etiqueta(3), "Legendaria");
    assert.equal(etiqueta(2), "Épica");
    assert.equal(etiqueta(1), "Común");
    assert.ok(p.tarjeta(3).classList.contains("rareza-legendaria"));
    assert.ok(p.tarjeta(1).classList.contains("rareza-comun"));
    p.cerrar();
  });

  test("el filtro deja solo las de una rareza", async () => {
    const p = await montar({ items: CON_RAREZA });
    await p.cambiar("bazarRareza", "legendaria");
    assert.deepStrictEqual(p.nombres(), ["Dragón"]);
    await p.cambiar("bazarRareza", "comun");
    assert.deepStrictEqual(p.nombres(), ["Melena <b>larga</b>", "Coletas"]);
    await p.cambiar("bazarRareza", "");
    assert.equal(p.nombres().length, 4);
    p.cerrar();
  });
});
