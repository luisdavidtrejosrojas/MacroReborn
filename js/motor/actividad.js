// ==============================
// SISTEMA DE ACTIVIDAD RECIENTE - MacroReborn
// ==============================
//
// Este motor registra automáticamente las acciones importantes
// de cada usuario (jugar, favoritos, logros, nivel, amigos,
// comentarios) para poder mostrarlas en:
//   - "Actividad reciente" (pestaña del perfil propio)
//   - "Actividad de amigos" (actividad de los amigos del usuario)
//
// Se guarda por usuario en localStorage bajo la clave
// "actividad_<nombre>", igual que el resto del sitio (favoritos_,
// amigos_, comentarios_, logros_, etc).
//
// No depende de ningún otro script: se puede incluir en cualquier
// página y siempre queda disponible registrarActividad().


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


// ---------- LOCALSTORAGE ----------

function obtenerActividades(nombre){
  if(!nombre) return [];
  return leerJSON(localStorage.getItem("actividad_" + nombre) || "[]");
}

function guardarActividades(nombre, lista){
  if(!nombre) return;
  localStorage.setItem("actividad_" + nombre, JSON.stringify(lista));
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
    case "comentario":
      return "💬 Publicaste un comentario";
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
    case "comentario":
      return "💬 " + nombreAmigo + " publicó un comentario";
    default:
      return (ICONOS_ACTIVIDAD[tipo] || "•") + " " + nombreAmigo + " tuvo actividad";
  }
}


// ---------- REGISTRAR ----------
// tipo: "juego" | "favorito" | "logro" | "nivel" | "amigo" | "comentario"
// detalle: dato extra (nombre del juego, nombre del logro, nivel, nombre del amigo, etc.)

function registrarActividad(nombre, tipo, detalle){
  if(!nombre || !tipo) return;

  const ahora = new Date();

  const nueva = {
    tipo: tipo,
    detalle: detalle || "",
    texto: textoActividadPropia(tipo, detalle),
    fecha: ahora.toLocaleDateString("es-AR"),
    hora: ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    timestamp: ahora.getTime()
  };

  const lista = obtenerActividades(nombre);
  lista.unshift(nueva);
  guardarActividades(nombre, lista.slice(0, MAX_ACTIVIDADES));
}
