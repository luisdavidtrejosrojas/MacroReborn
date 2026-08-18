// =========================
// MACROREBORN - JUGAR
// =========================

const parametros = new URLSearchParams(window.location.search);

const idJuego = Number(parametros.get("id"));

const juego = juegos.find(j => j.id === idJuego);

const contenedor = document.getElementById("contenedorJuego");

if (!juego) {

    contenedor.innerHTML = `
        <h2>❌ Juego no encontrado.</h2>
    `;

    throw new Error("Juego no encontrado");

}

document.getElementById("tituloJuego").textContent =
    "🎮 " + juego.nombre;

// Registra el juego en el reto diario (solo para mostrar progreso local).
if (typeof registrarJuegoRetoDiario === "function") {
    registrarJuegoRetoDiario(idJuego);
}

// SEO: título de pestaña real por juego y canonical apuntando a la
// ficha (juego.html), que es la página "de verdad" indexable para
// este juego. jugar.html queda noindex (ver <head>): esto solo evita
// que, si igual la llega a ver un bot, señale contenido duplicado.
if (typeof seoActualizar === "function") {
    seoActualizar({
        titulo: "Jugando a " + juego.nombre + " | MacroReborn",
        url: SEO_SITE + "/juego.html?id=" + idJuego,
        imagen: seoUrlAbsoluta(juego.imagen)
    });
}

// Botón "Volver a la ficha" — puramente visual/de navegación,
// reutiliza el id ya obtenido de la URL. No agrega datos nuevos.
try {
    const volverFicha = document.getElementById("volverFicha");
    if (volverFicha) {
        volverFicha.href = "juego.html?id=" + idJuego;
    }
} catch (e) {}


// =========================
// CARGAR JUEGO
// =========================

if (juego.iframe) {

    contenedor.innerHTML = `
        <iframe
            src="${juego.iframe}"
            width="100%"
            height="100%"
            frameborder="0"
            allowfullscreen
            loading="lazy">
        </iframe>
    `;

    // ==============================
    // ESTADO DE CARGA (overlay) — puramente visual/aditivo.
    // Oculta el overlay de "Cargando..." cuando el iframe termina
    // de cargar. No modifica el iframe en sí ni su origen.
    // ==============================
    try {
        const overlay = document.getElementById("overlayCarga");
        const iframeEl = contenedor.querySelector("iframe");
        if (overlay && iframeEl) {
            iframeEl.addEventListener("load", () => {
                overlay.classList.add("oculto");
            });
        } else if (overlay) {
            overlay.classList.add("oculto");
        }
    } catch (e) {}

}
else {

    contenedor.innerHTML = `
        <h2>⚠️ Este juego todavía no está disponible.</h2>
    `;

    try {
        const overlay = document.getElementById("overlayCarga");
        if (overlay) overlay.classList.add("oculto");
    } catch (e) {}

}


// =========================
// XP (si existe el sistema)
// =========================
// Se le pasa idJuego para que, además de sumar XP cada 1 minuto
// jugado, ese mismo pulso cuente como tiempo jugado a ESTE juego
// puntual (lo usa el ranking semanal — ver js/motor/xp.js).

if (typeof iniciarXP === "function") {

    iniciarXP(idJuego);

}

// =========================
// EXPERIENCIA DE SESIÓN + POST-PARTIDA
// =========================

