// ==============================
// SISTEMA DE REPORTES DE COMENTARIOS - MacroReborn
// ==============================
// Guarda los reportes en localStorage (clave global "reportesComentarios")
// para el panel de moderacion (admin.html). No elimina ni modifica el
// comentario original al reportarlo: solo registra que fue reportado.
// Eliminar el comentario / ignorar el reporte son acciones aparte, que
// solo puede disparar un administrador o moderador desde el panel.


// ==============================
// OBTENER REPORTES
// ==============================

function obtenerReportes(){

  return leerJSON(
    localStorage.getItem("reportesComentarios") || "[]"
  );

}




// ==============================
// GUARDAR REPORTES
// ==============================

function guardarReportes(lista){

  localStorage.setItem(
    "reportesComentarios",
    JSON.stringify(lista)
  );

}




// ==============================
// REPORTAR UN COMENTARIO
// ==============================
// perfilNombre: dueño del perfil donde esta el comentario (clave de
//               "comentarios_<perfilNombre>"), o "chatGeneral" para
//               mensajes del chat general (clave "chatGeneral").
// indice: posicion del comentario dentro de esa lista al momento de
//         reportarlo.
// comentario: el objeto {usuario, texto, ...} del comentario reportado.
//             Si trae "id" (como los mensajes del chat), se guarda
//             tambien para poder ubicarlo aunque la lista haya cambiado.
// motivo: motivo elegido por quien reporta (texto libre, opcional).

function reportarComentario(perfilNombre, indice, comentario, motivo){

  const lista = obtenerReportes();

  const quienReporta = typeof obtenerUsuarioActivo === "function"
    ? obtenerUsuarioActivo()
    : leerJSON(localStorage.getItem("usuarioActivo") || "null");

  lista.push({

    id: Date.now() + Math.random().toString(16).slice(2),

    perfil: perfilNombre,

    indice: indice,

    idOriginal: comentario && comentario.id !== undefined ? comentario.id : null,

    usuario: comentario ? comentario.usuario : "",

    texto: comentario ? comentario.texto : "",

    reportadoPor: quienReporta ? quienReporta.nombre : "Anónimo",

    motivo: (motivo && motivo.trim()) ? motivo.trim() : "No especificado",

    fecha: new Date().toLocaleDateString("es-AR"),

    estado: "pendiente"

  });

  guardarReportes(lista);

}




// ==============================
// REPORTES PENDIENTES (para el panel)
// ==============================

function obtenerReportesPendientes(){

  return obtenerReportes().filter(r => r.estado === "pendiente");

}




// ==============================
// IGNORAR UN REPORTE
// ==============================
// No borra el comentario ni el reporte: solo lo saca de la bandeja de
// pendientes, para dejar rastro de que ya fue revisado.

function ignorarReporte(idReporte){

  const lista = obtenerReportes();
  const idx = lista.findIndex(r => r.id === idReporte);

  if(idx === -1) return;

  lista[idx].estado = "ignorado";
  guardarReportes(lista);

}




// ==============================
// ELIMINAR EL COMENTARIO DE UN REPORTE
// ==============================
// Borra el comentario/mensaje original (si sigue existiendo tal cual se
// reporto) y marca el reporte como resuelto. Ademas re-acomoda el
// indice de otros reportes pendientes sobre el mismo perfil para que no
// queden apuntando a la posicion equivocada.

function eliminarComentarioDeReporte(idReporte){

  const reportes = obtenerReportes();
  const reporte = reportes.find(r => r.id === idReporte);

  if(!reporte) return false;

  let eliminado = false;

  if(reporte.perfil === "chatGeneral"){

    let mensajes = leerJSON(localStorage.getItem("chatGeneral") || "[]");

    if(reporte.idOriginal !== null){
      const antes = mensajes.length;
      mensajes = mensajes.filter(m => m.id !== reporte.idOriginal);
      eliminado = mensajes.length < antes;
    }else if(mensajes[reporte.indice]){
      mensajes.splice(reporte.indice, 1);
      eliminado = true;
    }

    localStorage.setItem("chatGeneral", JSON.stringify(mensajes));

  }else{

    const clave = "comentarios_" + reporte.perfil;
    let comentarios = leerJSON(localStorage.getItem(clave) || "[]");
    const actual = comentarios[reporte.indice];

    if(actual && actual.usuario === reporte.usuario && actual.texto === reporte.texto){
      comentarios.splice(reporte.indice, 1);
      localStorage.setItem(clave, JSON.stringify(comentarios));
      eliminado = true;

      // Reacomodar el indice de otros reportes pendientes del mismo perfil
      reportes.forEach(r=>{
        if(
          r.id !== reporte.id &&
          r.perfil === reporte.perfil &&
          r.estado === "pendiente" &&
          r.indice > reporte.indice
        ){
          r.indice -= 1;
        }
      });
    }

  }

  reporte.estado = eliminado ? "eliminado" : "eliminado_no_encontrado";
  guardarReportes(reportes);

  return eliminado;

}
