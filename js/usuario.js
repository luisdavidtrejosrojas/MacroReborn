// ==============================
// USUARIO PÚBLICO - MacroReborn
// usuario.html?usuario=NombreDelUsuario
// ==============================


// ---------- PESTAÑAS ----------

const botonesTab = document.querySelectorAll(".tab");
const contenidosTab = document.querySelectorAll(".contenido-tab");

botonesTab.forEach(boton => {
  boton.addEventListener("click", () => {
    botonesTab.forEach(b => b.classList.remove("activa"));
    contenidosTab.forEach(c => c.classList.remove("activo"));
    boton.classList.add("activa");
    document.getElementById(boton.dataset.tab).classList.add("activo");
  });
});


// ---------- HELPERS ----------

function obtenerActivo() {
  return leerJSON(localStorage.getItem("usuarioActivo") || "null");
}

function obtenerSolicitudes() {
  return leerJSON(localStorage.getItem("solicitudesAmigos") || "[]");
}

function guardarSolicitudes(lista) {
  localStorage.setItem("solicitudesAmigos", JSON.stringify(lista));
}

function obtenerAmigos(nombre) {
  return leerJSON(localStorage.getItem("amigos_" + nombre) || "[]");
}


// ---------- ORDEN DE CAPAS ----------

const ORDEN_CAPAS = [
  "fondo","espalda","modelo","piel","ojos","boca",
  "botas","pantalon","remera","guantes","accesorio",
  "cara","pelo","mascota","borde"
];

// Resuelve la ruta real de una capa de avatar.
// El "modelo" (ej: "tora") vive en imagenes/tora.png.
// El resto de las capas (ej: "tora_piel1") viven en imagenes/tora/piel1.png.
function rutaImagenCapa(valor) {
  if (!valor || valor === "ninguno") return null;
  if (!valor.includes("_")) {
    return "imagenes/" + valor + ".png";
  }
  const idx = valor.indexOf("_");
  const modelo = valor.slice(0, idx);
  const resto = valor.slice(idx + 1);
  return "imagenes/" + modelo + "/" + resto + ".png";
}


// ---------- LEER URL ----------

const params = new URLSearchParams(window.location.search);
const nombreBuscado = params.get("usuario");

const usuarios = leerJSON(localStorage.getItem("usuariosMacro") || "[]");
const usuario = usuarios.find(u => u.nombre === nombreBuscado);


