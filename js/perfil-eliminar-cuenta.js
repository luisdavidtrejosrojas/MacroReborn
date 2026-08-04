// ==============================
// PERFIL — ELIMINAR CUENTA (ZONA PELIGROSA)
// Exclusivo de perfil.html (perfil propio del usuario logueado).
// usuario.html NO carga este script, así que esta función jamás
// aparece al ver el perfil de otra persona.
//
// FLUJO:
//   1) pedirConfirmacion()        -> "¿Estás seguro?" (función global
//                                     definida en js/perfil.js, se reutiliza
//                                     tal cual para no duplicar código/UI).
//   2) pedirPasswordYEliminar()   -> modal propio que pide la contraseña
//                                     actual y la valida.
//   3) eliminarCuentaCompleta()   -> único punto de borrado de datos.
//
// NOTA (Fase 1 - Neon):
// El borrado de la cuenta "real" (fila en la tabla "users", y en
// cascada sus logros/insignias/amistades/solicitudes) ahora lo hace el
// servidor: POST /api/delete-account, que además valida la contraseña
// contra la base (ver intentarConfirmar() más abajo). eliminarCuentaCompleta()
// se llama DESPUÉS de que el servidor confirme el borrado, y solo se
// encarga de lo que todavía vive en localStorage (comentarios,
// favoritos, historial, notificaciones, likes, etc., que siguen sin
// migrar a Neon).
// ==============================

