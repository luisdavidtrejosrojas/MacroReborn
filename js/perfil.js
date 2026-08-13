// ==============================
// PERFIL - MacroReborn
// ==============================


// ---------- PESTAÑAS ----------

const botones = document.querySelectorAll(".tab");
const contenidos = document.querySelectorAll(".contenido-tab");

botones.forEach(boton=>{
  boton.addEventListener("click",()=>{
    botones.forEach(b=>b.classList.remove("activa"));
    contenidos.forEach(c=>c.classList.remove("activo"));
    boton.classList.add("activa");
    document.getElementById(boton.dataset.tab).classList.add("activo");
  });
});


// ---------- PERFIL ----------

// USUARIO LOGUEADO

let datosUsuario = leerJSON(
  localStorage.getItem("usuarioActivo") || "null"
);


if(!datosUsuario){

  window.location.href = "login.html";
  throw new Error("Sin sesión");

}


// Adaptar datos de Neon al formato antiguo del perfil

datosUsuario.nombre = datosUsuario.username;
datosUsuario.nivel = datosUsuario.level;
datosUsuario.fechaRegistro = datosUsuario.created_at;
datosUsuario.logros = datosUsuario.logros || 0;
datosUsuario.biografia = datosUsuario.bio || "Todavía no escribió una biografía.";

// FIX: acá se pisaba datosUsuario.ultimaConexion con un campo que
// nunca existía ("ultimaConexion"), así que siempre terminaba en
// "Nunca". El dato real de Neon viaja como "last_login" (llega en
// datosUsuario porque /api/auth?action=login y /api/auth?action=register
// lo incluyen en la respuesta y js/login.js lo guarda tal cual en
// usuarioActivo). Se guarda aparte para no perderlo.
datosUsuario.ultimaConexion = datosUsuario.last_login || null;

// GUARDIA DE SESIÓN
// Sin esto, cualquiera podía entrar a perfil.html sin haber iniciado
// sesión: perfil.js rellenaba un usuario "falso" (nombre:"Usuario")
// solo para poder pintar la página, pero como el resto del archivo
// sigue usando esa misma variable "datosUsuario" para guardar (bio,
// avatar, comentarios...), terminaba escribiendo esos datos falsos
// en "usuarioActivo" de localStorage la primera vez que se guardaba
// algo — lo que además dejaba al navbar creyendo que había una sesión
// iniciada. Si no hay sesión real, mandamos directo a login.html y
// no seguimos ejecutando el resto del script.


// PERFIL

// RANKING: se reutiliza obtenerPosicionRanking() (definida en js/ranking.js)
// para que la posición mostrada acá sea siempre la misma que en ranking.html.
// Es asincrónica (ahora sale de /api/users), así que se pinta con un
// placeholder y se actualiza cuando resuelve.
const posicionRankingPromesa = typeof obtenerPosicionRanking === "function"
  ? obtenerPosicionRanking(datosUsuario.nombre)
  : Promise.resolve(null);

const usuario={

  nombre: datosUsuario.nombre,

  estado:"🟢 En línea",

  nivel: Number(datosUsuario.nivel) || 1,

  biografia: datosUsuario.biografia || "Todavía no escribió una biografía.",

  xp: Number(datosUsuario.xp) || 0,

  ranking: "Calculando…",

  logros: datosUsuario.logros || 0,

  fechaRegistro: datosUsuario.fechaRegistro || "Desconocida",

  ultimaConexion: datosUsuario.ultimaConexion || "Nunca",

};

document.getElementById("nombreUsuario").textContent=usuario.nombre;

// ---------- INSIGNIAS OFICIALES ----------
// Se muestran debajo del nombre. Son manuales (no se otorgan por
// logros): si el usuario no tiene ninguna, el contenedor queda oculto.
if(typeof renderInsigniasEnContenedor === "function"){
  renderInsigniasEnContenedor("insigniasPerfil", usuario.nombre);
}

const bienvenidaPerfil = document.getElementById("bienvenidaPerfil");
if(bienvenidaPerfil){
  bienvenidaPerfil.textContent = "Bienvenido al perfil de " + usuario.nombre + ".";
}

document.querySelector(".estado").textContent=usuario.estado;
document.querySelector(".nivel").textContent="⭐ Nivel "+usuario.nivel;
document.getElementById("biografia").textContent=usuario.biografia;
document.getElementById("xp").textContent="⚡ "+usuario.xp+" XP";

// ---------- BARRA DE XP ----------

const barraXP = document.getElementById("progresoXP");
const textoXP = document.getElementById("textoXP");

if(barraXP && textoXP){

  let necesario;

  if(usuario.nivel === 1){
    necesario = 50;
  }
  else if(usuario.nivel === 2){
    necesario = 100;
  }
  else{
    necesario = 100 + ((usuario.nivel - 2) * 200);
  }

  let porcentaje = (usuario.xp / necesario) * 100;

  barraXP.style.width = porcentaje + "%";
  textoXP.textContent = usuario.xp + " / " + necesario + " XP";

}

document.getElementById("ranking").textContent=usuario.ranking;

posicionRankingPromesa.then(posicionRanking=>{
  document.getElementById("ranking").textContent = posicionRanking ? "#" + posicionRanking : "Sin clasificar";
});

// ---------- PUNTOS DE LOGROS ----------

function actualizarPuntosLogrosUI(){
  const puntosLogrosEl = document.getElementById("puntosLogros");
  if(puntosLogrosEl){
    puntosLogrosEl.textContent = "🏅 " + calcularPuntosLogros(datosUsuario.nombre) + " puntos de logros";
  }
}

// Los logros ahora salen de /api/achievements: se precargan una sola
// vez acá y de ahí en más calcularPuntosLogros()/obtenerLogros() los
// leen sincrónicamente desde la caché en memoria (js/motor/logros.js).
const logrosListos = typeof cargarLogros === "function"
  ? cargarLogros(datosUsuario.nombre)
  : Promise.resolve();

logrosListos.then(actualizarPuntosLogrosUI);

// FIX: "Registrado" mostraba el timestamp ISO crudo de Neon
// (ej. "2026-08-05T02:48:25.503Z") en vez de una fecha legible.
document.getElementById("fechaRegistro").textContent =
  typeof fechaLegible === "function"
    ? fechaLegible(usuario.fechaRegistro, "Desconocida")
    : usuario.fechaRegistro;

