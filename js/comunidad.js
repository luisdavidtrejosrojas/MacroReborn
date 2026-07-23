// =======================
// COMUNIDAD MacroReborn
// =======================


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

const usuarios = leerJSON(localStorage.getItem("usuariosMacro") || "[]");
const activo = leerJSON(localStorage.getItem("usuarioActivo") || "null");


// ---------- HELPER: AVATAR POR CAPAS ----------

function avatarDe(nombre) {
  return leerJSON(localStorage.getItem("avatar_" + nombre) || "null");
}

// claseCapa: clase css que se le pone a cada <img> de capa
function avatarHTML(nombre, claseCapa) {
  const avatar = avatarDe(nombre);

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


// ---------- HELPER ESTADO DE RELACIÓN (amigos / solicitudes) ----------

function estadoRelacion(nombreOtro) {
  if (!activo) return "";
  if (activo.nombre === nombreOtro) return ""; // es uno mismo

  const misAmigos = leerJSON(localStorage.getItem("amigos_" + activo.nombre) || "[]");
  if (misAmigos.includes(nombreOtro)) {
    return `<span class="rel-amigos">✅ Amigos</span>`;
  }

  const solicitudes = leerJSON(localStorage.getItem("solicitudesAmigos") || "[]");
  const enviada = solicitudes.some(
    s => s.de === activo.nombre && s.para === nombreOtro && s.estado === "pendiente"
  );
  if (enviada) {
    return `<span class="rel-pendiente">⏳ Solicitud enviada</span>`;
  }

  const recibida = solicitudes.some(
    s => s.de === nombreOtro && s.para === activo.nombre && s.estado === "pendiente"
  );
  if (recibida) {
    return `<span class="rel-recibida">📩 Te mandó solicitud</span>`;
  }

  return "";
}


// ---------- HELPER: ¿ESTÁ CONECTADO? ----------
// Solo podemos confirmar con certeza la sesión activa en este navegador.

function estaConectado(usuario) {
  return activo && activo.nombre === usuario.nombre;
}


// ---------- RENDER: USUARIOS CONECTADOS ----------

function renderConectados(lista) {
  const conectados = lista.filter(estaConectado);

  if (conectados.length === 0) {
    listaConectados.innerHTML = `<p class="sin-datos">No hay usuarios conectados en este momento.</p>`;
    return;
  }

  listaConectados.innerHTML = conectados.map(usuario => `
    <a href="usuario.html?usuario=${encodeURIComponent(usuario.nombre)}" class="tarjeta-mini">
      <div class="avatar-mini-conectado">
        ${avatarHTML(usuario.nombre, "capa-mini")}
      </div>
      <div class="mini-info">
        <p class="mini-nombre">${usuario.nombre}</p>
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

    return `
      <div class="tarjeta-usuario">

        <span class="badge-estado ${conectado ? "online" : "offline"}">
          ${conectado ? "🟢 En línea" : "⚪ Desconectado"}
        </span>

        <div class="avatar-tarjeta">
          ${avatarHTML(usuario.nombre, "capa-tarjeta")}
        </div>

        <h3 class="usuario-nombre">${usuario.nombre}</h3>

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
          ${usuario.logros ? `
          <div class="stat-item">
            <span class="stat-valor">${usuario.logros}</span>
            <span class="stat-label">🏅 Logros</span>
          </div>` : ""}
        </div>

        ${usuario.biografia ? `<p class="usuario-bio">${usuario.biografia}</p>` : ""}

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

renderConectados(usuarios);
renderUsuarios(usuarios);
