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
  comentario: "💬",
  resena: "📝",
  like_juego: "👍"
};


// ---------- TIPOS VISIBLES EN "ACTIVIDAD RECIENTE" ----------
// El feed de actividad (propia y de amigos) ya no muestra TODO lo que
// hace el usuario: solo estas 5 acciones. "juego" (jugó tal cosa),
// "favorito" (agregó a favoritos) y "nivel" (subió de nivel) se
// siguen registrando igual que antes (quedan en activity_log, por si
// se necesitan a futuro), pero el backend las excluye de lo que
// devuelve /api/content?action=activity|activity-friends — ver
// api/content.js. Este set es solo documentación del criterio; el
// filtro real vive en el backend para no traer de más por la red.
const TIPOS_ACTIVIDAD_VISIBLES = ["resena", "like_juego", "amigo", "logro", "comentario"];


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


// ---------- MENCIONES (@usuario) DENTRO DE UN TEXTO ----------
// Reutiliza REGEX_MENCION de js/menciones.js si ya está cargado (mismo
// patrón que usa notificarMenciones para no desalinearse); si por
// algún motivo ese script no cargó todavía, cae a una copia local
// idéntica.

function _primeraMencion(texto){
  if(!texto) return null;
  const fuente = typeof REGEX_MENCION !== "undefined" ? REGEX_MENCION.source : "@([a-zA-Z0-9_]{3,20})";
  const match = new RegExp(fuente).exec(texto);
  return match ? match[1] : null;
}


// ---------- EMPAQUETAR/DESEMPAQUETAR JUEGO EN "detalle" ----------
// Para "resena" y "like_juego" necesitamos guardar en una sola
// columna de texto (activity_log.detalle) tanto el nombre del juego
// (para el texto) como su id (para armar el link de destino), y en el
// caso de "resena" también el texto de la reseña (para el preview y
// para detectar si menciona a alguien). Se guarda como JSON; si
// "detalle" no es JSON válido (actividades viejas, u otro tipo), se
// lo trata como el nombre plano del juego.

function empaquetarJuego(nombre, id, texto){
  return JSON.stringify({ juego: nombre || "", id: id != null ? id : null, texto: texto || "" });
}

function _desempaquetarJuego(detalle){
  try{
    const obj = JSON.parse(detalle);
    if(obj && typeof obj === "object" && "juego" in obj){
      return { juego: obj.juego || "", id: obj.id != null ? obj.id : null, texto: obj.texto || "" };
    }
  }catch(_e){ /* no era JSON: sigue abajo */ }
  return { juego: detalle || "", id: null, texto: "" };
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
      const mencion = _primeraMencion(detalle);
      const preview = previewComentario(detalle);
      if(mencion){
        return preview
          ? "📣 Mencionaste a @" + mencion + " en un comentario: \"" + preview + "\""
          : "📣 Mencionaste a @" + mencion + " en un comentario";
      }
      return preview ? "💬 Comentaste: \"" + preview + "\"" : "💬 Publicaste un comentario";
    }
    case "resena":{
      const info = _desempaquetarJuego(detalle);
      const mencion = _primeraMencion(info.texto);
      if(mencion){
        return "📣 Mencionaste a @" + mencion + " en tu reseña de " + info.juego;
      }
      const preview = previewComentario(info.texto);
      return preview
        ? "📝 Comentaste sobre " + info.juego + ": \"" + preview + "\""
        : "📝 Dejaste una reseña de " + info.juego;
    }
    case "like_juego":{
      const info = _desempaquetarJuego(detalle);
      return "👍 Le diste me gusta a " + info.juego;
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
      const mencion = _primeraMencion(detalle);
      const preview = previewComentario(detalle);
      if(mencion){
        return preview
          ? "📣 " + nombreAmigo + " mencionó a @" + mencion + " en un comentario: \"" + preview + "\""
          : "📣 " + nombreAmigo + " mencionó a @" + mencion + " en un comentario";
      }
      return preview
        ? "💬 " + nombreAmigo + " comentó: \"" + preview + "\""
        : "💬 " + nombreAmigo + " publicó un comentario";
    }
    case "resena":{
      const info = _desempaquetarJuego(detalle);
      const mencion = _primeraMencion(info.texto);
      if(mencion){
        return "📣 " + nombreAmigo + " mencionó a @" + mencion + " en su reseña de " + info.juego;
      }
      const preview = previewComentario(info.texto);
      return preview
        ? "📝 " + nombreAmigo + " comentó sobre " + info.juego + ": \"" + preview + "\""
        : "📝 " + nombreAmigo + " dejó una reseña de " + info.juego;
    }
    case "like_juego":{
      const info = _desempaquetarJuego(detalle);
      return "👍 " + nombreAmigo + " le dio me gusta a " + info.juego;
    }
    default:
      return (ICONOS_ACTIVIDAD[tipo] || "•") + " " + nombreAmigo + " tuvo actividad";
  }
}


// ---------- DESTINO (a dónde navega si tocás la actividad) ----------
// Solo las que tienen un lugar concreto al que ir devuelven algo;
// el resto devuelve null y el renderer las deja como texto plano
// (sin link).

function destinoActividad(tipo, detalle){
  switch(tipo){
    case "resena":{
      const info = _desempaquetarJuego(detalle);
      // Si la reseña menciona a alguien, el texto ya dice "Mencionaste
      // a @fulano": el destino va al perfil de esa persona, no al
      // juego, para que coincida con lo que dice la tarjeta.
      const mencion = _primeraMencion(info.texto);
      if(mencion) return "usuario.html?usuario=" + encodeURIComponent(mencion);
      return info.id !== null && info.id !== "" ? "juego.html?id=" + encodeURIComponent(info.id) : null;
    }
    case "like_juego":{
      const info = _desempaquetarJuego(detalle);
      return info.id !== null && info.id !== "" ? "juego.html?id=" + encodeURIComponent(info.id) : null;
    }
    case "amigo":
      return detalle ? "usuario.html?usuario=" + encodeURIComponent(detalle) : null;
    case "comentario":{
      const mencion = _primeraMencion(detalle);
      return mencion ? "usuario.html?usuario=" + encodeURIComponent(mencion) : null;
    }
    default:
      return null;
  }
}


// ---------- REGISTRAR ----------
// tipo: "juego" | "favorito" | "logro" | "nivel" | "amigo" | "comentario" | "resena" | "like_juego"
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
        destino: destinoActividad(a.tipo, a.detalle),
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
        destino: destinoActividad(a.tipo, a.detalle),
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
