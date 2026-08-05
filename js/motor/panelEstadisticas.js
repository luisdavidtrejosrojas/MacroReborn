// ==============================
// ESTADÍSTICAS DEL PANEL DE ADMINISTRACIÓN - MacroReborn (Fase 2: Neon)
// ==============================
// Los números agregados (totales, rankings, contadores) se calculan
// del lado del servidor en /api/system?action=admin-stats, con SQL
// directo sobre Neon — mucho más rápido que traer todo y sumar acá.
// Antes se calculaban recorriendo un montón de claves de localStorage
// (juegosJugados_<nombre>, favoritos_<nombre>, chatGeneral,
// amigos_<nombre>, reportesComentarios, logros_<nombre>,
// usuariosMacro) que dejaron de llenarse cuando esos sistemas pasaron
// a Neon, así que el panel siempre terminaba mostrando todo en cero.
//
// Lo único que se resuelve acá (en el navegador) es la traducción de
// ids a nombres/íconos usando los catálogos que ya vienen en otros
// archivos JS del sitio: js/datos-juegos.js (juegos), js/motor/logros.js
// (LOGROS) y js/motor/insignias.js (INSIGNIAS). Esos catálogos no
// viven en la base, así que el servidor no puede traducirlos.


// ==============================
// TRADUCCIÓN gameId -> nombre
// ==============================

function _nombreJuego(gameId){
  const encontrado = typeof juegos !== "undefined"
    ? juegos.find(j => String(j.id) === String(gameId))
    : null;
  return encontrado ? encontrado.nombre : `Juego #${gameId}`;
}

function _traducirJuegos(lista){
  return (lista || []).map(item => ({
    nombre: _nombreJuego(item.game_id),
    valor: item.cantidad
  }));
}


// ==============================
// TRADUCCIÓN achievementId / badgeId -> ícono + nombre
// ==============================

function _traducirLogros(lista){
  return (lista || []).map(item => {
    const definicion = (typeof LOGROS !== "undefined") ? LOGROS[item.achievement_id] : null;
    return {
      icono: definicion ? definicion.icono : "🏆",
      nombre: definicion ? definicion.nombre : item.achievement_id,
      veces: item.cantidad
    };
  });
}

function _traducirInsignias(lista){
  return (lista || []).map(item => {
    const definicion = (typeof INSIGNIAS !== "undefined") ? INSIGNIAS[item.badge_id] : null;
    return {
      icono: definicion ? definicion.icono : "🏅",
      nombre: definicion ? definicion.nombre : item.badge_id,
      veces: item.cantidad
    };
  });
}


// ==============================
// PUNTO DE ENTRADA (lo llama js/admin.js)
// ==============================

async function obtenerEstadisticasAdmin(){

  try{

    const resp = await fetch("/api/system?action=admin-stats");
    const datos = await resp.json();

    if(!datos || !datos.success) return null;

    return {

      usuarios: datos.usuarios,
      roles: datos.roles,

      juegos: {
        totalDisponibles: (typeof juegos !== "undefined") ? juegos.length : 0,
        masJugados: _traducirJuegos(datos.juegos.masJugados),
        favoritos: _traducirJuegos(datos.juegos.favoritos)
      },

      comunidad: datos.comunidad,

      progreso: {
        topNivel: datos.progreso.topNivel.map(u => ({ nombre: u.username, valor: u.level || 1 })),
        topXP: datos.progreso.topXP.map(u => ({ nombre: u.username, valor: u.xp || 0 })),
        logrosTop: _traducirLogros(datos.progreso.logrosTop),
        insigniasTop: _traducirInsignias(datos.progreso.insigniasTop)
      }

    };

  }catch(error){

    console.warn("MacroReborn: no se pudieron cargar las estadísticas del panel.", error);
    return null;

  }

}
