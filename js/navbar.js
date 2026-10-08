// ==============================
// NAVBAR - MacroReborn
// ==============================

const navbar = document.querySelector(".navbar");
const nav = navbar ? (navbar.querySelector(".nav-links") || navbar) : null;

// MRApp coordina el arranque común (equivalente conceptual a Layout.js de Morpho).
// Navbar mantiene su inicialización actual; solo marca que el shell está disponible.
if (window.MRApp && typeof MRApp.subscribe === "function") {
    MRApp.subscribe(function (servicios) {
        document.documentElement.setAttribute("data-macro-navbar", servicios && servicios.ready ? "ready" : "pending");
    });
}

// La navbar consume el estado público de MRTheme en vez de leer localStorage
// o data-* por su cuenta. Así los presets de Personalización se reflejan
// también en componentes dinámicos creados por esta capa.
(function sincronizarTemaNavbar(){
    function aplicarEstado(estado){
        const dato = estado || (window.MRTheme && typeof MRTheme.getState === "function" ? MRTheme.getState() : null);
        if (!dato) return;
        document.documentElement.setAttribute("data-mr-navbar-tema", dato.tema || "oscuro");
        document.documentElement.setAttribute("data-mr-navbar-paleta", dato.paleta || "macro");
    }

    if (window.MRTheme && typeof MRTheme.getState === "function") aplicarEstado(MRTheme.getState());

    const suscribir = window.MRTheme && typeof MRTheme.subscribePalette === "function"
        ? MRTheme.subscribePalette
        : null;
    if (suscribir) suscribir(aplicarEstado);

    if (window.MRTheme && typeof MRTheme.subscribe === "function") MRTheme.subscribe(aplicarEstado);
    else window.addEventListener("macro:theme-change", () => aplicarEstado());
    window.addEventListener("macro:palette-change", () => aplicarEstado());
})();

// La barra se queda fija arriba (position: sticky), así que un salto a una
// parte de la página (scrollIntoView, un enlace a un ancla) dejaría lo que
// busca debajo de ella. Su altura es el margen de esos saltos. Se mide porque
// cambia con el ancho, y se vuelve a medir si cambia; con el menú del móvil
// abierto la barra crece, y esa altura no cuenta.
(function margenDeLosSaltos(){
    if (!navbar || typeof ResizeObserver !== "function") return;
    function medir(){
        if (navbar.classList.contains("nav-menu-abierto")) return;
        document.documentElement.style.scrollPaddingTop = navbar.offsetHeight + "px";
    }
    new ResizeObserver(medir).observe(navbar);
})();

const usuarioNav = (window.MRSession && typeof MRSession.get === "function")
    ? MRSession.get()
    : leerJSON(localStorage.getItem("usuarioActivo") || "null");

function xpNecesariaNavbar(nivel){
    const n = Math.max(1, Number(nivel) || 1);
    if(n === 1) return 50;
    if(n === 2) return 100;
    return 100 + ((n - 2) * 200);
}

function experienciaNavbar(usuario){
    const nivel = Math.max(1, Number(usuario && (usuario.nivel ?? usuario.level)) || 1);
    const actual = Math.max(0, Number(usuario && usuario.xp) || 0);
    const necesaria = xpNecesariaNavbar(nivel);
    const porcentaje = necesaria > 0 ? Math.min(100, Math.max(0, (actual / necesaria) * 100)) : 0;
    return { nivel, actual, necesaria, porcentaje };
}

function renderExperienciaNavbar(usuario){
    const datos = experienciaNavbar(usuario);
    const xpEl = document.getElementById("navExperienciaUsuario");
    if(!xpEl) return;

    const fill = xpEl.querySelector(".user-guest-xp-fill");
    const texto = xpEl.querySelector(".user-guest-xp-text");
    if(fill) fill.style.width = datos.porcentaje.toFixed(1) + "%";
    if(texto) texto.textContent = `${datos.actual} / ${datos.necesaria} XP`;
    xpEl.title = `Nivel ${datos.nivel}: ${datos.actual} de ${datos.necesaria} XP`;
    xpEl.setAttribute("aria-label", `Nivel ${datos.nivel}. ${datos.actual} de ${datos.necesaria} XP`);
}

