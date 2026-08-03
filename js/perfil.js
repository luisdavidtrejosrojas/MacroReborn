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
datosUsuario.ultimaConexion = datosUsuario.ultimaConexion || "Nunca";

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
const posicionRanking = typeof obtenerPosicionRanking === "function"
  ? obtenerPosicionRanking(datosUsuario.nombre)
  : null;

const usuario={

  nombre: datosUsuario.nombre,

  estado:"🟢 En línea",

  nivel: Number(datosUsuario.nivel) || 1,

  biografia: datosUsuario.biografia || "Todavía no escribió una biografía.",

  xp: Number(datosUsuario.xp) || 0,

  ranking: posicionRanking ? "#" + posicionRanking : "Sin clasificar",

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

// ---------- PUNTOS DE LOGROS ----------

function actualizarPuntosLogrosUI(){
  const puntosLogrosEl = document.getElementById("puntosLogros");
  if(puntosLogrosEl){
    puntosLogrosEl.textContent = "🏅 " + calcularPuntosLogros(datosUsuario.nombre) + " puntos de logros";
  }
}

actualizarPuntosLogrosUI();

document.getElementById("fechaRegistro").textContent = usuario.fechaRegistro;

document.getElementById("ultimaConexion").textContent =
  typeof tiempoRelativo === "function"
    ? tiempoRelativo(datosUsuario.ultimaConexionTS || datosUsuario.ultimaConexion, "Nunca")
    : usuario.ultimaConexion;


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
  tora_piel1:"imagenes/tora/piel1.png",
  tora_piel2:"imagenes/tora/piel2.png",
  tora_piel3:"imagenes/tora/piel3.png",
  tora_ojos1:"imagenes/tora/ojos1.png",
  tora_ojos2:"imagenes/tora/ojos2.png",
  tora_ojos3:"imagenes/tora/ojos3.png",
  tora_ojos4:"imagenes/tora/ojos4.png",
  tora_boca1:"imagenes/tora/boca1.png",
  tora_boca2:"imagenes/tora/boca2.png",
  tora_boca3:"imagenes/tora/boca3.png",
  tora_pantalon1:"imagenes/tora/pantalon1.png",
  tora_pantalon2:"imagenes/tora/pantalon2.png",
  tora_pantalon3:"imagenes/tora/pantalon3.png",
  tora_pantalon4:"imagenes/tora/pantalon4.png",
  tora_botas1:"imagenes/tora/botas1.png",
  tora_botas2:"imagenes/tora/botas2.png",
  tora_botas3:"imagenes/tora/botas3.png",
  tora_botas4:"imagenes/tora/botas4.png",
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
  tora_cara1:"imagenes/tora/cara1.png",
  tora_cara2:"imagenes/tora/cara2.png",
  tora_mascota1:"imagenes/tora/mascota1.png",
  tora_mascota2:"imagenes/tora/mascota2.png",
  tora_borde1:"imagenes/tora/borde1.png",
  tora_borde2:"imagenes/tora/borde2.png",
  tora_borde3:"imagenes/tora/borde3.png",
  tora_borde4:"imagenes/tora/borde4.png",

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
  cereza_piel1:"imagenes/cereza/piel1.png",
  cereza_piel2:"imagenes/cereza/piel2.png",
  cereza_ojos1:"imagenes/cereza/ojos1.png",
  cereza_ojos2:"imagenes/cereza/ojos2.png",
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
  cereza_borde1:"imagenes/cereza/borde1.png",
  cereza_borde2:"imagenes/cereza/borde2.png",
  cereza_borde3:"imagenes/cereza/borde3.png",
  cereza_borde4:"imagenes/cereza/borde4.png",

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


// ---------- LOCAL STORAGE ----------

function cargarAvatar(){
  const usuario = leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
  );
  if(!usuario) return null;
  return leerJSON(
    localStorage.getItem("avatar_" + usuario.nombre) || "null"
  );
}

function guardarAvatar(avatar){
  const usuario = leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
  );
  if(!usuario) return;
  localStorage.setItem(
    "avatar_" + usuario.nombre,
    JSON.stringify(avatar)
  );
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

  ORDEN_CAPAS.forEach(tipo=>{
    let valor=avatar[tipo];
    if(valor && valor!="ninguno" && CAPAS_IMG[valor]){
      let capa=document.createElement("img");
      capa.src=CAPAS_IMG[valor];
      capa.style.position="absolute";
      capa.style.top="0";
      capa.style.left="0";
      capa.style.width="100%";
      capa.style.height="100%";
      capa.style.objectFit="contain";
      contenedor.appendChild(capa);
    }
  });

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

