// ==============================
// LA MUDANZA DE LAS PARTIDAS: EL LADO DE LOS JUEGOS — html/juegos/_mudanza.js
// ==============================
// Hasta que los juegos de terceros pasaron a su propia dirección
// (specs/008-aislar-juegos), lo que guardaba cada uno en el navegador
// (sus partidas, sus ajustes) quedaba a nombre de la web. Desde la dirección
// nueva no se ve. Así que la primera vez que alguien abre un juego después
// del cambio, la página de jugar (js/motor/juegos-aparte.js) abre esta en
// un marco invisible y le manda lo que hay. Aquí se guarda, sin pisar nada:
//
//   - una clave de localStorage que ya está aquí no cambia;
//   - una base de IndexedDB que no existe se crea igual que era (versión,
//     almacenes e índices) y se llena;
//   - en una que ya existe solo entran los registros que falten, y un
//     almacén que no tenga se salta y se cuenta.
//
// Solo se cree a las dos direcciones de la web, y nada de lo que guarda el
// sitio entra aquí aunque llegara: la sesión no sale nunca de la web.
// El protocolo, en specs/008-aislar-juegos/contracts/mensajes.md.

(function () {
  "use strict";

  // Lo que guarda el sitio: la misma lista que js/motor/juegos-aparte.js,
  // y una prueba vigila que coincidan. La página no lo manda; si llegara,
  // aquí se tira.
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

  // Las direcciones de la web a las que se cree: en la web, las dos; en el
  // PC, el puerto anterior al de los juegos, con los dos nombres.
  function origenesDeLaWeb(ubicacion) {
    if (ubicacion.hostname === "juegos.macroreborn.com") {
      return ["https://macroreborn.com", "https://www.macroreborn.com"];
    }
    if (ubicacion.hostname === "localhost" || ubicacion.hostname === "127.0.0.1") {
      const puerto = Number(ubicacion.port) - 1;
      return [`${ubicacion.protocol}//localhost:${puerto}`, `${ubicacion.protocol}//127.0.0.1:${puerto}`];
    }
    return [];
  }

  function guardarClaves(almacen, claves, cuentas) {
    for (const [clave, valor] of claves || []) {
      if (esDelSitio(clave)) continue;
      if (almacen.getItem(clave) !== null) {
        cuentas.claves.yaEstaban++;
        continue;
      }
      try {
        almacen.setItem(clave, valor);
        cuentas.claves.puestas++;
      } catch (error) {
        cuentas.fallos++;
        console.warn("MacroReborn: no se pudo guardar la clave " + clave + " de un juego.", error);
      }
    }
  }

  function abrir(fabrica, nombre, version, alCrear) {
    return new Promise((ok, mal) => {
      const peticion = version ? fabrica.open(nombre, version) : fabrica.open(nombre);
      peticion.onupgradeneeded = () => { if (alCrear) alCrear(peticion.result); };
      peticion.onsuccess = () => ok(peticion.result);
      peticion.onerror = () => mal(peticion.error);
      peticion.onblocked = () => mal(new Error("la base " + nombre + " está abierta en otra pestaña con otra versión"));
    });
  }

  // Los registros de un almacén, en una transacción. Uno que ya está (la
  // misma clave) se cuenta y se deja: preventDefault para que la
  // transacción siga con los demás.
  function llenarAlmacen(db, almacen, cuentas) {
    return new Promise((ok, mal) => {
      const transaccion = db.transaction(almacen.nombre, "readwrite");
      const store = transaccion.objectStore(almacen.nombre);
      for (const [clave, valor] of almacen.registros || []) {
        const peticion = store.keyPath === null ? store.add(valor, clave) : store.add(valor);
        peticion.onsuccess = () => { cuentas.registros.puestos++; };
        peticion.onerror = (evento) => {
          evento.preventDefault();
          evento.stopPropagation();
          if (peticion.error && peticion.error.name === "ConstraintError") {
            cuentas.registros.yaEstaban++;
          } else {
            cuentas.fallos++;
            console.warn("MacroReborn: no se pudo guardar un registro de " + almacen.nombre + ".", peticion.error);
          }
        };
      }
      transaccion.oncomplete = () => ok();
      transaccion.onabort = () => mal(transaccion.error || new Error("se cortó la transacción de " + almacen.nombre));
    });
  }

  async function guardarBase(fabrica, base, yaExiste, cuentas) {
    const db = yaExiste
      ? await abrir(fabrica, base.nombre)
      : await abrir(fabrica, base.nombre, base.version, (nueva) => {
        for (const almacen of base.almacenes || []) {
          const store = nueva.createObjectStore(almacen.nombre,
            { keyPath: almacen.keyPath, autoIncrement: !!almacen.autoIncrement });
          for (const indice of almacen.indices || []) {
            store.createIndex(indice.nombre, indice.keyPath, { unique: !!indice.unique, multiEntry: !!indice.multiEntry });
          }
        }
      });
    try {
      for (const almacen of base.almacenes || []) {
        if (!db.objectStoreNames.contains(almacen.nombre)) {
          cuentas.almacenesSaltados++;
          continue;
        }
        await llenarAlmacen(db, almacen, cuentas);
      }
    } finally {
      db.close();
    }
  }

  // Guarda un paquete de la mudanza. Devuelve las cuentas de la respuesta.
  async function mudar(paquete, entorno) {
    const cuentas = {
      claves: { puestas: 0, yaEstaban: 0 }, registros: { puestos: 0, yaEstaban: 0 },
      almacenesSaltados: 0, fallos: 0
    };
    guardarClaves(entorno.localStorage, paquete.claves, cuentas);
    const bases = paquete.bases || [];
    if (bases.length) {
      if (!entorno.indexedDB || typeof entorno.indexedDB.databases !== "function") {
        throw new Error("este navegador no deja ver qué bases hay");
      }
      const hay = new Set((await entorno.indexedDB.databases()).map((b) => b.name));
      for (const base of bases) await guardarBase(entorno.indexedDB, base, hay.has(base.nombre), cuentas);
    }
    return cuentas;
  }

  function iniciar(ventana) {
    const permitidos = origenesDeLaWeb(ventana.location);
    ventana.addEventListener("message", async (evento) => {
      if (!permitidos.includes(evento.origin)) return;
      const paquete = evento.data;
      if (!paquete || paquete.tipo !== "mr-mudanza" || paquete.version !== 1 || !evento.source) return;
      let respuesta;
      try {
        const cuentas = await mudar(paquete, { localStorage: ventana.localStorage, indexedDB: ventana.indexedDB });
        respuesta = { tipo: "mr-mudanza-hecha", version: 1, ...cuentas };
      } catch (error) {
        console.warn("MacroReborn: no se pudieron guardar las partidas en la dirección de los juegos.", error);
        respuesta = { tipo: "mr-mudanza-fallo", version: 1, motivo: String((error && error.message) || error) };
      }
      evento.source.postMessage(respuesta, evento.origin);
    });
    if (ventana.parent !== ventana) ventana.parent.postMessage({ tipo: "mr-mudanza-lista", version: 1 }, "*");
  }

  window.MRMudanza = { iniciar, mudar, esDelSitio, origenesDeLaWeb, CLAVES_DEL_SITIO, PREFIJOS_DEL_SITIO };
  iniciar(window);
})();
