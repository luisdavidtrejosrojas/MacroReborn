// ==============================
// SEO - helpers compartidos (MacroReborn)
// ==============================
// Actualiza en tiempo de ejecución las etiquetas <title>, <meta
// description>, canonical, Open Graph y Twitter Card de páginas cuyo
// contenido depende de la URL (ficha de juego, pantalla de juego,
// perfil público de un usuario). Cada página ya trae valores por
// defecto en su <head> (para navegadores/bots que no ejecutan JS);
// estas funciones solo los reemplazan cuando ya se sabe qué se está
// mostrando. No crea ni borra nada que no le corresponda.

const SEO_SITE = "https://www.macroreborn.com";
const SEO_SITE_NAME = "MacroReborn";
const SEO_IMAGEN_DEFECTO = SEO_SITE + "/imagenes/og-image.png";

function seoUrlAbsoluta(ruta) {
    if (!ruta) return SEO_IMAGEN_DEFECTO;
    if (/^https?:\/\//i.test(ruta)) return ruta;
    return SEO_SITE + "/" + ruta.replace(/^\.?\//, "");
}

function seoSetMeta(selector, atributo, valor) {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(atributo, valor);
}

// Recorta una descripción a un largo prolijo para buscadores
// (~155-160 caracteres) sin cortar una palabra a la mitad.
function seoRecortarDescripcion(texto, limite) {
    limite = limite || 155;
    const t = (texto || "").toString().trim();
    if (t.length <= limite) return t;
    const cortado = t.slice(0, limite);
    return cortado.slice(0, cortado.lastIndexOf(" ")) + "…";
}

function seoActualizar(datos) {
    if (datos.titulo) {
        document.title = datos.titulo;
        seoSetMeta('meta[property="og:title"]', "content", datos.titulo);
        seoSetMeta('meta[name="twitter:title"]', "content", datos.titulo);
    }
    if (datos.descripcion) {
        seoSetMeta('meta[name="description"]', "content", datos.descripcion);
        seoSetMeta('meta[property="og:description"]', "content", datos.descripcion);
        seoSetMeta('meta[name="twitter:description"]', "content", datos.descripcion);
    }
    if (datos.url) {
        seoSetMeta('link[rel="canonical"]', "href", datos.url);
        seoSetMeta('meta[property="og:url"]', "content", datos.url);
    }
    if (datos.imagen) {
        const abs = seoUrlAbsoluta(datos.imagen);
        seoSetMeta('meta[property="og:image"]', "content", abs);
        seoSetMeta('meta[name="twitter:image"]', "content", abs);
    }
}

// Crea o actualiza un bloque JSON-LD identificado por id, para no
// duplicar <script type="application/ld+json"> si la función se
// llama más de una vez (por ejemplo al cambiar de juego sin recargar).
function seoInyectarJSONLD(id, datos) {
    let script = document.getElementById(id);
    if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = id;
        document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(datos);
}
