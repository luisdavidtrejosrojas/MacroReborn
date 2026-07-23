// ==============================
// PANEL DE ESTADÍSTICAS - MacroReborn
// ==============================
// Motor de agregación para la pestaña "📊 Estadísticas" del panel de
// administración (admin.html, solo administrador). Lee datos que ya
// viven en localStorage bajo las claves que usa el resto del sitio
// (usuariosMacro, comentarios_<nombre>, chatGeneral, amigos_<nombre>,
// reportesComentarios, juegosJugados_<nombre>, favoritos_<nombre>,
// logros_<nombre>) y devuelve un único objeto ya armado, listo para
// pintar en el panel.
//
// Preparado para la v1.0 con base de datos: "obtenerEstadisticasAdmin"
// es el único punto de entrada que usa admin.js para pintar esta
// pestaña. El día de mañana alcanza con que esta función (o cada una
// de las secciones que arma) pida los números a una API en vez de
// recorrer localStorage, sin tocar admin.js ni el HTML.


// ==============================
// UTILIDADES DE LECTURA
// ==============================

// Recorre TODO localStorage y devuelve las claves que empiezan con un
// prefijo dado (ej: "comentarios_" devuelve una clave por cada perfil).
function _clavesConPrefijo(prefijo){

  const claves = [];

  for(let i = 0; i < localStorage.length; i++){
    const clave = localStorage.key(i);
    if(clave && clave.indexOf(prefijo) === 0){
      claves.push(clave);
    }
  }

  return claves;

}

// Suma la cantidad de elementos de todas las listas guardadas bajo un
// mismo prefijo (ej: total de comentarios sumando "comentarios_juan",
// "comentarios_ana", etc).
function _contarItemsPorPrefijo(prefijo){

  let total = 0;

  _clavesConPrefijo(prefijo).forEach(clave=>{
    const lista = leerJSON(localStorage.getItem(clave) || "[]");
    if(Array.isArray(lista)) total += lista.length;
  });

  return total;

}

// Las fechas de registro se guardan como texto "d/m/aaaa" (es-AR, ver
// js/registro.js). Esta función las convierte a timestamp para poder
// compararlas.
function _parsearFechaRegistro(fechaTexto){

  if(!fechaTexto) return null;

  const partes = String(fechaTexto).split("/");
  if(partes.length !== 3) return null;

  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const anio = Number(partes[2]);

  if(!dia || !mes || !anio) return null;

  return new Date(anio, mes - 1, dia).getTime();

}




// ==============================
// SECCIÓN: USUARIOS
// ==============================

function _estadisticasUsuarios(usuarios){

  const ahora = Date.now();
  const DIA_MS = 24 * 60 * 60 * 1000;

  const activos = usuarios.filter(usuario=>
    usuario.ultimaConexionTS && (ahora - usuario.ultimaConexionTS) <= 7 * DIA_MS
  ).length;

  const nuevos = usuarios.filter(usuario=>{
    const ts = _parsearFechaRegistro(usuario.fechaRegistro);
    return ts !== null && (ahora - ts) <= 30 * DIA_MS;
  }).length;

  const conectadosAhora = typeof obtenerUsuariosConectadosAhora === "function"
    ? obtenerUsuariosConectadosAhora().length
    : null;

  return {
    total: usuarios.length,
    activos7dias: activos,
    nuevos30dias: nuevos,
    conectadosAhora: conectadosAhora // null = el sistema de presencia no está disponible
  };

}




// ==============================
// SECCIÓN: JUEGOS
// ==============================

function _estadisticasJuegos(usuarios){

  const listaJuegos = (typeof juegos !== "undefined" && Array.isArray(juegos)) ? juegos : [];

  const conteoJugados = {};
  const conteoFavoritos = {};

  usuarios.forEach(usuario=>{

    const jugados = leerJSON(localStorage.getItem("juegosJugados_" + usuario.nombre) || "[]") || [];
    jugados.forEach(id=>{
      conteoJugados[id] = (conteoJugados[id] || 0) + 1;
    });

    const favoritos = leerJSON(localStorage.getItem("favoritos_" + usuario.nombre) || "[]") || [];
    favoritos.forEach(id=>{
      conteoFavoritos[id] = (conteoFavoritos[id] || 0) + 1;
    });

  });

  function nombreDeJuego(id){
    const encontrado = listaJuegos.find(j => String(j.id) === String(id));
    return encontrado ? encontrado.nombre : ("Juego #" + id);
  }

  function topDe(conteo, cantidad){
    return Object.keys(conteo)
      .map(id => ({ id: id, nombre: nombreDeJuego(id), veces: conteo[id] }))
      .sort((a, b) => b.veces - a.veces)
      .slice(0, cantidad);
  }

  return {
    totalDisponibles: listaJuegos.length,
    masJugados: topDe(conteoJugados, 5),
    favoritos: topDe(conteoFavoritos, 5)
  };

}




