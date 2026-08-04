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