// FIX: usaba un campo ("ultimaConexionTS") que nunca se llenaba en
// ningún lado del sitio, así que siempre caía al valor por defecto
// "Nunca" sin importar si la persona acababa de iniciar sesión. Ahora
// usa el last_login real (ver más arriba, donde se guarda en
// datosUsuario.ultimaConexion).
//
// Queda en una función aparte (en vez de código suelto) para poder
// volver a pintarla sola cuando llega un latido en vivo por Pusher
// (por ejemplo, si iniciaste sesión en otro dispositivo), o cada
// cierto tiempo, sin recargar la página.
function pintarUltimaConexion(){
  document.getElementById("ultimaConexion").textContent =
    typeof tiempoRelativo === "function"
      ? tiempoRelativo(datosUsuario.ultimaConexion, "Nunca")
      : usuario.ultimaConexion;
}

pintarUltimaConexion();


// ==============================
// SISTEMA AVATAR
// ==============================

const CAPAS_IMG={
  // Selector de modelo
  tora:"imagenes/tora.png",
  cereza:"imagenes/cereza.png",
  fiora:"imagenes/fiora.png",
  max:"imagenes/max.png",
  fenglei:"imagenes/fenglei.png",
  fengchao: "imagenes/fengchao.png",

  // ---- Guardarropa de TORA ----
  tora_fondo1:"imagenes/tora/fondo1.png",
  tora_fondo2:"imagenes/tora/fondo2.png",
  tora_fondo3:"imagenes/tora/fondo3.png",
  tora_fondo4:"imagenes/tora/fondo4.png",
  tora_fondo5:"imagenes/tora/fondo5.png",
  tora_fondo6:"imagenes/tora/fondo6.png",
  tora_fondo7:"imagenes/tora/fondo7.png",
  tora_fondo8:"imagenes/tora/fondo8.png",
  tora_fondo9:"imagenes/tora/fondo9.png",
  tora_fondo10:"imagenes/tora/fondo10.png",
  tora_fondo11:"imagenes/tora/fondo11.png",
  tora_fondo12:"imagenes/tora/fondo12.png",
  tora_fondo13:"imagenes/tora/fondo13.png",
  tora_fondo14:"imagenes/tora/fondo14.png",
  tora_fondo15:"imagenes/tora/fondo15.png",
  tora_fondo16:"imagenes/tora/fondo16.png",
  tora_fondo17:"imagenes/tora/fondo17.png",
  tora_fondo18:"imagenes/tora/fondo18.png",
  tora_fondo19:"imagenes/tora/fondo19.png",
  tora_fondo20:"imagenes/tora/fondo20.png",
  tora_fondo21:"imagenes/tora/fondo21.png",
  tora_fondo22:"imagenes/tora/fondo22.png",
  tora_fondo23:"imagenes/tora/fondo23.png",
  tora_piel1:"imagenes/tora/piel1.png",
  tora_piel2:"imagenes/tora/piel2.png",
  tora_piel3:"imagenes/tora/piel3.png",
  tora_ojos1:"imagenes/tora/ojos1.png",
  tora_ojos2:"imagenes/tora/ojos2.png",
  tora_ojos3:"imagenes/tora/ojos3.png",
  tora_ojos4:"imagenes/tora/ojos4.png",
  tora_ojos5:"imagenes/tora/ojos5.png",
  tora_ojos6:"imagenes/tora/ojos6.png",
  tora_boca1:"imagenes/tora/boca1.png",
  tora_boca2:"imagenes/tora/boca2.png",
  tora_boca3:"imagenes/tora/boca3.png",
  tora_boca4:"imagenes/tora/boca4.png",
  tora_boca5:"imagenes/tora/boca5.png",
  tora_boca6:"imagenes/tora/boca6.png",
  tora_boca7:"imagenes/tora/boca7.png",
  tora_pantalon1:"imagenes/tora/pantalon1.png",
  tora_pantalon2:"imagenes/tora/pantalon2.png",
  tora_pantalon3:"imagenes/tora/pantalon3.png",
  tora_pantalon4:"imagenes/tora/pantalon4.png",
  tora_botas1:"imagenes/tora/botas1.png",
  tora_botas2:"imagenes/tora/botas2.png",
  tora_botas3:"imagenes/tora/botas3.png",
  tora_botas4:"imagenes/tora/botas4.png",
  tora_botas5:"imagenes/tora/botas5.png",
  tora_botas6:"imagenes/tora/botas6.png",
  tora_pelo1:"imagenes/tora/pelo1.png",
  tora_pelo2:"imagenes/tora/pelo2.png",
  tora_pelo3:"imagenes/tora/pelo3.png",
  tora_pelo4:"imagenes/tora/pelo4.png",
  tora_remera1:"imagenes/tora/remera1.png",
  tora_remera2:"imagenes/tora/remera2.png",
  tora_remera3:"imagenes/tora/remera3.png",
  tora_remera4:"imagenes/tora/remera4.png",
  tora_guantes1:"imagenes/tora/guantes1.png",
  tora_guantes2:"imagenes/tora/guantes2.png",
  tora_guantes3:"imagenes/tora/guantes3.png",
  tora_guantes4:"imagenes/tora/guantes4.png",
  tora_espalda1:"imagenes/tora/espalda1.png",
  tora_espalda2:"imagenes/tora/espalda2.png",
  tora_accesorio1:"imagenes/tora/accesorio1.png",
  tora_accesorio2:"imagenes/tora/accesorio2.png",
  tora_accesorio3:"imagenes/tora/accesorio3.png",
  tora_accesorio4:"imagenes/tora/accesorio4.png",
  tora_accesorio5:"imagenes/tora/accesorio5.png",
  tora_accesorio6:"imagenes/tora/accesorio6.png",
  tora_accesorio7:"imagenes/tora/accesorio7.png",
  tora_accesorio8:"imagenes/tora/accesorio8.png",
  tora_accesorio9:"imagenes/tora/accesorio9.png",
  tora_accesorio10:"imagenes/tora/accesorio10.png",
  tora_cara1:"imagenes/tora/cara1.png",
  tora_cara2:"imagenes/tora/cara2.png",
  tora_cara3:"imagenes/tora/cara3.png",
  tora_cara4:"imagenes/tora/cara4.png",
  tora_cara5:"imagenes/tora/cara5.png",
  tora_cara6:"imagenes/tora/cara6.png",
  tora_cara7:"imagenes/tora/cara7.png",
  tora_cara8:"imagenes/tora/cara8.png",
  tora_mascota1:"imagenes/tora/mascota1.png",
  tora_mascota2:"imagenes/tora/mascota2.png",
  tora_mascota3:"imagenes/tora/mascota3.png",
  tora_mascota4:"imagenes/tora/mascota4.png",
  tora_mascota5:"imagenes/tora/mascota5.png",
  tora_mascota6:"imagenes/tora/mascota6.png",
  tora_mascota7:"imagenes/tora/mascota7.png",
  tora_mascota8:"imagenes/tora/mascota8.png",
  tora_mascota9:"imagenes/tora/mascota9.png",
  tora_borde1:"imagenes/tora/borde1.png",
  tora_borde2:"imagenes/tora/borde2.png",
  tora_borde3:"imagenes/tora/borde3.png",
  tora_borde4:"imagenes/tora/borde4.png",
  tora_borde5:"imagenes/tora/borde5.png",
  tora_borde6:"imagenes/tora/borde6.png",
  tora_borde7:"imagenes/tora/borde7.png",
  tora_borde8:"imagenes/tora/borde8.png",
  tora_borde9:"imagenes/tora/borde9.png",
  tora_borde10:"imagenes/tora/borde10.png",
  tora_borde11:"imagenes/tora/borde11.png",
  tora_borde12:"imagenes/tora/borde12.png",
  tora_borde13:"imagenes/tora/borde13.png",
  tora_borde14:"imagenes/tora/borde14.png",
  tora_borde15:"imagenes/tora/borde15.png",
  tora_borde16:"imagenes/tora/borde16.png",

  // ---- Guardarropa de CEREZA ----
  cereza_fondo1:"imagenes/cereza/fondo1.png",
  cereza_fondo2:"imagenes/cereza/fondo2.png",
  cereza_fondo3:"imagenes/cereza/fondo3.png",
  cereza_fondo4:"imagenes/cereza/fondo4.png",
  cereza_fondo5:"imagenes/cereza/fondo5.png",
  cereza_fondo6:"imagenes/cereza/fondo6.png",
  cereza_fondo7:"imagenes/cereza/fondo7.png",
  cereza_fondo8:"imagenes/cereza/fondo8.png",
  cereza_fondo9:"imagenes/cereza/fondo9.png",
  cereza_fondo10:"imagenes/cereza/fondo10.png",
  cereza_fondo11:"imagenes/cereza/fondo11.png",
  cereza_fondo12:"imagenes/cereza/fondo12.png",
  cereza_fondo13:"imagenes/cereza/fondo13.png",
  cereza_fondo14:"imagenes/cereza/fondo14.png",
  cereza_fondo15:"imagenes/cereza/fondo15.png",
  cereza_fondo16:"imagenes/cereza/fondo16.png",
  cereza_fondo17:"imagenes/cereza/fondo17.png",
  cereza_fondo18:"imagenes/cereza/fondo18.png",
  cereza_fondo19:"imagenes/cereza/fondo19.png",
  cereza_fondo20:"imagenes/cereza/fondo20.png",
  cereza_fondo21:"imagenes/cereza/fondo21.png",
  cereza_fondo22:"imagenes/cereza/fondo22.png",
  cereza_fondo23:"imagenes/cereza/fondo23.png",
  cereza_piel1:"imagenes/cereza/piel1.png",
  cereza_piel2:"imagenes/cereza/piel2.png",
  cereza_piel3:"imagenes/cereza/piel3.png",
  cereza_piel4:"imagenes/cereza/piel4.png",
  cereza_piel5:"imagenes/cereza/piel5.png",
  cereza_ojos1:"imagenes/cereza/ojos1.png",
  cereza_ojos2:"imagenes/cereza/ojos2.png",
  cereza_ojos3:"imagenes/cereza/ojos3.png",
  cereza_ojos4:"imagenes/cereza/ojos4.png",
  cereza_ojos5:"imagenes/cereza/ojos5.png",
  cereza_ojos6:"imagenes/cereza/ojos6.png",
  cereza_ojos7:"imagenes/cereza/ojos7.png",
  cereza_ojos8:"imagenes/cereza/ojos8.png",
  cereza_ojos9:"imagenes/cereza/ojos9.png",
  cereza_ojos10:"imagenes/cereza/ojos10.png",
  cereza_ojos11:"imagenes/cereza/ojos11.png",
  cereza_ojos12:"imagenes/cereza/ojos12.png",
  cereza_boca1:"imagenes/cereza/boca1.png",
  cereza_boca2:"imagenes/cereza/boca2.png",
  cereza_pantalon1:"imagenes/cereza/pantalon1.png",
  cereza_pantalon2:"imagenes/cereza/pantalon2.png",
  cereza_botas1:"imagenes/cereza/botas1.png",
  cereza_botas2:"imagenes/cereza/botas2.png",
  cereza_pelo1:"imagenes/cereza/pelo1.png",
  cereza_pelo2:"imagenes/cereza/pelo2.png",
  cereza_pelo3:"imagenes/cereza/pelo3.png",
  cereza_pelo4:"imagenes/cereza/pelo4.png",
  cereza_remera1:"imagenes/cereza/remera1.png",
  cereza_remera2:"imagenes/cereza/remera2.png",
  cereza_guantes1:"imagenes/cereza/guantes1.png",
  cereza_guantes2:"imagenes/cereza/guantes2.png",
  cereza_accesorio1:"imagenes/cereza/accesorio1.png",
  cereza_accesorio2:"imagenes/cereza/accesorio2.png",
  cereza_espalda1:"imagenes/cereza/espalda1.png",
  cereza_espalda2:"imagenes/cereza/espalda2.png",
  cereza_cara1:"imagenes/cereza/cara1.png",
  cereza_cara2:"imagenes/cereza/cara2.png",
  cereza_cara3:"imagenes/cereza/cara3.png",
  cereza_cara4:"imagenes/cereza/cara4.png",
  cereza_mascota1:"imagenes/cereza/mascota1.png",
  cereza_mascota2:"imagenes/cereza/mascota2.png",
  cereza_mascota5:"imagenes/cereza/mascota5.png",
  cereza_mascota6:"imagenes/cereza/mascota6.png",
  cereza_mascota7:"imagenes/cereza/mascota7.png",
  cereza_mascota8:"imagenes/cereza/mascota8.png",
  cereza_mascota9:"imagenes/cereza/mascota9.png",
  cereza_borde1:"imagenes/cereza/borde1.png",
  cereza_borde2:"imagenes/cereza/borde2.png",
  cereza_borde3:"imagenes/cereza/borde3.png",
  cereza_borde4:"imagenes/cereza/borde4.png",
  cereza_borde5:"imagenes/cereza/borde5.png",
  cereza_borde6:"imagenes/cereza/borde6.png",
  cereza_borde7:"imagenes/cereza/borde7.png",
  cereza_borde8:"imagenes/cereza/borde8.png",
  cereza_borde9:"imagenes/cereza/borde9.png",
  cereza_borde10:"imagenes/cereza/borde10.png",
  cereza_borde11:"imagenes/cereza/borde11.png",
  cereza_borde12:"imagenes/cereza/borde12.png",
  cereza_borde13:"imagenes/cereza/borde13.png",
  cereza_borde14:"imagenes/cereza/borde14.png",
  cereza_borde15:"imagenes/cereza/borde15.png",
  cereza_borde16:"imagenes/cereza/borde16.png",

  // ---- Guardarropa de FENGCHAO ----
  fengchao_piel1:"imagenes/fengchao/piel1.png",
  fengchao_piel2:"imagenes/fengchao/piel2.png",

};

