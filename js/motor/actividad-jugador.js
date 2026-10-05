// ==============================
// ¿HAY ALGUIEN JUGANDO? — js/motor/actividad-jugador.js
// ==============================
// Decidido el 04/10/2026 (docs/referencia/ECONOMIA.md): un minuto de juego solo
// cuenta -para el XP, el ranking, la racha y las monedas- si en los
// últimos 3 minutos alguien tocó el teclado, el ratón o la pantalla.
// Hasta ese día bastaba con tener la pestaña a la vista, y en los
// registros había días de 24 horas "jugadas" con la página abierta y
// nadie delante. Es lo mismo que hacía macrojuegos.
//
// Se escucha en la página y también DENTRO del juego: 108 de los 112
// juegos se sirven desde la propia web, así que el iframe es del mismo
// origen y se le pueden poner oídos (vigilarJuego, que llama
// js/jugar.js). En los otros cuatro el navegador no deja ver nada de lo
// que pasa dentro. Ahí cuenta entrar al juego (el foco se va al iframe),
// y vale diez minutos: para seguir contando hay que volver a entrar, o
// tocar algo fuera.
//
// js/motor/xp.js le pregunta antes de mandar cada pulso (hayAlguien).
// Esto no impide trucos de quien sepa escribir un script: el servidor
// sigue contando un minuto por minuto como mucho (migración 024), y las
// monedas por jugar dejan de crecer a las 4 horas del día
// (api/_monedas.js).

(function () {
  "use strict";

  const MS_SIN_NADA = 3 * 60 * 1000;
  const MS_JUEGO_EXTERNO = 10 * 60 * 1000;
  const EVENTOS = ["keydown", "pointerdown", "pointermove", "mousedown", "mousemove", "wheel", "touchstart"];

  function crearVigilante(ventana, ahora) {
    ahora = ahora || (() => Date.now());

    // Al cargar la página cuenta como actividad: para llegar aquí alguien
    // pulsó Jugar.
    let ultima = ahora();
    let externoDesde = 0;

    const marcar = () => { ultima = ahora(); };

    function escuchar(objetivo) {
      for (const tipo of EVENTOS) {
        objetivo.addEventListener(tipo, marcar, { capture: true, passive: true });
      }
    }

    function esDeEstaWeb(iframe) {
      try {
        return !!(iframe.contentWindow && iframe.contentWindow.document);
      } catch (_) {
        return false;
      }
    }

    // Poner oídos dentro del juego. El iframe estrena ventana cada vez que
    // carga, y con ella se van los oídos: se vuelven a poner en cada load.
    function vigilarJuego(iframe) {
      if (!iframe) return;
      const enganchar = () => {
        try {
          const w = iframe.contentWindow;
          if (w && w.document && !w.__mrVigilado) {
            w.__mrVigilado = true;
            escuchar(w);
          }
        } catch (_) {
          // De otra web: no se puede mirar dentro. Ver la cabecera.
        }
      };
      iframe.addEventListener("load", enganchar);
      enganchar();
    }

    // Entrar en un juego de otra web: la ventana pierde el foco y el
    // elemento activo pasa a ser su iframe.
    function alPerderElFoco() {
      const activo = ventana.document.activeElement;
      if (activo && activo.tagName === "IFRAME" && !esDeEstaWeb(activo)) {
        externoDesde = ahora();
        marcar();
      }
    }

    function hayAlguien() {
      const t = ahora();
      if (t - ultima <= MS_SIN_NADA) return true;
      const activo = ventana.document.activeElement;
      return externoDesde > 0 && !!activo && activo.tagName === "IFRAME" &&
        t - externoDesde <= MS_JUEGO_EXTERNO;
    }

    escuchar(ventana);
    ventana.addEventListener("blur", alPerderElFoco);
    ventana.addEventListener("focus", () => { externoDesde = 0; });

    return { hayAlguien, vigilarJuego, marcar, alPerderElFoco, ultimaActividad: () => ultima };
  }

  if (typeof window !== "undefined") {
    window.MRActividad = crearVigilante(window);
    window.MRActividad.crearVigilante = crearVigilante;
  }
})();
