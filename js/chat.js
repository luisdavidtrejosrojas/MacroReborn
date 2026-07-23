// ==============================
// CHAT GENERAL - MacroReborn
// ==============================

// ---------- USUARIO ACTIVO ----------

const usuarioActivo = leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
);

const miNombre = usuarioActivo
    ? usuarioActivo.nombre
    : "Invitado";


// ---------- MENSAJES ----------

function obtenerMensajes(){
    return leerJSON(
        localStorage.getItem("chatGeneral") || "[]"
    );
}

function guardarMensajes(lista){

    if(lista.length > 200){
        lista = lista.slice(-200);
    }

    localStorage.setItem(
        "chatGeneral",
        JSON.stringify(lista)
    );
}


// ---------- AVATAR ----------

const ORDEN_CAPAS = [
    "fondo","espalda","modelo","piel","ojos","boca",
    "botas","pantalon","remera","guantes","accesorio",
    "cara","pelo","mascota","borde"
];

// El avatar guardado por perfil.js usa valores como "tora_piel1" para el
// guardarropa (viven en imagenes/tora/piel1.png) y "tora" para el modelo
// (vive en imagenes/tora.png). Misma lógica que comunidad.js/usuario.js/
// amigos.js/ranking.js: la ruta se deriva del propio valor guardado, por
// lo que cualquier imagen nueva agregada a imagenes/<modelo>/ funciona
// automáticamente sin tener que tocar este archivo.
function rutaImagenCapa(valor){
    if(!valor || valor === "ninguno") return null;
    if(!valor.includes("_")){
        return "imagenes/" + valor + ".png";
    }
    const idx = valor.indexOf("_");
    const modelo = valor.slice(0, idx);
    const resto = valor.slice(idx + 1);
    return "imagenes/" + modelo + "/" + resto + ".png";
}


// ---------- AVATAR HTML ----------

function obtenerAvatarHTML(nombre){

    const avatar = leerJSON(
        localStorage.getItem("avatar_" + nombre) || "null"
    );

    if(!avatar){
        return `<img src="imagenes/avatar.png" class="avatar-chat" alt="" loading="lazy">`;
    }

    let capas = "";

    ORDEN_CAPAS.forEach(tipo=>{
        const ruta = rutaImagenCapa(avatar[tipo]);

        if(ruta){
            capas += `<img class="capa-chat" src="${ruta}" alt="" loading="lazy">`;
        }
    });

    return `<div class="avatar-chat-personalizado">${capas}</div>`;
}


// ---------- RENDER CHAT ----------

function responder(nombre){
    const input = document.getElementById("mensajeInput");
    input.value = "@" + nombre + " ";
    input.focus();
}

function renderChat(){

    const contenedor = document.getElementById("mensajesChat");
    if(!contenedor) return;

    const mensajes = obtenerMensajes();
    contenedor.innerHTML = "";

    if(mensajes.length === 0){
        contenedor.innerHTML = `
        <div class="mensaje-chat-vacio">
            Todavía no hay mensajes.<br>
            ¡Sé el primero en escribir!
        </div>`;
        return;
    }

    mensajes.forEach(msg=>{

        const esMio = msg.usuario === miNombre;

        const div = document.createElement("div");
        div.className = "mensaje" + (esMio ? " mensaje-propio" : "");

        div.innerHTML = `
            <div class="cabecera-mensaje">
                ${obtenerAvatarHTML(msg.usuario)}
                <div>
                    <b>${msg.usuario}</b>
                    <div class="fecha-chat">${msg.fecha}</div>
                </div>
            </div>

            <p class="texto-chat">${msg.texto}</p>

            <div class="acciones-chat">
                ${typeof botonLikeHTML === "function" ? botonLikeHTML("chatGeneral", msg.id, miNombre) : ""}

                <button class="btn-responder" onclick="responder('${msg.usuario}')">
                    Responder
                </button>

                ${esMio ? `
                    <button class="btn-borrar" data-id="${msg.id}">
                        🗑️ Borrar
                    </button>
                ` : `
                    <button class="btn-reportar" data-id="${msg.id}">
                        🚩 Reportar
                    </button>
                `}
            </div>
        `;

        contenedor.appendChild(div);
    });

    contenedor.scrollTop = contenedor.scrollHeight;
}


