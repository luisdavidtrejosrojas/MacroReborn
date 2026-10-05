# MacroReborn

MacroReborn es una comunidad de juegos web, en [macroreborn.com](https://macroreborn.com): un catálogo
de juegos gratis con ficha, calificaciones y ranking, más avatares, perfiles, amigos, chat, una
economía de monedas y moderación. Este repositorio es el sitio entero (las páginas, el servidor y las
pruebas) y su documentación, que empieza aquí.

## Por dónde empezar

- Para trabajar en local (la base de práctica, el servidor local y las pruebas):
  [DESARROLLO](docs/guias/DESARROLLO.md).
- Para saber qué queda por arreglar: [AUDITORIA](docs/listas/AUDITORIA.md).

## Las reglas

- [La constitución](.specify/memory/constitution.md): las reglas del proyecto. Está por encima de
  cualquier otro documento, y en ella están también las convenciones: español, sin emojis, un commit
  por cambio y reutilizar lo que ya existe.
- [CLAUDE.md](CLAUDE.md): las notas prácticas para trabajar con Claude Code en este repositorio.
- [specs/](specs/): cada cambio desde el 05/10/2026, con su especificación, su plan y sus tareas.

## Referencia: cómo es hoy

| Documento | Para quién | Qué cuenta |
|---|---|---|
| [ARTE](docs/referencia/ARTE.md) | El equipo de desarrollo | Cómo se protege el arte de las prendas: qué consigue cada medida y qué no |
| [AVATARES](docs/referencia/AVATARES.md) | El equipo de desarrollo | Los avatares compuestos en el servidor: el plan del 21/09/2026, sus fases y cómo funcionan hoy las previsualizaciones, la foto de perfil y el pelo de atrás |
| [AVISOS](docs/referencia/AVISOS.md) | El equipo de desarrollo | Lo que aparece sin recargar: los avisos en vivo por Server-Sent Events, sus piezas, los dos procesos, los límites y quién puede oír qué |
| [CUENTAS](docs/referencia/CUENTAS.md) | El equipo de desarrollo | Las contraseñas: el hash con bcrypt, cómo se dejó de guardarlas en claro y qué no cubre |
| [ECONOMIA](docs/referencia/ECONOMIA.md) | El equipo de desarrollo y quien decida precios | Las monedas: los precios por rareza, cómo se ganan, los límites y el recálculo de saldos del 04/10/2026 |
| [MODERACION](docs/referencia/MODERACION.md) | El equipo de desarrollo y los administradores | Advertir, suspender y banear: qué hace cada sanción, quién puede ponerla, el panel y lo que ven los demás |
| [SEO](docs/referencia/SEO.md) | El equipo de desarrollo | Los metadatos, los datos estructurados, el sitemap, robots y las imágenes, y lo que queda para las URL limpias |
| [TIENDA](docs/referencia/TIENDA.md) | El equipo de desarrollo y el de arte | El Bazar: el catálogo entero a la venta, los precios por rareza, la migración 022 y lo que decide el equipo de arte |
| [VPS](docs/referencia/VPS.md) | Quien opera el servidor | El servidor de producción: la máquina, nginx, la base de datos, los respaldos, el cron, el dominio y la seguridad |

## Guías: cómo hacer algo

| Documento | Para quién | Qué cuenta |
|---|---|---|
| [DESARROLLO](docs/guias/DESARROLLO.md) | El equipo de desarrollo | Trabajar en local: la base de práctica, el servidor local, las pruebas y los datos de verdad |
| [JUEGOS](docs/guias/JUEGOS.md) | Quien añade o quita juegos | Cómo se añade un juego al catálogo y cómo se quita, con casos reales |
| [CAMBIOS-DE-OTROS-DEVS](docs/guias/CAMBIOS-DE-OTROS-DEVS.md) | Quien funde el trabajo de otra persona | Cómo se funde lo que manda otro dev, los casos del 28/09 y del 03/10/2026, y la tabla de rutas de antes |
| [RETOMAR](docs/guias/RETOMAR.md) | Luis, tras formatear el PC | Lo que no está en el repositorio y dónde se guarda (la llave SSH, los secretos, las copias), y cómo levantar el entorno |

## Listas vivas: lo pendiente

| Documento | Para quién | Qué cuenta |
|---|---|---|
| [AUDITORIA](docs/listas/AUDITORIA.md) | Todo el equipo | Lo que hay por arreglar, por orden de importancia, con su estado |
| [SUGERENCIAS](docs/listas/SUGERENCIAS.md) | Todo el equipo | Lo que pidió la comunidad en el canal viejo de sugerencias de Discord, cada idea con su estado y una recomendación |

## Historia y decisiones: por qué está como está

| Fecha | Documento | Qué cuenta |
|---|---|---|
| 22/09/2026 | [FRONTEND](docs/historia/FRONTEND.md) | Por qué el navegador está como está, qué se usaría empezando de cero y por qué no se reescribe |
| 16/09/2026 | [AVISOS-ROTOS](docs/historia/AVISOS-ROTOS.md) | Por qué los avisos en vivo pasaron dos semanas sin funcionar tras la mudanza al VPS, y el adiós a Pusher |
| 16/09/2026 | [IMAGEN-NO-ENCONTRADA](docs/historia/IMAGEN-NO-ENCONTRADA.md) | La marca de imagen rota que dejaba sobre el avatar una prenda quitada o retirada: de dónde salía y cómo se arregló |
| 16/09/2026 | [LIENZO-DEL-CATALOGO](docs/historia/LIENZO-DEL-CATALOGO.md) | Los dibujos del catálogo que no miden el lienzo de 327x504: cuántos son, qué dice la base y el trabajo que quedó pendiente |

## Especificaciones

Cada cambio pasa por Spec Kit y deja su carpeta en [specs/](specs/), con la especificación, el plan y
las tareas. La primera, [001](specs/001-reordenar-documentacion/spec.md), reordena esta documentación.

---

## Qué es el proyecto

MacroReborn es una comunidad de juegos web: un catálogo de juegos
gratis online (estáticos, del lado del navegador) con ficha por juego,
calificaciones, reseñas, favoritos, historial, ranking por tiempo
jugado, amigos, chat, notificaciones y perfiles de usuario.

## Stack

- **Frontend**: HTML/CSS/JS vanilla (sin frameworks), en la raíz del
  repo y en `js/`.
- **Backend**: handlers en `api/` servidos por `server.js` sobre Node,
  contra un PostgreSQL en el mismo VPS. Antes era serverless en Vercel
  contra Neon; la mudanza está contada en `docs/referencia/VPS.md`.
- **Catálogo de juegos**: datos estáticos en `js/datos-juegos.js`; los
  juegos en sí se referencian desde CDNs externos (nada de binarios en
  el repo).
- **Desarrollo local**: base de práctica PGlite (Postgres embebido en
  WASM) y un servidor local para probar en el navegador.

## Cómo probar localmente

```bash
npm install        # instala las dependencias (solo la primera vez)
npm test           # tests automáticos (base local, no toca la real)
npm run test:smoke  # smoke test HTTP: levanta y cierra un servidor local efímero
npm run db:local   # sitio local en http://localhost:3001
```

Todo corre en la máquina de desarrollo; nada toca la base real ni el
servidor de producción. Detalles en `docs/guias/DESARROLLO.md`.

## Sistemas documentados

- **Contraseñas**: hash bcrypt, migración perezosa de usuarios
  existentes y backfill protegido — ver `docs/referencia/CUENTAS.md`.
- **Juegos**: cómo se agrega un juego nuevo al catálogo (datos,
  portada, sitemap, prueba local) — ver `docs/guias/JUEGOS.md`.
- **Avisos en vivo**: cómo aparece una notificación sin recargar, con
  Server-Sent Events servidos por la propia máquina — ver
  `docs/referencia/AVISOS.md`.
