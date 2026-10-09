// ==============================
// LOS JUEGOS, EN SU PROPIA DIRECCIÓN: EL NAVEGADOR — js/motor/juegos-aparte.js
// ==============================
// Los juegos de terceros se abren desde juegos.macroreborn.com, otro origen
// que la web, para que su código no pueda leer la sesión ni tocar la página
// (punto 1 de docs/listas/AUDITORIA.md, specs/008-aislar-juegos). El
// servidor, api/_juegos-aparte.js; aquí, lo que necesita la página de jugar:
//
//   origen(location)    dónde están los juegos: en la web,
//                       https://juegos.macroreborn.com; en el PC
//                       (localhost o 127.0.0.1), el mismo nombre con el
//                       puerto siguiente, que es lo que abre
//                       scripts/servidor-local.js.
//   tipo(juego)         "terceros", "propio" (Macro Snake, del equipo, que
//                       se queda en la web) u "otra-web" (los que ya se
//                       abren desde su propia web).
//   direccion(juego)    el src del marco: los de terceros, en la dirección
//                       de los juegos; los demás, como hoy.
//   marco(juego)        el sandbox y el allow del marco
//                       (specs/008-aislar-juegos/contracts/marco-del-juego.md).
//   esDelSitio(clave)   lo que guarda el propio sitio, que no pasa nunca a la
//                       dirección de los juegos.
//   mudarPartidas()     la primera vez, pasa a la dirección de los juegos lo
//                       que los juegos guardaron en el navegador (más abajo).
//
// El sandbox no lleva allow-top-navigation: un juego no puede llevarse la
// página a otra dirección. Lleva allow-same-origin para que cada juego
// conserve su origen y pueda guardar partidas; junto con allow-scripts solo
// sería peligroso en un marco del mismo origen que la página, que podría
// quitarse el sandbox, y aquí nunca lo es. Macro Snake no lleva sandbox: es
// de la misma web y del equipo, y no le pondría ningún límite.

