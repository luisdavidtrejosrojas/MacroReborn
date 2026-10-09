// ==============================
// LOS JUEGOS, EN SU PROPIA DIRECCIÓN: EL NAVEGADOR — js/motor/juegos-aparte.js
// ==============================
// Los juegos de terceros se abren desde juegos.macroreborn.com, otro origen
// que la web, para que su código no pueda leer la sesión ni tocar la página
// (punto 1 de docs/listas/AUDITORIA.md, specs/008-aislar-juegos). El
// servidor, api/_juegos-aparte.js; aquí, lo que necesita la página de jugar:
//
//   origen(location)    dónde están los juegos: en la web,
//                       https://juegos.macroreborn.com; en el PC
//                       (localhost o 127.0.0.1), el mismo nombre con el
//                       puerto siguiente, que es lo que abre
//                       scripts/servidor-local.js.
//   tipo(juego)         "terceros", "propio" (Macro Snake, del equipo, que
//                       se queda en la web) u "otra-web" (los que ya se
//                       abren desde su propia web).
//   direccion(juego)    el src del marco: los de terceros, en la dirección
//                       de los juegos; los demás, como hoy.
//   marco(juego)        el sandbox y el allow del marco
//                       (specs/008-aislar-juegos/contracts/marco-del-juego.md).
//
// El sandbox no lleva allow-top-navigation: un juego no puede llevarse la
// página a otra dirección. Lleva allow-same-origin para que cada juego
// conserve su origen y pueda guardar partidas; junto con allow-scripts solo
// sería peligroso en un marco del mismo origen que la página, que podría
// quitarse el sandbox, y aquí nunca lo es. Macro Snake no lleva sandbox: es
// de la misma web y del equipo, y no le pondría ningún límite.

(function () {
  "use strict";

  const DIRECCION_DE_LOS_JUEGOS = "https://juegos.macroreborn.com";
  const NOMBRES_LOCALES = ["localhost", "127.0.0.1"];

  // Los juegos del equipo. La misma lista está en api/_juegos-aparte.js, y
  // una prueba vigila que coincidan.
  const PROPIOS = ["macro-snake"];

  const SANDBOX = [
    "allow-scripts", "allow-same-origin", "allow-forms", "allow-pointer-lock", "allow-popups",
    "allow-popups-to-escape-sandbox", "allow-modals", "allow-downloads", "allow-orientation-lock",
    "allow-presentation"
  ].join(" ");
  // Un marco de otro origen no hereda de la página los mandos ni el sonido.
  const ALLOW = "fullscreen; gamepad; autoplay";

  function origen(ubicacion) {
    const u = ubicacion || window.location;
    if (NOMBRES_LOCALES.includes(u.hostname)) {
      const puerto = Number(u.port) || (u.protocol === "https:" ? 443 : 80);
      return u.protocol + "//" + u.hostname + ":" + (puerto + 1);
    }
    return DIRECCION_DE_LOS_JUEGOS;
  }

  function tipo(juego) {
    const marco = String((juego && juego.iframe) || "");
    if (/^https?:\/\//i.test(marco)) return "otra-web";
    const archivo = /(?:^|\/)html\/juegos\/([^/?#]+)\.html$/.exec(marco);
    if (!archivo) return "sin-marco";
    return PROPIOS.includes(archivo[1]) ? "propio" : "terceros";
  }

  function direccion(juego, ubicacion) {
    const marco = String((juego && juego.iframe) || "");
    if (tipo(juego) !== "terceros") return marco;
    return origen(ubicacion) + "/" + marco.replace(/^\.?\//, "");
  }

  function marco(juego) {
    const t = tipo(juego);
    return t === "terceros" || t === "otra-web" ? { sandbox: SANDBOX, allow: ALLOW } : null;
  }

  window.MRJuegosAparte = { origen, tipo, direccion, marco, PROPIOS, SANDBOX, ALLOW };
})();
