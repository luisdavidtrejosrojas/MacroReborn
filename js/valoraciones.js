// =========================
// MACROREBORN - CALIFICACION (ESTRELLAS) + LIKE / NO ME GUSTA
// =========================
// Sistema independiente y autocontenido (IIFE) para no chocar con las
// variables globales que ya usa juego.js (idJuego, juego, usuario, etc).
// Todo se guarda en localStorage, igual que favoritos/historial/comentarios.
//
// Claves usadas:
//   calificaciones_<idJuego>  -> { "nombreUsuario": puntuacion(1-5), ... }
//   votosJuego_<idJuego>      -> { "nombreUsuario": "like" | "dislike", ... }
//
// No se mezclan datos entre juegos porque cada clave incluye el id del juego.

(function () {
  "use strict";

  const parametrosVal = new URLSearchParams(window.location.search);
  const idJuegoVal = Number(parametrosVal.get("id"));

  if (Number.isNaN(idJuegoVal)) return;

  const usuarioVal = leerJSON(localStorage.getItem("usuarioActivo") || "null");

  const claveCalificaciones = "calificaciones_" + idJuegoVal;
  const claveVotosJuego = "votosJuego_" + idJuegoVal;

  // ---------- ELEMENTOS ----------

  const contEstrellasRelleno = document.getElementById("estrellasRelleno");
  const elPromedio = document.getElementById("calificacionPromedio");
  const elVotos = document.getElementById("calificacionVotos");
  const contEstrellasUsuario = document.getElementById("calificacionEstrellas");

  const botonLike = document.getElementById("botonLike");
  const botonDislike = document.getElementById("botonDislike");
  const contadorLikes = document.getElementById("contadorLikes");
  const contadorDislikes = document.getElementById("contadorDislikes");

  // Si la página no tiene estos elementos, no hay nada que hacer.
  if (!contEstrellasUsuario && !botonLike) return;

  // ---------- CALIFICACIONES (1 a 5 ESTRELLAS) ----------

  function obtenerCalificaciones() {
    return leerJSON(localStorage.getItem(claveCalificaciones) || "{}");
  }

  function guardarCalificaciones(obj) {
    localStorage.setItem(claveCalificaciones, JSON.stringify(obj));
  }

  function calcularPromedio(obj) {
    const valores = Object.values(obj);
    if (valores.length === 0) return { promedio: 0, cantidad: 0 };
    const suma = valores.reduce((a, b) => a + b, 0);
    return { promedio: suma / valores.length, cantidad: valores.length };
  }

  function renderCalificacion() {
    const calificaciones = obtenerCalificaciones();
    const { promedio, cantidad } = calcularPromedio(calificaciones);

    if (contEstrellasRelleno) {
      contEstrellasRelleno.style.width = (promedio / 5) * 100 + "%";
    }

    if (elPromedio) {
      elPromedio.textContent = promedio.toFixed(1) + "/5";
    }

    if (elVotos) {
      elVotos.textContent =
        "(" + cantidad + (cantidad === 1 ? " voto" : " votos") + ")";
    }

    if (contEstrellasUsuario) {
      const miVoto = usuarioVal ? calificaciones[usuarioVal.nombre] || 0 : 0;
      contEstrellasUsuario.querySelectorAll(".estrella").forEach((btn) => {
        const valor = Number(btn.dataset.valor);
        btn.classList.toggle("activa", valor <= miVoto);
      });
    }
  }

  if (contEstrellasUsuario) {
    const botonesEstrella = contEstrellasUsuario.querySelectorAll(".estrella");

    botonesEstrella.forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        const valor = Number(btn.dataset.valor);
        botonesEstrella.forEach((b) => {
          b.classList.toggle("preview", Number(b.dataset.valor) <= valor);
        });
      });

      btn.addEventListener("click", () => {
        if (!usuarioVal) {
          alert("Iniciá sesión para calificar este juego");
          return;
        }

        const valor = Number(btn.dataset.valor);
        const calificaciones = obtenerCalificaciones();
        calificaciones[usuarioVal.nombre] = valor;
        guardarCalificaciones(calificaciones);

        renderCalificacion();
      });
    });

    contEstrellasUsuario.addEventListener("mouseleave", () => {
      botonesEstrella.forEach((b) => b.classList.remove("preview"));
    });
  }

  renderCalificacion();

  // ---------- LIKE / NO ME GUSTA ----------

  function obtenerVotosJuego() {
    return leerJSON(localStorage.getItem(claveVotosJuego) || "{}");
  }

  function guardarVotosJuego(obj) {
    localStorage.setItem(claveVotosJuego, JSON.stringify(obj));
  }

  function renderVotosJuego() {
    const votos = obtenerVotosJuego();
    const valores = Object.values(votos);
    const likes = valores.filter((v) => v === "like").length;
    const dislikes = valores.filter((v) => v === "dislike").length;

    if (contadorLikes) contadorLikes.textContent = likes;
    if (contadorDislikes) contadorDislikes.textContent = dislikes;

    const miVoto = usuarioVal ? votos[usuarioVal.nombre] : null;

    if (botonLike) botonLike.classList.toggle("activo", miVoto === "like");
    if (botonDislike) botonDislike.classList.toggle("activo", miVoto === "dislike");
  }

  function votarJuego(tipo) {
    if (!usuarioVal) {
      alert("Iniciá sesión para votar este juego");
      return;
    }

    const votos = obtenerVotosJuego();

    // Un solo voto por usuario: si tocás el mismo botón, se quita;
    // si tocás el otro, reemplaza al anterior.
    if (votos[usuarioVal.nombre] === tipo) {
      delete votos[usuarioVal.nombre];
    } else {
      votos[usuarioVal.nombre] = tipo;
    }

    guardarVotosJuego(votos);
    renderVotosJuego();
  }

  if (botonLike) {
    botonLike.addEventListener("click", () => votarJuego("like"));
  }

  if (botonDislike) {
    botonDislike.addEventListener("click", () => votarJuego("dislike"));
  }

  renderVotosJuego();
})();