(function () {
  "use strict";

  const DIRECCION_DE_LOS_JUEGOS = "https://juegos.macroreborn.com";
  const NOMBRES_LOCALES = ["localhost", "127.0.0.1"];

  // Los juegos del equipo. La misma lista está en api/_juegos-aparte.js, y
  // una prueba vigila que coincidan.
  const PROPIOS = ["macro-snake"];

  const SANDBOX = [
    "allow-scripts", "allow-same-origin", "allow-forms", "allow-pointer-lock", "allow-popups",
    "allow-popups-to-escape-sandbox", "allow-modals", "allow-downloads", "allow-orientation-lock",
    "allow-presentation"
  ].join(" ");
  // Un marco de otro origen no hereda de la página los mandos ni el sonido.
  const ALLOW = "fullscreen; gamepad; autoplay";

  // Lo que guarda el propio sitio en el localStorage de la web. Nunca pasa a
  // la dirección de los juegos cuando se mudan las partidas (research D9):
  // la sesión, el usuario y lo demás se quedan en la web. Una prueba recorre
  // el código del sitio y avisa si aparece una clave que esta lista no cubre;
  // la misma lista está en html/juegos/_mudanza.js.
  const CLAVES_DEL_SITIO = [
    "macroSessionToken", "usuarioActivo", "presenciaMacro", "macroRebornRecomendacionesBase",
    "macroRebornRetoDiario", "mr_originals_played", "temaMacroReborn", "paletaMacroReborn",
    "macro:last-achievement-unlocked", "macro:last-activity-recorded", "macro:last-game-played",
    "mrPartidasMudadas"
  ];
  const PREFIJOS_DEL_SITIO = ["macro", "mr_", "chatAntispam_", "estadisticas_"];

  function esDelSitio(clave) {
    const texto = String(clave);
    return CLAVES_DEL_SITIO.includes(texto) || PREFIJOS_DEL_SITIO.some((prefijo) => texto.startsWith(prefijo));
  }

  function origen(ubicacion) {
    const u = ubicacion || window.location;
    if (NOMBRES_LOCALES.includes(u.hostname)) {
      const puerto = Number(u.port) || (u.protocol === "https:" ? 443 : 80);
      return u.protocol + "//" + u.hostname + ":" + (puerto + 1);
    }
    return DIRECCION_DE_LOS_JUEGOS;
  }

  function tipo(juego) {
    const marco = String((juego && juego.iframe) || "");
    if (/^https?:\/\//i.test(marco)) return "otra-web";
    const archivo = /(?:^|\/)html\/juegos\/([^/?#]+)\.html$/.exec(marco);
    if (!archivo) return "sin-marco";
    return PROPIOS.includes(archivo[1]) ? "propio" : "terceros";
  }

  function direccion(juego, ubicacion) {
    const marco = String((juego && juego.iframe) || "");
    if (tipo(juego) !== "terceros") return marco;
    return origen(ubicacion) + "/" + marco.replace(/^\.?\//, "");
  }

  function marco(juego) {
    const t = tipo(juego);
    return t === "terceros" || t === "otra-web" ? { sandbox: SANDBOX, allow: ALLOW } : null;
  }

  // ---------- La mudanza de las partidas: el lado de la página ----------
  // Lo que guardaron los juegos cuando se abrían desde la web está a nombre
  // de la web, y desde su dirección nueva no se ve. La primera vez que se
  // abre un juego de terceros, la página lo recoge y se lo manda a la
  // mudanza (html/juegos/_mudanza.html), que lo guarda sin pisar nada
  // (research D8, contracts/mensajes.md). Lo de la web no se borra: si
  // hubiera que volver atrás, ahí sigue.

  const MARCA = "mrPartidasMudadas";
  // Lo que los juegos vuelven a bajar solos: ROMs, BIOS y núcleos de los
  // emuladores, y los datos de Unity. Pueden ser decenas de MB, y no son
  // partidas.
  const CACHES = ["EmulatorJS-roms", "EmulatorJS-bios", "EmulatorJS-core", "UnityCache"];
  const TOPE_BASE = 64 * 1024 * 1024;
  const TOPE_TOTAL = 128 * 1024 * 1024;
  const PLAZO_MS = 60000;

  const esDeTipo = (valor, nombre) => Object.prototype.toString.call(valor) === "[object " + nombre + "]";

  // Lo que ocupa un valor, más o menos: lo binario por su tamaño, el texto a
  // dos bytes por letra. Basta para no pasar una base de cientos de MB.
  function tamano(valor, vistos) {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === "string") return valor.length * 2;
    if (typeof valor !== "object") return 8;
    if (ArrayBuffer.isView(valor)) return valor.byteLength;
    if (esDeTipo(valor, "ArrayBuffer")) return valor.byteLength;
    if (esDeTipo(valor, "Blob") || esDeTipo(valor, "File")) return valor.size;
    if (vistos.has(valor)) return 0;
    vistos.add(valor);
    let total = 0;
    for (const clave of Object.keys(valor)) total += clave.length * 2 + tamano(valor[clave], vistos);
    return total;
  }

  const pedir = (peticion) => new Promise((ok, mal) => {
    peticion.onsuccess = () => ok(peticion.result);
    peticion.onerror = () => mal(peticion.error);
  });

  // Una base entera, con su versión, sus almacenes, sus índices y sus
  // registros. Si pasa del tope, null.
  async function leerBase(fabrica, nombre, tope) {
    const db = await pedir(fabrica.open(nombre));
    try {
      const base = { nombre, version: db.version, almacenes: [], tamano: 0 };
      for (const nombreAlmacen of Array.from(db.objectStoreNames)) {
        const store = db.transaction(nombreAlmacen, "readonly").objectStore(nombreAlmacen);
        const indices = Array.from(store.indexNames).map((nombreIndice) => {
          const indice = store.index(nombreIndice);
          return { nombre: nombreIndice, keyPath: indice.keyPath, unique: indice.unique, multiEntry: indice.multiEntry };
        });
        const claves = await pedir(store.getAllKeys());
        const valores = await pedir(db.transaction(nombreAlmacen, "readonly").objectStore(nombreAlmacen).getAll());
        const registros = claves.map((clave, i) => [clave, valores[i]]);
        base.tamano += tamano(registros, new Set());
        if (base.tamano > tope) return null;
        base.almacenes.push({ nombre: nombreAlmacen, keyPath: store.keyPath, autoIncrement: store.autoIncrement, indices, registros });
      }
      return base;
    } finally {
      db.close();
    }
  }

  // Lo que guardaron los juegos en el navegador, a nombre de esta web: el
  // localStorage sin lo del sitio, y las bases de IndexedDB sin las cachés.
  // Sin indexedDB.databases() (Firefox anterior a la 126) no se pueden
  // conocer las bases: va solo el localStorage.
  async function recogerPartidas(entorno, topes) {
    const almacen = entorno.localStorage;
    const fabrica = entorno.indexedDB;
    const topeBase = (topes && topes.base) || TOPE_BASE;
    const topeTotal = (topes && topes.total) || TOPE_TOTAL;
    const claves = [];
    for (let i = 0; i < almacen.length; i++) {
      const clave = almacen.key(i);
      if (clave !== null && !esDelSitio(clave)) claves.push([clave, almacen.getItem(clave)]);
    }
    const bases = [];
    const saltadas = [];
    if (fabrica && typeof fabrica.databases === "function") {
      let total = 0;
      for (const { name } of await fabrica.databases()) {
        if (!name) continue;
        if (CACHES.includes(name)) {
          saltadas.push({ nombre: name, motivo: "cache" });
          continue;
        }
        const base = await leerBase(fabrica, name, topeBase);
        if (!base || total + base.tamano > topeTotal) {
          saltadas.push({ nombre: name, motivo: "demasiado-grande" });
          continue;
        }
        total += base.tamano;
        delete base.tamano;
        bases.push(base);
      }
    }
    return { claves, bases, saltadas };
  }

  // La conversación con la mudanza, en un marco invisible a su página:
  // espera a que diga que está lista, le manda el paquete solo a la
  // dirección de los juegos y espera la respuesta. Sin respuesta en el
  // plazo, null. El marco se quita siempre.
  function hablarConLaMudanza(ventana, origenJuegos, paquete, plazoMs) {
    return new Promise((ok) => {
      const documento = ventana.document;
      const marcoMudanza = documento.createElement("iframe");
      marcoMudanza.style.display = "none";
      marcoMudanza.setAttribute("aria-hidden", "true");
      marcoMudanza.tabIndex = -1;
      let reloj = null;
      const alRecibir = (evento) => {
        if (evento.origin !== origenJuegos || evento.source !== marcoMudanza.contentWindow || !evento.data) return;
        if (evento.data.tipo === "mr-mudanza-lista") {
          marcoMudanza.contentWindow.postMessage(paquete, origenJuegos);
        } else if (evento.data.tipo === "mr-mudanza-hecha" || evento.data.tipo === "mr-mudanza-fallo") {
          terminar(evento.data);
        }
      };
      function terminar(respuesta) {
        ventana.clearTimeout(reloj);
        ventana.removeEventListener("message", alRecibir);
        marcoMudanza.remove();
        ok(respuesta);
      }
      reloj = ventana.setTimeout(() => terminar(null), plazoMs);
      ventana.addEventListener("message", alRecibir);
      marcoMudanza.setAttribute("src", origenJuegos + "/html/juegos/_mudanza.html");
      documento.body.appendChild(marcoMudanza);
    });
  }

  function ponerMarca(almacen, datos) {
    try {
      almacen.setItem(MARCA, JSON.stringify({ version: 1, fecha: new Date().toISOString(), ...datos }));
    } catch (error) {
      console.warn("MacroReborn: no se pudo apuntar que las partidas ya pasaron.", error);
    }
  }

  // Una vez por navegador y por dirección de la web: con la marca puesta, no
  // hace nada. Nunca para el juego: si algo falla, lo dice en la consola, no
  // pone la marca y se reintenta la próxima vez.
  //   opciones.alEmpezar  se llama si hay algo que pasar (para el aviso de carga)
  //   opciones.conversar  quién habla con la mudanza; por defecto, el marco invisible
  async function mudarPartidas(opciones) {
    const o = opciones || {};
    const ventana = o.ventana || window;
    const almacen = ventana.localStorage;
    try {
      if (almacen.getItem(MARCA) !== null) return { hecho: true, yaEstaba: true };
      const recogido = await recogerPartidas({ localStorage: almacen, indexedDB: ventana.indexedDB }, o.topes);
      if (!recogido.claves.length && !recogido.bases.length) {
        ponerMarca(almacen, { claves: 0, registros: 0, saltadas: recogido.saltadas });
        return { hecho: true, nadaQuePasar: true };
      }
      if (o.alEmpezar) o.alEmpezar();
      const paquete = { tipo: "mr-mudanza", version: 1, ...recogido };
      const origenJuegos = o.origen || origen(ventana.location);
      const respuesta = o.conversar
        ? await o.conversar(paquete)
        : await hablarConLaMudanza(ventana, origenJuegos, paquete, o.plazoMs || PLAZO_MS);
      if (respuesta && respuesta.tipo === "mr-mudanza-hecha") {
        ponerMarca(almacen, { claves: respuesta.claves.puestas, registros: respuesta.registros.puestos, saltadas: recogido.saltadas });
        return { hecho: true, respuesta };
      }
      const motivo = respuesta ? respuesta.motivo : "la dirección de los juegos no contestó a tiempo";
      console.warn("MacroReborn: no se pudieron pasar las partidas guardadas; se probará la próxima vez.", motivo);
      return { hecho: false, motivo };
    } catch (error) {
      console.warn("MacroReborn: no se pudieron pasar las partidas guardadas; se probará la próxima vez.", error);
      return { hecho: false, motivo: String((error && error.message) || error) };
    }
  }

  window.MRJuegosAparte = {
    origen, tipo, direccion, marco, esDelSitio, recogerPartidas, mudarPartidas, hablarConLaMudanza,
    PROPIOS, SANDBOX, ALLOW, CLAVES_DEL_SITIO, PREFIJOS_DEL_SITIO, MARCA, CACHES, TOPE_BASE, TOPE_TOTAL
  };
})();
