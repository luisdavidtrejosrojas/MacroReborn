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

        // Contador de notificaciones
        const notificaciones = leerJSON(
            localStorage.getItem("notificaciones_" + usuarioNav.nombre) || "[]"
        );

        const sinLeer = notificaciones.filter(n => !n.leida).length;

        nav.insertAdjacentHTML("beforeend",`

            <a class="sesion-extra" href="notificaciones.html">
                🔔 <span id="contadorNotificaciones">${
                    sinLeer > 0 ? sinLeer : ""
                }</span>
            </a>

            <a class="sesion-extra" href="perfil.html">
                👤 ${usuarioNav.nombre}
            </a>

            <a class="sesion-extra" href="#" id="cerrarSesion">
                🚪 Cerrar sesión
            </a>

        `);

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