let editorCapas={
  fondo:"ninguno",
  espalda:"ninguno",
  modelo:"tora",
  piel:"ninguno",
  ojos:"ninguno",
  boca:"ninguno",
  botas:"ninguno",
  pantalon:"ninguno",
  remera:"ninguno",
  guantes:"ninguno",
  accesorio:"ninguno",
  cara:"ninguno",
  pelo:"ninguno",
  mascota:"ninguno",
  borde:"ninguno"
};

const ORDEN_CAPAS=[
  "fondo","espalda","modelo","piel","ojos","boca",
  "botas","pantalon","remera","guantes","accesorio",
  "cara","pelo","mascota","borde"
];


// ---------- AVATAR (Neon: users.avatar) ----------
// El avatar viaja embebido en datosUsuario (viene de /api/login o ya
// estaba en la sesión guardada), así que leerlo es sincrónico. Guardarlo
// sí pega a la API, además de actualizar la caché local al toque para
// que el resto de la página (preview, avatar principal) lo vea ya.

function cargarAvatar(){
  return normalizarAvatar(datosUsuario.avatar);
}

async function guardarAvatar(avatar){

  datosUsuario.avatar = avatar;
  localStorage.setItem("usuarioActivo", JSON.stringify(datosUsuario));

  try{

    await fetch("/api/users?action=update-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: datosUsuario.nombre, avatar: avatar })
    });

  }catch(error){

    console.warn("MacroReborn: no se pudo guardar el avatar en el servidor.", error);

  }

}


