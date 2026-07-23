// ==============================
// SISTEMA DE ROLES Y PERMISOS - MacroReborn
// ==============================
// Se apoya en el campo "insignias" que ya vive dentro de cada usuario
// (ver js/motor/insignias.js) para decidir qué puede hacer cada uno.
// Todo se guarda con el mismo mecanismo que el resto del sitio
// (localStorage, clave "usuariosMacro"), así que no rompe nada de lo
// que ya existía y queda preparado para el día que esto se conecte a
// una base de datos real: alcanza con reemplazar estas funciones de
// lectura/escritura por llamadas a una API sin tocar el resto del sitio.


// ==============================
// LECTURA / ESCRITURA DE USUARIOS
// ==============================

function obtenerUsuarios(){

  return leerJSON(
    localStorage.getItem("usuariosMacro") || "[]"
  );

}

function guardarUsuarios(lista){

  localStorage.setItem(
    "usuariosMacro",
    JSON.stringify(lista)
  );

}

function obtenerUsuarioActivo(){

  return leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
  );

}

function buscarUsuarioPorNombre(nombre){

  return obtenerUsuarios().find(u => u.nombre === nombre) || null;

}

// Actualiza un usuario dentro de "usuariosMacro" y, si es el que tiene
// la sesión iniciada en este navegador, sincroniza también
// "usuarioActivo" para que los cambios se vean sin tener que
// desloguearse.

function actualizarUsuario(nombre, cambios){

  const usuarios = obtenerUsuarios();
  const idx = usuarios.findIndex(u => u.nombre === nombre);

  if(idx === -1) return null;

  usuarios[idx] = Object.assign({}, usuarios[idx], cambios);
  guardarUsuarios(usuarios);

  const activo = obtenerUsuarioActivo();
  if(activo && activo.nombre === nombre){
    localStorage.setItem(
      "usuarioActivo",
      JSON.stringify(Object.assign({}, activo, cambios))
    );
  }

  return usuarios[idx];

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
// Aceptan tanto el nombre de usuario como el objeto usuario, para poder
// usarse cómodamente desde cualquier página.

function _insigniasDe(usuarioONombre){

  const nombre = typeof usuarioONombre === "string"
    ? usuarioONombre
    : (usuarioONombre ? usuarioONombre.nombre : null);

  if(!nombre) return [];

  if(typeof obtenerInsignias === "function"){
    return obtenerInsignias(nombre);
  }

  const usuario = buscarUsuarioPorNombre(nombre);
  return (usuario && Array.isArray(usuario.insignias)) ? usuario.insignias : [];

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
// SUSPENSIÓN DE USUARIOS
// ==============================
// Un usuario suspendido no puede comentar, mandar mensajes ni hacer
// acciones de comunidad (agregar amigos, aceptar solicitudes, etc).
// Sigue pudiendo navegar el sitio con normalidad.

function estaSuspendido(usuarioONombre){

  const nombre = typeof usuarioONombre === "string"
    ? usuarioONombre
    : (usuarioONombre ? usuarioONombre.nombre : null);

  if(!nombre) return false;

  const usuario = buscarUsuarioPorNombre(nombre);
  return !!(usuario && usuario.suspendido);

}

function suspenderUsuario(nombre, motivo){

  return actualizarUsuario(nombre, {
    suspendido: true,
    fechaSuspension: new Date().toLocaleString("es-AR"),
    motivoSuspension: motivo || "No especificado"
  });

}

function reactivarUsuario(nombre){

  return actualizarUsuario(nombre, {
    suspendido: false,
    fechaSuspension: null,
    motivoSuspension: null
  });

}

// Chequeo genérico para usar antes de comentar / mandar mensajes /
// acciones de comunidad. Si está suspendido, muestra el aviso y
// devuelve true (para poder hacer "if(bloqueadoPorSuspension()) return;").

function bloqueadoPorSuspension(){

  const activo = obtenerUsuarioActivo();
  if(!activo) return false;

  if(!estaSuspendido(activo.nombre)) return false;

  mostrarAvisoSuspension();
  return true;

}

function mostrarAvisoSuspension(){
  alert("🚫 Tu cuenta está suspendida.");
}




// ==============================
// BANNER DE SUSPENSIÓN + ACCESO AL PANEL EN LA NAVBAR
// ==============================
// Se ejecuta solo cuando existe un contenedor .navbar en la página
// (lo agrega navbar.js en el DOM al cargar). No pisa nada del diseño
// existente: usa las mismas clases que ya usa navbar.js.

function _pintarBannerSuspension(){

  const activo = obtenerUsuarioActivo();
  if(!activo || !estaSuspendido(activo.nombre)) return;

  if(document.getElementById("avisoSuspension")) return;

  const usuarioActualizado = buscarUsuarioPorNombre(activo.nombre);
  const motivo = usuarioActualizado && usuarioActualizado.motivoSuspension
    ? usuarioActualizado.motivoSuspension
    : "";

  const banner = document.createElement("div");
  banner.id = "avisoSuspension";
  banner.className = "aviso-suspension";
  banner.innerHTML = `🚫 Tu cuenta está suspendida.${motivo ? " Motivo: " + motivo : ""}`;

  document.body.prepend(banner);

}

function _pintarAccesoPanel(){

  const activo = obtenerUsuarioActivo();
  const nav = document.querySelector(".nav-links") || document.querySelector("nav");

  if(!activo || !nav) return;
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