(function inicializarExperienciaJuego(){
    const resumenNombre = document.getElementById("resumenNombreJuego");
    const resumenCategoria = document.getElementById("resumenCategoria");
    const tiempoSesion = document.getElementById("tiempoSesion");
    const botonFullscreen = document.getElementById("botonPantallaCompleta");
    const botonCompartir = document.getElementById("botonCompartirJuego");
    const botonTermine = document.getElementById("botonTermine");
    const botonVerFicha = document.getElementById("botonVerFicha");
    const panelPost = document.getElementById("panelPostJuego");
    const cerrarPost = document.getElementById("cerrarPostJuego");
    const postMismo = document.getElementById("postJugarMismo");
    const postFicha = document.getElementById("postVerFicha");
    const resumenFin = document.getElementById("resumenFinSesion");
    const relacionados = document.getElementById("juegosRelacionados");
    const pantallaJuego = document.querySelector(".pantalla-juego");

    if (!juego) return;

    if (resumenNombre) resumenNombre.textContent = juego.nombre;
    if (resumenCategoria) resumenCategoria.textContent = juego.categoria || "General";

    const fichaUrl = "juego.html?id=" + juego.id;
    if (botonVerFicha) botonVerFicha.href = fichaUrl;
    if (postMismo) postMismo.href = "jugar.html?id=" + juego.id;
    if (postFicha) postFicha.href = fichaUrl;

    const inicioSesion = Date.now();
    let intervaloSesion = null;

    function formatearTiempo(ms){
        const segundos = Math.max(0, Math.floor(ms / 1000));
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        return String(min).padStart(2, "0") + ":" + String(seg).padStart(2, "0");
    }

    function actualizarTiempo(){
        if (tiempoSesion) tiempoSesion.textContent = formatearTiempo(Date.now() - inicioSesion);
    }

    actualizarTiempo();
    intervaloSesion = setInterval(actualizarTiempo, 1000);

    window.addEventListener("beforeunload", () => {
        if (intervaloSesion) clearInterval(intervaloSesion);
    }, { once: true });

    botonFullscreen?.addEventListener("click", async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                botonFullscreen.textContent = "⛶ Pantalla completa";
                return;
            }
            if (pantallaJuego?.requestFullscreen) {
                await pantallaJuego.requestFullscreen();
                botonFullscreen.textContent = "⛶ Salir de pantalla completa";
            }
        } catch (error) {
            console.warn("MacroReborn: pantalla completa no disponible.", error);
        }
    });

    document.addEventListener("fullscreenchange", () => {
        if (!botonFullscreen) return;
        botonFullscreen.textContent = document.fullscreenElement
            ? "⛶ Salir de pantalla completa"
            : "⛶ Pantalla completa";
    });

    botonCompartir?.addEventListener("click", async () => {
        const data = {
            title: juego.nombre + " | MacroReborn",
            text: "Estoy jugando " + juego.nombre + " en MacroReborn",
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(data);
                return;
            }
            await navigator.clipboard.writeText(window.location.href);
            botonCompartir.textContent = "✓ Enlace copiado";
            setTimeout(() => botonCompartir.textContent = "↗ Compartir", 1800);
        } catch (error) {
            if (error?.name !== "AbortError") {
                console.warn("MacroReborn: no se pudo compartir el juego.", error);
            }
        }
    });

    botonTermine?.addEventListener("click", () => {
        const minutos = Math.max(1, Math.round((Date.now() - inicioSesion) / 60000));
        if (resumenFin) {
            resumenFin.textContent = "Sesión de " + minutos + (minutos === 1 ? " minuto" : " minutos") + ". El historial, XP y reto diario siguen usando los sistemas existentes de MacroReborn.";
        }
        if (panelPost) {
            panelPost.hidden = false;
            panelPost.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    });

    cerrarPost?.addEventListener("click", () => {
        if (panelPost) panelPost.hidden = true;
    });

    // Recomendaciones: prioridad a la misma categoría y después al resto del catálogo.
    if (relacionados && Array.isArray(juegos)) {
        const relacionadosLista = juegos
            .filter(j => j.id !== juego.id)
            .sort((a, b) => {
                const score = item => {
                    let valor = 0;
                    if (item.categoria === juego.categoria) valor += 100;
                    if (item.tipo === "destacado") valor += 25;
                    if (item.estado?.includes("Nuevo")) valor += 8;
                    return valor;
                };
                return score(b) - score(a);
            })
            .slice(0, 4);

        relacionados.innerHTML = relacionadosLista.map(item => `
            <a class="tarjeta-relacionada" href="juego.html?id=${item.id}">
                <div class="tarjeta-relacionada-imagen">
                    <img src="${item.imagen}" alt="${item.nombre}" loading="lazy">
                </div>
                <div class="tarjeta-relacionada-contenido">
                    <h3>${item.nombre}</h3>
                    <p>${item.categoria || "General"}</p>
                </div>
            </a>
        `).join("");
    }
})();
