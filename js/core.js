// ============================================
// MacroReborn — core.js
// Utilidades compartidas por todas las páginas.
// Se carga PRIMERO en cada HTML para que el resto
// de los scripts puedan usar leerJSON() de forma segura.
// ============================================

/**
 * Envoltorio seguro de JSON.parse.
 * Si el valor guardado en localStorage está corrupto o mal formado,
 * en vez de romper toda la ejecución del script devuelve null
 * (igual que si la clave no existiera), y deja un aviso en consola.
 */
function leerJSON(valorCrudo) {
  try {
    return JSON.parse(valorCrudo);
  } catch (error) {
    console.warn("MacroReborn: dato corrupto en localStorage, se ignora.", error);
    return null;
  }
}

/**
 * Envoltorio seguro para guardar en localStorage.
 * Evita que un error de guardado (por ejemplo, cuota superada)
 * detenga la ejecución del resto del script.
 */
function guardarJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    console.warn("MacroReborn: no se pudo guardar en localStorage.", error);
    return false;
  }
}

/**
 * Convierte una fecha/timestamp en un texto relativo tipo
 * "Hace 5 minutos", "Hace 3 horas", "Hace 2 días", etc.
 * Acepta un número (epoch en ms) o un string de fecha parseable.
 * Si no se puede interpretar, devuelve el valor de "porDefecto".
 */
function tiempoRelativo(fechaOTimestamp, porDefecto) {
  if (fechaOTimestamp === undefined || fechaOTimestamp === null || fechaOTimestamp === "") {
    return porDefecto !== undefined ? porDefecto : "Nunca";
  }

  const fecha = new Date(fechaOTimestamp);

  if (isNaN(fecha.getTime())) {
    return porDefecto !== undefined ? porDefecto : "Nunca";
  }

  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);

  if (segundos < 0) return "Hace unos segundos";
  if (segundos < 60) return "Hace unos segundos";

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return "Hace " + minutos + (minutos === 1 ? " minuto" : " minutos");

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return "Hace " + horas + (horas === 1 ? " hora" : " horas");

  const dias = Math.floor(horas / 24);
  if (dias < 30) return "Hace " + dias + (dias === 1 ? " día" : " días");

  const meses = Math.floor(dias / 30);
  if (meses < 12) return "Hace " + meses + (meses === 1 ? " mes" : " meses");

  const anios = Math.floor(meses / 12);
  return "Hace " + anios + (anios === 1 ? " año" : " años");
}




// ==============================
// PRESENCIA (usuarios "conectados ahora")
// ==============================
// Sistema liviano de latido para aproximar cuántos usuarios están
// usando MacroReborn en este momento, pensado para el panel de
// estadísticas del administrador. Como todo el sitio vive en
// localStorage (sin servidor), no hay forma de saber en tiempo real
// quién está conectado desde otra máquina: lo que sí se puede hacer es
// que, cada vez que carga una página con un usuario con sesión
// iniciada EN ESTE NAVEGADOR, se guarde la hora en un mapa
// { nombre: timestamp } bajo una única clave global
// ("presenciaMacro"). Un usuario cuenta como "conectado ahora" si tiene
// un latido de los últimos MINUTOS_CONECTADO minutos.
//
// En la v1.0 con servidor esto se reemplaza por sesiones reales
// (websockets, "último ping", etc.) sin tocar admin.js: alcanza con
// que "obtenerUsuariosConectadosAhora" pida la lista a una API.

const MINUTOS_CONECTADO = 5;

function _registrarLatidoPresencia(){

  const activo = leerJSON(localStorage.getItem("usuarioActivo") || "null");
  if(!activo || !activo.nombre) return;

  const mapa = leerJSON(localStorage.getItem("presenciaMacro") || "{}") || {};
  mapa[activo.nombre] = Date.now();

  guardarJSON("presenciaMacro", mapa);

}

function obtenerUsuariosConectadosAhora(){

  const mapa = leerJSON(localStorage.getItem("presenciaMacro") || "{}") || {};
  const limite = Date.now() - (MINUTOS_CONECTADO * 60 * 1000);

  return Object.keys(mapa).filter(nombre => mapa[nombre] >= limite);

}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", _registrarLatidoPresencia);
}else{
  _registrarLatidoPresencia();
}




