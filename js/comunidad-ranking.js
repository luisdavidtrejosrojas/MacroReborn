// ==============================
// COMUNIDAD + RANKING - MacroReborn
// ==============================
// Página combinada (antes eran ranking.html y comunidad.html por
// separado). Se escribió como archivo nuevo e independiente en vez
// de cargar js/ranking.js y js/comunidad.js juntos, porque ambos
// declaran variables globales con el mismo nombre ("const buscador")
// y cargarlos en la misma página rompía todo el script con un
// SyntaxError. De esta forma ranking.js y comunidad.js quedan
// intactos y se siguen usando tal cual en perfil.html/usuario.html.
//
// De paso, como ranking y comunidad necesitan la misma lista de
// usuarios, acá se pide UNA sola vez a /api/users y se reusa para
// las dos secciones (antes cada página hacía su propio pedido).


// ---------- ELEMENTOS: RANKING ----------

const rkPodio = document.getElementById("podioTop6");
const rkResto = document.getElementById("listaRankingResto");
const rkBuscador = document.getElementById("buscarRankingJugador");
const rkBotonLogros = document.getElementById("botonRankingLogros");
const rkBanner = document.getElementById("rkBannerUnite");

// ---------- ELEMENTOS: COMUNIDAD ----------

const comListaConectados = document.getElementById("listaConectados");
const comListaUsuarios = document.getElementById("listaUsuarios");
const comContador = document.getElementById("contadorUsuarios");
const comBuscador = document.getElementById("buscadorUsuarios");

// Usuario con sesión iniciada en este navegador.
const activoComRk = leerJSON(localStorage.getItem("usuarioActivo") || "null");

let _rkOrdenarPorLogros = false;
let _rkUsuarios = [];       // lista completa ya con puntuacion/puntosLogros
let _comAmigos = [];
let _comSolicitudesEnviadas = [];
let _comSolicitudesRecibidas = [];


// ==============================
// AVATAR POR CAPAS (compartido)
// ==============================
// Misma resolución de rutas que ya usan js/ranking.js y js/comunidad.js.

const RK_ORDEN_CAPAS = [
  "fondo", "espalda", "modelo", "piel", "ojos", "boca",
  "pantalon", "botas", "remera", "guantes", "accesorio",
  "cara", "pelo", "mascota", "borde"
];

function rkRutaCapa(valor) {
  if (!valor || valor === "ninguno") return null;
  if (!valor.includes("_")) return "imagenes/" + valor + ".png";
  const idx = valor.indexOf("_");
  return "imagenes/" + valor.slice(0, idx) + "/" + valor.slice(idx + 1) + ".png";
}

function rkAvatarHTML(avatarCrudo, contenedorClase, capaClase, defaultAncho) {

  const avatar = normalizarAvatar(avatarCrudo);

  if (!avatar) {
    return `
      <div class="${contenedorClase}">
        <img src="imagenes/avatar.png" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
      </div>
    `;
  }

  let html = "";
  let rutas = [];

  RK_ORDEN_CAPAS.forEach(tipo => {
    const ruta = rkRutaCapa(avatar[tipo]);
    if (ruta) {
      html += `<img class="${capaClase}" src="${ruta}" alt="" loading="lazy">`;
      rutas.push(ruta);
    }
  });

  return `
    <div class="${contenedorClase} avatar-compuesto" data-capas="${rutas.join("|")}" data-capa-class="${capaClase}">
      ${html}
    </div>
  `;

}


// ==============================
// INDICADOR DE CAMBIO DE POSICIÓN (+1 / -1 / --)
// ==============================
// Sale de rank_actual y rank_anterior, que llegan desde /api/users
// (se calculan y refrescan solos del lado del servidor, ver
// actualizarSnapshotRanking() en api/users.js). Si todavía no hay
// datos guardados para ese usuario, se muestra "--".

function rkDeltaHTML(usuario) {

  const actual = Number(usuario.rank_actual);
  const anterior = Number(usuario.rank_anterior);

  if (!actual || !anterior || isNaN(actual) || isNaN(anterior)) {
    return `<span class="rk-delta rk-neutro">--</span>`;
  }

  const cambio = anterior - actual; // positivo = subió puestos

  if (cambio > 0) return `<span class="rk-delta rk-sube">+${cambio}</span>`;
  if (cambio < 0) return `<span class="rk-delta rk-baja">${cambio}</span>`;
  return `<span class="rk-delta rk-neutro">--</span>`;

}


// ==============================
// RENDER: RANKING
// ==============================

