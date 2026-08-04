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

(async function(){

let usuario = null;

try{

  const respuesta = await fetch("/api/users?username=" + encodeURIComponent(nombreBuscado));
  const datos = await respuesta.json();

  if(datos && datos.success){
    usuario = {
      ...datos.user,
      nombre: datos.user.username,
      nivel: datos.user.level,
      biografia: datos.user.bio || "Todavía no escribió una biografía.",
      fechaRegistro: datos.user.created_at
    };
  }

}catch(error){

  console.warn("MacroReborn: no se pudo cargar el perfil.", error);

}


if (!usuario) {

  alert("Usuario no encontrado");

} else {

  // Precargar logros/insignias del perfil visitado antes de renderizar
  // nada que dependa de ellos (puntos de logros, insignias, tarjetas).
  if(typeof cargarLogros === "function"){
    await cargarLogros(usuario.nombre);
  }

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
  document.getElementById("ranking").textContent = "Calculando…";
  if(typeof obtenerPosicionRanking === "function"){
    obtenerPosicionRanking(usuario.nombre).then(posicionRanking=>{
      document.getElementById("ranking").textContent = posicionRanking ? "#" + posicionRanking : "Sin clasificar";
    });
  } else {
    document.getElementById("ranking").textContent = "Sin clasificar";
  }

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

  // Amigos del perfil visitado (para "ya somos amigos" y la lista de
  // solo lectura). Se pide una sola vez y se reusa en ambos lados.
  let _amigosDeEstePerfil = [];

  async function cargarAmigosDeEstePerfil(){
    try{
      const respuesta = await fetch("/api/friends?username=" + encodeURIComponent(usuario.nombre));
      const datos = await respuesta.json();
      _amigosDeEstePerfil = (datos && datos.success) ? datos.amigos : [];
    }catch(error){
      console.warn("MacroReborn: no se pudo cargar la lista de amigos.", error);
      _amigosDeEstePerfil = [];
    }
  }

  function renderAmigosUsuario() {
    const contenedor = document.getElementById("listaAmigosUsuario");
    if (!contenedor) return;

    if (_amigosDeEstePerfil.length === 0) {
      contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">Este jugador todavía no tiene amigos.</p>`;
      return;
    }

    contenedor.innerHTML = _amigosDeEstePerfil.map(amigo => {
      const nombreAmigo = amigo.username;
      const av = normalizarAvatar(amigo.avatar);

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

  await cargarAmigosDeEstePerfil();
  renderAmigosUsuario();


  // ---------- AVATAR ----------
  // El avatar viaja embebido en el usuario (users.avatar), ya no hace
  // falta ir a buscarlo a una clave localStorage aparte.

  const avatar = normalizarAvatar(usuario.avatar);
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

  // Solicitudes propias del visitante (para saber si ya le mandó
  // solicitud a este perfil, o si este perfil ya le mandó una a él).
  let _misSolicitudes = { solicitudesEntrantes: [], solicitudesSalientes: [] };

  async function cargarMisSolicitudes(){
    if(!activo) return;
    try{
      const respuesta = await fetch("/api/friends?username=" + encodeURIComponent(activo.nombre));
      const datos = await respuesta.json();
      if(datos && datos.success){
        _misSolicitudes = {
          solicitudesEntrantes: datos.solicitudesEntrantes,
          solicitudesSalientes: datos.solicitudesSalientes
        };
      }
    }catch(error){
      console.warn("MacroReborn: no se pudo cargar tus solicitudes.", error);
    }
  }

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

    const yaEsAmigo = _amigosDeEstePerfil.some(a => a.username === activo.nombre);
    const solicitudEnviada = _misSolicitudes.solicitudesSalientes.some(s => s.para === usuario.nombre);
    const solicitudRecibida = _misSolicitudes.solicitudesEntrantes.some(s => s.de === usuario.nombre);

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

  await cargarMisSolicitudes();
  actualizarBotonAmigo();

  if (btnAmigo) {
    btnAmigo.addEventListener("click", async () => {
      if (!activo || btnAmigo.disabled) return;

      if(typeof bloqueadoPorSuspension === "function" && bloqueadoPorSuspension()) return;

      btnAmigo.disabled = true;

      // Si hay solicitud recibida pendiente → aceptar
      const recibida = _misSolicitudes.solicitudesEntrantes.find(s => s.de === usuario.nombre);

      if (recibida) {

        try{
          const respuesta = await fetch("/api/friends", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "accept", requestId: recibida.id })
          });
          const datos = await respuesta.json();
          if(!datos || !datos.success){ actualizarBotonAmigo(); return; }
        }catch(error){
          console.warn("MacroReborn: no se pudo aceptar la solicitud.", error);
          actualizarBotonAmigo();
          return;
        }

        if(typeof crearNotificacion === "function"){
          crearNotificacion(
            usuario.nombre,
            "🤝 Nueva amistad",
            activo.nombre + " aceptó tu solicitud de amistad."
          );
        }

        // LOGROS DE AMIGOS
        if(typeof desbloquearLogro === "function"){
          desbloquearLogro(activo.nombre, "primerAmigo");
          desbloquearLogro(usuario.nombre, "primerAmigo");
        }

        // ACTIVIDAD RECIENTE - AMIGO
        if(typeof registrarActividad === "function"){
          registrarActividad(activo.nombre, "amigo", usuario.nombre);
          registrarActividad(usuario.nombre, "amigo", activo.nombre);
        }

        await cargarAmigosDeEstePerfil();
        await cargarMisSolicitudes();
        actualizarBotonAmigo();
        renderAmigosUsuario();
        return;
      }

      // Evitar duplicados
      const yaExiste = _misSolicitudes.solicitudesSalientes.some(s => s.para === usuario.nombre);
      if (yaExiste){ actualizarBotonAmigo(); return; }

      // Enviar solicitud
      try{
        const respuesta = await fetch("/api/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request", from: activo.nombre, to: usuario.nombre })
        });
        const datos = await respuesta.json();
        if(!datos || !datos.success){ actualizarBotonAmigo(); return; }
      }catch(error){
        console.warn("MacroReborn: no se pudo enviar la solicitud.", error);
        actualizarBotonAmigo();
        return;
      }

      // NOTIFICACION A QUIEN RECIBE LA SOLICITUD
      if(typeof crearNotificacion==="function"){
        crearNotificacion(
          usuario.nombre,
          "📩 Nueva solicitud de amistad",
          activo.nombre + " te envió una solicitud de amistad."
        );
      }

      await cargarMisSolicitudes();
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

})();