// ==============================
// LATIDO AL SERVIDOR (last_login real, Fase 1: Neon)
// ==============================
// Complementa al latido local de arriba: ese solo sirve dentro de ESTE
// navegador (localStorage no se comparte entre dispositivos). Para que
// "Comunidad" pueda saber quién está conectado de verdad sin importar
// desde qué navegador/dispositivo, refrescamos periódicamente
// "last_login" en Neon mientras haya una sesión iniciada con una
// pestaña abierta. js/comunidad.js considera "conectado" a cualquier
// usuario cuyo last_login sea de los últimos MINUTOS_CONECTADO minutos
// (misma constante de arriba).

const MINUTOS_LATIDO_SERVIDOR = 2; // más seguido que el umbral de "conectado" (5 min)

function _latidoServidor(){

  const activo = leerJSON(localStorage.getItem("usuarioActivo") || "null");
  if(!activo || !activo.nombre) return;

  fetch("/api/users?action=heartbeat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: activo.nombre })
  }).catch(() => {
    // Si falla (sin conexión, etc.) no rompe nada: se reintenta solo
    // en el próximo latido.
  });

}

function _iniciarLatidoServidor(){
  _latidoServidor();
  setInterval(_latidoServidor, MINUTOS_LATIDO_SERVIDOR * 60 * 1000);
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", _iniciarLatidoServidor);
}else{
  _iniciarLatidoServidor();
}




// ==============================
// AVATAR — NORMALIZACIÓN (Fase 1: Neon)
// ==============================
// El avatar ahora viaja dentro de cada usuario (columna users.avatar,
// guardada como JSON) en vez de vivir en la clave localStorage
// "avatar_<nombre>". Según el driver, esa columna puede llegar ya
// parseada como objeto o como texto crudo: esta función normaliza
// cualquiera de los dos casos a un objeto de capas (o null si el
// usuario todavía no armó su avatar), para que el resto del sitio siga
// trabajando con el mismo objeto { modelo, fondo, pelo, ... } de
// siempre.

function normalizarAvatar(valor){
  if(!valor) return null;
  if(typeof valor === "string"){
    return leerJSON(valor);
  }
  return valor;
}




// ==============================
// AVATAR DE OTROS USUARIOS — CACHÉ (Fase 2: cierre de migración)
// ==============================
// Varios lugares del sitio (chat, comentarios de perfil, reseñas,
// actividad de amigos) necesitan pintar el avatar de OTRO usuario de
// forma sincrónica dentro de un bucle de render. Antes leían
// "avatar_<nombre>" de localStorage, una clave que solo existía en el
// navegador donde ese usuario había armado su avatar (nunca en el de
// quien está mirando), así que en la práctica siempre mostraban el
// avatar por defecto. Mismo criterio que _cacheInsignias en
// js/motor/insignias.js: una caché en memoria que se llena con
// cargarAvatarUsuario()/cargarAvataresDeVarios() antes de renderizar,
// y un getter sincrónico (obtenerAvatarCacheado) para usar en el HTML.

const _cacheAvatares = {};

function obtenerAvatarCacheado(nombre){
  return Object.prototype.hasOwnProperty.call(_cacheAvatares, nombre)
    ? _cacheAvatares[nombre]
    : null;
}

async function cargarAvatarUsuario(nombre){

  if(!nombre) return null;

  try{
    const resp = await fetch("/api/users?username=" + encodeURIComponent(nombre));
    const datos = await resp.json();
    const avatar = (datos && datos.success) ? normalizarAvatar(datos.user.avatar) : null;
    _cacheAvatares[nombre] = avatar;
    return avatar;
  }catch(error){
    console.warn("MacroReborn: no se pudo cargar el avatar.", error);
    return _cacheAvatares[nombre] || null;
  }

}

// Trae los avatares de varios usuarios de una vez (listas: chat,
// comentarios, reseñas, actividad), un pedido por nombre único.

async function cargarAvataresDeVarios(nombres){

  const unicos = [...new Set((nombres || []).filter(Boolean))]
    .filter(nombre => !Object.prototype.hasOwnProperty.call(_cacheAvatares, nombre));

  if(!unicos.length) return;

  await Promise.all(unicos.map(nombre => cargarAvatarUsuario(nombre)));

}




