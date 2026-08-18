// =======================
// COMUNIDAD MacroReborn
// =======================
// Fase 1: la lista de usuarios sale de /api/users (antes: la clave
// localStorage "usuariosMacro", que en la práctica nunca se llegaba a
// llenar). El estado de amistad/solicitudes sale de /api/friends.


// ---------- RESOLVER RUTA DE UNA CAPA DE AVATAR ----------
// El avatar guardado por perfil.js usa valores como "tora_piel1" para el
// guardarropa (viven en imagenes/tora/piel1.png) y "tora" para el modelo
// (vive en imagenes/tora.png). Misma lógica que usuario.js/amigos.js/ranking.js.

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

const ORDEN_CAPAS = [
  "fondo", "espalda", "modelo", "piel", "ojos", "boca",
  "botas", "pantalon", "remera", "guantes", "accesorio",
  "cara", "pelo", "mascota", "borde"
];


// ---------- DATOS BASE ----------

const listaConectados = document.getElementById("listaConectados");
const listaUsuarios = document.getElementById("listaUsuarios");
const contador = document.getElementById("contadorUsuarios");
const buscador = document.getElementById("buscadorUsuarios");

const activo = leerJSON(localStorage.getItem("usuarioActivo") || "null");

let usuarios = [];       // se llena en cargarComunidad()
let misAmigos = [];      // nombres de mis amigos (si hay sesión)
let solicitudesEnviadas = [];   // nombres a los que ya les mandé solicitud
let solicitudesRecibidas = [];  // nombres que me mandaron solicitud


// ---------- HELPER: AVATAR POR CAPAS ----------

function avatarHTML(avatarCrudo, claseCapa) {
  const avatar = normalizarAvatar(avatarCrudo);

  if (!avatar) {
    return `<img src="imagenes/avatar.png" class="${claseCapa}" style="object-fit:contain;" alt="" loading="lazy">`;
  }

  let html = "";
  ORDEN_CAPAS.forEach(tipo => {
    const ruta = rutaImagenCapa(avatar[tipo]);
    if (ruta) {
      html += `<img src="${ruta}" class="${claseCapa}" alt="" loading="lazy">`;
    }
  });

  return html || `<img src="imagenes/avatar.png" class="${claseCapa}" style="object-fit:contain;" alt="" loading="lazy">`;
}

// Rutas de las capas de un avatar, en el mismo orden que usa avatarHTML()
// arriba. Se usa para armar el data-capas del contenedor ".avatar-compuesto"
// que compone las capas en una sola imagen (ver componerAvataresEnPantalla
// en js/core.js): así el click derecho fuera del editor toma el avatar
// completo en vez de una capa suelta.
function rutasCapasAvatar(avatarCrudo) {
  const avatar = normalizarAvatar(avatarCrudo);
  if (!avatar) return [];
  return ORDEN_CAPAS.map(tipo => rutaImagenCapa(avatar[tipo])).filter(Boolean);
}


// ---------- HELPER ESTADO DE RELACIÓN (amigos / solicitudes) ----------

function estadoRelacion(nombreOtro) {
  if (!activo) return "";
  if (activo.nombre === nombreOtro) return ""; // es uno mismo

  if (misAmigos.includes(nombreOtro)) {
    return `<span class="rel-amigos">✅ Amigos</span>`;
  }

  if (solicitudesEnviadas.includes(nombreOtro)) {
    return `<span class="rel-pendiente">⏳ Solicitud enviada</span>`;
  }

  if (solicitudesRecibidas.includes(nombreOtro)) {
    return `<span class="rel-recibida">📩 Te mandó solicitud</span>`;
  }

  return "";
}


// ---------- HELPER: ¿ESTÁ CONECTADO? ----------
// Antes solo se marcaba como "conectado" a la sesión activa DE ESTE
// NAVEGADOR (activo.nombre === usuario.nombre), así que cualquier otra
// persona realmente conectada desde otro dispositivo aparecía como
// desconectada. Ahora se calcula a partir de "last_login" (que llega
// desde /api/users y se mantiene fresco gracias al latido periódico
// de js/core.js -> POST /api/heartbeat mientras la persona tiene una
// pestaña abierta con sesión iniciada): si tuvo actividad dentro de
// los últimos MINUTOS_CONECTADO minutos, cuenta como en línea, sin
// importar en qué navegador esté.
//
// MINUTOS_CONECTADO ya viene declarada como const en js/core.js (se
// carga antes que este archivo en comunidad.html), así que se reusa
// esa misma constante en vez de volver a declararla acá. Redeclarar
// un "const" con el mismo nombre en dos <script> de la misma página
// tira un SyntaxError apenas el navegador parsea este archivo, lo que
// frenaba TODO comunidad.js (por eso no se veía ningún jugador, aunque
// la API funcionara perfecto).

function estaConectado(usuario) {
  if (!usuario || !usuario.last_login) return false;

  const ultima = new Date(usuario.last_login).getTime();
  if (isNaN(ultima)) return false;

  return (Date.now() - ultima) <= MINUTOS_CONECTADO * 60 * 1000;
}


// ---------- RENDER: USUARIOS CONECTADOS ----------

