// =========================
// MACROREBORN - ACTIVIDAD (PERFIL PROPIO)
// =========================
//
// Usa datosUsuario, ORDEN_CAPAS y CAPAS_IMG definidos en perfil.js
// (se carga después en perfil.html), y las funciones del motor de
// actividad (js/motor/actividad.js).


// ---------- AVATAR MINI (reutiliza el mismo criterio que perfil.js) ----------

function avatarMiniActividad(nombre){
  const avatar = leerJSON(localStorage.getItem("avatar_" + nombre) || "null");

  if(!avatar){
    return `<img src="imagenes/avatar.png" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" alt="" loading="lazy">`;
  }

  let capas = "";
  ORDEN_CAPAS.forEach(tipo=>{
    const valor = avatar[tipo];
    if(valor && valor !== "ninguno" && CAPAS_IMG[valor]){
      capas += `<img class="capa-comentario" src="${CAPAS_IMG[valor]}" alt="" loading="lazy">`;
    }
  });

  return `<div class="avatar-mini" style="width:44px;height:44px;">${capas}</div>`;
}


// ---------- ACTIVIDAD RECIENTE (propia) ----------

function renderActividadReciente(){
  const contenedor = document.getElementById("listaActividadReciente");
  if(!contenedor) return;

  const lista = obtenerActividades(datosUsuario.nombre);

  if(lista.length === 0){
    contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">Todavía no tenés actividad registrada.</p>`;
    return;
  }

  contenedor.innerHTML = lista.map(a => `
    <div class="actividad">
      <div>${a.texto}</div>
      <div class="actividad-fecha">${a.fecha} · ${a.hora}</div>
    </div>
  `).join("");
}


// ---------- ACTIVIDAD DE AMIGOS ----------

function renderActividadAmigos(){
  const contenedor = document.getElementById("listaActividadAmigos");
  if(!contenedor) return;

  const misAmigos = leerJSON(localStorage.getItem("amigos_" + datosUsuario.nombre) || "[]");

  if(misAmigos.length === 0){
    contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">No tienes amigos agregados.</p>`;
    return;
  }

  // Juntamos la actividad de todos los amigos, con quién la hizo.
  let actividadesAmigos = [];

  misAmigos.forEach(nombreAmigo=>{
    const actividades = obtenerActividades(nombreAmigo);
    actividades.forEach(a=>{
      actividadesAmigos.push({ ...a, nombreAmigo });
    });
  });

  if(actividadesAmigos.length === 0){
    contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">Tus amigos todavía no realizaron ninguna actividad.</p>`;
    return;
  }

  actividadesAmigos.sort((a,b) => b.timestamp - a.timestamp);
  actividadesAmigos = actividadesAmigos.slice(0, MAX_ACTIVIDADES);

  contenedor.innerHTML = actividadesAmigos.map(a => `
    <div class="actividad" style="display:flex;align-items:center;gap:14px;">
      ${avatarMiniActividad(a.nombreAmigo)}
      <div style="flex:1;min-width:0;">
        <div>${textoActividadAmigo(a.nombreAmigo, a.tipo, a.detalle)}</div>
        <div class="actividad-fecha">${a.fecha} · ${a.hora}</div>
      </div>
    </div>
  `).join("");
}


// ---------- INICIO ----------

renderActividadReciente();
renderActividadAmigos();
