// =========================
// MACROREBORN - RESEÑAS DE JUEGOS
// =========================
// Sistema independiente y autocontenido (IIFE), no depende del orden de
// carga de los demás scripts de juego.html.
//
// Clave usada: resenas_<idJuego> -> array de
//   { usuario, calificacion, texto, fecha, timestamp, editado }
//
// Un usuario solo puede tener UNA reseña por juego (se identifica por
// nombre de usuario). Puede editarla o eliminarla, pero no duplicarla.

(function () {
  "use strict";

  const parametrosResena = new URLSearchParams(window.location.search);
  const idJuegoResena = Number(parametrosResena.get("id"));

  if (Number.isNaN(idJuegoResena)) return;

  const usuarioResena = leerJSON(localStorage.getItem("usuarioActivo") || "null");
  const claveResenas = "resenas_" + idJuegoResena;

  // ---------- ELEMENTOS ----------

  const listaResenas = document.getElementById("listaResenas");
  const formResena = document.getElementById("formResena");
  const resenaAviso = document.getElementById("resenaAviso");
  const contEstrellasForm = document.getElementById("formResenaEstrellas");
  const textareaResena = document.getElementById("resenaTexto");
  const botonPublicar = document.getElementById("botonPublicarResena");
  const botonEliminar = document.getElementById("botonEliminarResena");

  if (!listaResenas) return;

  // ---------- AVATAR (mismo criterio que comunidad.js / usuario.js) ----------

  const ORDEN_CAPAS_RESENA = [
    "fondo", "espalda", "modelo", "piel", "ojos", "boca",
    "botas", "pantalon", "remera", "guantes", "accesorio",
    "cara", "pelo", "mascota", "borde"
  ];

  function rutaImagenCapaResena(valor) {
    if (!valor || valor === "ninguno") return null;
    if (!valor.includes("_")) {
      return "imagenes/" + valor + ".png";
    }
    const idx = valor.indexOf("_");
    const modelo = valor.slice(0, idx);
    const resto = valor.slice(idx + 1);
    return "imagenes/" + modelo + "/" + resto + ".png";
  }

  function avatarHTMLResena(nombre) {
    const avatar = leerJSON(localStorage.getItem("avatar_" + nombre) || "null");

    if (!avatar) {
      return `<img src="imagenes/avatar.png" class="resena-avatar-simple" alt="${escaparHTML(nombre)}" loading="lazy">`;
    }

    let capas = "";
    ORDEN_CAPAS_RESENA.forEach((tipo) => {
      const ruta = rutaImagenCapaResena(avatar[tipo]);
      if (ruta) {
        capas += `<img src="${ruta}" class="capa-resena" alt="" loading="lazy">`;
      }
    });

    return capas
      ? `<div class="resena-avatar">${capas}</div>`
      : `<img src="imagenes/avatar.png" class="resena-avatar-simple" alt="${escaparHTML(nombre)}" loading="lazy">`;
  }

  // ---------- HELPERS ----------

  function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto == null ? "" : String(texto);
    return div.innerHTML;
  }

  function estrellasHTML(valor) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html += `<span class="resena-estrella ${i <= valor ? "llena" : ""}">★</span>`;
    }
    return html;
  }

  function obtenerResenas() {
    return leerJSON(localStorage.getItem(claveResenas) || "[]");
  }

  function guardarResenas(lista) {
    localStorage.setItem(claveResenas, JSON.stringify(lista));
  }

  function miResena() {
    if (!usuarioResena) return null;
    return obtenerResenas().find((r) => r.usuario === usuarioResena.nombre) || null;
  }

  // ---------- RENDER LISTA ----------

  function renderResenas() {
    const lista = obtenerResenas()
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp); // más recientes primero

    if (lista.length === 0) {
      listaResenas.innerHTML = `<p class="resenas-vacio">Todavía no hay reseñas para este juego. ¡Sé el primero en dejar la tuya!</p>`;
      return;
    }

    listaResenas.innerHTML = lista
      .map((r) => {
        const esPropia = usuarioResena && r.usuario === usuarioResena.nombre;

        return `
      <div class="tarjeta-resena${esPropia ? " resena-propia" : ""}" data-usuario="${escaparHTML(r.usuario)}">
        <div class="resena-cabecera">
          ${avatarHTMLResena(r.usuario)}
          <div class="resena-datos">
            <b class="resena-nombre">${escaparHTML(r.usuario)}</b>
            <div class="resena-estrellas">${estrellasHTML(r.calificacion)}</div>
            <span class="resena-fecha">${escaparHTML(r.fecha)}${r.editado ? " · editada" : ""}</span>
          </div>
          ${esPropia ? `
          <div class="resena-acciones-propias">
            <button type="button" class="boton-editar-resena">✏️ Editar</button>
            <button type="button" class="boton-borrar-resena">🗑️ Eliminar</button>
          </div>` : ""}
        </div>
        <p class="resena-texto">${escaparHTML(r.texto)}</p>
        ${typeof botonLikeHTML === "function" ? botonLikeHTML("resenas_" + idJuegoResena, escaparHTML(r.usuario), usuarioResena ? usuarioResena.nombre : null) : ""}
      </div>
    `;
      })
      .join("");

    // Acciones sobre la propia reseña, directo desde la tarjeta
    listaResenas.querySelectorAll(".boton-editar-resena").forEach((btn) => {
      btn.addEventListener("click", () => {
        cargarFormularioParaEditar();
        if (formResena) {
          formResena.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (textareaResena) textareaResena.focus();
      });
    });

    listaResenas.querySelectorAll(".boton-borrar-resena").forEach((btn) => {
      btn.addEventListener("click", eliminarMiResena);
    });
  }

  // ---------- FORMULARIO ----------

  let valorSeleccionadoForm = 0;

  function pintarEstrellasForm(valorHover) {
    if (!contEstrellasForm) return;
    const valor = valorHover || valorSeleccionadoForm;
    contEstrellasForm.querySelectorAll(".estrella").forEach((btn) => {
      const v = Number(btn.dataset.valor);
      btn.classList.toggle("activa", v <= valor);
    });
  }

  function cargarFormularioParaEditar() {
    const existente = miResena();
    if (!existente) return;

    valorSeleccionadoForm = existente.calificacion;
    pintarEstrellasForm();

    if (textareaResena) textareaResena.value = existente.texto;

    actualizarEstadoBotones();
  }

  function limpiarFormulario() {
    valorSeleccionadoForm = 0;
    pintarEstrellasForm();
    if (textareaResena) textareaResena.value = "";
  }

  function actualizarEstadoBotones() {
    const existente = miResena();

    if (botonPublicar) {
      botonPublicar.textContent = existente ? "Actualizar reseña" : "Publicar reseña";
    }

    if (botonEliminar) {
      botonEliminar.style.display = existente ? "inline-flex" : "none";
    }
  }

  function actualizarVisibilidadForm() {
    if (usuarioResena) {
      if (formResena) formResena.style.display = "block";
      if (resenaAviso) resenaAviso.style.display = "none";
      cargarFormularioParaEditar();
      actualizarEstadoBotones();
    } else {
      if (formResena) formResena.style.display = "none";
      if (resenaAviso) resenaAviso.style.display = "block";
    }
  }

  if (contEstrellasForm) {
    const botonesEstrellaForm = contEstrellasForm.querySelectorAll(".estrella");

    botonesEstrellaForm.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        pintarEstrellasForm(Number(btn.dataset.valor));
      });

      btn.addEventListener("click", () => {
        valorSeleccionadoForm = Number(btn.dataset.valor);
        pintarEstrellasForm();
      });
    });

    contEstrellasForm.addEventListener("mouseleave", () => pintarEstrellasForm());
  }

  if (botonPublicar) {
    botonPublicar.addEventListener("click", () => {
      if (!usuarioResena) {
        alert("Iniciá sesión para dejar tu reseña");
        return;
      }

      const texto = (textareaResena?.value || "").trim();

      if (!valorSeleccionadoForm) {
        alert("Elegí una calificación en estrellas para tu reseña");
        return;
      }

      if (!texto) {
        alert("Escribí un texto para tu reseña");
        return;
      }

      const lista = obtenerResenas();
      const indiceExistente = lista.findIndex((r) => r.usuario === usuarioResena.nombre);
      const ahora = new Date();

      if (indiceExistente >= 0) {
        // Editar reseña existente (no se permite duplicar)
        lista[indiceExistente] = {
          ...lista[indiceExistente],
          calificacion: valorSeleccionadoForm,
          texto: texto,
          timestamp: ahora.getTime(),
          fecha: ahora.toLocaleDateString("es-AR"),
          editado: true
        };
      } else {
        lista.push({
          usuario: usuarioResena.nombre,
          calificacion: valorSeleccionadoForm,
          texto: texto,
          fecha: ahora.toLocaleDateString("es-AR"),
          timestamp: ahora.getTime(),
          editado: false
        });
      }

      guardarResenas(lista);
      renderResenas();
      actualizarEstadoBotones();
    });
  }

  function eliminarMiResena() {
    if (!usuarioResena) return;

    const confirmar =
      typeof pedirConfirmacion === "function"
        ? (mensaje, onConfirmar) => pedirConfirmacion(mensaje, onConfirmar, "🗑️ Eliminar reseña")
        : (mensaje, onConfirmar) => {
            if (confirm(mensaje)) onConfirmar();
          };

    confirmar("¿Seguro que querés eliminar tu reseña de este juego?", () => {
      const lista = obtenerResenas().filter((r) => r.usuario !== usuarioResena.nombre);
      guardarResenas(lista);
      limpiarFormulario();
      actualizarEstadoBotones();
      renderResenas();
    });
  }

  if (botonEliminar) {
    botonEliminar.addEventListener("click", eliminarMiResena);
  }

  // ---------- INICIO ----------

  actualizarVisibilidadForm();
  renderResenas();
})();
