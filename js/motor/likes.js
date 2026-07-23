// =========================
// MACROREBORN - SISTEMA DE LIKES
// =========================
// Sistema genérico y reutilizable para poner "me gusta" en comentarios
// de perfil, mensajes de chat o reseñas de juegos. No depende de dónde
// se use: cada lugar le pasa una "clave" (el grupo al que pertenece el
// item, ej: "comentarios_Juan", "chatGeneral", "resenas_5") y un
// "itemId" (identificador del item dentro de ese grupo: el índice del
// comentario, el id del mensaje, el nombre de usuario de la reseña).
//
// Se guarda en localStorage bajo "likes_<clave>" como un objeto:
// { itemId: ["usuario1", "usuario2", ...] }


function obtenerLikes(clave){
    return leerJSON(localStorage.getItem("likes_" + clave) || "{}");
}

function guardarLikes(clave, likes){
    localStorage.setItem("likes_" + clave, JSON.stringify(likes));
}

function usuariosQueDieronLike(clave, itemId){
    const likes = obtenerLikes(clave);
    return likes[itemId] || [];
}

function cantidadLikes(clave, itemId){
    return usuariosQueDieronLike(clave, itemId).length;
}

function leDioLike(clave, itemId, nombreUsuario){
    if(!nombreUsuario) return false;
    return usuariosQueDieronLike(clave, itemId).indexOf(nombreUsuario) !== -1;
}

// Alterna el like: si el usuario ya le había dado, se lo saca; si no,
// se lo pone. Devuelve la cantidad de likes actualizada.
function alternarLike(clave, itemId, nombreUsuario){
    if(!nombreUsuario) return null;

    const likes = obtenerLikes(clave);
    const lista = likes[itemId] || [];

    const index = lista.indexOf(nombreUsuario);

    if(index === -1){
        lista.push(nombreUsuario);
    } else {
        lista.splice(index, 1);
    }

    likes[itemId] = lista;
    guardarLikes(clave, likes);

    return lista.length;
}

// Devuelve el HTML del botón de like, ya con el contador y marcado como
// activo si el usuario que está mirando ya le dio like.
function botonLikeHTML(clave, itemId, nombreUsuarioActivo){
    const cantidad = cantidadLikes(clave, itemId);
    const activo = leDioLike(clave, itemId, nombreUsuarioActivo);

    return `<button type="button" class="boton-like${activo ? " like-activo" : ""}" data-clave="${clave}" data-item="${itemId}">
        <span class="like-icono">${activo ? "❤️" : "🤍"}</span>
        <span class="like-contador">${cantidad}</span>
    </button>`;
}


// ---------- CLICK GLOBAL ----------
// Cualquier página que incluya este script y pinte botones con
// botonLikeHTML() ya tiene el toggle funcionando solo, sin tener que
// escribir el listener de nuevo en cada lugar.

document.addEventListener("click", (e)=>{

    const boton = e.target.closest(".boton-like");
    if(!boton) return;

    const usuarioActivo = leerJSON(localStorage.getItem("usuarioActivo") || "null");

    if(!usuarioActivo){
        alert("Iniciá sesión para dar like.");
        return;
    }

    const clave = boton.dataset.clave;
    const itemId = boton.dataset.item;

    const nuevaCantidad = alternarLike(clave, itemId, usuarioActivo.nombre);
    const activo = leDioLike(clave, itemId, usuarioActivo.nombre);

    boton.classList.toggle("like-activo", activo);
    boton.innerHTML = `
        <span class="like-icono">${activo ? "❤️" : "🤍"}</span>
        <span class="like-contador">${nuevaCantidad}</span>
    `;
});
