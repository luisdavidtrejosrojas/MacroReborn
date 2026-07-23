// ==============================
// REGISTRO DE ACCIONES DE MODERACIÓN - MacroReborn
// ==============================
// Guarda un historial de las acciones importantes que hacen los
// administradores y moderadores desde el panel (admin.html): quién la
// hizo, con qué rol, cuándo, sobre qué usuario y por qué. Todo se
// guarda en localStorage bajo una única clave global
// ("historialModeracion"), con el mismo mecanismo que ya usa el resto
// del sitio (ver reportes.js, permisos.js).
//
// Preparado para la v1.0 con base de datos: "registrarAccionModeracion"
// es el único punto de entrada que usa el panel para escribir acá, así
// que alcanza con reemplazar el contenido de esta función (y de
// "obtenerHistorialModeracion") por llamadas a una API
// (POST /moderacion/historial, GET /moderacion/historial) sin tocar
// admin.js ni el HTML.


// ==============================
// CATÁLOGO DE ACCIONES
// ==============================
// Un único lugar donde queda documentado cada tipo de acción que se
// puede registrar, con su ícono y su etiqueta para mostrar en el panel.
// Si el día de mañana se suma un tipo de acción nuevo, alcanza con
// agregarlo acá.

const ACCIONES_MODERACION = {

  eliminar_comentario: { icono: "🗑️", etiqueta: "Eliminó un comentario" },
  eliminar_publicacion: { icono: "🗑️", etiqueta: "Eliminó una publicación" },
  aceptar_reporte: { icono: "✅", etiqueta: "Aceptó un reporte" },
  rechazar_reporte: { icono: "👁️", etiqueta: "Rechazó un reporte" },
  advertir_usuario: { icono: "⚠️", etiqueta: "Advirtió a un usuario" },
  suspender_usuario: { icono: "🚫", etiqueta: "Suspendió a un usuario" },
  reactivar_usuario: { icono: "✅", etiqueta: "Reactivó a un usuario" },
  cambiar_rol: { icono: "🔑", etiqueta: "Cambió un rol" },
  asignar_insignia: { icono: "🏅", etiqueta: "Asignó una insignia" },
  quitar_insignia: { icono: "🏅", etiqueta: "Quitó una insignia" },
  otra: { icono: "📌", etiqueta: "Otra acción de moderación" }

};




// ==============================
// LECTURA / ESCRITURA
// ==============================

function obtenerHistorialModeracion(){

  return leerJSON(
    localStorage.getItem("historialModeracion") || "[]"
  );

}

function guardarHistorialModeracion(lista){

  guardarJSON("historialModeracion", lista);

}




// ==============================
// REGISTRAR UNA ACCIÓN
// ==============================
// datos = {
//   accion: id dentro de ACCIONES_MODERACION (obligatorio),
//   usuarioAfectado: nombre del usuario afectado, o null,
//   motivo: texto libre (opcional, "No especificado" si se omite)
// }
// Quién hizo la acción y con qué rol se toman solos del usuario con
// sesión iniciada en este navegador: el panel ya exige tener permisos
// de moderación (ver js/admin.js) para poder llegar hasta acá.

function registrarAccionModeracion(datos){

  const activo = typeof obtenerUsuarioActivo === "function"
    ? obtenerUsuarioActivo()
    : leerJSON(localStorage.getItem("usuarioActivo") || "null");

  if(!activo || !datos || !datos.accion) return null;

  const definicion = ACCIONES_MODERACION[datos.accion] || ACCIONES_MODERACION.otra;

  const entrada = {

    id: Date.now() + Math.random().toString(16).slice(2),

    usuario: activo.nombre,

    rol: (typeof esAdministrador === "function" && esAdministrador(activo))
      ? "Administrador"
      : "Moderador",

    accion: datos.accion,

    accionEtiqueta: definicion.etiqueta,

    accionIcono: definicion.icono,

    usuarioAfectado: datos.usuarioAfectado || null,

    motivo: (datos.motivo && String(datos.motivo).trim())
      ? String(datos.motivo).trim()
      : "No especificado",

    fecha: new Date().toLocaleString("es-AR"),

    fechaTS: Date.now()

  };

  const lista = obtenerHistorialModeracion();
  lista.push(entrada);

  // Límite razonable mientras se guarda en localStorage, para no
  // llenar la cuota del navegador. Al pasar a base de datos (v1.0)
  // este límite deja de tener sentido y se puede quitar.
  const MAX_HISTORIAL = 1000;
  const recortada = lista.length > MAX_HISTORIAL
    ? lista.slice(lista.length - MAX_HISTORIAL)
    : lista;

  guardarHistorialModeracion(recortada);

  return entrada;

}




// ==============================
// CONSULTA CON FILTROS (para el panel)
// ==============================
// filtros = { rol, accion, texto }, todos opcionales.
// Devuelve siempre del más reciente al más viejo.

function obtenerHistorialFiltrado(filtros){

  filtros = filtros || {};

  let lista = obtenerHistorialModeracion().slice().reverse();

  if(filtros.rol){
    lista = lista.filter(entrada => entrada.rol === filtros.rol);
  }

  if(filtros.accion){
    lista = lista.filter(entrada => entrada.accion === filtros.accion);
  }

  if(filtros.texto && filtros.texto.trim()){
    const texto = filtros.texto.trim().toLowerCase();
    lista = lista.filter(entrada =>
      (entrada.usuario || "").toLowerCase().includes(texto) ||
      (entrada.usuarioAfectado || "").toLowerCase().includes(texto) ||
      (entrada.motivo || "").toLowerCase().includes(texto)
    );
  }

  return lista;

}




// ==============================
// ADVERTENCIAS DE UN USUARIO
// ==============================
// Se derivan del propio historial (no se guardan aparte) para no
// duplicar datos: una advertencia es, ni más ni menos, una entrada de
// historial con accion "advertir_usuario" sobre ese usuario.

function obtenerAdvertenciasDe(nombre){

  return obtenerHistorialModeracion()
    .filter(entrada => entrada.accion === "advertir_usuario" && entrada.usuarioAfectado === nombre);

}

function contarAdvertenciasDe(nombre){

  return obtenerAdvertenciasDe(nombre).length;

}
