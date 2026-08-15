// ==============================
// NAVBAR - MacroReborn
// ==============================

const nav = document.querySelector(".nav-links") || document.querySelector("nav");

const usuarioNav = leerJSON(
    localStorage.getItem("usuarioActivo") || "null"
);

// ---------- ESTILOS DEL DESPLEGABLE DE NOTIFICACIONES ----------
// Se inyectan una sola vez desde acá, así el desplegable funciona en
// cualquier página sin tener que agregar un <link> nuevo a cada HTML
// (mismos colores que ya usa notificaciones.html).

function _inyectarEstilosNotifDropdown(){

    if(document.getElementById("estilosNotifDropdown")) return;

    const estilo = document.createElement("style");
    estilo.id = "estilosNotifDropdown";
    estilo.textContent = `
        .notif-bell-wrap{ position: relative; display: inline-flex; }
        .notif-bell-boton{ background: none; border: none; font: inherit; cursor: pointer; padding: 0; color: var(--text-main); }
        .notif-dropdown{
            position: absolute; top: calc(100% + 10px); right: 0;
            width: 320px; max-width: 88vw;
            background: #111c33; border: 1px solid rgba(148,163,184,0.18);
            border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.35);
            opacity: 0; transform: translateY(-6px); pointer-events: none;
            transition: opacity .15s ease, transform .15s ease;
            z-index: 200; overflow: hidden; text-align: left;
        }
        .notif-dropdown.abierto{ opacity: 1; transform: translateY(0); pointer-events: auto; }
        .notif-dropdown-header{
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 14px; border-bottom: 1px solid rgba(148,163,184,0.15);
            font-size: 13px; font-weight: 700; color: #f1f5f9;
        }
        .notif-dropdown-lista{ max-height: 320px; overflow-y: auto; }
        .notif-dropdown-item{ padding: 10px 14px; border-bottom: 1px solid rgba(148,163,184,0.1); }
        .notif-dropdown-item:last-child{ border-bottom: none; }
        .notif-dropdown-item.no-leida{ background: rgba(99,102,241,0.1); }
        .notif-dropdown-item h4{ margin: 0 0 3px; font-size: 12.5px; font-weight: 700; color: #f1f5f9; }
        .notif-dropdown-item p{ margin: 0 0 4px; font-size: 11.5px; color: #cbd5e1; line-height: 1.4; }
        .notif-dropdown-item span{ font-size: 10.5px; color: #64748b; }
        .notif-dropdown-vacio{ padding: 28px 14px; text-align: center; font-size: 12.5px; color: #94a3b8; }
        .notif-dropdown-footer{ padding: 10px 14px; text-align: center; border-top: 1px solid rgba(148,163,184,0.15); }
        .notif-dropdown-footer a{ font-size: 12px; font-weight: 600; color: #93c5fd; text-decoration: none; }
        .notif-dropdown-footer a:hover{ text-decoration: underline; }
    `;
    document.head.appendChild(estilo);
}