function rkRenderizar(filtro = "") {

  if (!rkPodio || !rkResto) return;

  let lista = _rkUsuarios.slice();

  lista.sort((a, b) => {
    const campo = _rkOrdenarPorLogros ? "puntosLogros" : "puntuacion";
    return b[campo] - a[campo];
  });

  if (filtro) {
    const texto = filtro.toLowerCase();
    lista = lista.filter(u => u.nombre.toLowerCase().includes(texto));
  }

  const top6 = lista.slice(0, 6);
  const resto = lista.slice(6, 60);

  // ---- Podio (top 6) ----

  rkPodio.innerHTML = top6.map((usuario, i) => {

    const puesto = i + 1;

    return `
      <div class="rk-podio-card" data-puesto="${puesto}">

        ${puesto === 1 ? `<div class="rk-corona">👑</div>` : ""}

        <div class="rk-podio-numero">${puesto}</div>

        ${rkAvatarHTML(usuario.avatar, "rk-podio-avatar", "capa-rk")}

        <p class="rk-podio-nombre">${usuario.nombre}</p>

        ${_rkOrdenarPorLogros
          ? `<span class="rk-delta rk-neutro">🏅 ${usuario.puntosLogros}</span>`
          : rkDeltaHTML(usuario)}

      </div>
    `;

  }).join("");

  // ---- Resto (7º en adelante) ----

  rkResto.innerHTML = resto.map((usuario, i) => {

    const puesto = i + 7;

    return `
      <a href="usuario.html?usuario=${encodeURIComponent(usuario.nombre)}" class="rk-mini-card">

        ${rkAvatarHTML(usuario.avatar, "rk-mini-avatar", "capa-rk-mini")}

        <p class="rk-mini-nombre">${usuario.nombre}</p>
        <p class="rk-mini-puesto">${puesto}º</p>

        ${_rkOrdenarPorLogros
          ? `<span class="rk-delta rk-neutro">🏅 ${usuario.puntosLogros}</span>`
          : rkDeltaHTML(usuario)}

      </a>
    `;

  }).join("");

}


// ---- Buscador del ranking ----

rkBuscador?.addEventListener("input", () => {
  rkRenderizar(rkBuscador.value);
});

// ---- Botón "Ver Ranking de Logros" ----
// Alterna el orden entre puntuación total (nivel+XP+logros, la de
// siempre) y solo puntos de logros, reusando los mismos datos ya
// cargados (no hace falta pedir nada de nuevo al servidor).

rkBotonLogros?.addEventListener("click", () => {

  _rkOrdenarPorLogros = !_rkOrdenarPorLogros;

  rkBotonLogros.textContent = _rkOrdenarPorLogros
    ? "Ver Ranking General"
    : "Ver Ranking de Logros";

  rkBotonLogros.classList.toggle("rk-activo", _rkOrdenarPorLogros);

  rkRenderizar(rkBuscador?.value || "");

});


// ==============================
// COMUNIDAD (misma lógica que tenía js/comunidad.js, con nombres
// propios para no chocar con el resto de este archivo)
// ==============================

function comEstaConectado(usuario) {
  if (!usuario || !usuario.last_login) return false;
  const ultima = new Date(usuario.last_login).getTime();
  if (isNaN(ultima)) return false;
  return (Date.now() - ultima) <= MINUTOS_CONECTADO * 60 * 1000;
}

function comEstadoRelacion(nombreOtro) {
  if (!activoComRk) return "";
  if (activoComRk.nombre === nombreOtro) return "";

  if (_comAmigos.includes(nombreOtro)) return `<span class="rel-amigos">✅ Amigos</span>`;
  if (_comSolicitudesEnviadas.includes(nombreOtro)) return `<span class="rel-pendiente">⏳ Solicitud enviada</span>`;
  if (_comSolicitudesRecibidas.includes(nombreOtro)) return `<span class="rel-recibida">📩 Te mandó solicitud</span>`;

  return "";
}

function comRenderConectados(lista) {

  if (!comListaConectados) return;

  const conectados = lista.filter(comEstaConectado);

  if (conectados.length === 0) {
    comListaConectados.innerHTML = `<p class="sin-datos">No hay usuarios conectados en este momento.</p>`;
    return;
  }

  comListaConectados.innerHTML = conectados.map(usuario => `
    <a href="usuario.html?usuario=${encodeURIComponent(usuario.nombre)}" class="tarjeta-mini">
      ${rkAvatarHTML(usuario.avatar, "avatar-mini-conectado", "capa-mini")}
      <div class="mini-info">
        <p class="mini-nombre">${usuario.nombre}</p>
        <p class="mini-estado">🟢 En línea</p>
      </div>
    </a>
  `).join("");

}

