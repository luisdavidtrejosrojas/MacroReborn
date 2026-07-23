// ==============================
// PERFIL — CONFIGURACIÓN DE CUENTA
// Exclusivo de perfil.html (perfil propio del usuario logueado).
// usuario.html NO carga este script, así que esta sección jamás
// aparece al ver el perfil de otra persona.
//
// NOTA PARA LA FUTURA v1.0 (con base de datos real):
// Toda la lectura/escritura de la contraseña pasa por la función
// guardarNuevaPasswordUsuario(). Hoy persiste en localStorage; el día
// que exista un backend alcanza con reemplazar el cuerpo de esa función
// por un fetch/POST a la API (por ejemplo POST /api/usuario/password),
// sin tocar el formulario, las validaciones ni el resto del sitio.
// ==============================

(function () {

  const formPassword = document.getElementById("formCambiarPassword");

  // Si el formulario no existe en la página (por ejemplo, si este script
  // se cargara por error en usuario.html), no hacemos nada.
  if (!formPassword) return;

  const inputActual = document.getElementById("passActual");
  const inputNueva = document.getElementById("passNueva");
  const inputConfirmar = document.getElementById("passConfirmar");
  const mensaje = document.getElementById("mensajeConfigPassword");
  const boton = document.getElementById("botonGuardarPassword");

  function mostrarMensajeConfig(texto, tipo) {
    if (!mensaje) {
      alert(texto);
      return;
    }
    mensaje.textContent = texto;
    mensaje.classList.remove("error", "exito", "visible");
    void mensaje.offsetWidth; // fuerza el reinicio de la animación
    mensaje.classList.add(tipo, "visible");
  }

  // ---------- PERSISTENCIA (único punto de guardado) ----------
  // Devuelve true/false. Se deja como función async a propósito para
  // que el reemplazo por una llamada real a la API (v1.0) sea directo.
  async function guardarNuevaPasswordUsuario(nombreUsuario, nuevaPassword) {

    const usuarioActivoActual = leerJSON(localStorage.getItem("usuarioActivo") || "null");
    if (!usuarioActivoActual) return false;

    usuarioActivoActual.password = nuevaPassword;
    const guardadoActivo = guardarJSON("usuarioActivo", usuarioActivoActual);

    const listaUsuarios = leerJSON(localStorage.getItem("usuariosMacro") || "[]") || [];
    const listaActualizada = listaUsuarios.map(u =>
      u.nombre === nombreUsuario ? { ...u, password: nuevaPassword } : u
    );
    const guardadoLista = guardarJSON("usuariosMacro", listaActualizada);

    // Mantenemos sincronizada la referencia que usa el resto de perfil.js
    // (evita que quede desactualizada dentro de la misma sesión).
    if (typeof datosUsuario !== "undefined" && datosUsuario) {
      datosUsuario.password = nuevaPassword;
    }

    return guardadoActivo !== false && guardadoLista !== false;
  }

  formPassword.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const actual = inputActual.value;
    const nueva = inputNueva.value;
    const confirmar = inputConfirmar.value;

    const usuarioActivoActual = leerJSON(localStorage.getItem("usuarioActivo") || "null");

    if (!usuarioActivoActual) {
      mostrarMensajeConfig("No se encontró una sesión activa. Iniciá sesión de nuevo.", "error");
      return;
    }

    if (!actual || !nueva || !confirmar) {
      mostrarMensajeConfig("Completá los tres campos para continuar.", "error");
      return;
    }

    // Verificar que la contraseña actual sea correcta.
    if (actual !== (usuarioActivoActual.password || "")) {
      mostrarMensajeConfig("La contraseña actual no es correcta.", "error");
      return;
    }

    if (nueva.length < 6) {
      mostrarMensajeConfig("La nueva contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }

    // Comprobar que la nueva contraseña y la confirmación coincidan.
    if (nueva !== confirmar) {
      mostrarMensajeConfig("La nueva contraseña y la confirmación no coinciden.", "error");
      return;
    }

    if (nueva === actual) {
      mostrarMensajeConfig("La nueva contraseña debe ser distinta a la actual.", "error");
      return;
    }

    if (boton) boton.disabled = true;

    const actualizada = await guardarNuevaPasswordUsuario(usuarioActivoActual.nombre, nueva);

    if (boton) boton.disabled = false;

    if (actualizada) {
      mostrarMensajeConfig("Contraseña actualizada correctamente. ✅", "exito");
      formPassword.reset();
    } else {
      mostrarMensajeConfig("No se pudo actualizar la contraseña. Probá de nuevo.", "error");
    }
  });

})();
