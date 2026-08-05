// ==============================
// NAVBAR - MacroReborn
// ==============================

const nav = document.querySelector(".nav-links") || document.querySelector("nav");

const usuarioNav = leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
);

if(nav){

    // Evitar duplicados
    document.querySelectorAll(".sesion-extra")
    .forEach(e=>e.remove());

    if(usuarioNav){

        nav.insertAdjacentHTML("beforeend",`

            <a class="sesion-extra" href="notificaciones.html">
                🔔 <span id="contadorNotificaciones"></span>
            </a>

            <a class="sesion-extra" href="perfil.html">
                👤 ${usuarioNav.nombre}
            </a>

            <a class="sesion-extra" href="#" id="cerrarSesion">
                🚪 Cerrar sesión
            </a>

        `);

        // Contador de notificaciones (Neon)
        fetch("/api/content?action=notifications&username=" + encodeURIComponent(usuarioNav.nombre))
            .then(resp => resp.json())
            .then(datos => {
                if(!datos || !datos.success) return;
                const sinLeer = datos.notificaciones.filter(n => !n.leida).length;
                const span = document.getElementById("contadorNotificaciones");
                if(span) span.textContent = sinLeer > 0 ? sinLeer : "";
            })
            .catch(error => {
                console.warn("MacroReborn: no se pudo cargar el contador de notificaciones.", error);
            });

        const botonCerrar = document.getElementById("cerrarSesion");

        if(botonCerrar){

            botonCerrar.addEventListener("click",(e)=>{

                e.preventDefault();

                localStorage.removeItem("usuarioActivo");

                window.location.href="index.html";

            });

        }

    }else{

        nav.insertAdjacentHTML("beforeend",`

            <a class="sesion-extra" href="login.html">
                🔑 Iniciar sesión
            </a>

            <a class="sesion-extra" href="registro.html">
                📝 Registrarse
            </a>

        `);

    }

}