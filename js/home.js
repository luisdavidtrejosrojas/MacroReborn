// ============================================================================
// MACROREBORN — HOME PORTAL
// Convierte la portada en un centro de descubrimiento sin reemplazar los
// sistemas existentes de sesión, favoritos, historial, XP o comunidad.
// ============================================================================
(function () {
  function listaJuegos() {
    return (typeof juegos !== "undefined" && Array.isArray(juegos)) ? juegos : [];
  }

  function escapar(texto) {
    return (texto || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tarjeta(juego, variante) {
    if (!juego) return "";
    const badge = juego.estado || (variante === "nuevo" ? "🆕 Nuevo" : juego.categoria);
    return `
      <article class="portal-juego-card ${variante ? `portal-juego-card-${variante}` : ""}">
        <a href="juego.html?id=${encodeURIComponent(juego.id)}" class="portal-juego-link" aria-label="Jugar ${escapar(juego.nombre)}">
          <div class="portal-juego-imagen">
            ${typeof crearImagenJuego === "function" ? crearImagenJuego(juego) : `<img src="${escapar(juego.imagen || "imagenes/logo.png")}" alt="${escapar(juego.nombre)}">`}
            <span class="portal-juego-badge">${escapar(badge)}</span>
            <span class="portal-juego-overlay"><span>▶ Jugar</span></span>
          </div>
          <div class="portal-juego-info">
            <h3>${escapar(juego.nombre)}</h3>
            <span class="portal-juego-meta">${escapar(juego.categoria || "Juegos")}</span>
          </div>
        </a>
      </article>`;
  }

  function render(seccionId, items, variante, limite) {
    const el = document.getElementById(seccionId);
    if (!el) return;
    const lista = (items || []).slice(0, limite || 6);
    el.innerHTML = lista.length
      ? lista.map(j => tarjeta(j, variante)).join("")
      : `<div class="portal-vacio">Todavía no hay juegos para mostrar en esta sección.</div>`;
    const seccion = el.closest(".portal-seccion");
    if (seccion) seccion.hidden = lista.length === 0;
  }

  function idsDesdeHistorial(datos) {
    const ids = (datos && Array.isArray(datos.historial)) ? datos.historial.map(String) : [];
    const mapa = new Map(listaJuegos().map(j => [String(j.id), j]));
    return ids.map(id => mapa.get(id)).filter(Boolean);
  }

  async function cargarHistorial() {
    const activo = typeof leerJSON === "function"
      ? leerJSON(localStorage.getItem("usuarioActivo") || "null")
      : null;
    if (!activo || !activo.nombre) return [];

    try {
      const resp = await fetch("/api/content?action=game-history&username=" + encodeURIComponent(activo.nombre));
      const datos = await resp.json();
      return idsDesdeHistorial(datos);
    } catch (error) {
      console.warn("MacroReborn: no se pudo cargar el historial para la Home.", error);
      return [];
    }
  }

  async function cargarResumen() {
    try {
      const resp = await fetch("/api/content?action=games-overview");
      const datos = await resp.json();
      return datos && datos.success ? (datos.juegos || {}) : {};
    } catch (error) {
      return {};
    }
  }

  function ordenarPorResumen(resumen, campo, fallback) {
    const mapa = resumen || {};
    return listaJuegos().slice().sort((a, b) => {
      const va = Number((mapa[String(a.id)] || {})[campo] || 0);
      const vb = Number((mapa[String(b.id)] || {})[campo] || 0);
      if (vb !== va) return vb - va;
      return fallback(a, b);
    });
  }

  function fechaNueva(a, b) {
    const an = Number(a.id) || 0;
    const bn = Number(b.id) || 0;
    return bn - an;
  }

  function inicializar() {
    const lista = listaJuegos();
    const count = document.getElementById("homeTotalJuegos");
    if (count) count.textContent = lista.length;

    render("homeDestacados", lista.filter(j => j.tipo === "destacado"), "destacado", 6);
    render("homeNuevos", lista.slice().sort(fechaNueva), "nuevo", 6);

    cargarResumen().then(resumen => {
      render("homeTrending", ordenarPorResumen(resumen, "tendencia", fechaNueva), "trending", 6);
      render("homeMasJugados", ordenarPorResumen(resumen, "partidas", fechaNueva), "jugado", 6);
      render("homeMejorValorados", ordenarPorResumen(resumen, "promedio", (a, b) => fechaNueva(a, b)), "valorado", 6);
    });

    cargarHistorial().then(historial => {
      render("homeContinuar", historial, "continuar", 5);
      const seccion = document.getElementById("homeContinuar")?.closest(".portal-seccion");
      if (seccion) seccion.hidden = historial.length === 0;
    });

    const categorias = document.getElementById("homeCategorias");
    if (categorias) {
      const conteos = lista.reduce((acc, juego) => {
        const cat = juego.categoria || "Otros";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      categorias.innerHTML = Object.entries(conteos)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, total]) => `
          <a class="portal-categoria-card" href="juegos.html?categoria=${encodeURIComponent(cat)}">
            <span class="portal-categoria-icon">🎮</span>
            <span><strong>${escapar(cat)}</strong><small>${total} juegos</small></span>
          </a>`)
        .join("");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar);
  } else {
    inicializar();
  }
})();