(function () {

  const botonEliminarCuenta = document.getElementById("botonEliminarCuenta");

  // Si el botón no existe en la página (por ejemplo, si este script se
  // cargara por error en usuario.html), no hacemos nada.
  if (!botonEliminarCuenta) return;

  // ---------- CLAVES DE DATOS EXCLUSIVAMENTE PROPIOS DEL USUARIO ----------
  // Cada una guarda información identificada únicamente por el nombre del
  // dueño de la cuenta, así que se puede borrar directamente.
  const PREFIJOS_DATOS_PROPIOS = [
    "bio_",
    "avatar_",
    "amigos_",
    "actividad_",
    "comentarios_",
    "insignias_",
    "logros_",
    "notificaciones_",
    "favoritos_",
    "historial_",
    "juegosJugados_"
  ];

  // ---------- LIMPIEZA DE REFERENCIAS EN DATOS DE OTROS USUARIOS ----------
  // Recorre todo localStorage para sacar cualquier rastro del usuario
  // eliminado de colecciones compartidas (listas de amigos ajenas,
  // comentarios en muros ajenos, reseñas, calificaciones, likes, chat
  // general, solicitudes de amistad y reportes). No toca ni afecta los
  // datos del resto de las cuentas, solo remueve las menciones puntuales
  // a la cuenta eliminada.
  function limpiarReferenciasCruzadas(nombreUsuario) {

    Object.keys(localStorage).forEach((clave) => {

      // Listas de amigos de OTROS usuarios (array de nombres).
      if (clave.startsWith("amigos_") && clave !== "amigos_" + nombreUsuario) {
        const lista = leerJSON(localStorage.getItem(clave));
        if (Array.isArray(lista)) {
          const filtrada = lista.filter((n) => n !== nombreUsuario);
          if (filtrada.length !== lista.length) guardarJSON(clave, filtrada);
        }
        return;
      }

      // Comentarios dejados en el muro de OTROS usuarios.
      if (clave.startsWith("comentarios_") && clave !== "comentarios_" + nombreUsuario) {
        const lista = leerJSON(localStorage.getItem(clave));
        if (Array.isArray(lista)) {
          const filtrada = lista.filter((c) => c && c.usuario !== nombreUsuario);
          if (filtrada.length !== lista.length) guardarJSON(clave, filtrada);
        }
        return;
      }

      // Reseñas de juegos (resenas_<idJuego> -> array de {usuario, ...}).
      if (clave.startsWith("resenas_")) {
        const lista = leerJSON(localStorage.getItem(clave));
        if (Array.isArray(lista)) {
          const filtrada = lista.filter((r) => r && r.usuario !== nombreUsuario);
          if (filtrada.length !== lista.length) guardarJSON(clave, filtrada);
        }
        return;
      }

      // Calificaciones en estrellas y votos like/dislike por juego
      // (objetos { "nombreUsuario": valor }).
      if (clave.startsWith("calificaciones_") || clave.startsWith("votosJuego_")) {
        const obj = leerJSON(localStorage.getItem(clave));
        if (obj && typeof obj === "object" && nombreUsuario in obj) {
          delete obj[nombreUsuario];
          guardarJSON(clave, obj);
        }
        return;
      }

      // "Me gusta" en comentarios, chat y reseñas
      // (likes_<clave> -> { itemId: ["usuario1", "usuario2", ...] }).
      if (clave.startsWith("likes_")) {
        const likes = leerJSON(localStorage.getItem(clave));
        if (likes && typeof likes === "object") {
          let cambio = false;
          Object.keys(likes).forEach((itemId) => {
            if (Array.isArray(likes[itemId]) && likes[itemId].indexOf(nombreUsuario) !== -1) {
              likes[itemId] = likes[itemId].filter((u) => u !== nombreUsuario);
              cambio = true;
            }
          });
          if (cambio) guardarJSON(clave, likes);
        }
        return;
      }

      // Chat general.
      if (clave === "chatGeneral") {
        const mensajes = leerJSON(localStorage.getItem(clave));
        if (Array.isArray(mensajes)) {
          const filtrados = mensajes.filter((m) => m && m.usuario !== nombreUsuario);
          if (filtrados.length !== mensajes.length) guardarJSON(clave, filtrados);
        }
        return;
      }

      // Solicitudes de amistad (enviadas o recibidas).
      if (clave === "solicitudesAmigos") {
        const lista = leerJSON(localStorage.getItem(clave));
        if (Array.isArray(lista)) {
          const filtrada = lista.filter((s) => s && s.de !== nombreUsuario && s.para !== nombreUsuario);
          if (filtrada.length !== lista.length) guardarJSON(clave, filtrada);
        }
        return;
      }

      // Reportes de comentarios (moderación): tanto los que hizo el
      // usuario como los que reportaban comentarios suyos.
      if (clave === "reportesComentarios") {
        const lista = leerJSON(localStorage.getItem(clave));
        if (Array.isArray(lista)) {
          const filtrada = lista.filter((r) =>
            r && r.usuario !== nombreUsuario && r.reportadoPor !== nombreUsuario
          );
          if (filtrada.length !== lista.length) guardarJSON(clave, filtrada);
        }
      }

    });
  }

  // ---------- PUNTO ÚNICO DE BORRADO (ver nota de v1.0 arriba) ----------
  async function eliminarCuentaCompleta(nombreUsuario) {

    // 1) Datos exclusivamente propios del usuario.
    PREFIJOS_DATOS_PROPIOS.forEach((prefijo) => {
      localStorage.removeItem(prefijo + nombreUsuario);
    });

    // 2) Referencias a este usuario en datos/colecciones de otras cuentas.
    limpiarReferenciasCruzadas(nombreUsuario);

    // 3) El registro del usuario dentro de la lista general de cuentas.
    const listaUsuarios = leerJSON(localStorage.getItem("usuariosMacro") || "[]") || [];
    const listaSinUsuario = listaUsuarios.filter((u) => u.nombre !== nombreUsuario);
    guardarJSON("usuariosMacro", listaSinUsuario);

    // 4) Cerrar la sesión.
    localStorage.removeItem("usuarioActivo");

    return true;
  }

  // ---------- MODAL: PEDIR CONTRASEÑA Y CONFIRMAR ----------
  // Reutiliza la misma identidad visual que pedirConfirmacion() (definida
  // en js/perfil.js), agregando un campo de contraseña.
  //
  // NOTA (fix Fase 1): antes esta función recibía "passwordReal" desde
  // usuarioActivo.password para comparar en el navegador. Como
  // /api/login ya no devuelve la contraseña al cliente, ese valor
  // siempre era undefined y la comparación fallaba siempre. Ahora la
  // contraseña se valida en el servidor (POST /api/delete-account).
  function pedirPasswordYEliminar(nombreUsuario) {
    document.querySelectorAll(".confirmacion-overlay").forEach((el) => el.remove());

    const overlay = document.createElement("div");
    overlay.className = "confirmacion-overlay";
    overlay.innerHTML = `
      <div class="confirmacion-caja">
        <p class="confirmacion-mensaje">Para confirmar, ingresá tu contraseña actual.</p>
        <div class="campo-config">
          <label for="passEliminarCuenta">Contraseña actual</label>
          <input type="password" id="passEliminarCuenta" autocomplete="current-password" placeholder="Tu contraseña">
        </div>
        <div id="mensajeEliminarCuenta" class="config-mensaje"></div>
        <div class="confirmacion-botones">
          <button type="button" class="confirmacion-cancelar">Cancelar</button>
          <button type="button" class="confirmacion-confirmar">🗑️ Eliminar cuenta</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const inputPass = overlay.querySelector("#passEliminarCuenta");
    const mensajeModal = overlay.querySelector("#mensajeEliminarCuenta");
    const botonConfirmarModal = overlay.querySelector(".confirmacion-confirmar");
    const botonCancelarModal = overlay.querySelector(".confirmacion-cancelar");

    inputPass.focus();

    function cerrar() {
      overlay.remove();
      document.removeEventListener("keydown", porEscape);
    }

    function porEscape(evento) {
      if (evento.key === "Escape") cerrar();
    }

    function mostrarErrorModal(texto) {
      mensajeModal.textContent = texto;
      mensajeModal.classList.remove("error", "exito", "visible");
      void mensajeModal.offsetWidth;
      mensajeModal.classList.add("error", "visible");
    }

    botonCancelarModal.addEventListener("click", cerrar);

    overlay.addEventListener("click", (evento) => {
      if (evento.target === overlay) cerrar();
    });

    document.addEventListener("keydown", porEscape);

    async function intentarConfirmar() {
      const ingresada = inputPass.value;

      if (!ingresada) {
        mostrarErrorModal("Ingresá tu contraseña actual para continuar.");
        return;
      }

      botonConfirmarModal.disabled = true;
      botonCancelarModal.disabled = true;

      // Validar la contraseña y borrar la cuenta en el servidor
      // (Neon). La comparación ya NO se hace en el navegador.
      let datos;
      try {
        const respuesta = await fetch("/api/auth?action=delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: nombreUsuario, password: ingresada })
        });
        datos = await respuesta.json();
      } catch (error) {
        botonConfirmarModal.disabled = false;
        botonCancelarModal.disabled = false;
        mostrarErrorModal("Error de conexión. Probá de nuevo.");
        return;
      }

      if (!datos || !datos.success) {
        botonConfirmarModal.disabled = false;
        botonCancelarModal.disabled = false;
        mostrarErrorModal((datos && datos.error) || "La contraseña ingresada es incorrecta.");
        return;
      }

      // La cuenta ya fue borrada en Neon (y, en cascada, sus logros,
      // insignias, amistades y solicitudes). Ahora se limpia lo que
      // todavía vive en localStorage.
      const eliminada = await eliminarCuentaCompleta(nombreUsuario);

      if (eliminada) {
        cerrar();
        mostrarDespedidaYRedirigir();
      } else {
        botonConfirmarModal.disabled = false;
        botonCancelarModal.disabled = false;
        mostrarErrorModal("No se pudo terminar de limpiar la cuenta. Probá de nuevo.");
      }
    }

    botonConfirmarModal.addEventListener("click", intentarConfirmar);

    inputPass.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        intentarConfirmar();
      }
    });
  }

  // ---------- MENSAJE FINAL + REDIRECCIÓN ----------
  function mostrarDespedidaYRedirigir() {
    const zona = document.getElementById("zonaPeligrosaCuenta");
    if (zona) {
      zona.innerHTML = `<p class="config-despedida">✅ Tu cuenta fue eliminada correctamente. Te estamos redirigiendo...</p>`;
    }
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1400);
  }

  // ---------- DISPARADOR PRINCIPAL ----------
  botonEliminarCuenta.addEventListener("click", () => {
    const activo = leerJSON(localStorage.getItem("usuarioActivo") || "null");

    if (!activo) {
      // No hay sesión activa: no hay nada que eliminar.
      window.location.href = "login.html";
      return;
    }

    if (typeof pedirConfirmacion !== "function") return;

    // 1) Confirmación general. Si cancela, no pasa nada (pedirConfirmacion
    //    solo ejecuta el callback si el usuario elige "confirmar").
    pedirConfirmacion(
      "¿Estás seguro de que querés eliminar tu cuenta? Esta acción es permanente: se borrarán tu perfil, avatar, amigos, comentarios, favoritos, historial y todo lo asociado a tu cuenta.",
      () => pedirPasswordYEliminar(activo.nombre),
      "Sí, continuar"
    );
  });

})();
