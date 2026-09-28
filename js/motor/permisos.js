// ==============================
// SISTEMA DE ROLES Y PERMISOS - MacroReborn (Fase 2: Neon, cierre de migración)
// ==============================
// Se apoya en las insignias oficiales (js/motor/insignias.js, ya en
// Neon desde la Fase 1) para decidir qué puede hacer cada uno.
//
// La lista de usuarios y la suspensión de cuentas vivían antes en
// localStorage bajo la clave "usuariosMacro" — una clave que dejó de
// llenarse el día que el registro/login pasaron a Neon (Fase 1), así
// que en la práctica "obtenerUsuarios()" siempre devolvía un array
// vacío y la suspensión nunca tenía efecto real. Ahora todo sale de
// /api/users (tabla "users" de Neon).


// ==============================
// LECTURA DE USUARIOS (Neon)
// ==============================

// Trae la lista completa de usuarios (para el panel de administración).
// tope alto a propósito: el panel necesita verlos a todos, no solo los
// primeros 300 que trae /api/users por defecto. Con las cuentas
// baneadas, que en las demás listas no salen (api/_sanciones.js): el
// servidor solo se las da a la moderación.
async function obtenerUsuarios(){

  try{

    const resp = await fetch("/api/users?limit=2000&moderacion=1");
    const datos = await resp.json();
    return (datos && datos.success) ? datos.users : [];

  }catch(error){

    console.warn("MacroReborn: no se pudo cargar la lista de usuarios.", error);
    return [];

  }

}

function obtenerUsuarioActivo(){
  if (window.MRSession && typeof window.MRSession.get === "function") {
    return window.MRSession.get();
  }
  return leerJSON(localStorage.getItem("usuarioActivo") || "null");
}

async function buscarUsuarioPorNombre(nombre){

  if(!nombre) return null;

  try{

    let datos;
    if(window.MRApi && typeof window.MRApi.requestShared === "function"){
      datos = await window.MRApi.requestShared(
        "GET",
        "/api/users?username=" + encodeURIComponent(nombre),
        { credentials: "same-origin" }
      );
    }else{
      const resp = await fetch("/api/users?username=" + encodeURIComponent(nombre));
      datos = await resp.json();
    }
    return (datos && datos.success) ? datos.user : null;

  }catch(error){

    console.warn("MacroReborn: no se pudo cargar el usuario.", error);
    return null;

  }

}




// ==============================
// ROLES DISPONIBLES
// ==============================
// Coinciden con el id de las insignias oficiales (js/motor/insignias.js).
// El colaborador es puramente visual: no otorga ningún permiso.

const ROLES = {
  ADMINISTRADOR: "administrador",
  MODERADOR: "moderador",
  COLABORADOR: "colaborador"
};




// ==============================
// CONSULTA DE ROL / INSIGNIAS
// ==============================
// Sincrónicas a propósito (se llaman dentro de bucles de render): leen
// de la caché en memoria de js/motor/insignias.js. Cualquier página
// que necesite un resultado confiable tiene que llamar antes a
// cargarInsignias(nombre) (o cargarInsigniasDeVarios) y esperarlo, tal
// como ya hacía el resto del sitio con las insignias.

function _insigniasDe(usuarioONombre){

  const nombre = typeof usuarioONombre === "string"
    ? usuarioONombre
    : (usuarioONombre ? usuarioONombre.nombre : null);

  if(!nombre) return [];

  return typeof obtenerInsignias === "function" ? obtenerInsignias(nombre) : [];

}

function esAdministrador(usuarioONombre){
  return _insigniasDe(usuarioONombre).includes(ROLES.ADMINISTRADOR);
}

// El administrador también puede hacer todo lo que puede un moderador.
function esModerador(usuarioONombre){
  const insignias = _insigniasDe(usuarioONombre);
  return insignias.includes(ROLES.MODERADOR) || insignias.includes(ROLES.ADMINISTRADOR);
}