// ---------- ENVIAR MENSAJE ----------

function enviarMensaje(){

    const input = document.getElementById("mensajeInput");
    const texto = input.value.trim();

    if(texto === "") return;

    if(!usuarioActivo){
        alert("Debés iniciar sesión.");
        return;
    }

    if(typeof bloqueadoPorSuspension === "function" && bloqueadoPorSuspension()) return;

    const mensajes = obtenerMensajes();

    mensajes.push({
        id: Date.now(),
        usuario: miNombre,
        texto: texto,
        fecha: new Date().toLocaleString("es-AR")
    });

    guardarMensajes(mensajes);

    input.value = "";
    renderChat();
}


// ---------- EVENTOS ----------

document.getElementById("botonEnviar")?.addEventListener("click", enviarMensaje);

document.getElementById("mensajeInput")?.addEventListener("keydown", function(e){
    if(e.key === "Enter"){
        enviarMensaje();
    }
});


// ---------- BORRAR MENSAJES ----------

document.addEventListener("click", (e)=>{
    if(e.target.classList.contains("btn-borrar")){

        const id = Number(e.target.dataset.id);

        let mensajes = obtenerMensajes();

        mensajes = mensajes.filter(m => m.id !== id);

        guardarMensajes(mensajes);

        renderChat();
    }
});


// ---------- REPORTAR MENSAJES ----------
// Reutiliza el mismo motor de reportes que ya usan los comentarios de
// perfil (js/motor/reportes.js -> reportarComentario), guardando todo
// junto en localStorage bajo "reportesComentarios" para un futuro panel
// de moderación. Acá el "perfil" que se pasa es un identificador fijo
// ("chatGeneral") para distinguir estos reportes de los de perfiles.

document.addEventListener("click", (e)=>{
    if(e.target.classList.contains("btn-reportar")){

        if(!usuarioActivo){
            alert("Iniciá sesión para reportar un mensaje.");
            return;
        }

        const id = Number(e.target.dataset.id);
        const mensajes = obtenerMensajes();
        const indice = mensajes.findIndex(m => m.id === id);
        const mensaje = mensajes[indice];

        if(!mensaje) return;

        const confirmar =
            typeof pedirConfirmacion === "function"
                ? (texto, onConfirmar) => pedirConfirmacion(texto, onConfirmar, "🚩 Reportar")
                : (texto, onConfirmar) => { if(confirm(texto)) onConfirmar(); };

        confirmar("¿Seguro que querés reportar este mensaje?", () => {
            if(typeof reportarComentario === "function"){
                const motivo = prompt("¿Por qué reportás este mensaje? (opcional)") || "";
                reportarComentario("chatGeneral", indice, {
                    usuario: mensaje.usuario,
                    texto: mensaje.texto,
                    id: mensaje.id
                }, motivo);
            }
            alert("Gracias. El mensaje fue reportado correctamente.");
        });
    }
});


// ---------- MENSAJES DE EJEMPLO ----------

if(obtenerMensajes().length === 0){
    guardarMensajes([
        {
            id: Date.now(),
            usuario:"MacroBot",
            texto:"👋 ¡Bienvenido al chat general de MacroReborn!",
            fecha:new Date().toLocaleString("es-AR")
        },
        {
            id: Date.now()+1,
            usuario:"MacroBot",
            texto:"🎮 Respetá a los demás jugadores y disfrutá la comunidad.",
            fecha:new Date().toLocaleString("es-AR")
        }
    ]);
}


// ---------- INICIO ----------

renderChat();

// ⚠️ LO DE 10s DESPUÉS LO PODÉS QUITAR MÁS ADELANTE
setInterval(renderChat, 10000);