// ---------- PREVIEW EDITOR ----------

function actualizarPreview(){
  const preview=document.getElementById("previewAvatar");
  if(!preview)return;
  preview.innerHTML="";
  ORDEN_CAPAS.forEach(tipo=>{
    let valor=editorCapas[tipo];
    if(valor!="ninguno" && CAPAS_IMG[valor]){
      let img=document.createElement("img");
      img.src=CAPAS_IMG[valor];
      img.className="capa";
      preview.appendChild(img);
    }
  });
}


// ---------- AVATAR PRINCIPAL ----------

function actualizarAvatarPrincipal(){
  const avatar=cargarAvatar();
  const avatarWrapper=document.querySelector(".avatar");
  if(!avatarWrapper)return;

  if(!avatar){
    avatarWrapper.innerHTML='<img id="avatarPrincipal" src="imagenes/avatar.png" alt="Tu avatar en MacroReborn">';
    return;
  }

  let contenedor=document.createElement("div");
  contenedor.style.position="relative";
  contenedor.style.width="100%";
  contenedor.style.height="100%";
  contenedor.className="avatar-compuesto";

  const estiloCapa = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;";
  let rutasCapas = [];

  ORDEN_CAPAS.forEach(tipo=>{
    let valor=avatar[tipo];
    if(valor && valor!="ninguno" && CAPAS_IMG[valor]){
      let capa=document.createElement("img");
      capa.src=CAPAS_IMG[valor];
      capa.setAttribute("style", estiloCapa);
      contenedor.appendChild(capa);
      rutasCapas.push(CAPAS_IMG[valor]);
    }
  });

  contenedor.setAttribute("data-capas", rutasCapas.join("|"));
  contenedor.setAttribute("data-capa-style", estiloCapa);

  avatarWrapper.innerHTML="";
  avatarWrapper.appendChild(contenedor);
}


// ---------- FILTRAR OPCIONES SEGÚN EL MODELO ELEGIDO ----------
// Cada personaje tiene su propio guardarropa. Esta función oculta las
// opciones que no son del modelo actual y muestra un aviso si una
// categoría todavía no tiene nada cargado para ese personaje.

function filtrarOpcionesPorModelo(grupo){
  const modeloActual = editorCapas.modelo;
  let visibles = 0;

  grupo.querySelectorAll(".opcion-item").forEach(item=>{
    const modeloItem = item.dataset.modelo;
    const visible = !modeloItem || modeloItem === modeloActual;
    item.style.display = visible ? "" : "none";
    if(visible) visibles++;
  });

  let aviso = grupo.querySelector(".sin-opciones");
  if(visibles === 0){
    if(!aviso){
      aviso = document.createElement("p");
      aviso.className = "sin-opciones";
      aviso.style.opacity = "0.7";
      aviso.style.padding = "10px 0";
      aviso.textContent = "Todavía no hay opciones cargadas para este personaje.";
      grupo.querySelector(".fila-opciones")?.appendChild(aviso);
    }
  } else if(aviso){
    aviso.remove();
  }
}

function filtrarTodosLosGrupos(){
  gruposOpcion.forEach(g=>filtrarOpcionesPorModelo(g));
}


// ---------- SINCRONIZAR SELECCIONADAS EN EDITOR ----------
// Marca visualmente las opciones según el estado actual de editorCapas

function sincronizarSeleccionadas(){
  document.querySelectorAll(".opcion-item").forEach(opcion=>{
    const capa = opcion.dataset.capa;
    const valor = opcion.dataset.valor;
    if(editorCapas[capa] === valor){
      opcion.classList.add("seleccionada");
    } else {
      opcion.classList.remove("seleccionada");
    }
  });
}


// ---------- BARRA DE CATEGORÍAS ----------

const catBotones = document.querySelectorAll(".cat-btn");
const gruposOpcion = document.querySelectorAll(".grupo-opcion");