if(nav){

    // Evitar duplicados
    document.querySelectorAll(".sesion-extra")
    .forEach(e=>e.remove());
    document.querySelectorAll(".notif-bell-wrap")
    .forEach(e=>e.remove());

    if(usuarioNav){

        _inyectarEstilosNotifDropdown();

        nav.insertAdjacentHTML("beforeend",`

            <a class="sesion-extra nav-ayuda" href="chat.html" title="¿Necesitás ayuda? Preguntá en el chat">❔</a>

            <span class="nav-monedas" id="navMonedas" title="Tus monedas"></span>

            <div class="notif-bell-wrap" id="notifBellWrap">
                <button type="button" class="sesion-extra notif-bell-boton" id="botonNotificaciones" aria-haspopup="true" aria-expanded="false">
                    🔔 <span id="contadorNotificaciones"></span>
                </button>
                <div class="notif-dropdown" id="notifDropdown">
                    <div class="notif-dropdown-header">
                        <span>Notificaciones</span>
                    </div>
                    <div class="notif-dropdown-lista" id="notifDropdownLista">
                        <div class="notif-dropdown-vacio">Cargando...</div>
                    </div>
                    <div class="notif-dropdown-footer">
                        <a href="notificaciones.html">Ver todas las notificaciones</a>
                    </div>
                </div>
            </div>

            <a class="sesion-extra" href="perfil.html">
                👤 ${usuarioNav.nombre}
            </a>

            <a class="sesion-extra" href="#" id="cerrarSesion">
                🚪 Cerrar sesión
            </a>

        `);

        // Monedas del usuario (mismo saldo que se gasta en el Centro de
        // avatares de comunidad-ranking.html). Se reusa ese mismo
        // endpoint porque ya devuelve el saldo actual; no hace falta
        // pedir nada nuevo al servidor solo para mostrar el numerito acá.
        fetch("/api/content?action=avatar-shop&username=" + encodeURIComponent(usuarioNav.nombre))
            .then(resp => resp.json())
            .then(datos => {
                if(!datos || !datos.success) return;
                const spanMonedas = document.getElementById("navMonedas");
                if(spanMonedas) spanMonedas.textContent = "🪙 " + (datos.monedas != null ? datos.monedas : 0);
            })
            .catch(error => {
                console.warn("MacroReborn: no se pudo cargar el saldo de monedas.", error);
            });

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

        // ---------- DESPLEGABLE DE NOTIFICACIONES ----------

        const botonNotif = document.getElementById("botonNotificaciones");
        const dropdownNotif = document.getElementById("notifDropdown");

        function cerrarDropdownNotif(){
            if(!dropdownNotif) return;
            dropdownNotif.classList.remove("abierto");
            if(botonNotif) botonNotif.setAttribute("aria-expanded", "false");
        }

        function abrirDropdownNotif(){
            if(!dropdownNotif) return;
            dropdownNotif.classList.add("abierto");
            if(botonNotif) botonNotif.setAttribute("aria-expanded", "true");

            // renderNotificacionesDropdown() vive en js/notificaciones.js.
            // Se llama acá (recién al abrir) y no antes, porque ese
            // script corre antes de que este botón exista en el DOM.
            if(typeof renderNotificacionesDropdown === "function"){
                renderNotificacionesDropdown();
            }

            // Al abrir la campanita, se marcan todas las notificaciones
            // como leídas (mismo endpoint que ya usa el botón "Marcar
            // leídas" de notificaciones.html). El contador se vacía al
            // toque para que se sienta instantáneo, sin esperar la
            // respuesta del servidor.
            const span = document.getElementById("contadorNotificaciones");
            if(span) span.textContent = "";

            fetch("/api/content?action=notifications-mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: usuarioNav.nombre })
            }).then(()=>{
                // Repinta el listado para que también se les quite el
                // resaltado de "no leída" a los ítems del desplegable.
                if(typeof renderNotificacionesDropdown === "function"){
                    renderNotificacionesDropdown();
                }
            }).catch(error => {
                console.warn("MacroReborn: no se pudieron marcar las notificaciones como leídas.", error);
            });
        }

        if(botonNotif && dropdownNotif){

            botonNotif.addEventListener("click", (e)=>{
                e.stopPropagation();
                dropdownNotif.classList.contains("abierto")
                    ? cerrarDropdownNotif()
                    : abrirDropdownNotif();
            });

            document.addEventListener("click", (e)=>{
                if(!dropdownNotif.classList.contains("abierto")) return;
                if(e.target.closest("#notifBellWrap")) return;
                cerrarDropdownNotif();
            });

            document.addEventListener("keydown", (e)=>{
                if(e.key === "Escape") cerrarDropdownNotif();
            });

        }

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

            <a class="sesion-extra nav-ayuda" href="chat.html" title="¿Necesitás ayuda? Preguntá en el chat">❔</a>

            <a class="sesion-extra" href="login.html">
                🔑 Iniciar sesión
            </a>

            <a class="sesion-extra" href="registro.html">
                📝 Registrarse
            </a>

        `);

    }

}