// ==============================
// MIRAR LOS JUEGOS UNO A UNO — scripts/revision-juegos.js
// ==============================
// Abrir 112 juegos a mano para saber si siguen funcionando son horas, y
// lo que se ve un dia no se puede comparar con lo que se ve otro. Esto
// los abre todos en Edge, sin ventana, por la pagina de jugar de verdad,
// y de cada uno apunta:
//
//   - si carga: el elemento mas grande que pinta el marco del juego (un
//     canvas, el reproductor de Flash, un video, el #game de los
//     emuladores...), y "carga" si mide 64.000 px2 o mas (320x200);
//   - los errores de JavaScript del marco;
//   - una captura del marco;
//   - con --sonda, si el juego puede ver la web: antes de empezar deja
//     localStorage["mr_sonda"] = "1" en la web y mira, desde dentro de
//     cada juego, si lee esa clave y si llega a la pagina que lo
//     contiene. Es una clave de prueba y no la sesion, para poder hacerlo
//     tambien en la web real sin entrar con ninguna cuenta.
//
// Nacio con specs/008-aislar-juegos (research D12): se corre antes de
// sacar los juegos a su propia direccion y despues, y se comparan. Muchos
// juegos esperan a que alguien pulse "Play": los 46 emuladores esconden
// su pantalla (#game, display:none) hasta entonces, y despues piden
// "Start Game". Con --pulsar, la revision hace lo que haria una persona:
// busca dentro del juego un boton con ese texto y lo pulsa con un clic
// de verdad, hasta dos veces. Aun asi, lo que manda es la pagina de
// capturas, lado a lado.
//
//   node scripts/revision-juegos.js                       contra el sitio local (3001)
//   node scripts/revision-juegos.js --base https://macroreborn.com --sonda
//   node scripts/revision-juegos.js --ids 5,113 --movil
//   node scripts/revision-juegos.js --comparar <otro>/informe.json --salida <carpeta>
//
// Opciones: --base, --salida (por defecto revision-juegos/<fecha>/, fuera
// de git), --sonda, --pulsar, --movil (390x844 con pantalla tactil; si
// no, 1366x800), --comparar, --ids, --espera (segundos despues de cargar
// el marco, 12 por defecto), --navegador (la ruta de Edge o de Chrome) y
// --cache (una cache HTTP que se comparte entre revisiones, para no bajar
// lo mismo cada vez; el resto del perfil es nuevo en cada revision).
//
// No la corre npm test: necesita un navegador y la red.

"use strict";

const fs = require("fs");
const os = require("os");
const net = require("net");
const path = require("path");
const vm = require("vm");
const { spawn } = require("child_process");

const RAIZ = path.join(__dirname, "..");
const AREA_MINIMA = 64000;
const SELECTOR_JUEGO = "canvas, embed, object, video, iframe, ruffle-player, ruffle-object, #game";
const PLAZO_JUEGO_MS = 120000;

function opcion(nombre, porDefecto) {
  const i = process.argv.indexOf(nombre);
  const valor = i > -1 ? process.argv[i + 1] : undefined;
  return valor !== undefined && !valor.startsWith("--") ? valor : porDefecto;
}
const tiene = (nombre) => process.argv.includes(nombre);
const pausa = (ms) => new Promise((ok) => setTimeout(ok, ms));