function esColaborador(usuarioONombre){
  return _insigniasDe(usuarioONombre).includes(ROLES.COLABORADOR);
}




// ==============================
// TABLA DE PERMISOS
// ==============================
// Un único lugar donde queda documentado (y controlado) qué puede
// hacer cada rol. Si el día de mañana se agrega un permiso nuevo,
// alcanza con sumarlo acá.

const PERMISOS = {

  // Exclusivos del administrador
  panelAdmin:            [ROLES.ADMINISTRADOR],
  verUsuarios:            [ROLES.ADMINISTRADOR],
  buscarUsuarios:          [ROLES.ADMINISTRADOR],
  asignarInsignias:        [ROLES.ADMINISTRADOR],
  quitarInsignias:        [ROLES.ADMINISTRADOR],
  gestionarModeradores:      [ROLES.ADMINISTRADOR],
  verEstadisticas:        [ROLES.ADMINISTRADOR],

  // Compartidos entre administrador y moderador
  panelModeracion:        [ROLES.ADMINISTRADOR, ROLES.MODERADOR],
  verReportes:          [ROLES.ADMINISTRADOR, ROLES.MODERADOR],
  eliminarComentarios:      [ROLES.ADMINISTRADOR, ROLES.MODERADOR],
  suspenderUsuarios:        [ROLES.ADMINISTRADOR, ROLES.MODERADOR],
  reactivarUsuarios:        [ROLES.ADMINISTRADOR, ROLES.MODERADOR]

};

function tienePermiso(usuarioONombre, permiso){

  const definicion = PERMISOS[permiso];
  if(!definicion) return false;

  const insignias = _insigniasDe(usuarioONombre);
  return definicion.some(rol => insignias.includes(rol));

}




// ==============================
// SUSPENSIÓN DE USUARIOS (Neon)
// ==============================
// Un usuario suspendido no puede comentar, mandar mensajes ni hacer
// acciones de comunidad (agregar amigos, aceptar solicitudes, etc).
// Sigue pudiendo navegar el sitio con normalidad.

async function estaSuspendido(usuarioONombre){

  const nombre = typeof usuarioONombre === "string"
    ? usuarioONombre
    : (usuarioONombre ? usuarioONombre.nombre : null);

  if(!nombre) return false;

  const usuario = await buscarUsuarioPorNombre(nombre);
  return !!(usuario && usuario.suspendido);

}

// Advertir, suspender, banear y levantar: lo decide y lo apunta el
// servidor (api/_sanciones.js, desde el 28/09/2026). Devuelven su
// respuesta entera, { success, error, ... }, para que el panel diga la
// verdad: antes ignoraba la respuesta y anunciaba "enviada" aunque el
// servidor la hubiera rechazado.
async function _moderar(accion, cuerpo){
  try{
    const resp = await fetch("/api/users?action=" + accion, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo)
    });
    const datos = await resp.json().catch(() => null);
    return datos || { success: false, error: "El servidor no contestó" };
  }catch(error){
    console.warn("MacroReborn: no se pudo hablar con la moderación.", error);
    return { success: false, error: "No se pudo hablar con el servidor" };
  }
}

const advertirCuenta = (nombre, motivo) => _moderar("warn", { username: nombre, motivo });
const suspenderUsuario = (nombre, motivo, dias) => _moderar("suspend", { username: nombre, motivo, dias });
const banearUsuario = (nombre, motivo) => _moderar("ban", { username: nombre, motivo });
const reactivarUsuario = (nombre) => _moderar("reactivate", { username: nombre });

// Chequeo genérico para usar antes de comentar / mandar mensajes /
// acciones de comunidad. Si está suspendido, muestra el aviso y
// devuelve true (para poder hacer "if(await bloqueadoPorSuspension()) return;").

async function bloqueadoPorSuspension(){

  const activo = obtenerUsuarioActivo();
  if(!activo) return false;

  if(!(await estaSuspendido(activo.nombre))) return false;

  mostrarAvisoSuspension();
  return true;

}

