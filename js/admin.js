// ==============================
// PANEL DE ADMINISTRACIÓN - MacroReborn
// ==============================
// Usa el motor de permisos (js/motor/permisos.js), insignias
// (js/motor/insignias.js) y reportes (js/motor/reportes.js). Todo se
// guarda en localStorage junto con "usuariosMacro", como el resto del
// sitio, y queda preparado para reemplazar esas funciones por llamadas
// a una API el día que MacroReborn tenga base de datos.


// ==============================
// CONTROL DE ACCESO
// ==============================

const activoAdmin = typeof obtenerUsuarioActivo === "function"
  ? obtenerUsuarioActivo()
  : leerJSON(localStorage.getItem("usuarioActivo") || "null");

const tieneAccesoPanel = activoAdmin &&
  typeof tienePermiso === "function" &&
  tienePermiso(activoAdmin, "panelModeracion");

if(!tieneAccesoPanel){

  document.getElementById("accesoDenegado").style.display = "flex";
  document.getElementById("panelAdmin").style.display = "none";

}else{

  document.getElementById("panelAdmin").style.display = "block";

  const esAdmin = esAdministrador(activoAdmin);

  // ---------- ENCABEZADO SEGÚN ROL ----------

  document.getElementById("adminRolBadge").textContent = esAdmin
    ? "👑 Administrador"
    : "🛡️ Moderador";

  if(!esAdmin){
    document.getElementById("adminTitulo").textContent = "🛡️ Panel de Moderación";
    document.getElementById("adminSubtitulo").textContent =
      "Revisá reportes de la comunidad y suspendé usuarios cuando sea necesario.";
  }

  // ---------- PESTAÑAS ----------
  // El moderador solo tiene acceso a Reportes: las funciones
  // exclusivas del administrador (usuarios, insignias, estadísticas)
  // quedan directamente ocultas, no solo deshabilitadas.

  const botonesTab = document.querySelectorAll(".menu-perfil .tab");
  const contenidosTab = document.querySelectorAll(".contenido-tab");

  if(!esAdmin){
    document.getElementById("botonTabUsuarios").remove();
    document.getElementById("botonTabEstadisticas").remove();
    document.getElementById("botonTabRegistro").remove();
    document.getElementById("tabUsuarios").remove();
    document.getElementById("tabEstadisticas").remove();
    document.getElementById("tabRegistro").remove();

    document.getElementById("botonTabReportes").classList.add("activa");
    document.getElementById("tabReportes").classList.add("activo");
  }

  document.querySelectorAll(".menu-perfil .tab").forEach(boton=>{
    boton.addEventListener("click", ()=>{
      document.querySelectorAll(".menu-perfil .tab").forEach(b=>b.classList.remove("activa"));
      document.querySelectorAll(".contenido-tab").forEach(c=>c.classList.remove("activo"));
      boton.classList.add("activa");
      document.getElementById(boton.dataset.tab).classList.add("activo");
    });
  });


  // ==============================
  // ADVERTIR USUARIO (administrador y moderador)
  // ==============================
  // Manda una notificación directa al usuario (misma clave que usa
  // js/notificaciones.js: "notificaciones_<nombre>", sin depender de
  // que ese script esté cargado en esta página) y registra la acción
  // en el historial de moderación. Pide el motivo con "prompt", igual
  // que ya hace el sitio para reportar comentarios (js/perfil.js).

  function advertirUsuario(nombre){

    const mensaje = prompt(`¿Por qué advertís a ${nombre}? Este texto se le va a mostrar como notificación.`);
    if(mensaje === null) return false; // canceló el prompt

    const motivo = mensaje.trim() || "No especificado";

    const claveNotificaciones = "notificaciones_" + nombre;
    const notificaciones = leerJSON(localStorage.getItem(claveNotificaciones) || "[]") || [];

    notificaciones.unshift({
      id: Date.now(),
      titulo: "⚠️ Advertencia de la moderación",
      mensaje: motivo,
      fecha: new Date().toLocaleString("es-AR"),
      leida: false
    });

    guardarJSON(claveNotificaciones, notificaciones.slice(0, 100));

    registrarAccionModeracion({
      accion: "advertir_usuario",
      usuarioAfectado: nombre,
      motivo: motivo
    });

    alert(`Advertencia enviada a ${nombre}.`);
    return true;

  }


  // ==============================
  // USUARIOS (solo administrador)
  // ==============================
  // Se declaran acá afuera (aunque solo se completan si es admin) para
  // poder llamarlas de forma segura desde la pestaña de Reportes, que
  // sí ve tanto el administrador como el moderador.

  let renderUsuariosAdmin = null;
  let renderEstadisticas = null;
  let renderHistorialModeracion = null;

  if(esAdmin){

    function chipEstadoCuenta(usuario){
      return usuario.suspendido
        ? `<span class="chip-estado chip-suspendido">🚫 Suspendido</span>`
        : `<span class="chip-estado chip-activo">🟢 Activo</span>`;
    }

    // Roles (administrador / moderador) van marcados con data-rol="1"
    // para poder pedir confirmación aparte y registrarlos como
    // "cambiar_rol" en vez de "asignar/quitar_insignia" en el historial.
    function botonesInsigniaUsuario(usuario){
      return Object.values(INSIGNIAS).map(insignia=>{
        const tiene = (usuario.insignias || []).includes(insignia.id);
        const esRol = insignia.id === ROLES.ADMINISTRADOR || insignia.id === ROLES.MODERADOR;
        return `
          <button
            class="btn-insignia-toggle ${tiene ? "activa-insignia" : ""}"
            data-usuario="${usuario.nombre}"
            data-insignia="${insignia.id}"
            data-rol="${esRol ? "1" : "0"}"
            title="${tiene ? "Quitar" : "Asignar"} ${insignia.nombre}"
          >${insignia.icono} ${insignia.nombre}</button>
        `;
      }).join("");
    }

    renderUsuariosAdmin = function(filtro){

      const contenedor = document.getElementById("listaUsuariosAdmin");
      const contador = document.getElementById("contadorUsuariosAdmin");

      let usuarios = obtenerUsuarios();

      if(filtro && filtro.trim()){
        const texto = filtro.trim().toLowerCase();
        usuarios = usuarios.filter(u => u.nombre.toLowerCase().includes(texto));
      }

      contador.textContent = `${usuarios.length} usuario${usuarios.length === 1 ? "" : "s"}`;

      if(usuarios.length === 0){
        contenedor.innerHTML = `<div class="estado-vacio"><span class="icono-vacio">🕹️</span><p>No se encontraron usuarios.</p></div>`;
        return;
      }

      contenedor.innerHTML = usuarios.map(usuario=>{

        const ranking = typeof obtenerPosicionRanking === "function"
          ? obtenerPosicionRanking(usuario.nombre)
          : null;

        const esUnoMismo = usuario.nombre === activoAdmin.nombre;

        const advertencias = typeof contarAdvertenciasDe === "function"
          ? contarAdvertenciasDe(usuario.nombre)
          : 0;

        return `
          <div class="admin-tarjeta-usuario">

            <div class="admin-tarjeta-cabecera">
              <h3>${usuario.nombre}</h3>
              ${chipEstadoCuenta(usuario)}
            </div>

            ${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(usuario.nombre, false) : ""}

            <div class="admin-tarjeta-stats">
              <span>⭐ Nivel ${usuario.nivel || 1}</span>
              <span>⚡ ${usuario.xp || 0} XP</span>
              <span>🏆 ${ranking ? "#" + ranking : "Sin clasificar"}</span>
              ${advertencias > 0 ? `<span class="chip-advertencias">⚠️ ${advertencias} advertencia${advertencias === 1 ? "" : "s"}</span>` : ""}
            </div>

            <div class="admin-tarjeta-insignias-acciones">
              ${botonesInsigniaUsuario(usuario)}
            </div>

            <div class="admin-tarjeta-acciones">
              <button class="btn-advertir" data-usuario="${usuario.nombre}" ${esUnoMismo ? "disabled title=\"No podés advertirte a vos mismo\"" : ""}>⚠️ Advertir usuario</button>
              ${usuario.suspendido
                ? `<button class="btn-reactivar" data-usuario="${usuario.nombre}">✅ Reactivar usuario</button>`
                : `<button class="btn-suspender" data-usuario="${usuario.nombre}" ${esUnoMismo ? "disabled title=\"No podés suspender tu propia cuenta\"" : ""}>🚫 Suspender usuario</button>`
              }
            </div>

          </div>
        `;

      }).join("");

      // EVENTOS: insignias / roles
      contenedor.querySelectorAll(".btn-insignia-toggle").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const nombre = btn.dataset.usuario;
          const idInsignia = btn.dataset.insignia;
          const esRol = btn.dataset.rol === "1";
          const actuales = obtenerInsignias(nombre);
          const laTiene = actuales.includes(idInsignia);
          const nombreInsignia = INSIGNIAS[idInsignia] ? INSIGNIAS[idInsignia].nombre : idInsignia;

          // Cambiar un rol (administrador/moderador) es más sensible
          // que una insignia cosmética: se pide confirmación aparte.
          if(esRol){
            const pregunta = laTiene
              ? `¿Quitarle el rol de ${nombreInsignia} a ${nombre}?`
              : `¿Convertir a ${nombre} en ${nombreInsignia}?`;
            if(!confirm(pregunta)) return;
          }

          if(laTiene){
            quitarInsignia(nombre, idInsignia);
          }else{
            asignarInsignia(nombre, idInsignia);
          }

          registrarAccionModeracion({
            accion: esRol ? "cambiar_rol" : (laTiene ? "quitar_insignia" : "asignar_insignia"),
            usuarioAfectado: nombre,
            motivo: `${laTiene ? "Quitó" : "Asignó"} ${nombreInsignia}`
          });

          renderUsuariosAdmin(document.getElementById("buscadorUsuariosAdmin").value);
          renderEstadisticas();
          renderHistorialModeracion();
        });
      });

      // EVENTOS: advertir
      contenedor.querySelectorAll(".btn-advertir").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          if(btn.disabled) return;
          if(!advertirUsuario(btn.dataset.usuario)) return;
          renderUsuariosAdmin(document.getElementById("buscadorUsuariosAdmin").value);
          renderHistorialModeracion();
        });
      });

      // EVENTOS: suspender
      contenedor.querySelectorAll(".btn-suspender").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          if(btn.disabled) return;
          const nombre = btn.dataset.usuario;
          if(!confirm(`¿Suspender a ${nombre}? No podrá comentar, mandar mensajes ni usar la comunidad.`)) return;
          const motivo = prompt(`¿Por qué suspendés a ${nombre}? (opcional)`) || "";
          suspenderUsuario(nombre, motivo);
          registrarAccionModeracion({
            accion: "suspender_usuario",
            usuarioAfectado: nombre,
            motivo: motivo
          });
          renderUsuariosAdmin(document.getElementById("buscadorUsuariosAdmin").value);
          renderEstadisticas();
          renderHistorialModeracion();
        });
      });

      // EVENTOS: reactivar
      contenedor.querySelectorAll(".btn-reactivar").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const nombre = btn.dataset.usuario;
          reactivarUsuario(nombre);
          registrarAccionModeracion({
            accion: "reactivar_usuario",
            usuarioAfectado: nombre
          });
          renderUsuariosAdmin(document.getElementById("buscadorUsuariosAdmin").value);
          renderEstadisticas();
          renderHistorialModeracion();
        });
      });

    }

    document.getElementById("buscadorUsuariosAdmin")?.addEventListener("input", (e)=>{
      renderUsuariosAdmin(e.target.value);
    });

    renderUsuariosAdmin("");


    // ==============================
    // ESTADÍSTICAS (solo administrador)
    // ==============================
    // Los números se calculan en js/motor/panelEstadisticas.js
    // (obtenerEstadisticasAdmin); acá solo se pintan en el DOM.

    function _filaTop(item, unidad){
      return `<li><span class="admin-top-nombre">${item.nombre}</span><span class="admin-top-valor">${item.valor !== undefined ? item.valor : item.veces}${unidad || ""}</span></li>`;
    }

    function _pintarLista(idLista, items, vacio, unidad){
      const contenedor = document.getElementById(idLista);
      if(!contenedor) return;
      contenedor.innerHTML = items.length
        ? items.map(item => _filaTop(item, unidad)).join("")
        : `<li class="admin-top-vacio">${vacio}</li>`;
    }

    renderEstadisticas = function(){

      const datos = typeof obtenerEstadisticasAdmin === "function"
        ? obtenerEstadisticasAdmin()
        : null;

      if(!datos) return;

      const usuarios = obtenerUsuarios();

      const admins = usuarios.filter(u => (u.insignias || []).includes("administrador")).length;
      const moderadores = usuarios.filter(u => (u.insignias || []).includes("moderador")).length;
      const colaboradores = usuarios.filter(u => (u.insignias || []).includes("colaborador")).length;
      const suspendidos = usuarios.filter(u => u.suspendido).length;

      // ---------- ROLES / MODERACIÓN ----------
      document.getElementById("statUsuarios").textContent = usuarios.length;
      document.getElementById("statSuspendidos").textContent = suspendidos;
      document.getElementById("statAdmins").textContent = admins;
      document.getElementById("statModeradores").textContent = moderadores;
      document.getElementById("statColaboradores").textContent = colaboradores;
      document.getElementById("statReportesPendientes").textContent = datos.comunidad.reportesPendientes;

      // ---------- 👥 USUARIOS ----------
      document.getElementById("statUsuariosTotal").textContent = datos.usuarios.total;
      document.getElementById("statUsuariosActivos").textContent = datos.usuarios.activos7dias;
      document.getElementById("statUsuariosNuevos").textContent = datos.usuarios.nuevos30dias;
      document.getElementById("statUsuariosConectados").textContent =
        datos.usuarios.conectadosAhora !== null ? datos.usuarios.conectadosAhora : "—";

      // ---------- 🎮 JUEGOS ----------
      document.getElementById("statJuegosTotal").textContent = datos.juegos.totalDisponibles;
      _pintarLista("listaJuegosMasJugados", datos.juegos.masJugados, "Todavía no se jugó ningún juego.", " veces");
      _pintarLista("listaJuegosFavoritos", datos.juegos.favoritos, "Todavía no hay favoritos.", " veces");

      // ---------- 💬 COMUNIDAD ----------
      document.getElementById("statComentarios").textContent = datos.comunidad.comentarios;
      document.getElementById("statMensajesChat").textContent = datos.comunidad.mensajesChat;
      document.getElementById("statAmigos").textContent = datos.comunidad.amigos;
      document.getElementById("statReportesTotales").textContent = datos.comunidad.reportesTotales;

      // ---------- 🏆 PROGRESO ----------
      _pintarLista("listaTopNivel", datos.progreso.topNivel.map(u => ({ nombre: u.nombre, valor: "Nivel " + u.valor })), "Sin datos todavía.");
      _pintarLista("listaTopXP", datos.progreso.topXP.map(u => ({ nombre: u.nombre, valor: u.valor + " XP" })), "Sin datos todavía.");
      _pintarLista("listaTopLogros", datos.progreso.logrosTop.map(l => ({ nombre: `${l.icono} ${l.nombre}`, veces: l.veces })), "Todavía no se desbloqueó ningún logro.", " veces");
      _pintarLista("listaTopInsignias", datos.progreso.insigniasTop.map(i => ({ nombre: `${i.icono} ${i.nombre}`, veces: i.veces })), "Todavía no se otorgó ninguna insignia.", " veces");

    }

    renderEstadisticas();


    // ==============================
    // REGISTRO DE ACCIONES DE MODERADORES (solo administrador)
    // ==============================
    // Usa js/motor/historial.js (registrarAccionModeracion ya se llama
    // desde cada acción del panel). Acá solo se arman los filtros y se
    // pinta la lista.

    const selectAccionHistorial = document.getElementById("filtroAccionHistorial");

    if(selectAccionHistorial && typeof ACCIONES_MODERACION === "object"){
      Object.keys(ACCIONES_MODERACION).forEach(id=>{
        const opcion = document.createElement("option");
        opcion.value = id;
        opcion.textContent = `${ACCIONES_MODERACION[id].icono} ${ACCIONES_MODERACION[id].etiqueta}`;
        selectAccionHistorial.appendChild(opcion);
      });
    }

    renderHistorialModeracion = function(){

      const contenedor = document.getElementById("listaHistorialModeracion");
      const contador = document.getElementById("contadorHistorial");
      if(!contenedor) return;

      const filtros = {
        rol: document.getElementById("filtroRolHistorial")?.value || "",
        accion: document.getElementById("filtroAccionHistorial")?.value || "",
        texto: document.getElementById("buscadorHistorial")?.value || ""
      };

      const entradas = typeof obtenerHistorialFiltrado === "function"
        ? obtenerHistorialFiltrado(filtros)
        : [];

      if(contador){
        contador.textContent = `${entradas.length} acción${entradas.length === 1 ? "" : "es"}`;
      }

      if(entradas.length === 0){
        contenedor.innerHTML = `<div class="estado-vacio"><span class="icono-vacio">🗒️</span><p>No hay acciones registradas todavía.</p></div>`;
        return;
      }

      contenedor.innerHTML = entradas.map(entrada => `
        <div class="admin-tarjeta-historial">

          <div class="admin-historial-cabecera">
            <span class="admin-historial-accion">${entrada.accionIcono} ${entrada.accionEtiqueta}</span>
            <span class="chip-rol ${entrada.rol === "Administrador" ? "chip-rol-admin" : "chip-rol-moderador"}">
              ${entrada.rol === "Administrador" ? "👑" : "🛡️"} ${entrada.rol}
            </span>
          </div>

          <div class="admin-historial-datos">
            <span><b>Hecho por:</b> ${entrada.usuario}</span>
            ${entrada.usuarioAfectado ? `<span><b>Usuario afectado:</b> ${entrada.usuarioAfectado}</span>` : ""}
            <span><b>Motivo:</b> ${entrada.motivo}</span>
            <span><b>Fecha:</b> ${entrada.fecha}</span>
          </div>

        </div>
      `).join("");

    }

    document.getElementById("buscadorHistorial")?.addEventListener("input", renderHistorialModeracion);
    document.getElementById("filtroRolHistorial")?.addEventListener("change", renderHistorialModeracion);
    document.getElementById("filtroAccionHistorial")?.addEventListener("change", renderHistorialModeracion);

    renderHistorialModeracion();

  }


  // ==============================
  // REPORTES (administrador y moderador)
  // ==============================

  function renderReportesAdmin(){

    const contenedor = document.getElementById("listaReportesAdmin");
    const pendientes = obtenerReportesPendientes()
      .slice()
      .reverse(); // más recientes primero

    if(pendientes.length === 0){
      contenedor.innerHTML = `<div class="estado-vacio"><span class="icono-vacio">✅</span><p>No hay reportes pendientes por ahora.</p></div>`;
      return;
    }

    contenedor.innerHTML = pendientes.map(reporte=>{

      const autor = buscarUsuarioPorNombre(reporte.usuario);
      const autorSuspendido = autor && autor.suspendido;
      const origen = reporte.perfil === "chatGeneral"
        ? "💬 Chat general"
        : `👤 Perfil de ${reporte.perfil}`;

      return `
        <div class="admin-tarjeta-reporte">

          <div class="admin-reporte-origen">${origen} · ${reporte.fecha}</div>

          <p class="admin-reporte-texto">"${reporte.texto}"</p>

          <div class="admin-reporte-datos">
            <span><b>Autor:</b> ${reporte.usuario || "Desconocido"}</span>
            <span><b>Reportado por:</b> ${reporte.reportadoPor}</span>
            <span><b>Motivo:</b> ${reporte.motivo}</span>
          </div>

          <div class="admin-tarjeta-acciones">
            <button class="btn-ignorar-reporte" data-id="${reporte.id}">👁️ Ignorar</button>
            <button class="btn-eliminar-reporte" data-id="${reporte.id}" data-origen="${reporte.perfil === "chatGeneral" ? "comentario" : "publicacion"}">🗑️ Eliminar ${reporte.perfil === "chatGeneral" ? "comentario" : "publicación"}</button>
            ${autor
              ? `
                <button class="btn-advertir" data-usuario="${reporte.usuario}">⚠️ Advertir autor</button>
                ${autorSuspendido
                  ? `<button class="btn-reactivar" data-usuario="${reporte.usuario}">✅ Reactivar autor</button>`
                  : `<button class="btn-suspender" data-usuario="${reporte.usuario}">🚫 Suspender autor</button>`}
              `
              : ""
            }
          </div>

        </div>
      `;

    }).join("");

    contenedor.querySelectorAll(".btn-ignorar-reporte").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const reporte = obtenerReportes().find(r => r.id === btn.dataset.id);
        ignorarReporte(btn.dataset.id);
        registrarAccionModeracion({
          accion: "rechazar_reporte",
          usuarioAfectado: reporte ? reporte.usuario : null,
          motivo: reporte ? `Reporte ignorado (motivo original: ${reporte.motivo})` : ""
        });
        renderReportesAdmin();
        if(esAdmin){
          renderEstadisticas();
          renderHistorialModeracion();
        }
      });
    });

    contenedor.querySelectorAll(".btn-eliminar-reporte").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const esPublicacion = btn.dataset.origen === "publicacion";
        if(!confirm(`¿Eliminar ${esPublicacion ? "esta publicación" : "este comentario"}? Esta acción no se puede deshacer.`)) return;
        const reporte = obtenerReportes().find(r => r.id === btn.dataset.id);
        eliminarComentarioDeReporte(btn.dataset.id);
        registrarAccionModeracion({
          accion: "aceptar_reporte",
          usuarioAfectado: reporte ? reporte.usuario : null,
          motivo: reporte ? `Se eliminó ${esPublicacion ? "la publicación" : "el comentario"} (motivo del reporte: ${reporte.motivo})` : ""
        });
        renderReportesAdmin();
        if(esAdmin){
          renderEstadisticas();
          renderHistorialModeracion();
        }
      });
    });

    contenedor.querySelectorAll(".btn-advertir").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if(!advertirUsuario(btn.dataset.usuario)) return;
        renderReportesAdmin();
        if(esAdmin){
          renderUsuariosAdmin(document.getElementById("buscadorUsuariosAdmin").value);
          renderHistorialModeracion();
        }
      });
    });

    contenedor.querySelectorAll(".btn-suspender").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const nombre = btn.dataset.usuario;
        if(!confirm(`¿Suspender a ${nombre}? No podrá comentar, mandar mensajes ni usar la comunidad.`)) return;
        const motivo = prompt(`¿Por qué suspendés a ${nombre}? (opcional)`) || "";
        suspenderUsuario(nombre, motivo);
        registrarAccionModeracion({
          accion: "suspender_usuario",
          usuarioAfectado: nombre,
          motivo: motivo
        });
        renderReportesAdmin();
        if(esAdmin){
          renderUsuariosAdmin(document.getElementById("buscadorUsuariosAdmin").value);
          renderEstadisticas();
          renderHistorialModeracion();
        }
      });
    });

    contenedor.querySelectorAll(".btn-reactivar").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const nombre = btn.dataset.usuario;
        reactivarUsuario(nombre);
        registrarAccionModeracion({
          accion: "reactivar_usuario",
          usuarioAfectado: nombre
        });
        renderReportesAdmin();
        if(esAdmin){
          renderUsuariosAdmin(document.getElementById("buscadorUsuariosAdmin").value);
          renderEstadisticas();
          renderHistorialModeracion();
        }
      });
    });

  }

  renderReportesAdmin();

}