function marcaDeTiempo() {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}-${dos(d.getHours())}${dos(d.getMinutes())}`;
}

function rutaDelNavegador() {
  const candidatos = process.platform === "win32"
    ? ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
       "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
       "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"]
    : ["/usr/bin/microsoft-edge", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  return candidatos.find((ruta) => fs.existsSync(ruta)) || null;
}

const BASE = opcion("--base", "http://localhost:3001").replace(/\/+$/, "");
const SALIDA = path.resolve(opcion("--salida", path.join(RAIZ, "revision-juegos", marcaDeTiempo())));
const SONDA = tiene("--sonda");
const PULSAR = tiene("--pulsar");
const MOVIL = tiene("--movil");
const COMPARAR = opcion("--comparar", null);
const IDS = opcion("--ids", null);
const ESPERA_MS = Math.max(0, Number(opcion("--espera", "12")) || 0) * 1000;
const NAVEGADOR = opcion("--navegador", rutaDelNavegador());
const CACHE = path.resolve(opcion("--cache", path.join(os.tmpdir(), "revision-juegos-cache")));

const PANTALLA = MOVIL
  ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
  : { width: 1366, height: 800, deviceScaleFactor: 1, mobile: false };
const AGENTE_MOVIL = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";

// ---------- El catálogo ----------

function leerCatalogo() {
  const codigo = fs.readFileSync(path.join(RAIZ, "js", "datos-juegos.js"), "utf8");
  return vm.runInNewContext(codigo + "\n;juegos", {});
}

// Los tres tipos de data-model «Juego» (specs/008-aislar-juegos).
function tipoDe(juego) {
  const marco = String(juego.iframe || "");
  if (/^https?:\/\//i.test(marco)) return "otra-web";
  if (/html\/juegos\/macro-snake\.html$/.test(marco)) return "propio";
  if (/html\/juegos\//.test(marco)) return "terceros";
  return "sin-marco";
}

// El motor, por lo que lleva el envoltorio, como en research «Lo que hay hoy».
function motorDe(juego) {
  if (tipoDe(juego) === "otra-web" || tipoDe(juego) === "sin-marco") return "-";
  let html;
  try {
    html = fs.readFileSync(path.join(RAIZ, String(juego.iframe).replace(/^\.\//, "")), "utf8");
  } catch (error) {
    return "sin archivo";
  }
  if (/EJS_|emulatorjs/.test(html)) return "emulador";
  if (/UnityLoader|createUnityInstance|unityweb/i.test(html)) return "Unity";
  if (/ruffle/i.test(html)) return "Flash";
  return "otro";
}

// ---------- El navegador, por su protocolo de depuración ----------

function puertoLibre() {
  return new Promise((ok, mal) => {
    const sonda = net.createServer();
    sonda.on("error", mal);
    sonda.listen(0, "127.0.0.1", () => {
      const puerto = sonda.address().port;
      sonda.close(() => ok(puerto));
    });
  });
}

class Depurador {
  constructor(ws) {
    this.ws = ws;
    this.siguiente = 0;
    this.pendientes = new Map();
    this.oyentes = new Set();
    ws.addEventListener("message", (evento) => {
      const m = JSON.parse(evento.data);
      if (m.id && this.pendientes.has(m.id)) {
        const { ok, mal, reloj } = this.pendientes.get(m.id);
        this.pendientes.delete(m.id);
        clearTimeout(reloj);
        if (m.error) mal(new Error(m.error.message));
        else ok(m.result);
      } else if (m.method) {
        for (const oyente of this.oyentes) oyente(m);
      }
    });
  }

  enviar(metodo, parametros = {}, plazoMs = 30000) {
    const id = ++this.siguiente;
    return new Promise((ok, mal) => {
      const reloj = setTimeout(() => {
        this.pendientes.delete(id);
        mal(new Error(metodo + ": sin respuesta en " + plazoMs / 1000 + " s"));
      }, plazoMs);
      this.pendientes.set(id, { ok, mal, reloj });
      this.ws.send(JSON.stringify({ id, method: metodo, params: parametros }));
    });
  }

  escuchar(oyente) {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  }

  esperar(metodo, condicion, plazoMs) {
    return new Promise((ok, mal) => {
      const reloj = setTimeout(() => { quitar(); mal(new Error("sin " + metodo)); }, plazoMs);
      const quitar = this.escuchar((m) => {
        if (m.method === metodo && (!condicion || condicion(m.params))) {
          clearTimeout(reloj);
          quitar();
          ok(m.params);
        }
      });
    });
  }
}

function conectar(url) {
  return new Promise((ok, mal) => {
    const ws = new WebSocket(url);
    ws.addEventListener("open", () => ok(ws), { once: true });
    ws.addEventListener("error", () => mal(new Error("no se pudo conectar con " + url)), { once: true });
  });
}

async function abrirNavegador() {
  if (!NAVEGADOR || !fs.existsSync(NAVEGADOR)) {
    throw new Error("No encuentro Edge ni Chrome. Pasá la ruta con --navegador.");
  }
  const puerto = await puertoLibre();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "revision-juegos-perfil-"));
  fs.mkdirSync(CACHE, { recursive: true });
  const proceso = spawn(NAVEGADOR, [
    "--headless=new",
    `--remote-debugging-port=${puerto}`,
    `--user-data-dir=${perfil}`,
    `--disk-cache-dir=${CACHE}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--mute-audio",
    // Sin esto, el reproductor de Flash espera un toque antes de arrancar,
    // porque no puede empezar con sonido.
    "--autoplay-policy=no-user-gesture-required",
    // Todos los marcos en el mismo proceso, para poder mirar dentro de los
    // de otras webs desde la misma sesión. El navegador sigue separando los
    // orígenes igual: esto cambia dónde corren, no qué pueden ver.
    "--disable-site-isolation-trials",
    "--disable-features=IsolateOrigins,site-per-process",
    "about:blank"
  ], { stdio: "ignore" });

  let lista = null;
  for (let intento = 0; intento < 60 && !lista; intento++) {
    try {
      lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
    } catch (error) {
      await pausa(500);
    }
  }
  if (!lista) throw new Error("El navegador no abrió su puerto de depuración.");
  const pagina = lista.find((t) => t.type === "page");
  const version = await (await fetch(`http://127.0.0.1:${puerto}/json/version`)).json();
  return { proceso, perfil, puerto, urlPagina: pagina.webSocketDebuggerUrl, urlNavegador: version.webSocketDebuggerUrl };
}