catBotones.forEach(btn=>{
  btn.addEventListener("click",()=>{
    const cat = btn.dataset.cat;

    // Activar botón seleccionado
    catBotones.forEach(b=>b.classList.remove("activa-cat"));
    btn.classList.add("activa-cat");

    // Mostrar solo el grupo correspondiente
    gruposOpcion.forEach(g=>{
      g.style.display = (g.dataset.grupo === cat) ? "" : "none";
    });

    const grupoActivo = [...gruposOpcion].find(g=>g.dataset.grupo===cat);
    if(grupoActivo) filtrarOpcionesPorModelo(grupoActivo);
  });
});


// ---------- ABRIR / CERRAR EDITOR ----------

document.getElementById("botonCrearAvatar")?.addEventListener("click",()=>{
  const guardado=cargarAvatar();
  if(guardado) editorCapas={...guardado};

  document.getElementById("editorAvatar").style.display="block";

  // Mostrar primera categoría (modelo) al abrir
  catBotones.forEach(b=>b.classList.remove("activa-cat"));
  catBotones[0]?.classList.add("activa-cat");
  gruposOpcion.forEach(g=>{
    g.style.display = (g.dataset.grupo === "modelo") ? "" : "none";
  });

  sincronizarSeleccionadas();
  filtrarTodosLosGrupos();
  actualizarPreview();
});

document.getElementById("cancelarEditor")?.addEventListener("click",()=>{
  document.getElementById("editorAvatar").style.display="none";
});


// ---------- GUARDAR AVATAR ----------

document.getElementById("guardarAvatar")?.addEventListener("click", async ()=>{
  await guardarAvatar({...editorCapas});
  document.getElementById("editorAvatar").style.display="none";
  actualizarAvatarPrincipal();

  // ==============================
  // LOGRO CREAR AVATAR
  // ==============================

  if(typeof desbloquearLogro === "function"){
    desbloquearLogro(datosUsuario.nombre, "primerAvatar");
    actualizarPuntosLogrosUI();
    renderLogros();
  }
});


// ---------- AVATAR ALEATORIO ----------
// Elige un modelo al azar (solo entre los que ya tienen guardarropa
// cargado en CAPAS_IMG) y, para cada categoría, una opción al azar
// entre las disponibles para ese modelo.

function modelosConGuardarropa(){
  const claves = Object.keys(CAPAS_IMG);
  const modelosBase = claves.filter(k => !k.includes("_"));
  return modelosBase.filter(m => claves.some(k => k.startsWith(m + "_")));
}

document.getElementById("avatarAleatorio")?.addEventListener("click", ()=>{

  const modelos = modelosConGuardarropa();
  if(modelos.length === 0) return;

  const modeloElegido = modelos[Math.floor(Math.random() * modelos.length)];

  ORDEN_CAPAS.forEach(tipo=>{
    editorCapas[tipo] = "ninguno";
  });
  editorCapas.modelo = modeloElegido;

  ORDEN_CAPAS.forEach(tipo=>{
    if(tipo === "modelo") return;

    const opciones = Object.keys(CAPAS_IMG)
      .filter(k => k.startsWith(modeloElegido + "_" + tipo));

    if(opciones.length > 0){
      editorCapas[tipo] = opciones[Math.floor(Math.random() * opciones.length)];
    }
  });

  filtrarTodosLosGrupos();
  sincronizarSeleccionadas();
  actualizarPreview();
});


// ---------- OPCIONES EDITOR (con toggle para deseleccionar) ----------

document.querySelectorAll(".opcion-item").forEach(opcion=>{
  opcion.onclick=()=>{
    const capa = opcion.dataset.capa;
    const valor = opcion.dataset.valor;

    if(capa === "modelo"){
      // Cambiar de personaje: el modelo siempre queda seleccionado,
      // y como el guardarropa de un personaje no le sirve a otro,
      // reseteamos esas categorías.
      editorCapas.modelo = valor;
      ORDEN_CAPAS.forEach(tipo=>{
        if(tipo !== "modelo") editorCapas[tipo] = "ninguno";
      });

      opcion.parentElement.querySelectorAll(".opcion-item")
        .forEach(x=>x.classList.remove("seleccionada"));
      opcion.classList.add("seleccionada");

      filtrarTodosLosGrupos();
      actualizarPreview();
      return;
    }

    // Toggle: si ya está equipada, desequipar; si no, equipar
    if(editorCapas[capa] === valor){
      editorCapas[capa] = "ninguno";
      opcion.classList.remove("seleccionada");
    } else {
      editorCapas[capa] = valor;
      // Quitar selección previa de la misma categoría
      opcion.parentElement.querySelectorAll(".opcion-item")
        .forEach(x=>x.classList.remove("seleccionada"));
      opcion.classList.add("seleccionada");
    }

    actualizarPreview();
  };
});


// ---------- INICIO ----------

actualizarAvatarPrincipal();



// ==============================
// EDITAR DESCRIPCIÓN
// ==============================

const botonEditar = document.querySelector(".datos button");

if(botonEditar)
  botonEditar.textContent = "✏️ Editar descripción";


botonEditar?.addEventListener("click", ()=>{

  const bio = document.getElementById("biografia");
  const descripcionInicio = document.getElementById("descripcionInicio");

  if(document.getElementById("inputBio")) return;


  const actual = bio.textContent.trim();


  const textarea = document.createElement("textarea");

  textarea.id = "inputBio";

  textarea.value =
    actual === "Todavía no escribió una biografía."
      ? ""
      : actual;


  textarea.style.cssText =
    "width:100%;padding:8px;border-radius:8px;border:2px solid #f0b429;background:#0f172a;color:white;font-size:14px;resize:vertical;min-height:70px;margin-top:8px;";


  textarea.placeholder = "Escribí tu descripción...";


  const btnGuardar = document.createElement("button");

  btnGuardar.textContent = "💾 Guardar";

  btnGuardar.style.cssText =
    "margin-top:8px;background:#f0b429;border:none;padding:8px 18px;border-radius:8px;font-weight:bold;cursor:pointer;";


  const btnCancelar = document.createElement("button");

  btnCancelar.textContent = "Cancelar";

  btnCancelar.style.cssText =
    "margin-top:8px;margin-left:8px;background:#555;color:white;border:none;padding:8px 14px;border-radius:8px;";


  bio.style.display = "none";


  bio.parentElement.insertBefore(
    textarea,
    bio.nextSibling
  );

  bio.parentElement.insertBefore(
    btnGuardar,
    textarea.nextSibling
  );

  bio.parentElement.insertBefore(
    btnCancelar,
    btnGuardar.nextSibling
  );


  textarea.focus();



// GUARDAR BIO EN NEON

btnGuardar.addEventListener("click", ()=>{


  const nuevo =
    textarea.value.trim() ||
    "Todavía no escribió una biografía.";


  bio.textContent = nuevo;


  if(descripcionInicio)
    descripcionInicio.textContent = nuevo;



  fetch("/api/users?action=update-bio", {

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({

      username: datosUsuario.nombre,

      bio: nuevo

    })

  })


  .then(res=>res.json())


  .then(data=>{

    console.log(
      "Bio actualizada:",
      data
    );


    datosUsuario.bio = nuevo;


    localStorage.setItem(
      "usuarioActivo",
      JSON.stringify(datosUsuario)
    );


  })


  .catch(error=>{

    console.error(
      "Error actualizando bio:",
      error
    );

  });



  bio.style.display = "";

  textarea.remove();

  btnGuardar.remove();

  btnCancelar.remove();


});


  // CANCELAR

  btnCancelar.addEventListener("click", ()=>{


    bio.style.display = "";

    textarea.remove();

    btnGuardar.remove();

    btnCancelar.remove();


  });


});