document.getElementById("guardarAvatar")?.addEventListener("click",()=>{
  guardarAvatar({...editorCapas});
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



    fetch("/api/update-bio", {

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

function renderAmigosPerfil(){
  const contenedor = document.getElementById("listaAmigosPerfil");
  if(!contenedor) return;

  const misAmigos = leerJSON(
    localStorage.getItem("amigos_" + datosUsuario.nombre) || "[]"
  );

  if(misAmigos.length === 0){
    contenedor.innerHTML = `<p>Todavía no agregaste amigos. <a href="comunidad.html" style="color:#f0b429;">Buscá jugadores en la comunidad</a>.</p>`;
    return;
  }

  contenedor.innerHTML = misAmigos.map(nombreAmigo => {
    const avatar = leerJSON(localStorage.getItem("avatar_" + nombreAmigo) || "null");

    let avatarHTML;
    if(!avatar){
      avatarHTML = `<img src="imagenes/avatar.png" style="width:55px;height:55px;border-radius:50%;object-fit:cover;" alt="" loading="lazy">`;
    } else {
      let capas = "";
      ORDEN_CAPAS.forEach(tipo=>{
        const valor = avatar[tipo];
        if(valor && valor!=="ninguno" && CAPAS_IMG[valor]){
          capas += `<img class="capa-comentario" src="${CAPAS_IMG[valor]}" alt="" loading="lazy">`;
        }
      });
      avatarHTML = `<div class="avatar-mini">${capas}</div>`;
    }

    return `
      <div class="actividad" style="display:flex;align-items:center;gap:14px;justify-content:space-between;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:14px;">
          ${avatarHTML}
          <b style="color:#f0b429;">${nombreAmigo}</b>
        </div>
        <div style="display:flex;gap:10px;">
          <a href="usuario.html?usuario=${encodeURIComponent(nombreAmigo)}" style="background:#1e293b;color:#f0b429;border:2px solid #f0b429;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:bold;text-decoration:none;">👤 Ver perfil</a>
          <button class="btn-quitar-amigo-perfil" data-nombre="${nombreAmigo}" style="background:#ef444422;color:#ef4444;border:2px solid #ef444466;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:bold;cursor:pointer;">🗑️ Eliminar</button>
        </div>
      </div>
    `;
  }).join("");

  contenedor.querySelectorAll(".btn-quitar-amigo-perfil").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const objetivo = btn.dataset.nombre;
      if(!confirm(`¿Eliminar a ${objetivo} de tus amigos?`)) return;

      const misAmigosNuevo = leerJSON(localStorage.getItem("amigos_" + datosUsuario.nombre) || "[]")
        .filter(n => n !== objetivo);
      localStorage.setItem("amigos_" + datosUsuario.nombre, JSON.stringify(misAmigosNuevo));

      const susAmigos = leerJSON(localStorage.getItem("amigos_" + objetivo) || "[]")
        .filter(n => n !== datosUsuario.nombre);
      localStorage.setItem("amigos_" + objetivo, JSON.stringify(susAmigos));

      renderAmigosPerfil();
    });
  });
}

renderAmigosPerfil();


// ==============================
// COMENTARIOS
// ==============================

function cargarComentarios(){
  return leerJSON(localStorage.getItem("comentarios_" + datosUsuario.nombre) || "[]");
}

function guardarComentarios(lista){
  localStorage.setItem(
    "comentarios_" + datosUsuario.nombre,
    JSON.stringify(lista)
  );
}

// AVATAR DEL USUARIO EN COMENTARIOS

function obtenerAvatarComentario(nombre){
  const avatar = leerJSON(
    localStorage.getItem("avatar_" + nombre) || "null"
  );

  if(!avatar){
    return `<img class="avatar-comentario" src="imagenes/avatar.png" alt="" loading="lazy">`;
  }

  let capas = "";
  ORDEN_CAPAS.forEach(tipo=>{
    let valor = avatar[tipo];
    if(valor && valor !== "ninguno" && CAPAS_IMG[valor]){
      capas += `<img class="capa-comentario" src="${CAPAS_IMG[valor]}" alt="" loading="lazy">`;
    }
  });

  return `<div class="avatar-mini">${capas}</div>`;
}

// ÚLTIMOS COMENTARIOS (pestaña Inicio)
// Reutiliza los mismos datos (cargarComentarios) y el mismo avatar
// (obtenerAvatarComentario) que la pestaña Comentarios, mostrando
// solo los más recientes.