async function cerrarNavegador(nav) {
  try {
    const ws = await conectar(nav.urlNavegador);
    ws.send(JSON.stringify({ id: 1, method: "Browser.close" }));
  } catch (error) {
    console.warn("No se pudo cerrar el navegador con Browser.close:", error.message);
  }
  for (let i = 0; i < 20 && nav.proceso.exitCode === null; i++) await pausa(250);
  if (nav.proceso.exitCode === null) nav.proceso.kill();
  for (let i = 0; i < 10; i++) {
    try {
      fs.rmSync(nav.perfil, { recursive: true, force: true });
      return;
    } catch (error) {
      if (i === 9) console.warn("No se pudo borrar el perfil temporal " + nav.perfil + ":", error.message);
      await pausa(500);
    }
  }
}

// ---------- Mirar un juego ----------

// Corre DENTRO del marco del juego, en un mundo aislado: ve el mismo
// documento y el mismo almacenamiento que el juego, sin tocar su código.
function medirDentro(conSonda, selector) {
  let mayor = null;
  for (const el of document.querySelectorAll(selector)) {
    const estilo = getComputedStyle(el);
    if (estilo.display === "none" || estilo.visibility === "hidden") continue;
    const caja = el.getBoundingClientRect();
    const area = Math.round(caja.width) * Math.round(caja.height);
    if (!mayor || area > mayor.area) {
      mayor = {
        etiqueta: el.tagName.toLowerCase() + (el.id ? "#" + el.id : ""),
        ancho: Math.round(caja.width),
        alto: Math.round(caja.height),
        area
      };
    }
  }
  const resultado = { url: location.href, estado: document.readyState, mayor };
  if (conSonda) {
    let lee;
    try { lee = localStorage.getItem("mr_sonda") === "1"; } catch (error) { lee = false; }
    let alcanza;
    try { alcanza = window.parent !== window && typeof window.parent.document.title === "string"; } catch (error) { alcanza = false; }
    resultado.sonda = { lee, alcanza };
  }
  return resultado;
}