// Escapa texto no confiable antes de insertarlo en HTML.
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : String(texto);
  return div.innerHTML;
}


function renderConectados(lista) {
  const conectados = lista.filter(estaConectado);

  if (conectados.length === 0) {
    listaConectados.innerHTML = `<p class="sin-datos">No hay usuarios conectados en este momento.</p>`;
    return;
  }

  listaConectados.innerHTML = conectados.map(usuario => `
    <a href="usuario.html?usuario=${encodeURIComponent(usuario.nombre)}" class="tarjeta-mini">
      <div class="avatar-mini-conectado avatar-compuesto" data-capas="${rutasCapasAvatar(usuario.avatar).join("|")}" data-capa-class="capa-mini">
        ${avatarHTML(usuario.avatar, "capa-mini")}
      </div>
      <div class="mini-info">
        <p class="mini-nombre">${escaparHTML(usuario.nombre)}</p>
        <p class="mini-estado">🟢 En línea</p>
      </div>
    </a>
  `).join("");
}


// ---------- RENDER: TODOS LOS USUARIOS ----------

function renderUsuarios(lista) {

  if (lista.length === 0) {
    listaUsuarios.innerHTML = `
      <div class="estado-vacio">
        <span class="icono-vacio">🕹️</span>
        <p>No hay usuarios registrados todavía.</p>
      </div>`;
    contador.textContent = "";
    return;
  }

  contador.textContent = `${lista.length} jugador${lista.length === 1 ? "" : "es"} registrado${lista.length === 1 ? "" : "s"}`;

  listaUsuarios.innerHTML = lista.map(usuario => {

    const conectado = estaConectado(usuario);
    const rel = estadoRelacion(usuario.nombre);
    const cantidadLogros = typeof obtenerLogros === "function" ? obtenerLogros(usuario.nombre).length : 0;

    return `
      <div class="tarjeta-usuario">

        <span class="badge-estado ${conectado ? "online" : "offline"}">
          ${conectado ? "🟢 En línea" : "⚪ Desconectado"}
        </span>

        <div class="avatar-tarjeta avatar-compuesto" data-capas="${rutasCapasAvatar(usuario.avatar).join("|")}" data-capa-class="capa-tarjeta">
          ${avatarHTML(usuario.avatar, "capa-tarjeta")}
        </div>

        <h3 class="usuario-nombre">${escaparHTML(usuario.nombre)}</h3>

        ${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(usuario.nombre, true) : ""}

        ${rel}

        <div class="usuario-stats">
          <div class="stat-item">
            <span class="stat-valor">${usuario.nivel || 1}</span>
            <span class="stat-label">⭐ Nivel</span>
          </div>
          ${usuario.xp ? `
          <div class="stat-item">
            <span class="stat-valor">${usuario.xp}</span>
            <span class="stat-label">XP</span>
          </div>` : ""}
          ${cantidadLogros ? `
          <div class="stat-item">
            <span class="stat-valor">${cantidadLogros}</span>
            <span class="stat-label">🏅 Logros</span>
          </div>` : ""}
        </div>

        ${usuario.bio ? `<p class="usuario-bio">${escaparHTML(usuario.bio)}</p>` : ""}

        <a href="usuario.html?usuario=${encodeURIComponent(usuario.nombre)}" class="btn-ver-perfil">👤 Ver perfil</a>

      </div>
    `;

  }).join("");
}


// ---------- BUSCADOR ----------

function aplicarFiltro() {
  const texto = (buscador?.value || "").trim().toLowerCase();
  const filtrados = texto
    ? usuarios.filter(u => u.nombre.toLowerCase().includes(texto))
    : usuarios;

  renderUsuarios(filtrados);
}

buscador?.addEventListener("input", aplicarFiltro);


// ---------- INICIO ----------

async function cargarComunidad() {

  try {

    const respuesta = await fetch("/api/users?limit=500");
    const datos = await respuesta.json();
    const crudos = (datos && datos.success) ? datos.users : [];

    usuarios = crudos.map(u => ({ ...u, nombre: u.username, nivel: u.level }));

  } catch (error) {

    console.warn("MacroReborn: no se pudo cargar la comunidad.", error);
    usuarios = [];

  }

  const nombres = usuarios.map(u => u.nombre);

  const tareas = [];

  if (typeof cargarLogrosDeVarios === "function") {
    tareas.push(cargarLogrosDeVarios(nombres));
  }
  if (typeof cargarInsigniasDeVarios === "function") {
    tareas.push(cargarInsigniasDeVarios(nombres));
  }

  if (activo) {
    tareas.push(
      fetch("/api/social?action=friends&username=" + encodeURIComponent(activo.nombre))
        .then(r => r.json())
        .then(datos => {
          if (!datos || !datos.success) return;
          misAmigos = datos.amigos.map(a => a.username);
          solicitudesEnviadas = datos.solicitudesSalientes.map(s => s.para);
          solicitudesRecibidas = datos.solicitudesEntrantes.map(s => s.de);
        })
        .catch(error => console.warn("MacroReborn: no se pudo cargar el estado de amistad.", error))
    );
  }

  await Promise.all(tareas);

  renderConectados(usuarios);
  renderUsuarios(usuarios);

}

cargarComunidad();
