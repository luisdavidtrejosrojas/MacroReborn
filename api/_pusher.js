// ==============================
// Pusher (push en tiempo real) - server-side
// ==============================
// Requiere 3 variables de entorno en Vercel (Project Settings -> 
// Environment Variables), sacadas del dashboard de Pusher
// (https://dashboard.pusher.com -> tu app -> App Keys):
//
//   PUSHER_APP_ID
//   PUSHER_KEY
//   PUSHER_SECRET
//   PUSHER_CLUSTER   (ej: "us2", "sa1", el que te haya asignado Pusher)
//
// PUSHER_KEY y PUSHER_CLUSTER también van hardcodeados en
// js/realtime.js (el cliente los necesita para conectarse, y no son
// secretos: son públicos por diseño de Pusher). PUSHER_SECRET y
// PUSHER_APP_ID NUNCA van al frontend.

const Pusher = require("pusher");

let _instancia = null;

function getPusher() {

  if (_instancia) return _instancia;

  _instancia = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  return _instancia;

}

// Nombre del canal público para las notificaciones de un usuario.
// Público (no privado/autenticado) a propósito: mantiene esto simple,
// en línea con el resto del proyecto. Cualquiera que adivine el
// nombre de usuario podría, en teoría, suscribirse a este canal y ver
// que "alguien recibió una notificación" (sin poder leer nada más,
// ya que el contenido solo se pide vía /api/content con el username
// correcto). Si en algún momento se necesita más privacidad, se puede
// pasar a canales "private-" con un endpoint de auth.
function canalNotificaciones(username) {
  return "notificaciones-" + String(username).toLowerCase();
}

module.exports = { getPusher, canalNotificaciones };