// También DENTRO del marco: el botón para empezar, si hay uno a la vista.
// Se queda con el más interior, que es el que recibe el clic.
function buscarBotonDentro() {
  const TEXTO = /^(play|play game|start|start game|click to play|press to play|jugar|empezar|comenzar|iniciar)$/i;
  let mejor = null;
  for (const el of document.querySelectorAll("button, a, [role=button], input[type=button], input[type=submit], div, span")) {
    const texto = String(el.tagName === "INPUT" ? el.value : el.innerText || "").trim();
    if (!texto || texto.length > 20 || !TEXTO.test(texto)) continue;
    const estilo = getComputedStyle(el);
    if (estilo.display === "none" || estilo.visibility === "hidden") continue;
    const caja = el.getBoundingClientRect();
    if (caja.width < 8 || caja.height < 8) continue;
    if (!mejor || mejor.el.contains(el)) mejor = { el, caja, texto };
  }
  return mejor ? { x: mejor.caja.left + mejor.caja.width / 2, y: mejor.caja.top + mejor.caja.height / 2, texto: mejor.texto } : null;
}

// Un clic de verdad, con el ratón, en el botón de empezar: cuenta como un
// gesto de quien juega, que es lo que algunos juegos esperan para sonar.
async function pulsarDentro(cdp, marcoId) {
  await cdp.enviar("Runtime.evaluate", {
    expression: `document.querySelector("#contenedorJuego iframe")?.scrollIntoView({ block: "center" })`
  });
  await pausa(300);
  const { executionContextId } = await cdp.enviar("Page.createIsolatedWorld",
    { frameId: marcoId, worldName: "revision-juegos" });
  const boton = (await cdp.enviar("Runtime.evaluate", {
    contextId: executionContextId, returnByValue: true, expression: `(${buscarBotonDentro.toString()})()`
  })).result.value;
  if (!boton) return null;
  const origen = (await cdp.enviar("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => { const f = document.querySelector("#contenedorJuego iframe"); const r = f.getBoundingClientRect();
      return { x: r.left + f.clientLeft, y: r.top + f.clientTop }; })()`
  })).result.value;
  const x = origen.x + boton.x;
  const y = origen.y + boton.y;
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await cdp.enviar("Input.dispatchMouseEvent",
      { type, x, y, button: "left", clickCount: type === "mouseMoved" ? 0 : 1 });
  }
  return boton.texto;
}

async function marcoDelJuego(cdp, plazoMs) {
  const hasta = Date.now() + plazoMs;
  while (Date.now() < hasta) {
    const { frameTree } = await cdp.enviar("Page.getFrameTree");
    const hijos = (frameTree.childFrames || []).map((c) => c.frame)
      .filter((f) => f.url && f.url !== "about:blank" && !/_mudanza\.html/.test(f.url));
    if (hijos.length) return hijos[0];
    await pausa(500);
  }
  return null;
}

async function revisarJuego(cdp, juego, contextos, errores) {
  const registro = {
    id: juego.id, nombre: juego.nombre, tipo: tipoDe(juego), motor: motorDe(juego),
    url: null, carga: false, mayor: null, errores: 0, primerosErrores: [], sonda: null,
    pulsado: [], captura: null, fallo: null, ms: 0
  };
  const inicio = Date.now();
  errores.length = 0;

  const cargada = cdp.esperar("Page.loadEventFired", null, 45000).catch(() => null);
  await cdp.enviar("Page.navigate", { url: `${BASE}/jugar.html?id=${encodeURIComponent(juego.id)}` });
  await cargada;

  const marco = await marcoDelJuego(cdp, 30000);
  if (!marco) {
    registro.fallo = "la página no abrió ningún marco";
  } else {
    await cdp.esperar("Page.frameStoppedLoading", (p) => p.frameId === marco.id, 30000).catch(() => null);
    await pausa(ESPERA_MS);
    if (PULSAR) {
      // El primer botón ya está a la vista. El segundo (el "Start Game" de
      // los emuladores) sale cuando el emulador termina de bajar: se le
      // espera hasta 15 segundos.
      for (let ronda = 0; ronda < 2; ronda++) {
        let texto = null;
        const hasta = Date.now() + (ronda === 0 ? 0 : 15000);
        do {
          texto = await pulsarDentro(cdp, marco.id);
          if (!texto && Date.now() < hasta) await pausa(1000);
        } while (!texto && Date.now() < hasta);
        if (!texto) break;
        registro.pulsado.push(texto);
        await pausa(3000);
      }
      if (registro.pulsado.length) await pausa(ESPERA_MS);
    }
    const { executionContextId } = await cdp.enviar("Page.createIsolatedWorld",
      { frameId: marco.id, worldName: "revision-juegos" });
    const r = await cdp.enviar("Runtime.evaluate", {
      contextId: executionContextId,
      returnByValue: true,
      expression: `(${medirDentro.toString()})(${JSON.stringify(SONDA)}, ${JSON.stringify(SELECTOR_JUEGO)})`
    });
    if (r.exceptionDetails) {
      registro.fallo = "no se pudo medir: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    } else {
      const medida = r.result.value;
      registro.url = medida.url;
      registro.mayor = medida.mayor;
      registro.carga = !!(medida.mayor && medida.mayor.area >= AREA_MINIMA);
      registro.sonda = medida.sonda || null;
    }
    const delMarco = errores.filter((e) => contextos.get(e.contexto) === marco.id);
    registro.errores = delMarco.length;
    registro.primerosErrores = delMarco.slice(0, 3).map((e) => e.texto.slice(0, 200));
  }

  // La captura: el marco del juego, o la pantalla entera si no hay marco.
  const caja = await cdp.enviar("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => { const f = document.querySelector("#contenedorJuego iframe");
      if (!f) return null; const r = f.getBoundingClientRect();
      return r.width && r.height ? { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height } : null; })()`
  });
  const recorte = caja.result.value;
  const foto = await cdp.enviar("Page.captureScreenshot", {
    format: "jpeg",
    quality: 70,
    captureBeyondViewport: true,
    ...(recorte ? { clip: { ...recorte, scale: MOVIL ? 0.5 : 0.6 } } : {})
  });
  registro.captura = `capturas/${juego.id}.jpg`;
  fs.writeFileSync(path.join(SALIDA, registro.captura), Buffer.from(foto.data, "base64"));
  registro.ms = Date.now() - inicio;
  return registro;
}