function mostrarAvisoSuspension(){
  const activo = obtenerUsuarioActivo();
  const nombre = activo && activo.nombre ? activo.nombre : "tu cuenta";
  const mensaje = "La cuenta de " + nombre + " está suspendida: podés jugar y mirar, pero no escribir. " +
    "¿Es un error? Escribinos en Discord: " + DISCORD_MODERACION;

  if(window.MRModal && typeof window.MRModal.show === "function") {
    window.MRModal.show({
      title: "Cuenta suspendida",
      message: mensaje,
      icon: "🚫",
      buttonText: "Entendido"
    });
    return;
  }

  alert("🚫 Tu cuenta está suspendida.");
}




// ==============================
// BANNER DE SUSPENSIÓN + ACCESO AL PANEL EN LA NAVBAR
// ==============================
// Se ejecuta solo cuando existe un contenedor .navbar en la página
// (lo agrega navbar.js en el DOM al cargar). No pisa nada del diseño
// existente: usa las mismas clases que ya usa navbar.js.

// Dónde se reclama una sanción (el mismo que da el servidor en sus
// respuestas, api/_sanciones.js).
const DISCORD_MODERACION = "https://discord.gg/tKjfsQ7GdG";

// "5/10 a las 14:00", en la hora de Argentina, como en el servidor.
function fechaSuspensionAR(fecha){
  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(fecha));
  const p = (tipo) => (partes.find(x => x.type === tipo) || {}).value || "";
  return p("day") + "/" + p("month") + " a las " + p("hour") + ":" + p("minute");
}

async function _pintarBannerSuspension(){

  const activo = obtenerUsuarioActivo();
  if(!activo) return;

  const usuarioActualizado = await buscarUsuarioPorNombre(activo.nombre);
  if(!usuarioActualizado || !usuarioActualizado.suspendido) return;

  if(document.getElementById("avisoSuspension")) return;

  const motivo = usuarioActualizado.motivo_suspension || "";
  const hasta = usuarioActualizado.suspendido_hasta
    ? " hasta el " + fechaSuspensionAR(usuarioActualizado.suspendido_hasta) + " (hora de Argentina)"
    : "";

  const banner = document.createElement("div");
  banner.id = "avisoSuspension";
  banner.className = "aviso-suspension";
  banner.textContent = "🚫 Tu cuenta está suspendida" + hasta +
    ": podés jugar y mirar, pero no escribir." + (motivo ? " Motivo: " + motivo + "." : "") + " ";
  const reclamar = document.createElement("a");
  reclamar.href = DISCORD_MODERACION;
  reclamar.target = "_blank";
  reclamar.rel = "noopener";
  reclamar.textContent = "¿Es un error? Escribinos en Discord";
  banner.appendChild(reclamar);

  document.body.prepend(banner);

}

async function _pintarAccesoPanel(){

  const activo = obtenerUsuarioActivo();
  const nav = document.querySelector(".nav-links") || document.querySelector("nav");

  if(!activo || !nav) return;

  if(typeof cargarInsignias === "function"){
    await cargarInsignias(activo.nombre);
  }

  if(!tienePermiso(activo, "panelModeracion")) return;
  if(document.getElementById("enlacePanelAdmin")) return;

  const esAdmin = esAdministrador(activo);

  nav.insertAdjacentHTML("beforeend", `
    <a class="sesion-extra" id="enlacePanelAdmin" href="admin.html">
      ${esAdmin ? "🛠️ Panel Admin" : "🛡️ Moderación"}
    </a>
  `);

}

document.addEventListener("DOMContentLoaded", function(){
  _pintarBannerSuspension();
  _pintarAccesoPanel();
});

// Por si el script se carga después de que el DOM ya está listo.
if(document.readyState === "interactive" || document.readyState === "complete"){
  _pintarBannerSuspension();
  _pintarAccesoPanel();
}
