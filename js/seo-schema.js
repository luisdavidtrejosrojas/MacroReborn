(function () {
  'use strict';

  const SITE = 'https://www.macroreborn.com';

  function addSchema(data, id) {
    if (!data) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    if (id) script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function cleanText(value, fallback) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text || fallback || '';
  }

  function breadcrumb(items) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  function init() {
    const path = location.pathname.split('/').pop() || 'index.html';
    if (path === 'index.html' || path === '') {
      addSchema({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'MacroReborn',
        url: SITE + '/',
        description: 'Portal de juegos online gratis, comunidad, ranking y perfiles gamer.'
      }, 'mr-schema-website');
      return;
    }

    if (path === 'juegos.html') {
      addSchema(breadcrumb([
        { name: 'Inicio', url: SITE + '/' },
        { name: 'Juegos', url: SITE + '/juegos.html' }
      ]), 'mr-schema-breadcrumb');

      if (Array.isArray(window.juegos)) {
        const list = window.juegos.slice(0, 24).map((game, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: SITE + '/juego.html?id=' + encodeURIComponent(game.id),
          name: cleanText(game.nombre, 'Juego')
        }));
        if (list.length) {
          addSchema({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Juegos de MacroReborn',
            itemListElement: list
          }, 'mr-schema-games');
        }
      }
      return;
    }

    if (path === 'juego.html') {
      const id = new URLSearchParams(location.search).get('id');
      const game = Array.isArray(window.juegos)
        ? window.juegos.find((item) => String(item.id) === String(id))
        : null;
      if (!game) return;

      addSchema(breadcrumb([
        { name: 'Inicio', url: SITE + '/' },
        { name: 'Juegos', url: SITE + '/juegos.html' },
        { name: cleanText(game.nombre, 'Juego'), url: SITE + '/juego.html?id=' + encodeURIComponent(game.id) }
      ]), 'mr-schema-breadcrumb');

      addSchema({
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: cleanText(game.nombre, 'Juego'),
        description: cleanText(game.descripcion, 'Juego online gratis en MacroReborn.'),
        image: game.imagen ? (new URL(game.imagen, SITE + '/')).href : undefined,
        genre: cleanText(game.categoria, 'Videojuegos'),
        url: SITE + '/juego.html?id=' + encodeURIComponent(game.id),
        applicationCategory: 'Game',
        operatingSystem: 'Web browser'
      }, 'mr-schema-game');
      return;
    }

    if (path === 'categoria.html') {
      const category = new URLSearchParams(location.search).get('categoria');
      if (!category) return;
      addSchema(breadcrumb([
        { name: 'Inicio', url: SITE + '/' },
        { name: 'Juegos', url: SITE + '/juegos.html' },
        { name: 'Categoría ' + category, url: SITE + '/categoria.html?categoria=' + encodeURIComponent(category) }
      ]), 'mr-schema-breadcrumb');
      return;
    }

    if (path === 'coleccion.html') {
      const collection = new URLSearchParams(location.search).get('coleccion');
      if (!collection) return;
      const label = collection.charAt(0).toUpperCase() + collection.slice(1);
      addSchema(breadcrumb([
        { name: 'Inicio', url: SITE + '/' },
        { name: 'Juegos', url: SITE + '/juegos.html' },
        { name: 'Colección ' + label, url: SITE + '/coleccion.html?coleccion=' + encodeURIComponent(collection) }
      ]), 'mr-schema-breadcrumb');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