function comRenderUsuarios(lista) {

  if (!comListaUsuarios) return;

  if (lista.length === 0) {
    comListaUsuarios.innerHTML = `
      <div class="estado-vacio">
        <span class="icono-vacio">🕹️</span>
        <p>No hay usuarios registrados todavía.</p>
      </div>`;
    if (comContador) comContador.textContent = "";
    return;
  }

  if (comContador) {
    comContador.textContent = `${lista.length} jugador${lista.length === 1 ? "" : "es"} registrado${lista.length === 1 ? "" : "s"}`;
  }

  comListaUsuarios.innerHTML = lista.map(usuario => {

    const conectado = comEstaConectado(usuario);
    const rel = comEstadoRelacion(usuario.nombre);
    const cantidadLogros = typeof obtenerLogros === "function" ? obtenerLogros(usuario.nombre).length : 0;

    return `
      <div class="tarjeta-usuario">

        <span class="badge-estado ${conectado ? "online" : "offline"}">
          ${conectado ? "🟢 En línea" : "⚪ Desconectado"}
        </span>

        ${rkAvatarHTML(usuario.avatar, "avatar-tarjeta", "capa-tarjeta")}

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
          ${cantidadLogros ? `
          <div class="stat-item">
            <span class="stat-valor">${cantidadLogros}</span>
            <span class="stat-label">🏅 Logros</span>
          </div>` : ""}
        </div>

        ${usuario.bio ? `<p class="usuario-bio">${usuario.bio}</p>` : ""}

        <a href="usuario.html?usuario=${encodeURIComponent(usuario.nombre)}" class="btn-ver-perfil">👤 Ver perfil</a>

      </div>
    `;

  }).join("");

}

comBuscador?.addEventListener("input", () => {
  const texto = (comBuscador.value || "").trim().toLowerCase();
  const filtrados = texto
    ? _rkUsuarios.filter(u => u.nombre.toLowerCase().includes(texto))
    : _rkUsuarios;
  comRenderUsuarios(filtrados);
});


// ==============================
// CARGA INICIAL (una sola vez para ranking + comunidad)
// ==============================

async function iniciarComunidadRanking() {

  let crudos = [];

  try {
    const respuesta = await fetch("/api/users?limit=500");
    const datos = await respuesta.json();
    crudos = (datos && datos.success) ? datos.users : [];
  } catch (error) {
    console.warn("MacroReborn: no se pudo cargar la lista de usuarios.", error);
  }

  const usuarios = crudos.map(u => ({ ...u, nombre: u.username, nivel: u.level }));
  const nombres = usuarios.map(u => u.nombre);

  const tareas = [];

  if (typeof cargarLogrosDeVarios === "function") tareas.push(cargarLogrosDeVarios(nombres));
  if (typeof cargarInsigniasDeVarios === "function") tareas.push(cargarInsigniasDeVarios(nombres));

  if (activoComRk) {
    tareas.push(
      fetch("/api/social?action=friends&username=" + encodeURIComponent(activoComRk.nombre))
        .then(r => r.json())
        .then(datos => {
          if (!datos || !datos.success) return;
          _comAmigos = datos.amigos.map(a => a.username);
          _comSolicitudesEnviadas = datos.solicitudesSalientes.map(s => s.para);
          _comSolicitudesRecibidas = datos.solicitudesEntrantes.map(s => s.de);
        })
        .catch(error => console.warn("MacroReborn: no se pudo cargar el estado de amistad.", error))
    );
  }

  await Promise.all(tareas);

  // Puntuación total (nivel + XP + logros), misma fórmula que usaba
  // js/ranking.js, más los puntos de logros solos para el toggle.
  _rkUsuarios = usuarios.map(usuario => {

    const puntosLogros = typeof calcularPuntosLogros === "function"
      ? calcularPuntosLogros(usuario.nombre)
      : 0;

    return {
      ...usuario,
      puntosLogros,
      puntuacion: (Number(usuario.nivel) || 1) * 100000 + (Number(usuario.xp) || 0) + puntosLogros
    };

  });

  if (rkBanner) {
    rkBanner.classList.toggle("rk-oculto", !!activoComRk);
  }

  rkRenderizar();
  comRenderConectados(usuarios);
  comRenderUsuarios(usuarios);

}

iniciarComunidadRanking();
