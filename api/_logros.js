// ==============================
// LOS LOGROS, VISTOS DESDE EL SERVIDOR — api/_logros.js
// ==============================
// Los logros los decide el navegador (js/motor/logros.js: "jugá 5 juegos
// distintos", "alcanzá el nivel 10"…) y los pide guardar con
// POST /api/social?action=achievements. Hasta el 04/10/2026 el servidor
// guardaba el que le pidieran, sin mirar nada: no hacía falta, porque un
// logro solo daba puntos.
//
// Desde ese día cada logro da también tantas monedas como puntos
// (docs/ECONOMIA.md). Así que antes de guardarlo el servidor comprueba,
// con los datos de la base, lo mismo que comprobó el navegador: si no,
// pedir los 25 de golpe daría miles de monedas. Si no se cumple, no se
// guarda, y el navegador deshace lo que había pintado.
//
// Los de tener 50 y 100 amigos dan puntos pero no monedas: premiaban
// crear cuentas falsas, que es justo lo que pasó el 02 y el 03/10/2026.
//
// Los nombres y los puntos son copia de js/motor/logros.js:
// tests/logros-servidor.test.js vigila que digan lo mismo.

// ---------- Cómo se comprueba cada tipo ----------
// Cada una devuelve la consulta; el logro se cumple si su fila dice ok.

const porNivel = (nivel) => (sql, id) =>
  sql`SELECT level >= ${nivel} AS ok FROM users WHERE id = ${id};`;

// El puesto del ranking semanal (users.rank_actual), el mismo que mira
// js/ranking.js. Sin puesto todavía, no se cumple ninguno.
const porPuestoHasta = (puesto) => (sql, id) =>
  sql`SELECT rank_actual IS NOT NULL AND rank_actual BETWEEN 1 AND ${puesto} AS ok FROM users WHERE id = ${id};`;
const porPuestoExacto = (puesto) => (sql, id) =>
  sql`SELECT rank_actual IS NOT NULL AND rank_actual = ${puesto} AS ok FROM users WHERE id = ${id};`;

const porJuegos = (cuantos) => (sql, id) =>
  sql`SELECT COUNT(DISTINCT game_id) >= ${cuantos} AS ok FROM games_played WHERE user_id = ${id};`;

const porAmigos = (cuantos) => (sql, id) =>
  sql`SELECT COUNT(*) >= ${cuantos} AS ok FROM friendships WHERE user_id = ${id};`;

const conAvatar = (sql, id) =>
  sql`SELECT (u.avatar IS NOT NULL OR EXISTS (SELECT 1 FROM saved_avatars s WHERE s.user_id = u.id)) AS ok
      FROM users u WHERE u.id = ${id};`;

// Un comentario en un perfil; el chat también vale.
const conPalabra = (sql, id) =>
  sql`SELECT (EXISTS (SELECT 1 FROM profile_comments WHERE author_user_id = ${id})
           OR EXISTS (SELECT 1 FROM chat_messages WHERE user_id = ${id})) AS ok;`;

// ---------- El catálogo ----------

const LOGROS = Object.freeze({
  primerAvatar:   { nombre: "Primer Avatar",   puntos: 10,   comprobar: conAvatar },
  primerJuego:    { nombre: "Primer Juego",    puntos: 10,   comprobar: porJuegos(1) },
  explorador:     { nombre: "Explorador",      puntos: 25,   comprobar: porJuegos(5) },
  coleccionista:  { nombre: "Coleccionista",   puntos: 100,  comprobar: porJuegos(30) },
  primeraPalabra: { nombre: "Primera Palabra", puntos: 10,   comprobar: conPalabra },
  primerAmigo:    { nombre: "Primer Amigo",    puntos: 10,   comprobar: porAmigos(1) },
  popular:        { nombre: "Popular",         puntos: 60,   comprobar: porAmigos(50),  sinMonedas: true },
  leyendaSocial:  { nombre: "Leyenda Social",  puntos: 120,  comprobar: porAmigos(100), sinMonedas: true },
  nivel2:         { nombre: "Nivel 2",         puntos: 10,   comprobar: porNivel(2) },
  nivel5:         { nombre: "Nivel 5",         puntos: 20,   comprobar: porNivel(5) },
  nivel10:        { nombre: "Nivel 10",        puntos: 35,   comprobar: porNivel(10) },
  nivel25:        { nombre: "Nivel 25",        puntos: 60,   comprobar: porNivel(25) },
  nivel50:        { nombre: "Nivel 50",        puntos: 100,  comprobar: porNivel(50) },
  nivel100:       { nombre: "Nivel 100",       puntos: 180,  comprobar: porNivel(100) },
  nivel200:       { nombre: "Nivel 200",       puntos: 300,  comprobar: porNivel(200) },
  nivel300:       { nombre: "Nivel 300",       puntos: 420,  comprobar: porNivel(300) },
  nivel400:       { nombre: "Nivel 400",       puntos: 540,  comprobar: porNivel(400) },
  nivel500:       { nombre: "Nivel 500",       puntos: 700,  comprobar: porNivel(500) },
  nivel1000:      { nombre: "Nivel 1000",      puntos: 1500, comprobar: porNivel(1000) },
  top100:         { nombre: "Top 100",         puntos: 80,   comprobar: porPuestoHasta(100) },
  top50:          { nombre: "Top 50",          puntos: 150,  comprobar: porPuestoHasta(50) },
  top10:          { nombre: "Top 10",          puntos: 280,  comprobar: porPuestoHasta(10) },
  top3:           { nombre: "Top 3",           puntos: 450,  comprobar: porPuestoHasta(3) },
  subcampeon:     { nombre: "Subcampeón",      puntos: 700,  comprobar: porPuestoExacto(2) },
  numeroUno:      { nombre: "Número Uno",      puntos: 1000, comprobar: porPuestoExacto(1) }
});

function existe(id) {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(LOGROS, id);
}

// ¿Lo tiene ganado esta cuenta? false también si el logro no existe.
async function seCumple(sql, id, userId) {
  if (!existe(id)) return false;
  const filas = await LOGROS[id].comprobar(sql, userId);
  return !!(filas.length && (filas[0].ok === true || filas[0].ok === "t"));
}

// Las monedas que da: sus puntos, salvo los que no dan.
function monedasDeLogro(id) {
  if (!existe(id) || LOGROS[id].sinMonedas) return 0;
  return LOGROS[id].puntos;
}

module.exports = { LOGROS, existe, seCumple, monedasDeLogro };
