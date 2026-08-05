// =========================
// MACROREBORN - ACTIVIDAD RECIENTE (PERFIL DE OTRO USUARIO) — Fase 2: Neon
// =========================
// FIX: la pestaña "Actividad reciente" de usuario.html nunca hacía
// nada — no existía ningún script que la pintara (solo estaba
// implementada para el perfil propio, en js/perfil-actividad.js).
// Este archivo sigue el mismo patrón que usuario-favoritos.js y
// usuario-historial.js: lee "?usuario=" de la URL y reutiliza
// obtenerActividades() (definida en js/motor/actividad.js, ya cargado
// antes que este archivo) para traer la actividad del usuario
// visitado, no la de la sesión activa.


const parametrosActividadUsuario = new URLSearchParams(
window.location.search
);


const idUsuarioActividad = parametrosActividadUsuario.get("usuario");


const contenedorActividadUsuario = document.getElementById("listaActividadUsuario");


async function renderActividadUsuario(){

    if(!contenedorActividadUsuario || !idUsuarioActividad) return;

    const lista = typeof obtenerActividades === "function"
        ? await obtenerActividades(idUsuarioActividad)
        : [];

    if(lista.length === 0){

        contenedorActividadUsuario.innerHTML =
            `<p style="color:#94a3b8;font-size:14px;">Este jugador todavía no tiene actividad registrada.</p>`;

        return;

    }

    contenedorActividadUsuario.innerHTML = lista.map(a => `
        <div class="actividad">
            <div>${a.texto}</div>
            <div class="actividad-fecha">${a.fecha} · ${a.hora}</div>
        </div>
    `).join("");

}

renderActividadUsuario();