if (!usuario) {

  alert("Usuario no encontrado");

} else {

  // Datos básicos
  document.getElementById("nombreUsuario").textContent = usuario.nombre;

  // SEO: título de pestaña y meta description reales para este perfil
  // (usuario.html es un único archivo para todos los perfiles vía
  // ?id=). La página sigue marcada noindex en el <head> (perfiles con
  // contenido variable/escaso no aportan valor de búsqueda todavía),
  // pero el título correcto mejora igual la pestaña del navegador y
  // cómo se ve el link al compartirlo.
  if (typeof seoActualizar === "function") {
    seoActualizar({
      titulo: usuario.nombre + " - Perfil de jugador | MacroReborn",
      descripcion: seoRecortarDescripcion(
        usuario.biografia ||
        (usuario.nombre + " juega en MacroReborn. Mirá su nivel, sus logros y su actividad reciente.")
      ),
      url: SEO_SITE + "/usuario.html?id=" + encodeURIComponent(nombreBuscado)
    });
  }

  // ---------- INSIGNIAS OFICIALES ----------
  // Se muestran debajo del nombre. Son manuales (no se otorgan por
  // logros): si el usuario no tiene ninguna, el contenedor queda oculto.
  if(typeof renderInsigniasEnContenedor === "function"){
    renderInsigniasEnContenedor("insigniasPerfil", usuario.nombre);
  }
  document.getElementById("estado").textContent = usuario.estado || "🟢 En línea";
  document.getElementById("nivel").textContent = "⭐ Nivel " + (usuario.nivel || 1);
  document.getElementById("biografia").textContent = usuario.biografia || "Todavía no escribió una biografía.";
  document.getElementById("xp").textContent = (usuario.xp || 0) + " XP";

  // LOGROS: se suman los puntos de los logros realmente desbloqueados,
  // con la misma función que usa perfil.js (calcularPuntosLogros, en
  // js/motor/logros.js), en vez de un campo suelto que podía faltar.
  const puntosLogros = typeof calcularPuntosLogros === "function"
    ? calcularPuntosLogros(usuario.nombre)
    : 0;
  document.getElementById("logros").textContent = puntosLogros + " puntos";

  // RANKING: se reutiliza obtenerPosicionRanking() (js/ranking.js) para
  // mostrar la misma posición real que aparece en ranking.html.
  const posicionRanking = typeof obtenerPosicionRanking === "function"
    ? obtenerPosicionRanking(usuario.nombre)
    : null;
  document.getElementById("ranking").textContent = posicionRanking ? "#" + posicionRanking : "Sin clasificar";

  document.getElementById("registro").textContent = usuario.fechaRegistro || "Desconocido";

  const textoUltimaConexion = typeof tiempoRelativo === "function"
    ? tiempoRelativo(usuario.ultimaConexionTS || usuario.ultimaConexion, "Nunca")
    : (usuario.ultimaConexion || "Nunca");

  document.getElementById("ultimaConexion").textContent = "Última conexión: " + textoUltimaConexion;

  document.title = usuario.nombre + " - MacroReborn";
  

  const descripcionInicio = document.getElementById("descripcionInicio");
  if (descripcionInicio) {
    descripcionInicio.textContent = usuario.biografia || "Todavía no escribió una biografía.";
  }


  // ---------- AMIGOS (lista real, solo lectura) ----------

  function renderAmigosUsuario() {
    const contenedor = document.getElementById("listaAmigosUsuario");
    if (!contenedor) return;

    const listaAmigos = obtenerAmigos(usuario.nombre);

    if (listaAmigos.length === 0) {
      contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">Este jugador todavía no tiene amigos.</p>`;
      return;
    }

    contenedor.innerHTML = listaAmigos.map(nombreAmigo => {
      const av = leerJSON(localStorage.getItem("avatar_" + nombreAmigo) || "null");

      let avatarHTML;
      if (!av) {
        avatarHTML = `<img src="imagenes/avatar.png" style="width:55px;height:55px;border-radius:50%;object-fit:cover;" alt="" loading="lazy">`;
      } else {
        let capas = "";
        ORDEN_CAPAS.forEach(tipo => {
          const ruta = rutaImagenCapa(av[tipo]);
          if (ruta) {
            capas += `<img class="capa-comentario" src="${ruta}" alt="" loading="lazy">`;
          }
        });
        avatarHTML = `<div class="avatar-mini">${capas}</div>`;
      }

      return `
        <div class="actividad" style="display:flex;align-items:center;gap:14px;justify-content:space-between;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:14px;">
            ${avatarHTML}
            <b style="color:#f0b429;">${nombreAmigo}</b>
          </div>
          <a href="usuario.html?usuario=${encodeURIComponent(nombreAmigo)}" style="background:#1e293b;color:#f0b429;border:2px solid #f0b429;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:bold;text-decoration:none;">👤 Ver perfil</a>
        </div>
      `;
    }).join("");
  }

  renderAmigosUsuario();


  // ---------- AVATAR ----------

  const avatar = leerJSON(localStorage.getItem("avatar_" + usuario.nombre) || "null");
  const caja = document.getElementById("avatarUsuario");

if (avatar && caja) {

  caja.innerHTML = "";

  let contenedorAvatar = document.createElement("div");

  contenedorAvatar.style.position = "relative";
  contenedorAvatar.style.width = "100%";
  contenedorAvatar.style.height = "100%";
  contenedorAvatar.style.display = "flex";
  contenedorAvatar.style.justifyContent = "center";
  contenedorAvatar.style.alignItems = "center";


  ORDEN_CAPAS.forEach(tipo => {

    const ruta = rutaImagenCapa(avatar[tipo]);

    if(ruta){

      const img = document.createElement("img");

      img.src = ruta;

      img.style.position = "absolute";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";

      img.style.top = "0";
      img.style.left = "0";

      contenedorAvatar.appendChild(img);

    }

  });


  caja.appendChild(contenedorAvatar);

}


  // ---------- BOTÓN AGREGAR AMIGO ----------

  const btnAmigo = document.getElementById("agregarAmigo");
  const activo = obtenerActivo();

  function actualizarBotonAmigo() {
    if (!btnAmigo) return;

    if (!activo) {
      btnAmigo.textContent = "🔑 Iniciá sesión para agregar";
      btnAmigo.disabled = true;
      btnAmigo.style.opacity = "0.5";
      btnAmigo.style.cursor = "default";
      return;
    }

    if (activo.nombre === usuario.nombre) {
      btnAmigo.style.display = "none";
      return;
    }

    const misAmigos = obtenerAmigos(activo.nombre);
    const solicitudes = obtenerSolicitudes();

    const yaEsAmigo = misAmigos.includes(usuario.nombre);
    const solicitudEnviada = solicitudes.some(
      s => s.de === activo.nombre && s.para === usuario.nombre && s.estado === "pendiente"
    );
    const solicitudRecibida = solicitudes.some(
      s => s.de === usuario.nombre && s.para === activo.nombre && s.estado === "pendiente"
    );

    // Resetear estilos
    btnAmigo.disabled = false;
    btnAmigo.style.cssText = "";

    if (yaEsAmigo) {
      btnAmigo.textContent = "✅ Amigos";
      btnAmigo.disabled = true;
      btnAmigo.style.background = "#4ade8033";
      btnAmigo.style.borderColor = "#4ade80";
      btnAmigo.style.color = "#4ade80";
      btnAmigo.style.cursor = "default";
    } else if (solicitudEnviada) {
      btnAmigo.textContent = "⏳ Solicitud enviada";
      btnAmigo.disabled = true;
      btnAmigo.style.opacity = "0.7";
      btnAmigo.style.cursor = "default";
    } else if (solicitudRecibida) {
      btnAmigo.textContent = "📩 Aceptar solicitud";
      btnAmigo.style.background = "#4ade8033";
      btnAmigo.style.borderColor = "#4ade80";
      btnAmigo.style.color = "#4ade80";
    } else {
      btnAmigo.textContent = "🤝 Agregar amigo";
    }
  }

  actualizarBotonAmigo();

  if (btnAmigo) {
    btnAmigo.addEventListener("click", () => {
      if (!activo || btnAmigo.disabled) return;

      if(typeof bloqueadoPorSuspension === "function" && bloqueadoPorSuspension()) return;

      const solicitudes = obtenerSolicitudes();

      // Si hay solicitud recibida pendiente → aceptar
      const idxRecibida = solicitudes.findIndex(
        s => s.de === usuario.nombre && s.para === activo.nombre && s.estado === "pendiente"
      );

      if (idxRecibida !== -1) {
        solicitudes[idxRecibida].estado = "aceptada";
        guardarSolicitudes(solicitudes);
        if(typeof crearNotificacion === "function"){

    crearNotificacion(

        usuario.nombre,

        "🤝 Nueva amistad",

        activo.nombre + " aceptó tu solicitud de amistad."

    );

}

        const misAmigos = obtenerAmigos(activo.nombre);
        if (!misAmigos.includes(usuario.nombre)) misAmigos.push(usuario.nombre);
        localStorage.setItem("amigos_" + activo.nombre, JSON.stringify(misAmigos));

        const susAmigos = obtenerAmigos(usuario.nombre);
        if (!susAmigos.includes(activo.nombre)) susAmigos.push(activo.nombre);
        localStorage.setItem("amigos_" + usuario.nombre, JSON.stringify(susAmigos));

        // LOGROS DE AMIGOS
        if(typeof desbloquearLogro === "function"){
          desbloquearLogro(activo.nombre, "primerAmigo");
          desbloquearLogro(usuario.nombre, "primerAmigo");
          if(misAmigos.length >= 50) desbloquearLogro(activo.nombre, "popular");
          if(susAmigos.length >= 50) desbloquearLogro(usuario.nombre, "popular");
          if(misAmigos.length >= 100) desbloquearLogro(activo.nombre, "leyendaSocial");
          if(susAmigos.length >= 100) desbloquearLogro(usuario.nombre, "leyendaSocial");
        }

        // ACTIVIDAD RECIENTE - AMIGO
        if(typeof registrarActividad === "function"){
          registrarActividad(activo.nombre, "amigo", usuario.nombre);
          registrarActividad(usuario.nombre, "amigo", activo.nombre);
        }

        actualizarBotonAmigo();
        renderAmigosUsuario();
        return;
      }
      // Evitar duplicados
      const yaExiste = solicitudes.some(
        s => s.de === activo.nombre && s.para === usuario.nombre
      );
      if (yaExiste) return;

      // Enviar solicitud
      solicitudes.push({
        de: activo.nombre,
        para: usuario.nombre,
        estado: "pendiente"
      });
      guardarSolicitudes(solicitudes);

      // NOTIFICACION A QUIEN RECIBE LA SOLICITUD
      if(typeof crearNotificacion==="function"){
        crearNotificacion(
          usuario.nombre,
          "📩 Nueva solicitud de amistad",
          activo.nombre + " te envió una solicitud de amistad."
        );
      }

      actualizarBotonAmigo();
    });
  }


  // ---------- COMENTARIOS ----------

  function obtenerAvatarComentario(nombre) {
    const av = leerJSON(localStorage.getItem("avatar_" + nombre) || "null");
    if (!av) {
      return `<img src="imagenes/avatar.png" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #f0b429;" alt="" loading="lazy">`;
    }
    let capas = "";
    ORDEN_CAPAS.forEach(tipo => {
      const ruta = rutaImagenCapa(av[tipo]);
      if (ruta) {
        capas += `<img class="capa-comentario" src="${ruta}" alt="" loading="lazy">`;
      }
    });
    return `<div class="avatar-mini">${capas}</div>`;
  }

  function obtenerListaComentarios() {
    return leerJSON(localStorage.getItem("comentarios_" + usuario.nombre) || "[]");
  }

  function renderComentarios() {
    const lista = obtenerListaComentarios();
    const contenedor = document.getElementById("listaComentarios");
    if (!contenedor) return;

    if (lista.length === 0) {
      contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">Este jugador todavía no tiene comentarios.</p>`;
      return;
    }

    contenedor.innerHTML = lista.map((c,i) => `
      <div class="comentario">
        <div class="usuario-comentario" style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          ${obtenerAvatarComentario(c.usuario)}
          <b style="color:#f0b429;">${c.usuario}</b>
        </div>
        ${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(c.usuario, true) : ""}
        <p style="color:#cbd5e1;margin:0 0 10px;">${c.texto}</p>
        ${typeof botonLikeHTML === "function" ? botonLikeHTML("comentarios_" + usuario.nombre, i, activo ? activo.nombre : null) : ""}
        <button class="boton-reportar" data-index="${i}">🚩 Reportar</button>
      </div>
    `).join("");

    // REPORTAR
    contenedor.querySelectorAll(".boton-reportar").forEach(btn=>{
      btn.onclick = () => {
        const index = Number(btn.dataset.index);

        const confirmar = typeof pedirConfirmacion === "function"
          ? (mensaje, onConfirmar) => pedirConfirmacion(mensaje, onConfirmar, "🚩 Reportar")
          : (mensaje, onConfirmar) => { if(confirm(mensaje)) onConfirmar(); };

        confirmar("¿Seguro que querés reportar este comentario?", () => {
          if(typeof reportarComentario === "function"){
            const listaActual = obtenerListaComentarios();
            const motivo = prompt("¿Por qué reportás este comentario? (opcional)") || "";
            reportarComentario(usuario.nombre, index, listaActual[index], motivo);
          }
          alert("Gracias. El comentario fue reportado correctamente.");
        });
      };
    });
  }

  renderComentarios();

  // Enviar comentario
  const botonComentar = document.getElementById("botonComentar");
  const inputComentario = document.getElementById("comentarioTexto");

  if (botonComentar && inputComentario) {
    const enviarComentario = () => {

      if(typeof bloqueadoPorSuspension === "function" && bloqueadoPorSuspension()) return;

      const texto = inputComentario.value.trim();
      if (!texto) return;

      const quien = activo ? activo.nombre : "Invitado";
      const nuevo = { usuario: quien, texto };
      // ==============================
// NOTIFICACION DE MENCION
// ==============================

if(typeof crearNotificacion === "function"){

    const mencion = texto.match(/@(\w+)/);


    if(mencion){

        const nombreMencionado = mencion[1];


        const usuariosTodos = leerJSON(
            localStorage.getItem("usuariosMacro") || "[]"
        );


        const existe = usuariosTodos.find(
            u => u.nombre === nombreMencionado
        );


        if(existe && existe.nombre !== quien){


            crearNotificacion(

                existe.nombre,

                "📢 Te mencionaron",

                quien + " te mencionó en un comentario."

            );


        }

    }

}

      const lista = obtenerListaComentarios();

lista.push(nuevo);

localStorage.setItem(
    "comentarios_" + usuario.nombre,
    JSON.stringify(lista)
);

inputComentario.value = "";

renderComentarios();


// ==============================
// NOTIFICACIÓN NUEVO COMENTARIO
// ==============================

if(
    activo &&
    activo.nombre !== usuario.nombre &&
    typeof crearNotificacion === "function"
){

    crearNotificacion(

        usuario.nombre,

        "💬 Nuevo comentario",

        activo.nombre + " comentó en tu perfil."

    );

}

      // ==============================
      // LOGRO PRIMER COMENTARIO
      // ==============================
      if (activo && typeof desbloquearLogro === "function") {
        desbloquearLogro(activo.nombre, "primeraPalabra");
      }

      // ACTIVIDAD RECIENTE - COMENTARIO
      if (activo && typeof registrarActividad === "function") {
        registrarActividad(activo.nombre, "comentario", "");
      }
    };

    botonComentar.addEventListener("click", enviarComentario);
    inputComentario.addEventListener("keydown", e => {
      if (e.key === "Enter") enviarComentario();
    });
  }


  // ---------- LOGROS ----------

  function renderLogrosUsuario() {
    const contenedor = document.getElementById("listaLogrosUsuario");
    if (!contenedor) return;
    if (typeof LOGROS === "undefined" || typeof obtenerLogros !== "function") return;

    const lista = obtenerLogros(usuario.nombre);

    if (lista.length === 0) {
      contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">Este jugador todavía no desbloqueó logros.</p>`;
      return;
    }

    contenedor.innerHTML = lista.map(conseguido => {
      const logro = LOGROS[conseguido.id];
      if (!logro) return "";
      return `
        <div class="tarjeta-logro desbloqueado">
          <div class="icono-logro">${logro.icono}</div>
          <div>
            <h3>${logro.nombre}</h3>
            <p>${logro.descripcion}</p>
            <span class="estado-logro">✅ ${logro.puntos} puntos<br>${conseguido.fecha || ""}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  renderLogrosUsuario();

}