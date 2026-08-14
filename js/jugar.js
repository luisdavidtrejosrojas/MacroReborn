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