// CARGAR BIO DESDE DATOS DEL USUARIO

if(datosUsuario.bio){

  document.getElementById("biografia").textContent =
    datosUsuario.bio;


  const desc =
    document.getElementById("descripcionInicio");


  if(desc)
    desc.textContent = datosUsuario.bio;

}

// ==============================
// AMIGOS (pestaña del perfil)
// ==============================

const MAX_AMIGOS_FAVORITOS = 10;

async function renderAmigosPerfil(){
  const contenedor = document.getElementById("listaAmigosPerfil");
  if(!contenedor) return;

  let misAmigos = [];
  let misFavoritos = [];

  try{
    const respuesta = await fetch("/api/social?action=friends&username=" + encodeURIComponent(datosUsuario.nombre));
    const datos = await respuesta.json();
    if(datos && datos.success) misAmigos = datos.amigos;
  }catch(error){
    console.warn("MacroReborn: no se pudo cargar la lista de amigos.", error);
  }

  try{
    const respuestaFav = await fetch("/api/social?action=favoriteFriends&username=" + encodeURIComponent(datosUsuario.nombre));
    const datosFav = await respuestaFav.json();
    if(datosFav && datosFav.success) misFavoritos = datosFav.favoritos;
  }catch(error){
    console.warn("MacroReborn: no se pudo cargar los amigos favoritos.", error);
  }

  if(misAmigos.length === 0){
    contenedor.innerHTML = `<p>Todavía no agregaste amigos. <a href="comunidad.html" style="color:#f0b429;">Buscá jugadores en la comunidad</a>.</p>`;
    return;
  }

  // Amigos favoritos primero, el resto después (mismo orden alfabético
  // que ya trae /api/social?action=friends dentro de cada grupo).
  const amigosOrdenados = [
    ...misAmigos.filter(a => misFavoritos.includes(a.username)),
    ...misAmigos.filter(a => !misFavoritos.includes(a.username))
  ];

  contenedor.innerHTML = `<div class="grid-usuarios">` + amigosOrdenados.map(amigo => {
    const nombreAmigo = amigo.username;
    const avatar = normalizarAvatar(amigo.avatar);
    const esFavorito = misFavoritos.includes(nombreAmigo);

    let capas = "";
    let rutasCapas = [];

    if(avatar){
      ORDEN_CAPAS.forEach(tipo=>{
        const valor = avatar[tipo];
        if(valor && valor!=="ninguno" && CAPAS_IMG[valor]){
          capas += `<img class="capa-tarjeta" src="${CAPAS_IMG[valor]}" alt="" loading="lazy">`;
          rutasCapas.push(CAPAS_IMG[valor]);
        }
      });
    }

    const avatarHTML = capas || `<img src="imagenes/avatar.png" class="avatar-default" alt="" loading="lazy">`;

    return `
      <div class="tarjeta-usuario">

        <button class="btn-favorito-amigo ${esFavorito ? "es-favorito" : ""}" data-nombre="${nombreAmigo}" title="${esFavorito ? "Quitar de favoritos" : "Marcar como favorito"}">★</button>

        <div class="avatar-tarjeta avatar-compuesto" data-capas="${rutasCapas.join("|")}" data-capa-class="capa-tarjeta">
          ${avatarHTML}
        </div>

        <h3 class="usuario-nombre">${nombreAmigo}</h3>

        <div class="usuario-stats">
          <div class="stat-item">
            <span class="stat-valor">${amigo.level || 1}</span>
            <span class="stat-label">⭐ Nivel</span>
          </div>
        </div>

        <div class="tarjeta-amigo-acciones">
          <a href="usuario.html?usuario=${encodeURIComponent(nombreAmigo)}" class="btn-ver-perfil">👤 Ver perfil</a>
          <button class="btn-quitar-amigo-perfil" data-nombre="${nombreAmigo}" title="Eliminar amigo">🗑️</button>
        </div>

      </div>
    `;
  }).join("") + `</div>`;

  contenedor.querySelectorAll(".btn-quitar-amigo-perfil").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const objetivo = btn.dataset.nombre;
      if(!confirm(`¿Eliminar a ${objetivo} de tus amigos?`)) return;

      btn.disabled = true;

      try{
        await fetch("/api/social?action=friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "remove", username: datosUsuario.nombre, friendUsername: objetivo })
        });
      }catch(error){
        console.warn("MacroReborn: no se pudo eliminar al amigo.", error);
      }

      renderAmigosPerfil();
    });
  });

  contenedor.querySelectorAll(".btn-favorito-amigo").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const objetivo = btn.dataset.nombre;
      const esFavoritoActual = btn.classList.contains("es-favorito");

      if(!esFavoritoActual && misFavoritos.length >= MAX_AMIGOS_FAVORITOS){
        alert(`Ya tenés el máximo de ${MAX_AMIGOS_FAVORITOS} amigos favoritos. Quitá uno antes de agregar otro.`);
        return;
      }

      btn.disabled = true;

      try{
        const respuesta = await fetch("/api/social?action=favoriteFriends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: esFavoritoActual ? "remove" : "add",
            username: datosUsuario.nombre,
            friendUsername: objetivo
          })
        });
        const datosResp = await respuesta.json();
        if(!datosResp || !datosResp.success){
          alert((datosResp && datosResp.error) || "No se pudo actualizar el amigo favorito.");
        }
      }catch(error){
        console.warn("MacroReborn: no se pudo actualizar el amigo favorito.", error);
      }

      renderAmigosPerfil();
    });
  });
}