// ---------- El informe ----------

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function resumir(juegos) {
  const deTerceros = juegos.filter((j) => j.tipo === "terceros");
  return {
    juegos: juegos.length,
    cargan: juegos.filter((j) => j.carga).length,
    conErrores: juegos.filter((j) => j.errores > 0).length,
    fallos: juegos.filter((j) => j.fallo).length,
    terceros: deTerceros.length,
    tercerosQueLeenLaWeb: SONDA ? deTerceros.filter((j) => j.sonda && j.sonda.lee).length : null,
    tercerosQueLleganALaPagina: SONDA ? deTerceros.filter((j) => j.sonda && j.sonda.alcanza).length : null
  };
}

function escribirInforme(juegos, antes) {
  const informe = {
    fecha: new Date().toISOString(), base: BASE, movil: MOVIL, sonda: SONDA, pulsar: PULSAR,
    espera: ESPERA_MS / 1000, resumen: resumir(juegos), juegos
  };
  fs.writeFileSync(path.join(SALIDA, "informe.json"), JSON.stringify(informe, null, 2));

  const deAntes = new Map((antes ? antes.juegos : []).map((j) => [String(j.id), j]));
  const carpetaAntes = antes ? path.relative(SALIDA, path.dirname(path.resolve(COMPARAR))).split(path.sep).join("/") : "";
  const rotos = antes ? juegos.filter((j) => deAntes.get(String(j.id))?.carga && !j.carga) : [];

  const tarjetas = juegos.map((j) => {
    const a = deAntes.get(String(j.id));
    const roto = a && a.carga && !j.carga;
    const sonda = j.sonda ? `lee la web: ${j.sonda.lee ? "SÍ" : "no"} · llega a la página: ${j.sonda.alcanza ? "SÍ" : "no"}` : "";
    const figura = (src, pie) => `<figure>${src ? `<img src="${esc(src)}" alt="">` : "<p>sin captura</p>"}<figcaption>${pie}</figcaption></figure>`;
    const imagenes = (a ? figura(a.captura ? carpetaAntes + "/" + a.captura : null, "antes: " + (a.carga ? "carga" : "no carga")) : "") +
      figura(j.captura, (a ? "después: " : "") + (j.carga ? "carga" : "no carga"));
    return `<article class="${roto ? "roto" : ""}"><h2>${esc(j.id)} · ${esc(j.nombre)}${roto ? " · ROTO" : ""}</h2>
<p>${esc(j.tipo)} · ${esc(j.motor)} · ${j.mayor ? esc(j.mayor.etiqueta + " " + j.mayor.ancho + "×" + j.mayor.alto) : "nada que pinte"} · ${j.errores} errores${j.pulsado && j.pulsado.length ? " · pulsó " + esc(j.pulsado.join(" y ")) : ""}</p>
${sonda ? `<p>${esc(sonda)}</p>` : ""}${j.fallo ? `<p class="fallo">${esc(j.fallo)}</p>` : ""}
<div class="fotos">${imagenes}</div></article>`;
  }).join("\n");

  const r = informe.resumen;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Revisión de juegos</title>
<style>
body{font:14px/1.4 system-ui,sans-serif;margin:16px;background:#f6f6f8;color:#1d1d24}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(${antes ? 520 : 300}px,1fr));gap:12px}
article{background:#fff;border:1px solid #ddd;border-radius:8px;padding:10px}article.roto{border:3px solid #c62828}
h2{font-size:15px;margin:0 0 4px}p{margin:2px 0}.fallo{color:#c62828}
.fotos{display:flex;gap:8px;margin-top:6px}figure{margin:0;flex:1}img{width:100%;border:1px solid #ccc}
figcaption{font-size:12px;color:#555}
</style></head><body>
<h1>Revisión de juegos</h1>
<p>${esc(BASE)} · ${MOVIL ? "móvil 390×844" : "PC 1366×800"} · ${esc(informe.fecha)}</p>
<p>Cargan ${r.cargan} de ${r.juegos}; con errores de JavaScript, ${r.conErrores}; sin poder medir, ${r.fallos}.${SONDA ? ` De los ${r.terceros} de terceros, leen la clave de la web ${r.tercerosQueLeenLaWeb} y llegan a la página ${r.tercerosQueLleganALaPagina}.` : ""}${antes ? ` Rotos frente a la revisión anterior: ${rotos.length}${rotos.length ? " (" + rotos.map((j) => esc(j.id)).join(", ") + ")" : ""}.` : ""}</p>
<main>
${tarjetas}
</main></body></html>`;
  fs.writeFileSync(path.join(SALIDA, "index.html"), html);
  return { informe, rotos };
}

// ---------- Todo junto ----------

async function main() {
  const antes = COMPARAR ? JSON.parse(fs.readFileSync(COMPARAR, "utf8")) : null;
  let catalogo = leerCatalogo();
  if (IDS) {
    const quiero = new Set(IDS.split(",").map((s) => s.trim()).filter(Boolean));
    catalogo = catalogo.filter((j) => quiero.has(String(j.id)));
  }
  fs.mkdirSync(path.join(SALIDA, "capturas"), { recursive: true });

  console.log("");
  console.log("REVISIÓN DE JUEGOS");
  console.log("==================");
  console.log(`${BASE} · ${MOVIL ? "móvil" : "PC"} · ${catalogo.length} juegos${SONDA ? " · con sonda" : ""}`);
  console.log("Salida: " + SALIDA);
  console.log("");

  const nav = await abrirNavegador();
  const juegos = [];
  let terminar = false;
  process.on("SIGINT", () => { terminar = true; console.warn("\nCortado: se guarda lo que haya."); });

  try {
    const cdp = new Depurador(await conectar(nav.urlPagina));
    const contextos = new Map();
    const errores = [];
    cdp.escuchar((m) => {
      if (m.method === "Runtime.executionContextCreated") {
        contextos.set(m.params.context.id, m.params.context.auxData && m.params.context.auxData.frameId);
      } else if (m.method === "Runtime.exceptionThrown") {
        const d = m.params.exceptionDetails;
        errores.push({ contexto: d.executionContextId, texto: String(d.exception?.description || d.text || "") });
      } else if (m.method === "Page.javascriptDialogOpening") {
        // Un alert() o un confirm() de un juego pararía la página entera.
        cdp.enviar("Page.handleJavaScriptDialog", { accept: true })
          .catch((error) => console.warn("No se pudo cerrar un diálogo:", error.message));
      }
    });
    await cdp.enviar("Page.enable");
    await cdp.enviar("Runtime.enable");
    await cdp.enviar("Emulation.setDeviceMetricsOverride", PANTALLA);
    if (MOVIL) {
      await cdp.enviar("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      await cdp.enviar("Emulation.setUserAgentOverride", { userAgent: AGENTE_MOVIL });
    }

    if (SONDA) {
      const cargada = cdp.esperar("Page.loadEventFired", null, 45000).catch(() => null);
      await cdp.enviar("Page.navigate", { url: BASE + "/" });
      await cargada;
      await cdp.enviar("Runtime.evaluate", { expression: `localStorage.setItem("mr_sonda", "1")` });
    }

    for (const juego of catalogo) {
      if (terminar) break;
      let registro;
      try {
        registro = await Promise.race([
          revisarJuego(cdp, juego, contextos, errores),
          pausa(PLAZO_JUEGO_MS).then(() => { throw new Error("más de " + PLAZO_JUEGO_MS / 1000 + " s"); })
        ]);
      } catch (error) {
        registro = {
          id: juego.id, nombre: juego.nombre, tipo: tipoDe(juego), motor: motorDe(juego), url: null,
          carga: false, mayor: null, errores: 0, primerosErrores: [], sonda: null, pulsado: [],
          captura: null, fallo: error.message, ms: 0
        };
      }
      juegos.push(registro);
      const s = registro.sonda;
      console.log(`  ${String(registro.id).padStart(3)} ${String(registro.nombre).padEnd(34).slice(0, 34)} ` +
        `${registro.tipo.padEnd(9)} ${registro.motor.padEnd(9)} ${registro.carga ? "carga   " : "NO carga"} ` +
        `${String(registro.errores).padStart(2)} errores` +
        (s ? ` · ${s.lee ? "LEE la web" : "no lee"} · ${s.alcanza ? "LLEGA a la página" : "no llega"}` : "") +
        (registro.pulsado.length ? ` · pulsó ${registro.pulsado.map((t) => "«" + t + "»").join(" y ")}` : "") +
        (registro.fallo ? ` · ${registro.fallo}` : ""));
      // Se reescribe tras cada juego: si algo corta la revisión, lo hecho queda.
      escribirInforme(juegos, antes);
    }
  } finally {
    await cerrarNavegador(nav);
  }

  const { informe, rotos } = escribirInforme(juegos, antes);
  const r = informe.resumen;
  console.log("");
  console.log(`Cargan ${r.cargan} de ${r.juegos}; con errores, ${r.conErrores}; sin poder medir, ${r.fallos}.`);
  if (SONDA) {
    console.log(`De los ${r.terceros} de terceros: leen la clave de la web ${r.tercerosQueLeenLaWeb}, llegan a la página ${r.tercerosQueLleganALaPagina}.`);
  }
  if (antes) {
    console.log(`Rotos frente a la revisión anterior: ${rotos.length}` +
      (rotos.length ? " (" + rotos.map((j) => j.id + " " + j.nombre).join(", ") + ")" : ""));
  }
  console.log("Informe: " + path.join(SALIDA, "index.html"));
}

// La conexión con el navegador puede dejar el proceso abierto aunque ya no
// haya nada que hacer: se sale a mano, con el informe ya escrito.
main().then(() => process.exit(0), (error) => {
  console.error("La revisión se paró:", error.message);
  process.exit(1);
});
