// ==============================
// SISTEMA DE INSIGNIAS OFICIALES - MacroReborn
// ==============================
// Insignias oficiales, asignadas manualmente (desde admin.html, o a mano
// desde la consola). Viven como un campo mas dentro de cada usuario
// ( usuario.insignias -> array de ids, ej: ["administrador"] ), guardado
// junto con el resto de "usuariosMacro" en localStorage. Asi, mismo
// mecanismo que ya usa todo el sitio y listo para el dia que esto pase
// a una base de datos real (el usuario ya viaja completo, insignias
// incluidas).


// LISTA DE INSIGNIAS DISPONIBLES

const INSIGNIAS = {

  administrador:{
    id:"administrador",
    icono:"👑",
    nombre:"Administrador"
  },

  moderador:{
    id:"moderador",
    icono:"🛡️",
    nombre:"Moderador"
  },

  colaborador:{
    id:"colaborador",
    icono:"❤️",
    nombre:"Colaborador"
  }

};




// ==============================
// LECTURA / ESCRITURA DE USUARIOS
// ==============================

function _insigniasLeerUsuarios(){

  return leerJSON(
    localStorage.getItem("usuariosMacro") || "[]"
  );

}

function _insigniasGuardarUsuarios(lista){

  localStorage.setItem(
    "usuariosMacro",
    JSON.stringify(lista)
  );

}




// ==============================
// OBTENER INSIGNIAS DE UN USUARIO
// ==============================

function obtenerInsignias(nombre){

  const usuarios = _insigniasLeerUsuarios();
  const usuario = usuarios.find(u => u.nombre === nombre);

  if(usuario && Array.isArray(usuario.insignias)){
    return usuario.insignias;
  }

  // MIGRACION: versiones anteriores guardaban las insignias en una
  // clave aparte ("insignias_<nombre>"). Si existe, se migra al campo
  // "insignias" dentro del usuario y se limpia la clave vieja.
  const legado = leerJSON(
    localStorage.getItem("insignias_" + nombre) || "null"
  );

  if(Array.isArray(legado) && legado.length && usuario){
    guardarInsignias(nombre, legado);
    localStorage.removeItem("insignias_" + nombre);
    return legado;
  }

  return [];

}




// ==============================
// GUARDAR INSIGNIAS DE UN USUARIO
// ==============================

function guardarInsignias(nombre, lista){

  const usuarios = _insigniasLeerUsuarios();
  const idx = usuarios.findIndex(u => u.nombre === nombre);

  if(idx === -1) return;

  usuarios[idx].insignias = lista;
  _insigniasGuardarUsuarios(usuarios);

  // Si es el usuario logueado en este navegador, sincronizar la sesion
  // activa para que el cambio se vea sin tener que volver a loguearse.
  const activo = leerJSON(localStorage.getItem("usuarioActivo") || "null");
  if(activo && activo.nombre === nombre){
    activo.insignias = lista;
    localStorage.setItem("usuarioActivo", JSON.stringify(activo));
  }

}




// ==============================
// ASIGNAR / QUITAR INSIGNIA
// ==============================
// Pensadas para usarse desde admin.html (solo administradores) o a
// mano desde la consola.

function asignarInsignia(nombre,id){

  if(!INSIGNIAS[id]){
    console.warn("Insignia inexistente:",id);
    return;
  }

  const lista = obtenerInsignias(nombre);

  if(!lista.includes(id)){
    lista.push(id);
    guardarInsignias(nombre,lista);
  }

}

function quitarInsignia(nombre,id){

  const lista = obtenerInsignias(nombre)
    .filter(actual => actual !== id);

  guardarInsignias(nombre,lista);

}




// ==============================
// HTML DE LAS INSIGNIAS
// ==============================
// insigniasItemsHTML(): version completa (icono + nombre), para el perfil.
// insigniasCompactasHTML(): solo el icono, para comentarios y listados
// donde el espacio es reducido.
// Si el usuario no tiene ninguna insignia, devuelven "" y no se muestra
// absolutamente nada.

function insigniasItemsHTML(nombre){

  return obtenerInsignias(nombre)
    .filter(id => INSIGNIAS[id])
    .map(id => `<span class="insignia-oficial" title="${INSIGNIAS[id].nombre}">${INSIGNIAS[id].icono} ${INSIGNIAS[id].nombre}</span>`)
    .join("");

}

function insigniasCompactasHTML(nombre){

  return obtenerInsignias(nombre)
    .filter(id => INSIGNIAS[id])
    .map(id => `<span class="insignia-oficial compacta" title="${INSIGNIAS[id].nombre}">${INSIGNIAS[id].icono}</span>`)
    .join("");

}

// Bloque listo para insertar en un template (incluye el contenedor).
// Devuelve "" si no hay insignias, para no dejar espacios vacios.

function insigniasBloqueHTML(nombre,compacta){

  const items = compacta
    ? insigniasCompactasHTML(nombre)
    : insigniasItemsHTML(nombre);

  if(!items) return "";

  return `<div class="insignias-usuario${compacta ? " compactas" : ""}">${items}</div>`;

}

// Pinta las insignias dentro de un contenedor ya existente en el DOM
// (usado en perfil.html y usuario.html, debajo del nombre). Si no tiene
// insignias, oculta el contenedor para que no quede ningun espacio.

function renderInsigniasEnContenedor(idContenedor,nombre,compacta){

  const contenedor = document.getElementById(idContenedor);

  if(!contenedor) return;

  const items = compacta
    ? insigniasCompactasHTML(nombre)
    : insigniasItemsHTML(nombre);

  if(!items){
    contenedor.innerHTML = "";
    contenedor.style.display = "none";
    return;
  }

  contenedor.innerHTML = items;
  contenedor.style.display = "";
  contenedor.classList.toggle("compactas", !!compacta);

}
