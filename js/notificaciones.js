// ==============================
// SISTEMA DE NOTIFICACIONES
// ==============================


// ---------- USUARIO ACTIVO ----------

const usuarioActivo = leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
);


// ---------- OBTENER ----------

function obtenerNotificaciones(nombre){

    return leerJSON(
        localStorage.getItem("notificaciones_" + nombre) || "[]"
    );

}


// ---------- GUARDAR ----------

function guardarNotificaciones(nombre, lista){

    localStorage.setItem(
        "notificaciones_" + nombre,
        JSON.stringify(lista)
    );

}


// ---------- CREAR ----------

function crearNotificacion(nombre, titulo, mensaje){

    if(!nombre) return;

    let lista = obtenerNotificaciones(nombre);

    lista.unshift({

        id: Date.now(),

        titulo: titulo,

        mensaje: mensaje,

        fecha: new Date().toLocaleString("es-AR"),

        leida: false

    });

    // Máximo 100 notificaciones
    if(lista.length > 100){

        lista = lista.slice(0,100);

    }

    guardarNotificaciones(nombre, lista);

    actualizarContador();

}


// ---------- MOSTRAR ----------

function renderNotificaciones(){

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

    const lista = obtenerNotificaciones(usuarioActivo.nombre);

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

function actualizarContador(){

    const contador = document.getElementById("contadorNotificaciones");

    if(!contador){

        return;

    }

    if(!usuarioActivo){

        contador.textContent = "";

        return;

    }

    const lista = obtenerNotificaciones(usuarioActivo.nombre);

    const sinLeer = lista.filter(n=>!n.leida).length;

    contador.textContent = sinLeer > 0 ? "(" + sinLeer + ")" : "";

}


// ---------- MARCAR TODAS ----------

document.getElementById("marcarLeidas")?.addEventListener("click",()=>{

    if(!usuarioActivo) return;

    const lista = obtenerNotificaciones(usuarioActivo.nombre);

    lista.forEach(n=>{

        n.leida = true;

    });

    guardarNotificaciones(usuarioActivo.nombre, lista);

    renderNotificaciones();

});


// ---------- BORRAR TODAS ----------

document.getElementById("borrarTodas")?.addEventListener("click",()=>{

    if(!usuarioActivo) return;

    if(!confirm("¿Vaciar todas las notificaciones?")) return;

    guardarNotificaciones(usuarioActivo.nombre, []);

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