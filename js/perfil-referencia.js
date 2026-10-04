// ==============================================================
// MACROREBORN - PERFIL "REFERENCIA MACROJUEGOS" (modo claro)
// --------------------------------------------------------------
// Widget aparte, mismo criterio que js/perfil-tarjeta-clasica.js:
// NO modifica js/perfil.js ni js/usuario.js, no cambia IDs ni
// eventos. Solo LEE lo que esos scripts ya pintan y agrega piezas
// visuales que css/perfil-macrojuegos-referencia.css muestra
// únicamente en modo claro.
//
// Cinta amarilla "ADMIN" y pastilla "ADMIN": se crean SOLO cuando el
// dueño del perfil tiene la insignia oficial "administrador" (la misma
// que usa js/motor/permisos.js en esAdministrador). A los demás
// usuarios no se les crea nada. Quien visita un perfil ve la cinta y
// la pastilla únicamente si el perfil visitado es de un administrador.
// ==============================================================

(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const esClaro = () => document.documentElement.getAttribute("data-tema") === "claro";

  // ---------- ¿EL DUEÑO DEL PERFIL ES ADMINISTRADOR? ----------
  function nombrePerfil() {
    const el = document.getElementById("nombreUsuario");
    const n = el ? el.textContent.trim() : "";
    return n && n !== "Usuario" ? n : "";
  }

  function esAdminElPerfil() {
    // 1) La insignia que ya pintó el perfil en #insigniasPerfil.
    const cont = document.getElementById("insigniasPerfil");
    if (cont) {
      const hay = Array.from(cont.querySelectorAll(".insignia-oficial")).some(i =>
        /administrador/i.test(i.getAttribute("title") || i.textContent || "")
      );
      if (hay) return true;
    }
    // 2) El motor de roles (caché de insignias), si ya cargó.
    const nombre = nombrePerfil();
    if (nombre && typeof esAdministrador === "function") {
      try { return !!esAdministrador(nombre); } catch (_) { /* sin caché aún */ }
    }
    return false;
  }

  // ---------- CINTA + PASTILLA (solo administradores) ----------
  function sincronizarRol() {
    const admin = esAdminElPerfil();

    const chapas = $(".tarjeta-avatar-chapas");
    if (chapas) {
      let cinta = chapas.querySelector(".mr-ref-cinta");
      if (admin && !cinta) {
        cinta = document.createElement("div");
        cinta.className = "mr-ref-cinta";
        cinta.setAttribute("aria-hidden", "true");
        const t = document.createElement("span");
        t.textContent = "ADMIN · ADMIN · ADMIN · ADMIN · ADMIN · ADMIN · ADMIN · ADMIN ·";
        cinta.appendChild(t);
        chapas.insertBefore(cinta, chapas.firstChild);
      } else if (!admin && cinta) {
        cinta.remove();
      }
    }

    const cab = $(".perfil-datos-cabecera");
    if (cab) {
      let pastilla = cab.querySelector(".mr-ref-rol");
      if (admin && !pastilla) {
        pastilla = document.createElement("span");
        pastilla.className = "mr-ref-rol";
        pastilla.textContent = "Admin";
        cab.appendChild(pastilla);
      } else if (!admin && pastilla) {
        pastilla.remove();
      }
    }
  }

  // ---------- NIVEL: solo el número ----------
  function sincronizarNivel() {
    const el = document.getElementById("nivel");
    if (!el) return;
    const m = (el.textContent || "").match(/\d+/);
    const n = m ? m[0] : "";
    if (el.getAttribute("data-mr-nivel") !== n) el.setAttribute("data-mr-nivel", n);
    const largo = String(Math.min(n.length, 4));
    if (el.getAttribute("data-mr-largo") !== largo) el.setAttribute("data-mr-largo", largo);
  }

  // ---------- ESTADO: espejo dentro de la tarjeta ----------
  function sincronizarEstado() {
    const real = document.getElementById("estadoOnlinePerfil") || document.getElementById("estado");
    const chapas = $(".tarjeta-avatar-chapas");
    if (!real || !chapas) return;

    let espejo = chapas.querySelector(".mr-ref-estado");
    if (!espejo) {
      espejo = document.createElement("span");
      espejo.className = "mr-ref-estado";
      chapas.appendChild(espejo);
    }
    const txt = (real.textContent || "").toLowerCase();
    const online = txt.includes("online") || txt.includes("en línea") || txt.includes("🟢");
    const etiqueta = online ? "Online" : "Offline";
    if (espejo.textContent !== etiqueta) espejo.textContent = etiqueta;
    espejo.classList.toggle("online", online);
  }

  // ---------- MIGAS: "Perfil de usuario NOMBRE" ----------
  let migasOriginal = null;

  function sincronizarMigas() {
    const texto = $(".perfil-migas-texto");
    if (!texto) return;

    if (!esClaro()) {
      if (migasOriginal !== null && texto.dataset.mrRef === "1") {
        texto.innerHTML = migasOriginal;
        delete texto.dataset.mrRef;
      }
      return;
    }

    const nombre = nombrePerfil();
    if (!nombre) return;
    if (migasOriginal === null || texto.dataset.mrRef !== "1") {
      migasOriginal = texto.innerHTML;
    }
    const nuevo = "Juegos » Comunidad de usuarios » ";
    const fuerte = "Perfil de usuario " + nombre;
    if (texto.dataset.mrRef !== "1" || texto.textContent !== nuevo + fuerte) {
      texto.textContent = "";
      texto.appendChild(document.createTextNode(nuevo));
      const st = document.createElement("strong");
      st.textContent = fuerte;
      texto.appendChild(st);
      texto.dataset.mrRef = "1";
    }
  }

  // ---------- ICONOS DE LAS PESTAÑAS ----------
  const ICONOS = {
    "inicio": "M12 3 2 12h3v8h5v-5h4v5h5v-8h3z",
    "actividad-amigos": "M9 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm7 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5zm11.5 0c.2-1.8-.3-3.2-1.3-4.2.9-.5 1.8-.7 2.8-.7 2.6 0 4.5 1.700 4.5 4.900z",
    "actividad": "M6 2h8l5 5v15H6zm7 1.500V8h4.500zM8 12h8v1.500H8zm0 3h8v1.500H8zm0 3h5v1.500H8z",
    "comentarios": "M3 3h18v14H8l-5 4zm4 5v1.500h10V8zm0 3.500V13h7v-1.500z",
    "favoritos": "M12 21 3.500 12.500A5 5 0 0 1 12 6a5 5 0 0 1 8.500 6.500z",
    "ultimos": "M7 6h10a5 5 0 0 1 5 5l.5 5a3 3 0 0 1-5.300 2L16 16H8l-1.200 2A3 3 0 0 1 1.500 16L2 11a5 5 0 0 1 5-5zm.5 3v2H5.500v2h2v2h2v-2h2v-2h-2V9zm9 .5a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400zm2.500 2.500a1.200 1.200 0 1 0 0 2.400 1.200 1.200 0 0 0 0-2.400z",
    "amigos": "M8 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm8.500 4a2.500 2.500 0 1 1 0 5 2.500 2.500 0 0 1 0-5zM2 20c0-3.300 2.500-5.500 6-5.500s6 2.200 6 5.500zm12.500 0c.1-1.600-.3-2.900-1.100-3.900.9-.6 1.900-.9 3.100-.9 2.400 0 4.500 1.600 4.500 4.800z",
    "avatares": "M12 3a2.500 2.500 0 0 0-2.500 2.500H11A1 1 0 1 1 12 6.500c-.6 0-1 .4-1 1V9L2 17.500V19h20v-1.500L13 9V8a2.500 2.500 0 0 0-1-5zM5.500 17.500 12 11.500l6.500 6z",
    "logros": "M12 2 4 5v6c0 5 3.400 9 8 11 4.600-2 8-6 8-11V5zm0 5 1.500 3H17l-2.700 2.300 1 3.400-2.800-2-2.800 2 1-3.400L7 10h3.500z",
    "config-cuenta": "M12 8.500a3.500 3.500 0 1 1 0 7 3.500 3.500 0 0 1 0-7zM10.500 2h3l.5 2.600 1.800.8 2.300-1.500 2.100 2.100-1.500 2.300.8 1.800L22 10.500v3l-2.600.5-.8 1.800 1.500 2.300-2.100 2.100-2.300-1.500-1.800.8-.5 2.600h-3l-.5-2.600-1.800-.8-2.300 1.500-2.100-2.100 1.500-2.300-.8-1.800L2 13.500v-3l2.600-.5.8-1.800-1.500-2.300 2.100-2.100 2.300 1.500 1.800-.8z"
  };
  ICONOS["avatares-usuario"] = ICONOS["avatares"];
  ICONOS["logros-tab"] = ICONOS["logros"];

  function iconosPestanas() {
    document.querySelectorAll(".menu-perfil .tab").forEach(tab => {
      if (tab.querySelector(".mr-ico")) return;
      const trazo = ICONOS[tab.dataset.tab];
      if (!trazo) return;

      // Separa el emoji inicial del texto sin perder ninguno de los dos.
      const original = tab.textContent;
      const i = original.indexOf(" ");
      const emoji = i > 0 ? original.slice(0, i) : "";
      const resto = i > 0 ? original.slice(i + 1) : original;

      tab.textContent = "";
      if (emoji) {
        const e = document.createElement("span");
        e.className = "mr-emoji";
        e.textContent = emoji + " ";
        tab.appendChild(e);
      }
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "mr-ico");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", trazo);
      svg.appendChild(path);
      tab.appendChild(svg);
      tab.appendChild(document.createTextNode(resto));
    });
  }

  // ---------- BOTÓN DE AMISTAD (solo usuario.html) ----------
  // usuario.js escribe el texto del botón según el estado. Acá solo se
  // reetiqueta el estado "enviar" (y el de visitante sin sesión) en modo
  // claro, y se restaura el texto original si se vuelve al modo oscuro.
  const TEXTO_NUEVO = "Enviar petición amistad";
  let globo = null;

  function esEstadoEnviar(txt) {
    return /agregar amigo|enviar petici[oó]n|inici[aá] sesi[oó]n para agregar/i.test(txt);
  }

  function sincronizarBotonAmigo() {
    const btn = document.getElementById("agregarAmigo");
    if (!btn) return;
    const actual = btn.textContent.trim();

    if (actual !== TEXTO_NUEVO) {
      btn.dataset.mrOriginal = btn.textContent;
    }

    if (esClaro() && esEstadoEnviar(actual)) {
      btn.dataset.mrEstado = "enviar";
      // Solo se evalúa con el texto que escribió usuario.js (no con el ya
      // reetiquetado), para no perder si es un visitante sin sesión.
      if (actual !== TEXTO_NUEVO) {
        btn.dataset.mrVisitante = /inici[aá] sesi[oó]n/i.test(actual) ? "1" : "";
        btn.textContent = TEXTO_NUEVO;
      }
    } else {
      if (!esClaro() && actual === TEXTO_NUEVO && btn.dataset.mrOriginal) {
        btn.textContent = btn.dataset.mrOriginal;
      }
      if (btn.dataset.mrEstado) delete btn.dataset.mrEstado;
    }
  }

  function moverAcciones() {
    const acciones = $(".perfil-acciones");
    const migas = $(".perfil-migas");
    if (!acciones || !migas) return;

    if (esClaro()) {
      if (acciones.parentElement !== migas) {
        if (!acciones._mrMarca) {
          acciones._mrMarca = document.createComment("mr-acciones");
          acciones.parentElement.insertBefore(acciones._mrMarca, acciones);
        }
        migas.appendChild(acciones);
      }
    } else if (acciones._mrMarca && acciones._mrMarca.parentElement && acciones.parentElement === migas) {
      acciones._mrMarca.parentElement.insertBefore(acciones, acciones._mrMarca);
    }
  }

  function iniciarGlobo() {
    const acciones = $(".perfil-acciones");
    if (!acciones || acciones.dataset.mrGlobo) return;
    acciones.dataset.mrGlobo = "1";

    const mostrar = () => {
      const btn = document.getElementById("agregarAmigo");
      if (!esClaro() || !btn || btn.dataset.mrVisitante !== "1") return;
      if (!globo) {
        globo = document.createElement("div");
        globo.className = "mr-ref-globo";
        globo.setAttribute("role", "tooltip");
        globo.textContent = "¿Aún no tienes una cuenta activa en MacroReborn?";
        acciones.appendChild(globo);
      }
      requestAnimationFrame(() => globo && globo.classList.add("visible"));
    };
    const ocultar = () => { if (globo) globo.classList.remove("visible"); };

    // En el contenedor (no en el botón) porque un botón deshabilitado no
    // recibe eventos de mouse en todos los navegadores.
    acciones.addEventListener("mouseenter", mostrar);
    acciones.addEventListener("mouseleave", ocultar);
    acciones.addEventListener("focusin", mostrar);
    acciones.addEventListener("focusout", ocultar);
  }

  // ---------- ANIMACIÓN DEL AVATAR EN PANTALLAS TÁCTILES ----------
  function iniciarAnimacionTactil() {
    const tarjeta = $(".tarjeta-avatar");
    if (!tarjeta || tarjeta.dataset.mrTactil) return;
    tarjeta.dataset.mrTactil = "1";
    tarjeta.addEventListener("click", () => {
      if (window.matchMedia && window.matchMedia("(hover: none)").matches) {
        tarjeta.classList.toggle("mr-limpio");
      }
    });
  }

  // ---------- NOMBRE DE LA BANDA: que quepa ----------
  // La banda deja libre el hueco de la estrella y la letra va a 32 px:
  // un nombre largo (llegan a 25 caracteres) se metía debajo de la
  // estrella y se cortaba. Se achica de uno en uno hasta que cabe. Va con
  // !important porque la hoja fija el tamaño con !important.
  const NOMBRE_MINIMO = 14;

  function ajustarNombreTarjeta() {
    const el = document.getElementById("tarjetaAvatarNombre");
    if (!el) return;
    el.style.removeProperty("font-size");
    if (!esClaro()) return;
    let tam = parseFloat(getComputedStyle(el).fontSize) || 32;
    while (el.scrollWidth > el.clientWidth + 1 && tam > NOMBRE_MINIMO) {
      tam -= 1;
      el.style.setProperty("font-size", tam + "px", "important");
    }
  }

  // ---------- ORQUESTA ----------
  function sincronizarTodo() {
    sincronizarRol();
    sincronizarNivel();
    sincronizarEstado();
    sincronizarMigas();
    sincronizarBotonAmigo();
    moverAcciones();
    ajustarNombreTarjeta();
  }

  function iniciar() {
    iconosPestanas();
    iniciarGlobo();
    iniciarAnimacionTactil();
    sincronizarTodo();

    if (typeof MutationObserver !== "undefined") {
      const obs = new MutationObserver(() => sincronizarTodo());
      ["nombreUsuario", "tarjetaAvatarNombre", "insigniasPerfil", "nivel", "estadoOnlinePerfil", "estado", "agregarAmigo"].forEach(id => {
        const el = document.getElementById(id);
        if (el) obs.observe(el, { childList: true, characterData: true, subtree: true, attributes: id === "estado" || id === "estadoOnlinePerfil" });
      });
      new MutationObserver(() => sincronizarTodo())
        .observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
    }

    // La banda cambia de ancho con la ventana (y la tarjeta, de columna
    // en el móvil): el nombre se vuelve a medir.
    let esperaAncho = null;
    window.addEventListener("resize", () => {
      clearTimeout(esperaAncho);
      esperaAncho = setTimeout(ajustarNombreTarjeta, 150);
    });

    // Red de seguridad: el nombre y las insignias llegan por fetch.
    let intentos = 0;
    const reintento = setInterval(() => {
      sincronizarTodo();
      if (++intentos >= 25) clearInterval(reintento);
    }, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