renderAmigosPerfil();


// ==============================
// COMENTARIOS
// ==============================

// Comentarios viven en Neon (tabla profile_comments,
// /api/content?action=comments). Se guarda una copia en memoria
// (_comentariosCache) para que funciones que antes leían localStorage
// de forma sincrónica (como renderUltimosComentariosInicio) puedan
// seguir haciéndolo sin volverse async.

let _comentariosCache = [];

async function cargarComentarios(){
  try{
    const resp = await fetch("/api/content?action=comments&username=" + encodeURIComponent(datosUsuario.nombre));
    const datos = await resp.json();
    _comentariosCache = (datos && datos.success) ? datos.comentarios : [];
  }catch(error){
    console.warn("MacroReborn: no se pudieron cargar los comentarios.", error);
    _comentariosCache = [];
  }
  return _comentariosCache;
}

// AVATAR DEL USUARIO EN COMENTARIOS

function obtenerAvatarComentario(nombre){
  // El avatar viaja embebido en el usuario (users.avatar, Neon); se lee
  // de la caché en memoria de js/core.js, precargada por
  // renderComentarios() antes de pintar la lista.
  const avatar = typeof obtenerAvatarCacheado === "function" ? obtenerAvatarCacheado(nombre) : null;

  if(!avatar){
    return `<img class="avatar-comentario" src="imagenes/avatar.png" alt="" loading="lazy">`;
  }

  let capas = "";
  let rutasCapas = [];
  ORDEN_CAPAS.forEach(tipo=>{
    let valor = avatar[tipo];
    if(valor && valor !== "ninguno" && CAPAS_IMG[valor]){
      capas += `<img class="capa-comentario" src="${CAPAS_IMG[valor]}" alt="" loading="lazy">`;
      rutasCapas.push(CAPAS_IMG[valor]);
    }
  });

  return `<div class="avatar-mini avatar-compuesto" data-capas="${rutasCapas.join("|")}" ` +
    `data-capa-class="capa-comentario">${capas}</div>`;
}

// ÚLTIMOS COMENTARIOS (pestaña Inicio)
// Reutiliza los mismos datos (cargarComentarios) y el mismo avatar
// (obtenerAvatarComentario) que la pestaña Comentarios, mostrando
// solo los más recientes.

function renderUltimosComentariosInicio(){
  const contenedor = document.getElementById("ultimosComentariosInicio");
  if(!contenedor) return;

  const lista = _comentariosCache;

  if(lista.length === 0){
    contenedor.innerHTML = `<p>Todavía no hay comentarios.</p>`;
    return;
  }

  // La lista ya viene del más nuevo al más viejo (ORDER BY id DESC en
  // /api/content?action=comments), así que los "últimos" son
  // simplemente los primeros 3, sin necesidad de invertir nada.
  const ultimos = lista.slice(0, 3);

  contenedor.innerHTML = ultimos.map((c)=>{
    return `
    <div class="comentario">
      <div class="usuario-comentario">
        ${obtenerAvatarComentario(c.usuario)}
        <b>${c.usuario}</b>
      </div>
      ${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(c.usuario, true) : ""}
      <p>${c.texto}</p>
      ${typeof botonLikeHTML === "function" ? botonLikeHTML("comment", c.id, datosUsuario.nombre) : ""}
    </div>
  `;
  }).join("");
}

// CONFIRMACIÓN ANTES DE ELIMINAR
// Modal simple y reutilizable: muestra el mensaje, y solo ejecuta
// "onConfirmar" si el usuario elige "Eliminar". Si elige "Cancelar",
// hace clic afuera o presiona Escape, no pasa absolutamente nada.

