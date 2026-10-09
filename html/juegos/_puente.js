// ==============================
// EL PUENTE DE LA ACTIVIDAD — html/juegos/_puente.js
// ==============================
// Corre DENTRO de cada juego de terceros, en su propia dirección: el
// servidor lo mete en línea al principio de cada envoltorio
// (api/_juegos-aparte.js). Un minuto de juego solo cuenta si en los últimos
// tres alguien tocó algo (js/motor/actividad-jugador.js), y la página de
// jugar ya no puede escuchar dentro del juego, porque es de otro origen.
// Así que el juego le avisa: con teclado, ratón, rueda o pantalla, como
// mucho una vez cada 5 segundos, le manda { tipo: "mr-actividad" }.
//
// El destino es "*" porque el juego no sabe si la página es macroreborn.com
// o www, y el aviso no lleva nada. Quien decide si lo cree es la página: solo
// de la dirección de los juegos y de la ventana de ese marco
// (specs/008-aislar-juegos/contracts/mensajes.md).

(function () {
  "use strict";

  // Abierto solo, fuera de la página de jugar, no hay a quién avisar.
  if (window.parent === window) return;

  const CADA_MS = 5000;
  const EVENTOS = ["keydown", "pointerdown", "pointermove", "mousedown", "mousemove", "wheel", "touchstart"];
  let ultimo = -Infinity;

  function avisar() {
    const ahora = Date.now();
    if (ahora - ultimo < CADA_MS) return;
    ultimo = ahora;
    try {
      window.parent.postMessage({ tipo: "mr-actividad" }, "*");
    } catch (error) {
      console.warn("MacroReborn: no se pudo avisar a la página de que alguien juega.", error);
    }
  }

  for (const tipo of EVENTOS) {
    window.addEventListener(tipo, avisar, { capture: true, passive: true });
  }
})();
