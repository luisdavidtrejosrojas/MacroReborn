// ==============================
// SISTEMA DE LOGROS - MacroReborn
// ==============================


// LISTA DE LOGROS

const LOGROS = {

  // ---------- AVATAR ----------

  primerAvatar:{
    id:"primerAvatar",
    icono:"🎨",
    nombre:"Primer Avatar",
    descripcion:"Creá tu primer avatar.",
    puntos:10
  },

  // ---------- JUEGOS ----------

  primerJuego:{
    id:"primerJuego",
    icono:"🎮",
    nombre:"Primer Juego",
    descripcion:"Jugá un juego.",
    puntos:10
  },

  explorador:{
    id:"explorador",
    icono:"🕹️",
    nombre:"Explorador",
    descripcion:"Jugá 5 juegos diferentes.",
    puntos:25
  },

  coleccionista:{
    id:"coleccionista",
    icono:"🌍",
    nombre:"Coleccionista",
    descripcion:"Jugá 30 juegos diferentes.",
    puntos:100
  },

  // ---------- COMUNIDAD ----------

  primeraPalabra:{
    id:"primeraPalabra",
    icono:"💬",
    nombre:"Primera Palabra",
    descripcion:"Escribí un comentario.",
    puntos:10
  },

  primerAmigo:{
    id:"primerAmigo",
    icono:"🤝",
    nombre:"Primer Amigo",
    descripcion:"Agregá un amigo.",
    puntos:10
  },

  popular:{
    id:"popular",
    icono:"👥",
    nombre:"Popular",
    descripcion:"Tené 50 amigos.",
    puntos:60
  },

  leyendaSocial:{
    id:"leyendaSocial",
    icono:"🌟",
    nombre:"Leyenda Social",
    descripcion:"Tené 100 amigos.",
    puntos:120
  },

  // ---------- NIVELES ----------

  nivel2:{
    id:"nivel2",
    icono:"⭐",
    nombre:"Nivel 2",
    descripcion:"Alcanzá el nivel 2.",
    puntos:10
  },

  nivel5:{
    id:"nivel5",
    icono:"⭐⭐",
    nombre:"Nivel 5",
    descripcion:"Alcanzá el nivel 5.",
    puntos:20
  },

  nivel10:{
    id:"nivel10",
    icono:"⭐⭐⭐",
    nombre:"Nivel 10",
    descripcion:"Alcanzá el nivel 10.",
    puntos:35
  },

  nivel25:{
    id:"nivel25",
    icono:"💎",
    nombre:"Nivel 25",
    descripcion:"Alcanzá el nivel 25.",
    puntos:60
  },

  nivel50:{
    id:"nivel50",
    icono:"🔥",
    nombre:"Nivel 50",
    descripcion:"Alcanzá el nivel 50.",
    puntos:100
  },

  nivel100:{
    id:"nivel100",
    icono:"👑",
    nombre:"Nivel 100",
    descripcion:"Alcanzá el nivel 100.",
    puntos:180
  },

  nivel200:{
    id:"nivel200",
    icono:"🌌",
    nombre:"Nivel 200",
    descripcion:"Alcanzá el nivel 200.",
    puntos:300
  },

  nivel300:{
    id:"nivel300",
    icono:"🚀",
    nombre:"Nivel 300",
    descripcion:"Alcanzá el nivel 300.",
    puntos:420
  },

  nivel400:{
    id:"nivel400",
    icono:"⚡",
    nombre:"Nivel 400",
    descripcion:"Alcanzá el nivel 400.",
    puntos:540
  },

  nivel500:{
    id:"nivel500",
    icono:"🏆",
    nombre:"Nivel 500",
    descripcion:"Alcanzá el nivel 500.",
    puntos:700
  },

  nivel1000:{
    id:"nivel1000",
    icono:"💠",
    nombre:"Nivel 1000",
    descripcion:"Alcanzá el nivel 1000.",
    puntos:1500
  },

  // ---------- RANKING ----------

  top100:{
    id:"top100",
    icono:"📈",
    nombre:"Top 100",
    descripcion:"Entrá al Top 100 del ranking.",
    puntos:80
  },

  top50:{
    id:"top50",
    icono:"🥈",
    nombre:"Top 50",
    descripcion:"Entrá al Top 50 del ranking.",
    puntos:150
  },

  top10:{
    id:"top10",
    icono:"🥇",
    nombre:"Top 10",
    descripcion:"Entrá al Top 10 del ranking.",
    puntos:280
  },

  top3:{
    id:"top3",
    icono:"🏅",
    nombre:"Top 3",
    descripcion:"Llegá al Top 3 del ranking.",
    puntos:450
  },

  subcampeon:{
    id:"subcampeon",
    icono:"👑",
    nombre:"Subcampeón",
    descripcion:"Alcanzá el puesto #2 del ranking.",
    puntos:700
  },

  numeroUno:{
    id:"numeroUno",
    icono:"🌟",
    nombre:"Número Uno",
    descripcion:"Alcanzá el puesto #1 del ranking.",
    puntos:1000
  }

};




// ==============================
// OBTENER LOGROS
// ==============================

function obtenerLogros(nombre){

  return leerJSON(
    localStorage.getItem("logros_" + nombre) || "[]"
  );

}




// ==============================
// GUARDAR LOGROS
// ==============================

function guardarLogros(nombre,lista){

  localStorage.setItem(
    "logros_" + nombre,
    JSON.stringify(lista)
  );

}




// ==============================
// TIENE LOGRO
// ==============================

function tieneLogro(nombre,id){

  const lista = obtenerLogros(nombre);

  return lista.some(l => l.id === id);

}




// ==============================
// DESBLOQUEAR LOGRO
// ==============================

function desbloquearLogro(nombre,id){

  if(!LOGROS[id]){
    console.warn("Logro inexistente:",id);
    return;
  }



  if(tieneLogro(nombre,id)){
    return;
  }



  const lista = obtenerLogros(nombre);



  lista.push({

    id:id,

    fecha:new Date().toLocaleDateString("es-AR")

  });



  guardarLogros(nombre,lista);





// ==============================
// ACTIVIDAD RECIENTE - LOGRO
// ==============================

if(typeof registrarActividad === "function"){

    registrarActividad(nombre, "logro", LOGROS[id].nombre);

}


// ==============================
// NOTIFICACION DE LOGRO
// ==============================

if(typeof crearNotificacion === "function"){

    crearNotificacion(

        nombre,

        "🏅 Nuevo logro desbloqueado",

        "Conseguiste: " + LOGROS[id].nombre

    );

}


}


// ==============================
// PUNTOS TOTALES DE LOGROS
// ==============================
// Suma los puntos de todos los logros que el usuario ya desbloqueó.
// Función centralizada para que perfil.html, usuario.html y ranking.html
// calculen siempre el mismo valor a partir de los mismos datos.

function calcularPuntosLogros(nombre){

  const lista = obtenerLogros(nombre);

  let puntos = 0;

  lista.forEach(logro=>{
    if(LOGROS[logro.id]){
      puntos += LOGROS[logro.id].puntos || 0;
    }
  });

  return puntos;

}

