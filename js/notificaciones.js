// ==============================
// SISTEMA DE NOTIFICACIONES (Fase 2: Neon)
// ==============================


// ---------- USUARIO ACTIVO ----------

const usuarioActivo = leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
);


// ---------- OBTENER ----------

async function obtenerNotificaciones(nombre){

    try{
        const resp = await fetch("/api/content?action=notifications&username=" + encodeURIComponent(nombre));
        const datos = await resp.json();
        if(!datos || !datos.success) return [];

        return datos.notificaciones.map(n => ({
            id: n.id,
            titulo: n.titulo,
            mensaje: n.mensaje,
            leida: n.leida,
            fecha: new Date(n.created_at).toLocaleString("es-AR")
        }));
    }catch(error){
        console.warn("MacroReborn: no se pudieron cargar las notificaciones.", error);
        return [];
    }

}


// ---------- CREAR ----------
// No es async a propósito: dispara el POST y no bloquea a quien llama
// (perfil.js, usuario.js, amigos.js, motor/logros.js, motor/xp.js),
// igual que antes hacía con localStorage.

function crearNotificacion(nombre, titulo, mensaje){

    if(!nombre) return;

    fetch("/api/content?action=notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: nombre, titulo, mensaje })
    }).then(()=>{
        // Si la notificación es para quien está mirando esta página
        // ahora mismo, refrescamos el contador y la lista.
        if(usuarioActivo && usuarioActivo.nombre === nombre){
            actualizarContador();
            renderNotificaciones();
        }
    }).catch(error=>{
        console.warn("MacroReborn: no se pudo crear la notificación.", error);
    });

}


// ---------- MOSTRAR ----------

async function renderNotificaciones(){

    const contenedor = document.getElementById("listaNotificaciones");

    if(!contenedor) return;

    if(!usuarioActivo){

        contenedor.innerHTML = `
        <div class="vacio">
            Iniciá sesión para ver tus notificaciones.
        </div>`;

        actualizarContador();

        return;

    }

    const lista = await obtenerNotificaciones(usuarioActivo.nombre);

    if(lista.length === 0){

        contenedor.innerHTML = `
        <div class="vacio">
            🔔 No tenés notificaciones.
        </div>`;

        actualizarContador();

        return;

    }

    contenedor.innerHTML = "";

    lista.forEach(noti=>{

        contenedor.innerHTML += `

        <div class="notificacion ${noti.leida ? "leida" : "no-leida"}">

            <h3>${noti.titulo}</h3>

            <p>${noti.mensaje}</p>

            <div class="fecha">
                ${noti.fecha}
            </div>

        </div>

        `;

    });

    actualizarContador();

}


// ---------- CONTADOR ----------

async function actualizarContador(){

    const contador = document.getElementById("contadorNotificaciones");

    if(!contador){

        return;

    }

    if(!usuarioActivo){

        contador.textContent = "";

        return;

    }

    const lista = await obtenerNotificaciones(usuarioActivo.nombre);

    const sinLeer = lista.filter(n=>!n.leida).length;

    contador.textContent = sinLeer > 0 ? "(" + sinLeer + ")" : "";

}


// ---------- MARCAR TODAS ----------

document.getElementById("marcarLeidas")?.addEventListener("click", async ()=>{

    if(!usuarioActivo) return;

    try{
        await fetch("/api/content?action=notifications-mark-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usuarioActivo.nombre })
        });
    }catch(error){
        console.warn("MacroReborn: no se pudieron marcar las notificaciones como leídas.", error);
    }

    renderNotificaciones();

});


// ---------- BORRAR TODAS ----------

document.getElementById("borrarTodas")?.addEventListener("click", async ()=>{

    if(!usuarioActivo) return;

    if(!confirm("¿Vaciar todas las notificaciones?")) return;

    try{
        await fetch("/api/content?action=notifications", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usuarioActivo.nombre })
        });
    }catch(error){
        console.warn("MacroReborn: no se pudieron borrar las notificaciones.", error);
    }

    renderNotificaciones();

});


// ---------- ACTUALIZAR AL ENFOCAR LA PESTAÑA ----------

window.addEventListener("focus",()=>{

    actualizarContador();

    renderNotificaciones();

});


// ---------- INICIO ----------

actualizarContador();

renderNotificaciones();