function pedirConfirmacion(mensaje, onConfirmar, textoBoton){
  document.querySelectorAll(".confirmacion-overlay").forEach(el => el.remove());

  const overlay = document.createElement("div");
  overlay.className = "confirmacion-overlay";
  overlay.innerHTML = `
    <div class="confirmacion-caja">
      <p class="confirmacion-mensaje">${mensaje}</p>
      <div class="confirmacion-botones">
        <button type="button" class="confirmacion-cancelar">Cancelar</button>
        <button type="button" class="confirmacion-confirmar">${textoBoton || "🗑️ Eliminar"}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function cerrar(){
    overlay.remove();
    document.removeEventListener("keydown", porEscape);
  }

  function porEscape(e){
    if(e.key === "Escape") cerrar();
  }

  overlay.querySelector(".confirmacion-cancelar").addEventListener("click", cerrar);

  overlay.querySelector(".confirmacion-confirmar").addEventListener("click", ()=>{
    cerrar();
    onConfirmar();
  });

  overlay.addEventListener("click", (e)=>{
    if(e.target === overlay) cerrar();
  });

  document.addEventListener("keydown", porEscape);
}

// MOSTRAR COMENTARIOS

async function renderComentarios(){
  const lista = await cargarComentarios();

  if(typeof cargarAvataresDeVarios === "function"){
    await cargarAvataresDeVarios(lista.map(c => c.usuario));
  }

  const contenedor = document.getElementById("listaComentarios");

  // Mantenemos sincronizado el resumen de Inicio cada vez que se
  // actualiza la lista de comentarios (alta o baja).
  renderUltimosComentariosInicio();

  if(!contenedor) return;

  // Usuario logueado en ESTE navegador: el botón "Eliminar" solo debe
  // aparecer en los comentarios que escribió esta persona, sin
  // importar en qué perfil los haya dejado (el suyo o el de otro).
  const usuarioActivoComentarios = leerJSON(localStorage.getItem("usuarioActivo") || "null");
  const miNombreComentarios = usuarioActivoComentarios ? usuarioActivoComentarios.nombre : null;

  if(lista.length === 0){
    contenedor.innerHTML = `
    <div class="comentario">
      <b>Usuario</b>
      <p>Buen perfil 😄</p>
      <button class="boton-responder" data-usuario="Usuario">Responder</button>
      <button class="boton-eliminar" data-id="-1">🗑️ Eliminar</button>
      <button class="boton-reportar" data-id="-1">🚩 Reportar</button>
    </div>`;
  } else {
    // Quién puede borrar cada comentario: el que lo escribió, o el
    // dueño de este perfil (esta página siempre muestra el perfil
    // propio, así que "esDueñoDelPerfil" da siempre true acá, pero se
    // deja explícito para que la regla sea igual que en js/usuario.js).
    const esDueñoDelPerfil = miNombreComentarios && miNombreComentarios === datosUsuario.nombre;

    contenedor.innerHTML = lista.map((c)=>{
      const esMio = miNombreComentarios && c.usuario === miNombreComentarios;
      const puedeEliminar = esMio || esDueñoDelPerfil;
      return `
      <div class="comentario">
        <div class="usuario-comentario">
          ${obtenerAvatarComentario(c.usuario)}
          <b>${c.usuario}</b>
        </div>
        ${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(c.usuario, true) : ""}
        <p>${c.texto}</p>
        ${typeof botonLikeHTML === "function" ? botonLikeHTML("comment", c.id, datosUsuario.nombre) : ""}
        <button class="boton-responder" data-usuario="${c.usuario}">Responder</button>
        ${puedeEliminar ? `<button class="boton-eliminar" data-id="${c.id}">🗑️ Eliminar</button>` : ""}
        <button class="boton-reportar" data-id="${c.id}">🚩 Reportar</button>
      </div>`;
    }).join("");
  }

  // RESPONDER
  contenedor.querySelectorAll(".boton-responder").forEach(btn=>{
    btn.onclick=()=>{
      const input = document.getElementById("comentarioTexto");
      if(input){
        input.value = "@" + btn.dataset.usuario + " ";
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(()=> input.focus(), 300);
      }
    };
  });

  // ELIMINAR
  contenedor.querySelectorAll(".boton-eliminar").forEach(btn=>{
    btn.onclick=()=>{
      const id = btn.dataset.id;

      pedirConfirmacion("¿Seguro que querés eliminar este comentario?", async ()=>{
        if(id === "-1"){
          contenedor.innerHTML="";
          return;
        }
        try{
          await fetch("/api/content?action=comments", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commentId: id, username: miNombreComentarios })
          });
        }catch(error){
          console.warn("MacroReborn: no se pudo eliminar el comentario.", error);
        }
        renderComentarios();
      });
    };
  });

  // REPORTAR
  contenedor.querySelectorAll(".boton-reportar").forEach(btn=>{
    btn.onclick=()=>{
      const id = btn.dataset.id;

      pedirConfirmacion("¿Seguro que querés reportar este comentario?", ()=>{

        if(typeof reportarComentario === "function"){
          const comentario = id === "-1"
            ? { usuario:"Usuario", texto:"Buen perfil 😄" }
            : _comentariosCache.find(c => String(c.id) === id);
          const motivo = prompt("¿Por qué reportás este comentario? (opcional)") || "";
          reportarComentario("comment", id === "-1" ? null : id, datosUsuario.nombre, comentario, motivo);
        }

        alert("Gracias. El comentario fue reportado correctamente.");

      }, "🚩 Reportar");
    };
  });
}

// ELIMINAR TODOS MIS COMENTARIOS (vaciar el muro del propio perfil)

document.getElementById("botonEliminarTodosComentarios")?.addEventListener("click", ()=>{
  pedirConfirmacion(
    "¿Seguro que querés eliminar TODOS los comentarios de tu perfil? Esta acción no se puede deshacer.",
    async ()=>{
      try{
        await fetch("/api/content?action=comments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileUsername: datosUsuario.nombre, username: datosUsuario.nombre })
        });
      }catch(error){
        console.warn("MacroReborn: no se pudieron eliminar los comentarios.", error);
      }
      renderComentarios();
    },
    "🗑️ Eliminar todos"
  );
});

// CREAR COMENTARIO

document.getElementById("botonComentar")?.addEventListener("click", async ()=>{

  if(typeof bloqueadoPorSuspension === "function" && await bloqueadoPorSuspension()) return;

  const input = document.getElementById("comentarioTexto");
  const texto = input.value.trim();
  if(!texto) return;

  const usuarioActivo = leerJSON(localStorage.getItem("usuarioActivo") || "null");

  try{
    await fetch("/api/content?action=comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileUsername: datosUsuario.nombre,
        texto: texto,
        authorUsername: usuarioActivo ? usuarioActivo.nombre : "Usuario"
      })
    });
  }catch(error){
    console.warn("MacroReborn: no se pudo publicar el comentario.", error);
    return;
  }

  input.value="";
  await renderComentarios();

  if(typeof notificarMenciones === "function" && usuarioActivo){
    notificarMenciones(texto, usuarioActivo.nombre, "en un comentario en el perfil de " + datosUsuario.nombre + ".");
  }

  // ==============================
  // LOGRO PRIMER COMENTARIO
  // ==============================
  if(usuarioActivo && typeof desbloquearLogro === "function"){
    desbloquearLogro(usuarioActivo.nombre, "primeraPalabra");
    actualizarPuntosLogrosUI();
    renderLogros();
  }

  // ACTIVIDAD RECIENTE - COMENTARIO
  if(usuarioActivo && typeof registrarActividad === "function"){
    registrarActividad(usuarioActivo.nombre, "comentario", texto);
    if(typeof renderActividadReciente === "function") renderActividadReciente();
  }
});

// ENTER PARA ENVIAR

document.getElementById("comentarioTexto")?.addEventListener("keydown",e=>{
  if(e.key==="Enter"){
    document.getElementById("botonComentar")?.click();
  }
});

renderComentarios();


// ==============================
// MOSTRAR LOGROS
// ==============================
// (la definición de renderLogros queda igual; solo cambia CUÁNDO se
// llama la primera vez, más abajo, para esperar a logrosListos)

function renderLogros(){

  const contenedor = document.getElementById("listaLogros");

  if(!contenedor) return;

  const lista = obtenerLogros(datosUsuario.nombre);

  contenedor.innerHTML = "";

  Object.values(LOGROS).forEach(logro=>{

    const conseguido = lista.find(l=>l.id===logro.id);

    contenedor.innerHTML += `
      <div class="tarjeta-logro ${conseguido ? "desbloqueado" : "bloqueado"}">
        <div class="icono-logro">${logro.icono}</div>
        <div>
          <h3>${logro.nombre}</h3>
          <p>${logro.descripcion}</p>
          ${
            conseguido
            ? `<span class="estado-logro">✅ Desbloqueado<br>${conseguido.fecha}</span>`
            : `<span class="estado-logro">🔒 Bloqueado</span>`
          }
        </div>
      </div>
    `;

  });

}

logrosListos.then(renderLogros);