function renderUltimosComentariosInicio(){
  const contenedor = document.getElementById("ultimosComentariosInicio");
  if(!contenedor) return;

  const lista = cargarComentarios();

  if(lista.length === 0){
    contenedor.innerHTML = `<p>Todavía no hay comentarios.</p>`;
    return;
  }

  const ultimos = lista.slice(-3).reverse();

  contenedor.innerHTML = ultimos.map((c,pos)=>{
    const indiceReal = lista.length - 1 - pos;
    return `
    <div class="comentario">
      <div class="usuario-comentario">
        ${obtenerAvatarComentario(c.usuario)}
        <b>${c.usuario}</b>
      </div>
      ${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(c.usuario, true) : ""}
      <p>${c.texto}</p>
      ${typeof botonLikeHTML === "function" ? botonLikeHTML("comentarios_" + datosUsuario.nombre, indiceReal, datosUsuario.nombre) : ""}
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

function renderComentarios(){
  const lista = cargarComentarios();
  const contenedor = document.getElementById("listaComentarios");

  // Mantenemos sincronizado el resumen de Inicio cada vez que se
  // actualiza la lista de comentarios (alta o baja).
  renderUltimosComentariosInicio();

  if(!contenedor) return;

  if(lista.length === 0){
    contenedor.innerHTML = `
    <div class="comentario">
      <b>Usuario</b>
      <p>Buen perfil 😄</p>
      <button class="boton-responder" data-usuario="Usuario">Responder</button>
      <button class="boton-eliminar" data-index="-1">🗑️ Eliminar</button>
      <button class="boton-reportar" data-index="-1">🚩 Reportar</button>
    </div>`;
  } else {
    contenedor.innerHTML = lista.map((c,i)=>{
      return `
      <div class="comentario">
        <div class="usuario-comentario">
          ${obtenerAvatarComentario(c.usuario)}
          <b>${c.usuario}</b>
        </div>
        ${typeof insigniasBloqueHTML === "function" ? insigniasBloqueHTML(c.usuario, true) : ""}
        <p>${c.texto}</p>
        ${typeof botonLikeHTML === "function" ? botonLikeHTML("comentarios_" + datosUsuario.nombre, i, datosUsuario.nombre) : ""}
        <button class="boton-responder" data-usuario="${c.usuario}">Responder</button>
        <button class="boton-eliminar" data-index="${i}">🗑️ Eliminar</button>
        <button class="boton-reportar" data-index="${i}">🚩 Reportar</button>
      </div>`;
    }).join("");
  }

  // RESPONDER
  contenedor.querySelectorAll(".boton-responder").forEach(btn=>{
    btn.onclick=()=>{
      const input = document.getElementById("comentarioTexto");
      if(input){
        input.value = "@" + btn.dataset.usuario + " ";
        input.focus();
      }
    };
  });

  // ELIMINAR
  contenedor.querySelectorAll(".boton-eliminar").forEach(btn=>{
    btn.onclick=()=>{
      let index = Number(btn.dataset.index);

      pedirConfirmacion("¿Seguro que querés eliminar este comentario?", ()=>{
        if(index === -1){
          contenedor.innerHTML="";
          return;
        }
        const lista = cargarComentarios();
        lista.splice(index,1);
        guardarComentarios(lista);
        renderComentarios();
      });
    };
  });

  // REPORTAR
  contenedor.querySelectorAll(".boton-reportar").forEach(btn=>{
    btn.onclick=()=>{
      let index = Number(btn.dataset.index);

      pedirConfirmacion("¿Seguro que querés reportar este comentario?", ()=>{

        if(typeof reportarComentario === "function"){
          const listaActual = cargarComentarios();
          const comentario = index === -1
            ? { usuario:"Usuario", texto:"Buen perfil 😄" }
            : listaActual[index];
          const motivo = prompt("¿Por qué reportás este comentario? (opcional)") || "";
          reportarComentario(datosUsuario.nombre, index, comentario, motivo);
        }

        alert("Gracias. El comentario fue reportado correctamente.");

      }, "🚩 Reportar");
    };
  });
}

// CREAR COMENTARIO

document.getElementById("botonComentar")?.addEventListener("click",()=>{

  if(typeof bloqueadoPorSuspension === "function" && bloqueadoPorSuspension()) return;

  const input = document.getElementById("comentarioTexto");
  const texto = input.value.trim();
  if(!texto) return;

  const usuarioActivo = leerJSON(localStorage.getItem("usuarioActivo") || "null");
  const lista = cargarComentarios();

  lista.push({
    usuario: usuarioActivo ? usuarioActivo.nombre : "Usuario",
    texto: texto
  });

  guardarComentarios(lista);
  input.value="";
  renderComentarios();

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
    registrarActividad(usuarioActivo.nombre, "comentario", "");
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

renderLogros();