// ==============================
// SECCIÓN: COMUNIDAD
// ==============================

function _estadisticasComunidad(usuarios){

  const comentarios = _contarItemsPorPrefijo("comentarios_");
  const mensajesChat = (leerJSON(localStorage.getItem("chatGeneral") || "[]") || []).length;

  let vinculosAmistad = 0;
  usuarios.forEach(usuario=>{
    const lista = leerJSON(localStorage.getItem("amigos_" + usuario.nombre) || "[]") || [];
    vinculosAmistad += lista.length;
  });

  // Cada amistad se guarda de los dos lados (ver perfil.js / usuario.js:
  // "amigos_A" incluye a B y "amigos_B" incluye a A), así que se cuenta
  // una sola vez.
  const amigos = Math.round(vinculosAmistad / 2);

  const reportes = leerJSON(localStorage.getItem("reportesComentarios") || "[]") || [];

  return {
    comentarios: comentarios,
    mensajesChat: mensajesChat,
    amigos: amigos,
    reportesTotales: reportes.length,
    reportesPendientes: reportes.filter(reporte => reporte.estado === "pendiente").length
  };

}




// ==============================
// SECCIÓN: PROGRESO
// ==============================

function _estadisticasProgreso(usuarios){

  const topNivel = usuarios.slice()
    .sort((a, b) => (b.nivel || 1) - (a.nivel || 1))
    .slice(0, 5)
    .map(usuario => ({ nombre: usuario.nombre, valor: usuario.nivel || 1 }));

  const topXP = usuarios.slice()
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 5)
    .map(usuario => ({ nombre: usuario.nombre, valor: usuario.xp || 0 }));

  // Logro más desbloqueado: se recorre "logros_<nombre>" de cada usuario.
  const conteoLogros = {};
  usuarios.forEach(usuario=>{
    const lista = leerJSON(localStorage.getItem("logros_" + usuario.nombre) || "[]") || [];
    lista.forEach(logro=>{
      conteoLogros[logro.id] = (conteoLogros[logro.id] || 0) + 1;
    });
  });

  const logrosTop = Object.keys(conteoLogros)
    .map(id => ({
      id: id,
      nombre: (typeof LOGROS !== "undefined" && LOGROS[id]) ? LOGROS[id].nombre : id,
      icono: (typeof LOGROS !== "undefined" && LOGROS[id]) ? LOGROS[id].icono : "🏅",
      veces: conteoLogros[id]
    }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 5);

  // Insignias oficiales otorgadas (administrador / moderador / colaborador).
  const conteoInsignias = {};
  usuarios.forEach(usuario=>{
    (usuario.insignias || []).forEach(id=>{
      conteoInsignias[id] = (conteoInsignias[id] || 0) + 1;
    });
  });

  const insigniasTop = Object.keys(conteoInsignias)
    .map(id => ({
      id: id,
      nombre: (typeof INSIGNIAS !== "undefined" && INSIGNIAS[id]) ? INSIGNIAS[id].nombre : id,
      icono: (typeof INSIGNIAS !== "undefined" && INSIGNIAS[id]) ? INSIGNIAS[id].icono : "🏅",
      veces: conteoInsignias[id]
    }))
    .sort((a, b) => b.veces - a.veces);

  return {
    topNivel: topNivel,
    topXP: topXP,
    logrosTop: logrosTop,
    insigniasTop: insigniasTop
  };

}




// ==============================
// FUNCIÓN PRINCIPAL
// ==============================

function obtenerEstadisticasAdmin(){

  const usuarios = obtenerUsuarios();

  return {
    usuarios: _estadisticasUsuarios(usuarios),
    juegos: _estadisticasJuegos(usuarios),
    comunidad: _estadisticasComunidad(usuarios),
    progreso: _estadisticasProgreso(usuarios)
  };

}