// ==============================
// FECHA LEGIBLE (Fase 1: Neon)
// ==============================
// Convierte una fecha/timestamp (ISO de Neon, epoch, etc.) en un
// texto corto y legible tipo "05/08/2026 13:53" (formato es-AR).
// Mismo criterio de "porDefecto" que ya usa tiempoRelativo() más
// arriba. Se usa, por ejemplo, para "Registrado" en perfil.html y
// usuario.html, que hasta ahora mostraban el ISO crudo de Neon.

function fechaLegible(fechaOTimestamp, porDefecto){
  if (fechaOTimestamp === undefined || fechaOTimestamp === null || fechaOTimestamp === "") {
    return porDefecto !== undefined ? porDefecto : "Desconocida";
  }

  const fecha = new Date(fechaOTimestamp);

  if (isNaN(fecha.getTime())) {
    return porDefecto !== undefined ? porDefecto : "Desconocida";
  }

  const fechaCorta = fecha.toLocaleDateString("es-AR");
  const horaCorta = fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return fechaCorta + " " + horaCorta;
}


// ==============================
// ¿ESTÁ CONECTADO? (Fase 2: cierre de migración)
// ==============================
// Mismo criterio que ya usa comunidad.js para la lista de "jugadores
// conectados": se considera en línea si tuvo actividad (last_login,
// refrescado por el latido de _iniciarLatidoServidor más arriba)
// dentro de los últimos MINUTOS_CONECTADO minutos. Se centraliza acá
// (con un nombre propio para no pisar la función local que ya tiene
// comunidad.js) para que cualquier otra página -como usuario.html-
// pueda mostrar el estado real de conexión de un usuario sin
// reinventar este cálculo.

function usuarioEstaConectado(usuario){
  if(!usuario || !usuario.last_login) return false;

  const ultima = new Date(usuario.last_login).getTime();
  if(isNaN(ultima)) return false;

  return (Date.now() - ultima) <= MINUTOS_CONECTADO * 60 * 1000;
}


// ==============================
// AVATAR EN MINIATURA — HTML COMPARTIDO (Fase 2: cierre de migración)
// ==============================
// Arma el HTML de un avatar en miniatura (capas apiladas) a partir
// del valor crudo guardado en users.avatar (string JSON u objeto ya
// normalizado). Misma convención de rutas que ya usan
// comunidad.js/amigos.js/usuario.js/chat.js: el "modelo" (ej. "tora")
// vive en imagenes/tora.png, y cada capa de guardarropa (ej.
// "tora_pelo1") vive en imagenes/tora/pelo1.png. Si el usuario no
// tiene avatar guardado, devuelve el avatar por defecto
// (imagenes/avatar.png) — nunca genera uno al azar.
//
// El HTML se arma con estilos inline (mismo criterio "top:0;left:0;
// width:100%;height:100%;object-fit:contain" que ya usan
// usuario.js/amigos.js/comunidad.js para el avatar principal) para
// que se vea bien en CUALQUIER contenedor, sin depender de que la
// página tenga cargado css/perfil.css ni de un tamaño fijo en
// píxeles. Así se puede reutilizar en lugares nuevos como el panel
// del buscador (ítems chicos) o la bienvenida de Inicio, además de
// los que ya arman este mismo HTML "a mano" en cada archivo.

const ORDEN_CAPAS_AVATAR = [
  "fondo","espalda","modelo","piel","ojos","boca",
  "botas","pantalon","remera","guantes","accesorio",
  "cara","pelo","mascota","borde"
];

function rutaCapaAvatar(valor){
  if(!valor || valor === "ninguno") return null;

  const texto = String(valor);
  const idx = texto.indexOf("_");

  if(idx === -1) return "imagenes/" + texto + ".png";

  return "imagenes/" + texto.slice(0, idx) + "/" + texto.slice(idx + 1) + ".png";
}

function avatarMiniaturaHTML(avatarCrudo){
  const avatar = normalizarAvatar(avatarCrudo);
  const avatarPorDefecto =
    `<img src="imagenes/avatar.png" alt="" loading="lazy" ` +
    `style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;

  if(!avatar) return avatarPorDefecto;

  let capas = "";
  ORDEN_CAPAS_AVATAR.forEach(tipo=>{
    const ruta = rutaCapaAvatar(avatar[tipo]);
    if(ruta){
      capas += `<img src="${ruta}" alt="" loading="lazy" ` +
        `style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;">`;
    }
  });

  if(!capas) return avatarPorDefecto;

  return `<div style="position:relative;width:100%;height:100%;">${capas}</div>`;
}
