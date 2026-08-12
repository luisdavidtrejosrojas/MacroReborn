// ==============================
// ACTUALIZACIONES EN TIEMPO REAL DEL PERFIL PROPIO (Pusher)
// ==============================
// Se conecta al mismo canal público por usuario que ya usa
// js/realtime.js para las notificaciones ("notificaciones-<nombre>")
// y escucha los eventos que ahora dispara el servidor (api/content.js
// y api/social.js) cada vez que se crea un comentario, una actividad,
// un juego jugado o un logro en ESTE perfil. Al recibir el evento,
// vuelve a pintar solo esa sección, sin recargar la página.
//
// Va en un archivo aparte (no adentro de js/realtime.js) para no
// tocar la lógica de la campanita de notificaciones, que es un tema
// distinto aunque comparta el mismo canal.
//
// Requiere que datosUsuario (js/perfil.js) y las funciones
// renderComentarios / renderActividadReciente / renderHistorialPerfil
// / renderLogros ya estén definidas, así que este script se carga al
// final, después de todos esos.

(function () {

  if (typeof Pusher === "undefined") {
    console.warn("MacroReborn: pusher-js no cargó, actualizaciones en vivo del perfil desactivadas.");
    return;
  }

  if (typeof datosUsuario === "undefined" || !datosUsuario || !datosUsuario.nombre) return;

  // Mismos valores que js/realtime.js (públicos a propósito, ver ese
  // archivo para más detalle).
  const PUSHER_KEY = "767a9d93fede4f8f7b52";
  const PUSHER_CLUSTER = "sa1";

  if (PUSHER_KEY === "TU_PUSHER_KEY") return;

  const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
  const canal = pusher.subscribe("notificaciones-" + datosUsuario.nombre.toLowerCase());

  canal.bind("nuevo-comentario", function () {
    if (typeof renderComentarios === "function") renderComentarios();
  });

  canal.bind("comentarios-vaciados", function () {
    if (typeof renderComentarios === "function") renderComentarios();
  });

  canal.bind("nueva-actividad", function () {
    if (typeof renderActividadReciente === "function") renderActividadReciente();
  });

  canal.bind("nuevo-historial", function () {
    if (typeof renderHistorialPerfil === "function") renderHistorialPerfil();
  });

  canal.bind("nuevo-logro", function () {
    if (typeof renderLogros === "function") renderLogros();
  });

  // "Última conexión" en vivo: útil, por ejemplo, si tenías el perfil
  // abierto en una pestaña y volvés a entrar desde otro dispositivo.
  canal.bind("latido", function (datos) {
    if (datos && datos.last_login) datosUsuario.ultimaConexion = datos.last_login;
    if (typeof pintarUltimaConexion === "function") pintarUltimaConexion();
  });

  // Aunque no llegue ningún latido nuevo, el texto "hace X minutos"
  // tiene que ir avanzando solo con el correr del tiempo.
  if (typeof pintarUltimaConexion === "function") {
    setInterval(pintarUltimaConexion, 30 * 1000);
  }

})();
