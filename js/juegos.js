// ============================================================================
// MACROREBORN — CATÁLOGO / DESCUBRIMIENTO
// Mantiene la renderización existente y añade filtros, búsqueda por URL y
// ordenamiento usando los datos reales del catálogo.
// ============================================================================
(function () {
  const destac = document.querySelector("#juegosDestacados");
  const nuevos = document.querySelector("#juegosNuevos");
  const todos = document.querySelector("#listaJuegos");
  const filtros = document.querySelector("#filtrosJuegos");
  const resultadosInfo = document.querySelector("#infoResultadosJuegos");
  const categoriaSelect = document.querySelector("#filtroCategoria");
  const ordenSelect = document.querySelector("#filtroOrden");
  const busquedaInput = document.querySelector("#filtroBusquedaJuegos");

  const lista = (typeof juegos !== "undefined" && Array.isArray(juegos)) ? juegos : [];
  let resumen = {};

  function escapar(texto) {
    return (texto || "").toString()
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function etiquetasJuego(juego) {
    const datos = resumen[String(juego.id)] || {};
    const etiquetas = [];
    if (juego.tipo === "destacado") etiquetas.push({ clase: "destacado", texto: "⭐ Destacado" });
    if (Number(datos.tendencia || 0) >= 15) etiquetas.push({ clase: "trending", texto: "🔥 Trending" });
    if (Number(datos.partidas || 0) >= 100) etiquetas.push({ clase: "popular", texto: "👑 Popular" });
    if (juego.estado && /nuevo/i.test(String(juego.estado))) etiquetas.push({ clase: "nuevo", texto: "🆕 Nuevo" });
    return etiquetas.slice(0, 2);
  }

  function crearJuego(juego){
    const tags = etiquetasJuego(juego);
    const datos = resumen[String(juego.id)] || {};
    return `
      <article class="juego-card" data-juego-id="${escapar(juego.id)}">
        <a href="juego.html?id=${encodeURIComponent(juego.id)}" class="juego-card-link" aria-label="Ver ${escapar(juego.nombre)}">
          <div class="juego-card-top">
            <span class="badge-categoria">${escapar(juego.categoria || "Juegos")}</span>
            <span class="badge-estado">${escapar(juego.estado || "🎮 Jugar")}</span>
          </div>
          <div class="juego-imagen">
            ${typeof crearImagenJuego === "function" ? crearImagenJuego(juego) : "🎮"}
            ${tags.length ? `<div class="juego-card-tags">${tags.map(tag => `<span class="juego-card-tag ${tag.clase}">${tag.texto}</span>`).join("")}</div>` : ""}
            <span class="juego-hover-accion">▶ Jugar</span>
          </div>
          <div class="juego-card-contenido">
            <h3>${escapar(juego.nombre)}</h3>
            <p class="juego-descripcion-corta">${escapar(juego.descripcion)}</p>
            <div class="juego-card-meta">
              <span>🎮 ${Number(datos.partidas || 0).toLocaleString("es-AR")} partidas</span>
              <span>⭐ ${Number(datos.promedio || 0).toFixed(1)}</span>
            </div>
            <span class="juego-card-cta" aria-hidden="true">🎮 Ver juego</span>
          </div>
        </a>
      </article>`;
  }

  function fechaFallback(a, b) { return (Number(b.id)||0) - (Number(a.id)||0); }

  function ordenar(items, criterio) {
    const arr = items.slice();
    switch (criterio) {
      case "jugados": return arr.sort((a,b) => ((resumen[String(b.id)]||{}).partidas||0) - ((resumen[String(a.id)]||{}).partidas||0) || fechaFallback(a,b));
      case "valorados": return arr.sort((a,b) => ((resumen[String(b.id)]||{}).promedio||0) - ((resumen[String(a.id)]||{}).promedio||0) || fechaFallback(a,b));
      case "favoritos": return arr.sort((a,b) => ((resumen[String(b.id)]||{}).favoritos||0) - ((resumen[String(a.id)]||{}).favoritos||0) || fechaFallback(a,b));
      case "trending": return arr.sort((a,b) => ((resumen[String(b.id)]||{}).tendencia||0) - ((resumen[String(a.id)]||{}).tendencia||0) || fechaFallback(a,b));
      case "nuevos": return arr.sort((a,b) => fechaFallback(a,b));
      case "az": return arr.sort((a,b) => a.nombre.localeCompare(b.nombre, "es"));
      default: return arr;
    }
  }

  function renderSeccion(el, items) {
    if (!el) return;
    el.innerHTML = items.map(crearJuego).join("");
    const section = el.closest(".seccion-juegos");
    if (section) section.hidden = items.length === 0;
  }

  function poblarCategorias() {
    if (!categoriaSelect) return;
    const categorias = [...new Set(lista.map(j => j.categoria).filter(Boolean))].sort((a,b) => a.localeCompare(b,"es"));
    categoriaSelect.innerHTML = '<option value="">Todas las categorías</option>' + categorias.map(c => `<option value="${escapar(c)}">${escapar(c)}</option>`).join("");
  }

  function aplicar() {
    const params = new URLSearchParams(location.search);
    const q = ((busquedaInput ? busquedaInput.value : params.get("q")) || "").trim().toLowerCase();
    const categoria = (categoriaSelect ? categoriaSelect.value : params.get("categoria")) || "";
    const orden = (ordenSelect ? ordenSelect.value : params.get("orden")) || "destacados";

    let filtrados = lista.filter(j => {
      const texto = [j.nombre, j.categoria, j.descripcion].join(" ").toLowerCase();
      return (!q || texto.includes(q)) && (!categoria || j.categoria === categoria);
    });

    filtrados = ordenar(filtrados, orden);

    if (resultadosInfo) resultadosInfo.innerHTML = `<strong>${filtrados.length}</strong> juegos encontrados${q ? ` para <b>“${escapar(q)}”</b>` : ""}`;
    if (todos) todos.innerHTML = filtrados.map(crearJuego).join("");

    const secDest = document.getElementById("seccionDestacados");
    const secNuev = document.getElementById("seccionNuevos");
    const esFiltro = Boolean(q || categoria || orden !== "destacados");
    if (secDest) secDest.hidden = esFiltro;
    if (secNuev) secNuev.hidden = esFiltro;
    if (todos) todos.closest(".seccion-juegos").hidden = filtrados.length === 0;
  }

  async function cargarResumen() {
    try {
      const resp = await fetch("/api/content?action=games-overview");
      const datos = await resp.json();
      if (datos && datos.success && datos.juegos) resumen = datos.juegos;
    } catch (_) {}
    renderSeccion(destac, lista.filter(j => j.tipo === "destacado").slice(0, 6));
    renderSeccion(nuevos, ordenar(lista, "nuevos").slice(0, 6));
    aplicar();
    document.dispatchEvent(new CustomEvent("macroreborn:catalogo-listo", { detail: { juegos: lista, resumen } }));
  }

  function inicializar() {
    poblarCategorias();
    const params = new URLSearchParams(location.search);
    if (busquedaInput) busquedaInput.value = params.get("q") || "";
    if (categoriaSelect) categoriaSelect.value = params.get("categoria") || "";
    if (ordenSelect) ordenSelect.value = params.get("orden") || "destacados";

    [categoriaSelect, ordenSelect].forEach(el => el && el.addEventListener("change", aplicar));
    if (busquedaInput) busquedaInput.addEventListener("input", aplicar);

    const total = document.getElementById("statTotalJuegos");
    if (total) total.textContent = lista.length;
    cargarResumen();

    if (typeof seoInyectarJSONLD === "function") {
      seoInyectarJSONLD("ldJsonCatalogo", {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Catálogo de juegos de MacroReborn",
        "itemListElement": lista.map((juego, indice) => ({
          "@type": "ListItem",
          "position": indice + 1,
          "url": SEO_SITE + "/juego.html?id=" + juego.id,
          "name": juego.nombre
        }))
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicializar); else inicializar();
})();
