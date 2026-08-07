// =========================
// MACROREBORN - ACTIVIDAD (PERFIL PROPIO) — Fase 2: Neon
// =========================
//
// Usa datosUsuario, ORDEN_CAPAS y CAPAS_IMG definidos en perfil.js
// (se carga después en perfil.html), y las funciones del motor de
// actividad (js/motor/actividad.js).


// ---------- AVATAR MINI (reutiliza el mismo criterio que perfil.js) ----------

function avatarMiniActividad(nombre){
  // El avatar viaja embebido en el usuario (users.avatar, Neon); se lee
  // de la caché en memoria de js/core.js, precargada por
  // renderActividadAmigos() antes de pintar la lista.
  const avatar = typeof obtenerAvatarCacheado === "function" ? obtenerAvatarCacheado(nombre) : null;

  if(!avatar){
    return `<img src="imagenes/avatar.png" style="width:44px;height:44px;border-radius:50%;object-fit:cover;" alt="" loading="lazy">`;
  }

  let capas = "";
  let rutasCapas = [];
  ORDEN_CAPAS.forEach(tipo=>{
    const valor = avatar[tipo];
    if(valor && valor !== "ninguno" && CAPAS_IMG[valor]){
      capas += `<img class="capa-comentario" src="${CAPAS_IMG[valor]}" alt="" loading="lazy">`;
      rutasCapas.push(CAPAS_IMG[valor]);
    }
  });

  return `<div class="avatar-mini avatar-compuesto" style="width:44px;height:44px;" ` +
    `data-capas="${rutasCapas.join("|")}" data-capa-class="capa-comentario">${capas}</div>`;
}


// ---------- ACTIVIDAD RECIENTE (propia) ----------

async function renderActividadReciente(){
  const contenedor = document.getElementById("listaActividadReciente");
  if(!contenedor) return;

  const lista = await obtenerActividades(datosUsuario.nombre);

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
// La lista de amigos vive en Neon desde la Fase 1
// (/api/social?action=friends), no en localStorage.

async function renderActividadAmigos(){
  const contenedor = document.getElementById("listaActividadAmigos");
  if(!contenedor) return;

  let misAmigos = [];
  try{
    const resp = await fetch("/api/social?action=friends&username=" + encodeURIComponent(datosUsuario.nombre));
    const datos = await resp.json();
    misAmigos = (datos && datos.success) ? datos.amigos.map(a => a.username) : [];
  }catch(error){
    console.warn("MacroReborn: no se pudo cargar la lista de amigos.", error);
  }

  if(misAmigos.length === 0){
    contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">No tienes amigos agregados.</p>`;
    return;
  }

  const actividadesAmigos = (await obtenerActividadesDe(misAmigos)).slice(0, MAX_ACTIVIDADES);

  if(actividadesAmigos.length === 0){
    contenedor.innerHTML = `<p style="color:#94a3b8;font-size:14px;">Tus amigos todavía no realizaron ninguna actividad.</p>`;
    return;
  }

  if(typeof cargarAvataresDeVarios === "function"){
    await cargarAvataresDeVarios(actividadesAmigos.map(a => a.nombreAmigo));
  }

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
