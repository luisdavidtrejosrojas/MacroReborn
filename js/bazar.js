// ================================================================
// BAZAR — js/bazar.js
// ================================================================
// La tienda de prendas del sitio (bazar.html). El diseño es el del Bazar
// que mandó el otro dev en su zip del 22/09/2026; el 28/09/2026 se eligió
// frente a la tienda anterior, y tienda.html redirige aquí.
//
// Lo que ya hacía la tienda y el Bazar conserva (docs/TIENDA.md):
//
//   - Todo sale de GET /api/content?action=avatar-shop: el catálogo (solo
//     lo publicado, de lo más nuevo a lo más viejo) y, con sesión, el
//     saldo y lo que ya se compró. De cada prenda se enseña su
//     previsualización, nunca el dibujo suelto, que es el arte del equipo
//     (desde el 24/09/2026 /prendas/ solo sirve con firma).
//   - Comprar pregunta antes y después ofrece ponérsela:
//     perfil.html?ponerse=<valor> abre el editor con la prenda puesta.
//   - bazar.html?prenda=<valor> enseña esa prenda y pregunta si se puede
//     comprar. Así llega quien pulsa una prenda con candado en el editor
//     o "Comprar" en el escaparate de Comunidad.
//
// Filtrar y buscar se hace aquí, sin volver al servidor: son unas 750
// prendas, y se pintan de a POR_PAGINA con "Ver más".

