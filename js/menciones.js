// ==============================
// MENCIONES (@usuario) - MacroReborn
// ==============================
// Busca @usuario dentro de un texto (comentarios de perfil, chat,
// reseñas) y le crea una notificación a cada persona mencionada,
// reutilizando crearNotificacion() de js/notificaciones.js — no agrega
// ningún endpoint nuevo.
//
// Si el nombre mencionado no existe, no pasa nada: el propio backend
// de notificaciones (api/content.js -> notifications) ya devuelve
// success:false sin romper nada cuando el usuario no se encuentra.
//
// Se usa así, después de guardar el texto con éxito:
//   notificarMenciones(texto, miNombre, "en el chat general.");

const REGEX_MENCION = /@([a-zA-Z0-9_]{3,20})/g;

function notificarMenciones(texto, origenNombre, contexto){

    if(!texto || typeof crearNotificacion !== "function") return;

    const encontrados = texto.match(REGEX_MENCION) || [];
    if(!encontrados.length) return;

    // Sin duplicados y sin autonotificarse si alguien se menciona a
    // sí mismo.
    const nombres = [...new Set(encontrados.map(m => m.slice(1)))]
        .filter(nombre => nombre.toLowerCase() !== (origenNombre || "").toLowerCase());

    nombres.forEach(nombre=>{
        crearNotificacion(
            nombre,
            "📣 Te mencionaron",
            (origenNombre || "Alguien") + " te mencionó " + contexto
        );
    });

}
