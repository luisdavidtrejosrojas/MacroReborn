// ==============================================================
// MACROREBORN - TARJETA DE PERFIL "ESTILO CLÁSICO"
// --------------------------------------------------------------
// Widget aparte que se agrega al lado del perfil (perfil.html y
// usuario.html) con la estética clásica de portal de juegos que
// pidió el usuario (avatar con alitas, insignia de nivel, estado
// online/offline y puntos).
//
// IMPORTANTE: este archivo NO modifica js/perfil.js ni js/usuario.js.
// Solo LEE lo que esos scripts ya pintan (#nombreUsuario, .nivel,
// .estado, #xp, avatar) y refleja esos mismos datos acá. Como
// usuario.js carga el perfil con fetch (asincrónico), no alcanza con
// leer una sola vez al cargar la página: se usa un MutationObserver
// + un par de reintentos cortos como red de seguridad.
// ==============================================================

(function () {

  function crearMarcadoTarjeta() {
    return `
      <span class="retro-perfil-etiqueta">🕹️ Vista clásica</span>
      <div class="retro-perfil-card">

        <div class="retro-header">
          <span class="retro-nivel-badge" id="retroNivel">1</span>
          <span class="retro-estado-pill" id="retroEstadoPill">
            <span class="retro-punto"></span>
            <span id="retroEstadoTexto">OFFLINE</span>
          </span>
        </div>

        <div class="retro-avatar-frame">
          <span class="retro-wing retro-wing-left" aria-hidden="true"></span>
          <img id="retroAvatarImg" src="imagenes/avatar.png" alt="">
          <span class="retro-wing retro-wing-right" aria-hidden="true"></span>
        </div>

        <div class="retro-card-footer">
          <span class="retro-username" id="retroNombre">Usuario</span>
          <span class="retro-xp-badge" id="retroXP">0 XP</span>
        </div>

      </div>
    `;
  }

  function texto(el) {
    return el ? el.textContent.trim() : "";
  }

  function primerNumero(cadena) {
    const coincidencia = (cadena || "").match(/\d+/);
    return coincidencia ? coincidencia[0] : null;
  }

  function obtenerFuentes() {
    return {
      nombreEl: document.getElementById("nombreUsuario"),
      nivelEl: document.getElementById("nivel") || document.querySelector(".nivel"),
      estadoEl: document.getElementById("estado") || document.querySelector(".estado"),
      xpEl: document.getElementById("xp"),
      avatarEl:
        document.getElementById("avatarPrincipal") ||
        document.querySelector("#avatarUsuario img") ||
        document.querySelector(".avatar img")
    };
  }

  function sincronizarTarjeta(contenedor) {
    const { nombreEl, nivelEl, estadoEl, xpEl, avatarEl } = obtenerFuentes();

    const retroNombre = contenedor.querySelector("#retroNombre");
    const retroNivel = contenedor.querySelector("#retroNivel");
    const retroEstadoPill = contenedor.querySelector("#retroEstadoPill");
    const retroEstadoTexto = contenedor.querySelector("#retroEstadoTexto");
    const retroXP = contenedor.querySelector("#retroXP");
    const retroAvatarImg = contenedor.querySelector("#retroAvatarImg");

    const nombre = texto(nombreEl);
    if (retroNombre && nombre) retroNombre.textContent = nombre;

    const nivelTexto = texto(nivelEl);
    const nivelNum = primerNumero(nivelTexto);
    if (retroNivel && nivelNum) retroNivel.textContent = nivelNum;

    const estadoTexto = texto(estadoEl);
    if (retroEstadoTexto && estadoTexto) {
      const enLinea = estadoTexto.includes("línea") || estadoTexto.includes("🟢");
      retroEstadoTexto.textContent = enLinea ? "ONLINE" : "OFFLINE";
      if (retroEstadoPill) retroEstadoPill.classList.toggle("en-linea", enLinea);
    }

    const xpTexto = texto(xpEl);
    const xpNum = primerNumero(xpTexto);
    if (retroXP && xpNum) retroXP.textContent = xpNum + " XP";

    if (retroAvatarImg && avatarEl && avatarEl.getAttribute("src")) {
      const nuevoSrc = avatarEl.getAttribute("src");
      if (retroAvatarImg.getAttribute("src") !== nuevoSrc) {
        retroAvatarImg.setAttribute("src", nuevoSrc);
      }
    }
  }

  function iniciar() {
    const contenedor = document.getElementById("retroPerfilWrap");
    if (!contenedor) return;

    contenedor.innerHTML = crearMarcadoTarjeta();
    sincronizarTarjeta(contenedor);

    // Observa los mismos elementos que ya pintan perfil.js / usuario.js
    // para reflejar cualquier cambio (incluye el caso asincrónico de
    // usuario.html, que trae los datos con fetch).
    if (typeof MutationObserver !== "undefined") {
      const objetivos = [
        document.getElementById("nombreUsuario"),
        document.getElementById("nivel"),
        document.querySelector(".nivel"),
        document.getElementById("estado"),
        document.querySelector(".estado"),
        document.getElementById("xp"),
        document.querySelector(".avatar")
      ].filter(Boolean);

      const observador = new MutationObserver(() => sincronizarTarjeta(contenedor));
      objetivos.forEach(el => {
        observador.observe(el, { childList: true, characterData: true, subtree: true, attributes: true });
      });
    }

    // Red de seguridad extra por si algún dato se pinta después de que
    // se hayan enganchado los observers (ej: primera carga muy lenta).
    let intentos = 0;
    const reintento = setInterval(() => {
      sincronizarTarjeta(contenedor);
      intentos++;
      if (intentos >= 12) clearInterval(reintento);
    }, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

})();