(function () {
  "use strict";

  const POR_PAGINA = 24;
  // "Nueva" durante una semana.
  const DIAS_NUEVA = 7;

  const els = {
    grid: document.getElementById("bazarGrid"),
    contador: document.getElementById("bazarContador"),
    saldo: document.getElementById("bazarSaldo"),
    saldoNota: document.getElementById("bazarSaldoNota"),
    buscar: document.getElementById("bazarBuscar"),
    categoria: document.getElementById("bazarCategoria"),
    modelo: document.getElementById("bazarModelo"),
    mostrarCompradas: document.getElementById("bazarMostrarCompradas"),
    destacado: document.getElementById("bazarDestacado"),
    verMas: document.getElementById("bazarVerMas"),
    modal: document.getElementById("bazarModalBackdrop"),
    modalImagen: document.getElementById("bazarModalImagen"),
    modalTitulo: document.getElementById("bazarModalTitulo"),
    modalDescripcion: document.getElementById("bazarModalDescripcion"),
    modalConfirmacion: document.getElementById("bazarModalConfirmacion"),
    modalCerrar: document.getElementById("bazarModalCerrar"),
    modalConfirmar: document.getElementById("bazarModalConfirmar"),
    toast: document.getElementById("bazarToast")
  };
  if (!els.grid) return;

  const estado = {
    items: [],
    comprados: new Set(),   // ids de avatar_shop_items
    monedas: null,          // null: sin sesión, o una que el servidor no reconoce
    mostrados: POR_PAGINA,
    itemModal: null,
    modalModo: "comprar",   // "comprar" | "comprada"
    cargandoCompra: false
  };

  const esc = (valor) => MRTexto.escapar(valor);
  const fmtMonedas = (valor) => Number(valor || 0).toLocaleString("es-AR");
  const precio = (item) => Math.max(0, Number(item && item.precio) || 0);
  const conSesion = () => estado.monedas !== null;
  const laTiene = (item) => estado.comprados.has(Number(item.id));
  const enlacePonerse = (item) => "perfil.html?ponerse=" + encodeURIComponent(item.valorCapa);
  // Entrar y volver aquí (js/login.js acepta ?volver=).
  const ENLACE_LOGIN = "login.html?volver=bazar.html";

  function sesionLocal() {
    return !!(window.MRSession && typeof MRSession.isLogged === "function" && MRSession.isLogged());
  }

  function nombreCategoria(valor) {
    const nombres = {
      pelo: "Pelo", ojos: "Ojos", cara: "Cara", piel: "Piel", boca: "Boca",
      botas: "Botas", pantalon: "Pantalón", remera: "Remera", guantes: "Guantes",
      accesorio: "Accesorio", mascota: "Mascota", borde: "Borde", fondo: "Fondo", espalda: "Espalda"
    };
    return nombres[String(valor || "").toLowerCase()] || String(valor || "Prenda");
  }

  function nombrePersonaje(modelo) {
    const m = String(modelo || "");
    return m ? m.charAt(0).toUpperCase() + m.slice(1) : "Avatar";
  }

  function esNueva(item) {
    const creada = Date.parse(item && item.creadoEl);
    return Number.isFinite(creada) && Date.now() - creada <= DIAS_NUEVA * 24 * 60 * 60 * 1000;
  }

  function imagen(item, atributos) {
    return item.previsualizacion
      ? `<img src="${esc(item.previsualizacion)}" alt="${esc(item.nombre)}" ${atributos || ""}>`
      : '<span aria-hidden="true">👕</span>';
  }

  // ---------- EL SALDO ----------

  function actualizarSaldo() {
    if (els.saldo) els.saldo.textContent = "🪙 " + fmtMonedas(conSesion() ? estado.monedas : 0);
    if (els.saldoNota) {
      els.saldoNota.textContent = conSesion()
        ? "Disponible para tus próximas compras"
        : sesionLocal()
          ? "Tu sesión caducó. Volvé a iniciarla para comprar."
          : "Iniciá sesión para comprar";
    }
  }

  // El saldo nuevo, también en la barra de navegación y en la sesión.
  function avisarSaldo(monedas) {
    const barra = document.getElementById("navMonedas");
    if (barra) barra.textContent = "🪙 " + fmtMonedas(monedas);
    if (window.MRSession && typeof MRSession.update === "function") MRSession.update({ monedas });
  }

  // ---------- LOS FILTROS ----------

  function poblarSelectores() {
    const categorias = [...new Set(estado.items.map(i => i.categoria).filter(Boolean))]
      .sort((a, b) => nombreCategoria(a).localeCompare(nombreCategoria(b), "es"));
    const modelos = [...new Set(estado.items.map(i => i.modelo).filter(Boolean))].sort();
    if (els.categoria) {
      els.categoria.innerHTML = '<option value="">Todas las categorías</option>' +
        categorias.map(v => `<option value="${esc(v)}">${esc(nombreCategoria(v))}</option>`).join("");
    }
    if (els.modelo) {
      els.modelo.innerHTML = '<option value="">Todos los personajes</option>' +
        modelos.map(v => `<option value="${esc(v)}">${esc(nombrePersonaje(v))}</option>`).join("");
    }
  }

  function itemsFiltrados() {
    const q = String(els.buscar && els.buscar.value || "").trim().toLowerCase();
    const categoria = String(els.categoria && els.categoria.value || "");
    const modelo = String(els.modelo && els.modelo.value || "");
    const mostrarCompradas = !!(els.mostrarCompradas && els.mostrarCompradas.checked);
    return estado.items.filter(item => {
      if (!mostrarCompradas && laTiene(item)) return false;
      if (categoria && item.categoria !== categoria) return false;
      if (modelo && item.modelo !== modelo) return false;
      if (q) {
        const texto = [item.nombre, nombreCategoria(item.categoria), item.modelo].join(" ").toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }

  // ---------- PINTAR ----------

  function botonCompra(item) {
    if (!conSesion()) {
      return `<a class="bazar-login" href="${ENLACE_LOGIN}">Iniciar sesión para comprar</a>`;
    }
    if (laTiene(item)) {
      return `<a class="bazar-ver-perfil" href="${esc(enlacePonerse(item))}">✅ Ya la tenés · Ponértela</a>`;
    }
    const falta = precio(item) - estado.monedas;
    return falta <= 0
      ? `<button class="bazar-comprar" type="button" data-comprar-id="${Number(item.id)}">Comprar ahora</button>`
      : `<button class="bazar-comprar" type="button" disabled title="Las monedas se ganan jugando">Te faltan 🪙 ${fmtMonedas(falta)}</button>`;
  }

  function renderGrid() {
    const items = itemsFiltrados();
    if (els.contador) {
      els.contador.textContent = `${items.length} ${items.length === 1 ? "prenda" : "prendas"}`;
    }
    if (!items.length) {
      els.grid.innerHTML = '<div class="bazar-vacio">No encontramos prendas con esos filtros. Probá ampliar la búsqueda o mostrar las que ya compraste.</div>';
      if (els.verMas) els.verMas.hidden = true;
      return;
    }

    els.grid.innerHTML = items.slice(0, estado.mostrados).map(item => {
      const comprada = laTiene(item);
      return `
        <article class="bazar-card ${comprada ? "comprada" : ""} ${esNueva(item) ? "nueva" : ""}" data-id="${Number(item.id)}">
          <div class="bazar-media">${imagen(item, 'loading="lazy" width="96" height="96"')}</div>
          <div class="bazar-body">
            <h3 title="${esc(item.nombre)}">${esc(item.nombre)}</h3>
            <p class="bazar-descriptor">${esc(nombreCategoria(item.categoria))} · ${esc(nombrePersonaje(item.modelo))}</p>
            <div class="bazar-linea-precio">
              <span class="bazar-precio">🪙 ${fmtMonedas(precio(item))}</span>
              ${comprada ? '<span class="bazar-propiedad">Comprada</span>' : ""}
            </div>
            ${botonCompra(item)}
          </div>
        </article>
      `;
    }).join("");

    if (els.verMas) {
      const quedan = items.length - estado.mostrados;
      els.verMas.hidden = quedan <= 0;
      els.verMas.textContent = `Ver más prendas (${fmtMonedas(Math.max(0, quedan))})`;
    }
  }

  function renderDestacado() {
    if (!els.destacado) return;
    const item = estado.items[0];
    if (!item) {
      els.destacado.innerHTML = '<div class="bazar-vacio">Todavía no hay prendas a la venta.</div>';
      return;
    }
    const comprada = laTiene(item);
    let accion;
    if (!conSesion()) accion = `<a class="bazar-login" href="${ENLACE_LOGIN}">Iniciar sesión para comprar</a>`;
    else if (comprada) accion = `<a class="bazar-ver-perfil" href="${esc(enlacePonerse(item))}">Ponértela en tu avatar</a>`;
    else if (precio(item) > estado.monedas) accion = `<button type="button" class="bazar-comprar" disabled title="Las monedas se ganan jugando">Te faltan 🪙 ${fmtMonedas(precio(item) - estado.monedas)}</button>`;
    else accion = `<button type="button" class="bazar-comprar" data-comprar-id="${Number(item.id)}">Comprar esta prenda</button>`;

    els.destacado.innerHTML = `
      <div class="bazar-destacado-media">${imagen(item)}</div>
      <div class="bazar-destacado-info">
        <span class="bazar-etiqueta">✨ Última llegada</span>
        <h2>${esc(item.nombre)}</h2>
        <p>La prenda más reciente que entró al Bazar. Mirala, elegí si es para vos y comprala con tus monedas.</p>
        <div class="bazar-destacado-meta">
          <span class="bazar-chip">${esc(nombreCategoria(item.categoria))}</span>
          <span class="bazar-chip">${esc(nombrePersonaje(item.modelo))}</span>
          ${comprada ? '<span class="bazar-chip">✅ Ya es tuya</span>' : ""}
        </div>
        <div class="bazar-precio-grande">🪙 ${fmtMonedas(precio(item))}</div>
        <div class="bazar-destacado-accion">${accion}</div>
      </div>
    `;
  }

  function pintar() {
    actualizarSaldo();
    renderDestacado();
    renderGrid();
  }

  function desdeElPrincipio() {
    estado.mostrados = POR_PAGINA;
    renderGrid();
  }

  // ---------- EL MODAL: CONFIRMAR, Y LUEGO PONÉRTELA ----------

  function abrirModal() {
    els.modal?.classList.add("abierto");
    els.modal?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function cerrarModal() {
    if (!els.modal) return;
    els.modal.classList.remove("abierto");
    els.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    estado.itemModal = null;
    estado.modalModo = "comprar";
  }

  function abrirConfirmacion(itemId) {
    if (!conSesion()) return;
    const item = estado.items.find(x => Number(x.id) === Number(itemId));
    if (!item || laTiene(item)) return;

    estado.itemModal = item;
    estado.modalModo = "comprar";
    const valor = precio(item);
    const alcanza = estado.monedas >= valor;

    if (els.modalImagen) els.modalImagen.innerHTML = imagen(item);
    if (els.modalTitulo) els.modalTitulo.textContent = item.nombre;
    if (els.modalDescripcion) els.modalDescripcion.textContent = `${nombreCategoria(item.categoria)} · ${nombrePersonaje(item.modelo)}`;
    if (els.modalConfirmacion) {
      els.modalConfirmacion.innerHTML = alcanza
        ? `Vas a gastar <strong>🪙 ${fmtMonedas(valor)}</strong> y te quedarán <strong>🪙 ${fmtMonedas(estado.monedas - valor)}</strong>. La prenda quedará desbloqueada en tu guardarropa.`
        : `Te faltan <strong>🪙 ${fmtMonedas(valor - estado.monedas)}</strong> para poder comprarla. Jugá un rato más, conseguí monedas y volvé al Bazar.`;
    }
    if (els.modalCerrar) els.modalCerrar.textContent = "Cancelar";
    if (els.modalConfirmar) {
      els.modalConfirmar.disabled = !alcanza;
      els.modalConfirmar.textContent = "Confirmar compra";
    }
    abrirModal();
  }

  // Comprada: el mismo modal ofrece ponérsela.
  function mostrarComprada(item) {
    estado.itemModal = item;
    estado.modalModo = "comprada";
    if (els.modalTitulo) els.modalTitulo.textContent = "¡Es tuya!";
    if (els.modalConfirmacion) {
      els.modalConfirmacion.innerHTML = `«${esc(item.nombre)}» ya está en tu guardarropa. Te quedan <strong>🪙 ${fmtMonedas(estado.monedas)}</strong>.`;
    }
    if (els.modalCerrar) els.modalCerrar.textContent = "Seguir mirando";
    if (els.modalConfirmar) {
      els.modalConfirmar.disabled = false;
      els.modalConfirmar.textContent = "Ponértela ahora";
    }
    abrirModal();
  }

  function mostrarToast(texto) {
    if (!els.toast) return;
    els.toast.textContent = texto;
    els.toast.classList.add("visible");
    clearTimeout(mostrarToast.timer);
    mostrarToast.timer = setTimeout(() => els.toast.classList.remove("visible"), 3200);
  }

  // ---------- COMPRAR ----------

  async function comprarItem() {
    const item = estado.itemModal;
    if (!item || estado.cargandoCompra) return;
    if (estado.monedas < precio(item)) {
      mostrarToast("No te alcanzan las monedas todavía.");
      return;
    }

    estado.cargandoCompra = true;
    if (els.modalConfirmar) {
      els.modalConfirmar.disabled = true;
      els.modalConfirmar.textContent = "Comprando…";
    }

    // Quién compra lo dice la sesión: solo viaja la prenda.
    let datos = null;
    let codigo = 0;
    try {
      const resp = await fetch("/api/content?action=avatar-shop-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: Number(item.id) })
      });
      codigo = resp.status;
      datos = await resp.json().catch(() => null);
    } catch (_) {
      // Sin conexión: datos se queda en null y se avisa abajo.
    }
    estado.cargandoCompra = false;

    if (datos && datos.success) {
      estado.comprados.add(Number(item.id));
      estado.monedas = Number(datos.monedas);
      avisarSaldo(estado.monedas);
      pintar();
      mostrarComprada(item);
      return;
    }

    if (datos && datos.error === "Ya tenés esta prenda") estado.comprados.add(Number(item.id));
    cerrarModal();
    pintar();
    mostrarToast(codigo === 401
      ? "Tu sesión caducó. Volvé a iniciarla para comprar prendas."
      : (datos && datos.error) || "No se pudo hablar con el servidor. Probá de nuevo en un momento.");
  }

  // ---------- UNA PRENDA ENLAZADA ----------
  // bazar.html?prenda=<valor>: se enseña esa prenda y, si se puede
  // comprar, se pregunta directamente.

  function abrirEnlazada() {
    let valor = null;
    try { valor = new URLSearchParams(window.location.search).get("prenda"); } catch (_) {}
    if (!valor) return;
    // Fuera de la dirección: recargar la página no vuelve a preguntar.
    try { history.replaceState(null, "", window.location.pathname); } catch (_) {}

    const item = estado.items.find(i => i.valorCapa === valor);
    if (!item) {
      mostrarToast("Esa prenda ya no está a la venta. Echale un vistazo a todo lo demás.");
      return;
    }

    if (els.buscar) els.buscar.value = "";
    if (els.categoria) els.categoria.value = item.categoria || "";
    if (els.modelo) els.modelo.value = item.modelo || "";
    if (els.mostrarCompradas && laTiene(item)) els.mostrarCompradas.checked = true;
    const posicion = itemsFiltrados().indexOf(item);
    estado.mostrados = Math.max(POR_PAGINA, Math.ceil((posicion + 1) / POR_PAGINA) * POR_PAGINA);
    renderGrid();

    const tarjeta = els.grid.querySelector(`[data-id="${Number(item.id)}"]`);
    if (tarjeta) {
      tarjeta.classList.add("destacada");
      if (typeof tarjeta.scrollIntoView === "function") tarjeta.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    if (conSesion() && !laTiene(item)) abrirConfirmacion(item.id);
  }

  // ---------- CARGA ----------

  async function cargar() {
    els.grid.innerHTML = '<div class="bazar-cargando">Cargando el Bazar…</div>';
    try {
      const resp = await fetch("/api/content?action=avatar-shop", { cache: "no-store" });
      const data = await resp.json();
      if (!resp.ok || !data || !data.success) throw new Error((data && data.error) || "No se pudo cargar el Bazar.");

      estado.items = (data.items || [])
        .filter(item => precio(item) > 0)
        .sort((a, b) => (Date.parse(b.creadoEl) || 0) - (Date.parse(a.creadoEl) || 0));
      estado.comprados = new Set((data.comprados || []).map(Number));
      estado.monedas = data.monedas == null ? null : Number(data.monedas);
      estado.mostrados = POR_PAGINA;
      poblarSelectores();
      pintar();
      abrirEnlazada();
    } catch (error) {
      console.warn("MacroReborn: no se pudo cargar el Bazar.", error);
      els.grid.innerHTML = '<div class="bazar-vacio">No pudimos cargar el Bazar ahora mismo. Probá recargando la página.</div>';
      if (els.contador) els.contador.textContent = "";
    }
  }

  // ---------- EVENTOS ----------

  let esperaBusqueda = null;
  els.buscar?.addEventListener("input", () => {
    clearTimeout(esperaBusqueda);
    esperaBusqueda = setTimeout(desdeElPrincipio, 150);
  });
  [els.categoria, els.modelo, els.mostrarCompradas].forEach(control => {
    control?.addEventListener("change", desdeElPrincipio);
  });
  els.verMas?.addEventListener("click", () => {
    estado.mostrados += POR_PAGINA;
    renderGrid();
  });

  // Los botones de comprar de la cuadrícula y del destacado.
  document.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-comprar-id]");
    if (boton && !boton.disabled) abrirConfirmacion(boton.dataset.comprarId);
  });

  els.modalCerrar?.addEventListener("click", cerrarModal);
  els.modalConfirmar?.addEventListener("click", () => {
    if (estado.modalModo === "comprada" && estado.itemModal) {
      window.location.href = enlacePonerse(estado.itemModal);
      return;
    }
    comprarItem();
  });
  els.modal?.addEventListener("click", event => {
    if (event.target === els.modal) cerrarModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && els.modal?.classList.contains("abierto")) cerrarModal();
  });

  // Otra pestaña entró con otra cuenta o salió: se vuelve a pedir todo.
  // La misma cuenta con otro saldo (monedas ganadas jugando): se repinta.
  if (window.MRSession && typeof MRSession.subscribe === "function") {
    let nombreAntes = (MRSession.get() || {}).nombre || null;
    MRSession.subscribe(detalle => {
      const usuario = detalle && detalle.usuario ? detalle.usuario : null;
      const nombre = usuario ? (usuario.nombre || usuario.username) : null;
      if (nombre !== nombreAntes) {
        nombreAntes = nombre;
        cargar();
      } else if (conSesion() && usuario && usuario.monedas != null && Number(usuario.monedas) !== estado.monedas) {
        estado.monedas = Number(usuario.monedas);
        pintar();
      }
    });
  }

  cargar();
})();