// La miniatura del botón de usuario. Con la cuenta entera ({ id,
// avatar_compuesto }) sale su avatar compuesto; solo con el avatar, la
// silueta (avatarMiniaturaHTML, en js/core.js). La sesión cambia con cada
// minuto de juego: solo se repinta si cambió el avatar, para no volver a
// pedir la imagen.
let _avatarNavbarPintado = null;
function renderAvatarNavbar(usuario){
    const avatarEl = document.querySelector("#botonUsuarioMenu .user-guest-avatar");
    if(!avatarEl) return;
    const avatar = usuario && usuario.avatar;
    const clave = JSON.stringify([usuario && usuario.id, usuario && usuario.avatar_compuesto, avatar]);
    if(clave === _avatarNavbarPintado) return;
    _avatarNavbarPintado = clave;
    if(typeof avatarMiniaturaHTML === "function") {
        avatarEl.innerHTML = avatarMiniaturaHTML(avatar, usuario);
    } else {
        avatarEl.innerHTML = '<img src="imagenes/avatar.png" alt="Avatar">';
    }
}

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
            background: var(--bg-panel, #111c33); border: 1px solid var(--line, rgba(148,163,184,0.18));
            border-radius: 12px; box-shadow: var(--sombra-suave, 0 16px 40px rgba(0,0,0,0.35));
            opacity: 0; transform: translateY(-6px); pointer-events: none;
            transition: opacity .15s ease, transform .15s ease;
            z-index: 200; overflow: hidden; text-align: left;
        }
        .notif-dropdown.abierto{ opacity: 1; transform: translateY(0); pointer-events: auto; }
        .notif-dropdown-header{
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 14px; border-bottom: 1px solid var(--line, rgba(148,163,184,0.15));
            font-size: 13px; font-weight: 700; color: var(--text-main, #f1f5f9);
        }
        .notif-dropdown-lista{ max-height: 320px; overflow-y: auto; }
        .notif-dropdown-item{ padding: 10px 14px; border-bottom: 1px solid var(--line, rgba(148,163,184,0.1)); }
        .notif-dropdown-item:last-child{ border-bottom: none; }
        .notif-dropdown-item.no-leida{ background: var(--chip-bg, rgba(99,102,241,0.1)); }
        .notif-dropdown-item h4{ margin: 0 0 3px; font-size: 12.5px; font-weight: 700; color: var(--text-main, #f1f5f9); }
        .notif-dropdown-item p{ margin: 0 0 4px; font-size: 11.5px; color: var(--text-secondary, #cbd5e1); line-height: 1.4; }
        .notif-dropdown-item span{ font-size: 10.5px; color: var(--text-muted, #64748b); }
        .notif-dropdown-vacio{ padding: 28px 14px; text-align: center; font-size: 12.5px; color: var(--text-muted, #94a3b8); }
        .notif-dropdown-footer{ padding: 10px 14px; text-align: center; border-top: 1px solid var(--line, rgba(148,163,184,0.15)); }
        .notif-dropdown-footer a{ font-size: 12px; font-weight: 600; color: var(--cyan, #93c5fd); text-decoration: none; }
        .notif-dropdown-footer a:hover{ text-decoration: underline; }
    `;
    document.head.appendChild(estilo);
}

if(navbar && nav){

    // ------------------------------------------------------------
    // Estructura visual retro: solo movemos los enlaces de navegación
    // que ya venían en .nav-links. Los elementos funcionales que otros
    // módulos inyectan (.sesion-extra, tema, permisos) permanecen en
    // .nav-links para no romperlos.
    // ------------------------------------------------------------
    const navCategorias = navbar.querySelector(".nav-categorias");

    if(navCategorias && !navbar.dataset.retroPreparada){
        const enlacesBase = Array.from(nav.querySelectorAll(":scope > a:not(.sesion-extra):not(.boton-tema):not(#enlacePanelAdmin)"));
        enlacesBase.reverse().forEach((enlace) => {
            navCategorias.insertBefore(enlace, navCategorias.firstChild);
        });

        if(!navCategorias.querySelector(".nav-retro-todos")){
            const todos = document.createElement("a");
            todos.className = "nav-retro-todos";
            todos.href = "juegos.html";
            todos.innerHTML = "🏠 Ver Todos";
            navCategorias.insertBefore(todos, navCategorias.firstChild);
        }

        // El Bazar (la tienda de prendas), detrás de Juegos. Se pone aquí y
        // no en el HTML de cada página, que son veinticinco con la misma
        // barra copiada. Hasta el 28/09/2026 era la tienda (tienda.html).
        if(!navCategorias.querySelector('a[href="bazar.html"]')){
            const bazar = document.createElement("a");
            bazar.href = "bazar.html";
            bazar.textContent = "🛍️ Bazar";
            const juegos = navCategorias.querySelector('a[href="juegos.html"]:not(.nav-retro-todos)');
            navCategorias.insertBefore(bazar, juegos ? juegos.nextSibling : null);
        }

        // Resalta, con la pastilla violeta, el enlace de la página en la
        // que estamos. "Ver Todos" cubre tanto el portal (index) como el
        // catálogo completo (juegos.html).
        const archivoActual = (location.pathname.split("/").pop() || "index.html").toLowerCase();
        const esPortal = archivoActual === "" || archivoActual === "index.html" || archivoActual === "juegos.html";
        navCategorias.querySelectorAll("a").forEach((enlace) => {
            const archivoEnlace = (enlace.getAttribute("href") || "").split("/").pop().toLowerCase();
            let activo;
            if(enlace.classList.contains("nav-retro-todos")){
                activo = esPortal;
            }else if(esPortal && archivoEnlace === "juegos.html"){
                // "Ver Todos" ya cubre juegos.html; no duplicamos el resaltado.
                activo = false;
            }else{
                activo = archivoEnlace === archivoActual;
            }
            enlace.classList.toggle("activa-nav", activo);
        });

        navbar.dataset.retroPreparada = "1";
    }

    // El buscador lo crea js/buscador.js. No lo recreamos acá para que
    // exista una sola barra y conserve TODAS sus funciones originales.

    // Evitar solo duplicados creados por ESTA capa.
    // Nunca borramos .sesion-extra en general: permisos.js agrega el
    // Panel Admin/Moderación y tema.js agrega el botón claro/oscuro
    // dentro de .nav-links.
    document.getElementById("userMenuWrap")?.remove();
    document.getElementById("userGuestWrap")?.remove();
    document.getElementById("notifBellWrap")?.remove();
    document.getElementById("navMonedasWrap")?.remove();
    nav.querySelectorAll(":scope > .nav-ayuda").forEach(e => e.remove());

    if(usuarioNav){

        _inyectarEstilosNotifDropdown();

        nav.insertAdjacentHTML("beforeend",`

            <a class="sesion-extra nav-ayuda" href="chat.html" title="¿Necesitás ayuda? Preguntá en el chat">❔</a>

            <span class="nav-monedas-wrap" id="navMonedasWrap">
                <span class="nav-monedas" id="navMonedas" title="Tus monedas"></span>
                <a class="nav-monedas-mas" href="bazar.html" title="Conseguir más monedas">+</a>
            </span>

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

            <div class="user-guest-wrap" id="userMenuWrap">
                <button type="button" class="sesion-extra user-guest-boton sesion-activa" id="botonUsuarioMenu" aria-haspopup="true" aria-expanded="false">
                    <span class="user-guest-avatar">${typeof avatarMiniaturaHTML === "function" ? avatarMiniaturaHTML(usuarioNav.avatar, usuarioNav) : '<img src="imagenes/avatar.png" alt="Avatar">'}</span>
                    <span class="user-guest-nombre">
                        <span class="user-guest-nombre-text">${MRTexto.escapar(usuarioNav.nombre)}</span>
                        <span class="user-guest-xp" id="navExperienciaUsuario" aria-label="Experiencia del usuario">
                            <span class="user-guest-xp-track"><span class="user-guest-xp-fill"></span></span>
                            <span class="user-guest-xp-text">0 / 0 XP</span>
                        </span>
                    </span>
                </button>

                <div class="user-guest-dropdown" id="dropdownUsuarioMenu">
                    <div class="user-guest-dropdown-header">${MRTexto.escapar(usuarioNav.nombre)}</div>

                    <div class="user-menu-lista">
                        <a href="perfil.html">🏠 Home</a>
                        <a href="perfil.html#actividad-amigos">👥 Actividad de amigos</a>
                        <a href="perfil.html#actividad">📜 Actividad reciente</a>
                        <a href="perfil.html#comentarios">💬 Comentarios</a>
                        <a href="perfil.html#favoritos">❤️ Favoritos</a>
                        <a href="perfil.html#ultimos">🎮 Últimos jugados</a>
                        <a href="perfil.html#amigos">🤝 Amigos</a>
                        <a href="perfil.html#logros">🏅 Logros</a>
                    </div>

                    <div class="user-guest-dropdown-footer">
                        <a href="#" id="cerrarSesion">🚪 Cerrar sesión</a>
                    </div>
                </div>
            </div>

        `);

        // ---------- DESPLEGABLE DEL MENÚ DE USUARIO (perfil) ----------
        // Mismo patrón que el desplegable de "Usuario temporal" (invitado)
        // y el de notificaciones: togglea al tocar el botón, se cierra al
        // hacer click afuera o al apretar Escape.

        const botonUsuarioMenu = document.getElementById("botonUsuarioMenu");
        const dropdownUsuarioMenu = document.getElementById("dropdownUsuarioMenu");

        renderAvatarNavbar(usuarioNav);
        renderExperienciaNavbar(usuarioNav);

        function cerrarDropdownUsuarioMenu(){
            if(!dropdownUsuarioMenu) return;
            dropdownUsuarioMenu.classList.remove("abierto");
            if(botonUsuarioMenu) botonUsuarioMenu.setAttribute("aria-expanded", "false");
        }

        function abrirDropdownUsuarioMenu(){
            if(!dropdownUsuarioMenu) return;
            dropdownUsuarioMenu.classList.add("abierto");
            if(botonUsuarioMenu) botonUsuarioMenu.setAttribute("aria-expanded", "true");
        }

        if(botonUsuarioMenu && dropdownUsuarioMenu){

            botonUsuarioMenu.addEventListener("click", (e)=>{
                e.stopPropagation();
                dropdownUsuarioMenu.classList.contains("abierto")
                    ? cerrarDropdownUsuarioMenu()
                    : abrirDropdownUsuarioMenu();
            });

            document.addEventListener("click", (e)=>{
                if(!dropdownUsuarioMenu.classList.contains("abierto")) return;
                if(e.target.closest("#userMenuWrap")) return;
                cerrarDropdownUsuarioMenu();
            });

            document.addEventListener("keydown", (e)=>{
                if(e.key === "Escape") cerrarDropdownUsuarioMenu();
            });

        }

        // Monedas del usuario, las mismas que se gastan en la tienda.
        // Primero el saldo que guardó la sesión, al instante; luego el
        // de verdad, con ?action=mis-monedas, que devuelve solo ese
        // número. Antes se pedía el catálogo entero de la tienda para
        // leerlo, en cada página. Si el servidor no contesta bien (sin
        // sesión, caída), se queda el que había: un 0 mentiría.
        function cargarMonedasNavbar(nombre){
            if(!nombre) return;

            const spanMonedas = document.getElementById("navMonedas");
            if(spanMonedas){
                const saldoLocal = Number(
                    (window.MRSession && typeof MRSession.get === "function" ? MRSession.get() : usuarioNav)?.monedas
                );
                if(Number.isFinite(saldoLocal)){
                    spanMonedas.textContent = "🪙 " + saldoLocal.toLocaleString("es-ES");
                }
            }

            fetch("/api/content?action=mis-monedas")
                .then(resp => resp.json())
                .then(datos => {
                    if(!datos || !datos.success || datos.monedas == null) return;
                    const saldo = Number(datos.monedas);
                    if(!Number.isFinite(saldo)) return;
                    const span = document.getElementById("navMonedas");
                    if(span) span.textContent = "🪙 " + saldo.toLocaleString("es-ES");

                    if(window.MRSession){
                        const actual = MRSession.get() || {};
                        if(Number(actual.monedas) !== saldo) MRSession.update({ monedas: saldo });
                    }
                })
                .catch(error => {
                    console.warn("MacroReborn: no se pudo cargar el saldo de monedas.", error);
                });
        }

        cargarMonedasNavbar(usuarioNav.nombre);

        // Contador de notificaciones (Neon). Si notificaciones.js está
        // disponible, reutilizamos su caché/coalescing para no pedir la
        // misma lista dos veces en la misma página.
        const cargarContadorNotificaciones = (nombre) => {
            if(!nombre) return;
            const obtener = (window.MRNotifications && typeof MRNotifications.get === "function")
                ? MRNotifications.get(nombre)
                : fetch("/api/content?action=notifications&username=" + encodeURIComponent(nombre))
                    .then(resp => resp.json())
                    .then(datos => (datos && datos.success) ? datos.notificaciones.map(n => ({ leida: n.leida })) : []);

            Promise.resolve(obtener).then(lista => {
                const sinLeer = Array.isArray(lista)
                    ? lista.filter(n => !n.leida).length
                    : 0;
                const span = document.getElementById("contadorNotificaciones");
                if(span) span.textContent = sinLeer > 0 ? sinLeer : "";
            }).catch(error => {
                console.warn("MacroReborn: no se pudo cargar el contador de notificaciones.", error);
            });
        };

        cargarContadorNotificaciones(usuarioNav.nombre);

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

        if(window.MRSession && typeof MRSession.subscribe === "function"){
            MRSession.subscribe(function(detalle){
                const usuarioActual = detalle && detalle.usuario;
                const nombreEl = document.querySelector("#botonUsuarioMenu .user-guest-nombre-text");
                const tituloEl = document.querySelector("#dropdownUsuarioMenu .user-guest-dropdown-header");
                const monedasEl = document.getElementById("navMonedas");

                if(!usuarioActual){
                    return;
                }

                const nombreActual = usuarioActual.nombre || usuarioActual.username;
                if(nombreActual){
                    if(nombreEl) nombreEl.textContent = nombreActual;
                    if(tituloEl) tituloEl.textContent = nombreActual;
                }
                renderAvatarNavbar(usuarioActual);
                renderExperienciaNavbar(usuarioActual);

                // Si la sesión ya trae el saldo nuevo (por ejemplo, después
                // de un pulso de XP), lo pintamos directamente. Solo
                // consultamos el endpoint de la tienda cuando la sesión no
                // tiene un saldo confiable todavía.
                const saldo = Number(usuarioActual.monedas);
                if(monedasEl && Number.isFinite(saldo)){
                    monedasEl.textContent = "🪙 " + saldo.toLocaleString("es-ES");
                }else if(nombreActual){
                    cargarMonedasNavbar(nombreActual);
                }
            });
        }

        if(botonCerrar){

            botonCerrar.addEventListener("click",(e)=>{

                e.preventDefault();

                if (window.MRSession) {
                    MRSession.logout();
                } else {
                    localStorage.removeItem("usuarioActivo");
                    localStorage.removeItem("macroSessionToken");
                }

                window.location.href="index.html";

            });

        }

    }else{

        nav.insertAdjacentHTML("beforeend",`

            <a class="sesion-extra nav-ayuda" href="chat.html" title="¿Necesitás ayuda? Preguntá en el chat">❔</a>

            <div class="user-guest-wrap" id="userGuestWrap">
                <button type="button" class="sesion-extra user-guest-boton" id="botonUsuarioTemporal" aria-haspopup="true" aria-expanded="false">
                    <span class="user-guest-avatar">
                        👤
                        <span class="user-guest-badge">1</span>
                    </span>
                    <span class="user-guest-nombre">Usuario temporal</span>
                </button>

                <div class="user-guest-dropdown" id="dropdownUsuarioTemporal">
                    <div class="user-guest-dropdown-header">
                        <span>Iniciar sesión</span>
                    </div>

                    <form id="formLoginNav" class="user-guest-form" novalidate>
                        <input type="text" id="navLoginUsuario" class="user-guest-input" placeholder="Usuario" autocomplete="username">
                        <input type="password" id="navLoginPassword" class="user-guest-input" placeholder="Contraseña" autocomplete="current-password">
                        <div id="navLoginMensaje" class="user-guest-mensaje" role="alert"></div>
                        <button type="submit" class="user-guest-login-boton">Login</button>
                    </form>

                    <div class="user-guest-dropdown-footer">
                        ¿No tenés cuenta? <a href="registro.html">Registrarse</a>
                    </div>
                </div>
            </div>

        `);

        // ---------- DESPLEGABLE DE "USUARIO TEMPORAL" (login rápido) ----------
        // Mismo patrón que el desplegable de notificaciones de más arriba:
        // se abre/cierra al tocar el botón, se cierra al hacer click afuera
        // o al apretar Escape.

        const botonGuest = document.getElementById("botonUsuarioTemporal");
        const dropdownGuest = document.getElementById("dropdownUsuarioTemporal");

        function cerrarDropdownGuest(){
            if(!dropdownGuest) return;
            dropdownGuest.classList.remove("abierto");
            if(botonGuest) botonGuest.setAttribute("aria-expanded", "false");
        }

        function abrirDropdownGuest(){
            if(!dropdownGuest) return;
            dropdownGuest.classList.add("abierto");
            if(botonGuest) botonGuest.setAttribute("aria-expanded", "true");

            const inputUsuario = document.getElementById("navLoginUsuario");
            if(inputUsuario) inputUsuario.focus();
        }

        if(botonGuest && dropdownGuest){

            botonGuest.addEventListener("click", (e)=>{
                e.stopPropagation();
                dropdownGuest.classList.contains("abierto")
                    ? cerrarDropdownGuest()
                    : abrirDropdownGuest();
            });

            document.addEventListener("click", (e)=>{
                if(!dropdownGuest.classList.contains("abierto")) return;
                if(e.target.closest("#userGuestWrap")) return;
                cerrarDropdownGuest();
            });

            document.addEventListener("keydown", (e)=>{
                if(e.key === "Escape") cerrarDropdownGuest();
            });

        }

        // ---------- LOGIN RÁPIDO DESDE LA NAVBAR ----------
        // Misma llamada a /api/auth?action=login que ya usa js/login.js
        // en login.html: se reutiliza la misma lógica para no duplicar
        // el sistema de autenticación en dos lugares distintos.

        const formLoginNav = document.getElementById("formLoginNav");
        const mensajeLoginNav = document.getElementById("navLoginMensaje");

        function mostrarMensajeLoginNav(texto, tipo){
            if(!mensajeLoginNav) return;

            mensajeLoginNav.textContent = texto;
            mensajeLoginNav.classList.remove("error", "exito", "visible");

            void mensajeLoginNav.offsetWidth;

            mensajeLoginNav.classList.add(tipo, "visible");
        }

        if(formLoginNav){

            formLoginNav.addEventListener("submit", async (e)=>{

                e.preventDefault();

                const usuario = document.getElementById("navLoginUsuario").value.trim();
                const password = document.getElementById("navLoginPassword").value;

                if(!usuario || !password){
                    mostrarMensajeLoginNav("Completá usuario y contraseña", "error");
                    return;
                }

                const botonSubmit = formLoginNav.querySelector(".user-guest-login-boton");
                if(botonSubmit) botonSubmit.disabled = true;

                try{

                    const respuesta = await fetch("/api/auth?action=login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: usuario, password: password })
                    });

                    const datos = await respuesta.json();

                    if(datos.success){

                        // Mismo normalizado que usa js/login.js, para que el
                        // resto del sitio (navbar, chat, ranking, favoritos...)
                        // siga leyendo "nombre" y "nivel" sin adaptarse.
                        const usuarioNormalizado = {
                            ...datos.user,
                            nombre: datos.user.username,
                            nivel: datos.user.level
                        };

                        if (datos.token) localStorage.setItem("macroSessionToken", datos.token);
                        if (window.MRSession) {
                            MRSession.set(usuarioNormalizado);
                        } else {
                            localStorage.setItem("usuarioActivo", JSON.stringify(usuarioNormalizado));
                        }

                        mostrarMensajeLoginNav("Bienvenido " + datos.user.username, "exito");

                        setTimeout(()=>{ window.location.reload(); }, 600);

                    }else{

                        mostrarMensajeLoginNav(datos.error || "No se pudo iniciar sesión", "error");
                        if(botonSubmit) botonSubmit.disabled = false;

                    }

                }catch(error){

                    mostrarMensajeLoginNav("Error de conexión", "error");
                    if(botonSubmit) botonSubmit.disabled = false;

                }

            });

        }

    }

}