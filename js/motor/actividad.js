// ==============================
// SISTEMA DE ACTIVIDAD RECIENTE - MacroReborn (Fase 2: Neon)
// ==============================
//
// Este motor registra automáticamente las acciones importantes
// de cada usuario (jugar, favoritos, logros, nivel, amigos,
// comentarios) para poder mostrarlas en:
//   - "Actividad reciente" (pestaña del perfil propio)
//   - "Actividad de amigos" (actividad de los amigos del usuario)
//
// Los datos viven en la tabla "activity_log" de Neon
// (/api/content?action=activity). "registrarActividad" sigue siendo
// una función normal (no async) para que ninguno de los lugares que
// ya la llaman (perfil.js, usuario.js, amigos.js, favoritos.js,
// juego.js, motor/logros.js, motor/xp.js) tenga que cambiar: adentro
// dispara el POST sin bloquear al que llama.


// ---------- CONFIG ----------

const MAX_ACTIVIDADES = 20;


// ---------- ICONOS ----------

const ICONOS_ACTIVIDAD = {
  juego: "🎮",
  favorito: "❤️",
  logro: "🏅",
  nivel: "⭐",
  amigo: "🤝",
  comentario: "💬"
};


// ---------- VISTA PREVIA DE COMENTARIOS ----------
// Desde la Fase 2, "detalle" para tipo "comentario" trae el texto real
// del comentario (antes viajaba vacío). Acá se recorta a un preview
// tipo red social y se escapa, ya que el texto se inyecta como HTML
// en perfil-actividad.js / usuario-actividad.js.

const LARGO_PREVIEW_COMENTARIO = 90;

function _escapeHTMLActividad(texto){
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Si el comentario ya no existe (se borró) o "detalle" viene vacío
// (actividades viejas, previas a este cambio), devuelve null y quien
// arma el texto cae al mensaje genérico de siempre.
function previewComentario(detalle){
  const texto = (detalle || "").trim();
  if(!texto) return null;

  const recortado = texto.length > LARGO_PREVIEW_COMENTARIO
    ? texto.slice(0, LARGO_PREVIEW_COMENTARIO).trimEnd() + "..."
    : texto;

  return _escapeHTMLActividad(recortado);
}


// ---------- TEXTOS ----------
// "Propio": en 2da persona, para la pestaña "Actividad reciente" del dueño.
// "Amigo": en 3ra persona, para la pestaña "Actividad de amigos".

function textoActividadPropia(tipo, detalle){
  switch(tipo){
    case "juego":
      return "🎮 Jugaste " + detalle;
    case "favorito":
      return "❤️ Agregaste " + detalle + " a favoritos";
    case "logro":
      return "🏅 Desbloqueaste el logro \"" + detalle + "\"";
    case "nivel":
      return "⭐ Subiste al nivel " + detalle;
    case "amigo":
      return "🤝 Agregaste a " + detalle + " como amigo";
    case "comentario":{
      const preview = previewComentario(detalle);
      return preview ? "💬 Comentaste: \"" + preview + "\"" : "💬 Publicaste un comentario";
    }
    default:
      return (ICONOS_ACTIVIDAD[tipo] || "•") + " " + (detalle || "");
  }
}

function textoActividadAmigo(nombreAmigo, tipo, detalle){
  switch(tipo){
    case "juego":
      return "🎮 " + nombreAmigo + " jugó " + detalle;
    case "favorito":
      return "❤️ " + nombreAmigo + " agregó " + detalle + " a favoritos";
    case "logro":
      return "🏅 " + nombreAmigo + " desbloqueó el logro \"" + detalle + "\"";
    case "nivel":
      return "⭐ " + nombreAmigo + " subió al nivel " + detalle;
    case "amigo":
      return "🤝 " + nombreAmigo + " agregó a " + detalle + " como amigo";
    case "comentario":{
      const preview = previewComentario(detalle);
      return preview
        ? "💬 " + nombreAmigo + " comentó: \"" + preview + "\""
        : "💬 " + nombreAmigo + " publicó un comentario";
    }
    default:
      return (ICONOS_ACTIVIDAD[tipo] || "•") + " " + nombreAmigo + " tuvo actividad";
  }
}


// ---------- REGISTRAR ----------
// tipo: "juego" | "favorito" | "logro" | "nivel" | "amigo" | "comentario"
// detalle: dato extra (nombre del juego, nombre del logro, nivel, nombre del amigo, etc.)
// No es async a propósito: dispara el POST y no bloquea a quien llama,
// igual que antes hacía guardarActividades() con localStorage.

function registrarActividad(nombre, tipo, detalle){
  if(!nombre || !tipo) return;

  fetch("/api/content?action=activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: nombre, tipo, detalle: detalle || "" })
  }).catch(error=>{
    console.warn("MacroReborn: no se pudo registrar la actividad.", error);
  });
}


// ---------- OBTENER (para renderActividadReciente / renderActividadAmigos) ----------
// Devuelve las últimas actividades de un usuario ya con "texto", "fecha"
// y "hora" armados, igual que antes armaba registrarActividad() al
// guardar en localStorage.

async function obtenerActividades(nombre){
  if(!nombre) return [];

  try{
    const resp = await fetch("/api/content?action=activity&username=" + encodeURIComponent(nombre));
    const datos = await resp.json();
    if(!datos || !datos.success) return [];

    return datos.actividades.map(a=>{
      const fechaObj = new Date(a.created_at);
      return {
        tipo: a.tipo,
        detalle: a.detalle || "",
        texto: textoActividadPropia(a.tipo, a.detalle),
        fecha: fechaObj.toLocaleDateString("es-AR"),
        hora: fechaObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: fechaObj.getTime()
      };
    });
  }catch(error){
    console.warn("MacroReborn: no se pudieron cargar las actividades.", error);
    return [];
  }
}


// ---------- OBTENER DE VARIOS USUARIOS A LA VEZ (para "Actividad de amigos") ----------
// Un solo pedido en vez de uno por amigo.

async function obtenerActividadesDe(nombres){
  if(!nombres || !nombres.length) return [];

  try{
    const resp = await fetch("/api/content?action=activity-friends&usernames=" + encodeURIComponent(nombres.join(",")));
    const datos = await resp.json();
    if(!datos || !datos.success) return [];

    return datos.actividades.map(a=>{
      const fechaObj = new Date(a.created_at);
      return {
        nombreAmigo: a.username,
        tipo: a.tipo,
        detalle: a.detalle || "",
        fecha: fechaObj.toLocaleDateString("es-AR"),
        hora: fechaObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: fechaObj.getTime()
      };
    });
  }catch(error){
    console.warn("MacroReborn: no se pudieron cargar las actividades de amigos.", error);
    return [];
  }
}
