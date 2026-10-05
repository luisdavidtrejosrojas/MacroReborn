# MacroReborn

MacroReborn es una comunidad de juegos web, en [macroreborn.com](https://macroreborn.com): un catálogo
de juegos gratis con ficha, calificaciones y ranking, más avatares, perfiles, amigos, chat, una
economía de monedas y moderación. Este repositorio es el sitio entero (las páginas, el servidor y las
pruebas) y su documentación, que empieza aquí.

## Por dónde empezar

- Para sumarse al equipo: preparar el entorno, Spec Kit, los commits, las pruebas y el despliegue,
  en [SUMARSE](docs/guias/SUMARSE.md).
- Para entender el sistema de un vistazo, sus partes y qué documento lleva cada área:
  [ARQUITECTURA](docs/referencia/ARQUITECTURA.md).
- Para trabajar en local (la base de práctica, el servidor local y las pruebas):
  [DESARROLLO](docs/guias/DESARROLLO.md).
- Para desplegar un cambio: [DESPLEGAR](docs/guias/DESPLEGAR.md).
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
| [ARQUITECTURA](docs/referencia/ARQUITECTURA.md) | Quien llega al proyecto, y quien busca dónde está algo | El sistema de un vistazo: sus partes, cómo se conectan, dónde vive cada una y qué documento lleva cada área |
| [ARTE](docs/referencia/ARTE.md) | El equipo de desarrollo | Cómo se protege el arte de las prendas: qué consigue cada medida y qué no |
| [AVATARES](docs/referencia/AVATARES.md) | El equipo de desarrollo | Cómo se componen, se guardan y se sirven los avatares: sus piezas, sus direcciones, el freno, las previsualizaciones, la foto de perfil y el pelo de atrás |
| [AVISOS](docs/referencia/AVISOS.md) | El equipo de desarrollo | Lo que aparece sin recargar: los avisos en vivo por Server-Sent Events, sus piezas, los dos procesos, los límites y quién puede oír qué |
| [CUENTAS](docs/referencia/CUENTAS.md) | El equipo de desarrollo | Las contraseñas y los nombres de usuario: el hash con bcrypt, qué nombre se acepta, por qué no distingue mayúsculas, qué no cubre y lo que queda de cuando las contraseñas se guardaban en claro |
| [ECONOMIA](docs/referencia/ECONOMIA.md) | El equipo de desarrollo y quien decida precios | Las monedas: los precios por rareza, cómo se ganan, los límites y el recálculo de saldos del 04/10/2026 |
| [MODERACION](docs/referencia/MODERACION.md) | El equipo de desarrollo y los administradores | Advertir, suspender y banear: qué hace cada sanción, quién puede ponerla, el panel y lo que ven los demás |
| [SEO](docs/referencia/SEO.md) | El equipo de desarrollo | Los metadatos de cada página y cuáles se indexan, los datos estructurados, el sitemap, robots y las imágenes, y lo que queda: sus puntos de la auditoría y las URL limpias |
| [TIENDA](docs/referencia/TIENDA.md) | El equipo de desarrollo y el de arte | El Bazar: el catálogo entero a la venta, los precios por rareza, la migración 022 y lo que decide el equipo de arte |
| [VPS](docs/referencia/VPS.md) | Quien opera el servidor | El servidor de producción: la máquina, nginx, la base de datos, los respaldos, el cron, el dominio y la seguridad |

## Guías: cómo hacer algo

| Documento | Para quién | Qué cuenta |
|---|---|---|
| [SUMARSE](docs/guias/SUMARSE.md) | Quien se suma al equipo | Preparar el entorno y trabajar como se trabaja aquí: Spec Kit, los commits y las ramas, cómo se prueba y cómo se despliega |
| [DESARROLLO](docs/guias/DESARROLLO.md) | El equipo de desarrollo | Trabajar en local: la base de práctica, el servidor local, las pruebas, los datos de verdad y cómo mirar a ojo los avatares y las previsualizaciones |
| [DESPLEGAR](docs/guias/DESPLEGAR.md) | Quien despliega, con el OK de Luis | Cómo se pone en producción un cambio: las migraciones, el código, el reinicio, la comprobación y cómo se deshace |
| [JUEGOS](docs/guias/JUEGOS.md) | Quien añade o quita juegos | Cómo se añade un juego al catálogo y cómo se quita, con casos reales |
| [CAMBIOS-DE-OTROS-DEVS](docs/guias/CAMBIOS-DE-OTROS-DEVS.md) | Quien funde el trabajo de otra persona | Cómo se funde lo que manda otro dev: el método, qué pedirle y la tabla de rutas de antes |
| [RETOMAR](docs/guias/RETOMAR.md) | Luis, tras formatear el PC | Lo que no está en el repositorio y dónde se guarda (la llave SSH, la memoria de Claude, las copias), qué hacer si se pierde la llave y lo que solo hace falta para volver a montar su PC |

## Listas vivas: lo pendiente

| Documento | Para quién | Qué cuenta |
|---|---|---|
| [AUDITORIA](docs/listas/AUDITORIA.md) | Todo el equipo | Lo que hay por arreglar, por orden de importancia, con su estado |
| [SUGERENCIAS](docs/listas/SUGERENCIAS.md) | Todo el equipo | Lo que pidió la comunidad en el canal viejo de sugerencias de Discord, cada idea con su estado y una recomendación |

## Historia y decisiones: por qué está como está

| Fecha | Documento | Qué cuenta |
|---|---|---|
| 04/10/2026 | [SALDOS-REHECHOS](docs/historia/SALDOS-REHECHOS.md) | El recálculo de una sola vez de todos los saldos con la economía nueva: qué calculó, cómo se corrió, lo que salió y el respaldo de antes |
| 03/10/2026 | [CASOS-DE-OTROS-DEVS](docs/historia/CASOS-DE-OTROS-DEVS.md) | Los dos primeros zips de otro dev, del 28/09 y del 03/10: qué traían, qué entró y qué no, y qué se arregló al meterlos |
| 28/09/2026 | [ACTIVAR-LA-MODERACION](docs/historia/ACTIVAR-LA-MODERACION.md) | Lo que se hizo el día que se activaron las sanciones: la cuenta que quedó baneada y las columnas viejas que dejaron de usarse |
| 22/09/2026 | [FRONTEND](docs/historia/FRONTEND.md) | Por qué el navegador está como está, qué se usaría empezando de cero y por qué no se reescribe |
| 21/09/2026 | [AVATARES-AL-SERVIDOR](docs/historia/AVATARES-AL-SERVIDOR.md) | El plan de pasar los avatares al servidor: por qué, lo medido sobre el VPS, sus cinco fases, lo aprendido de macrojuegos, cómo se decidió la foto de perfil y por qué se había descartado el 16/09 |
| 19/09/2026 | [LLAVE-SSH](docs/historia/LLAVE-SSH.md) | Las dos veces que se perdió la llave para entrar al servidor, la lección que dejó y lo que se cambió el 19/09 |
| 16/09/2026 | [CONTRASENAS-EN-CLARO](docs/historia/CONTRASENAS-EN-CLARO.md) | Cómo se dejó de guardar las contraseñas en texto plano: el relleno de las que quedaban, el plan de activación y su despliegue |
| 16/09/2026 | [AVISOS-ROTOS](docs/historia/AVISOS-ROTOS.md) | Por qué los avisos en vivo pasaron dos semanas sin funcionar tras la mudanza al VPS, y el adiós a Pusher |
| 16/09/2026 | [IMAGEN-NO-ENCONTRADA](docs/historia/IMAGEN-NO-ENCONTRADA.md) | La marca de imagen rota que dejaba sobre el avatar una prenda quitada o retirada: de dónde salía y cómo se arregló |
| 16/09/2026 | [LIENZO-DEL-CATALOGO](docs/historia/LIENZO-DEL-CATALOGO.md) | Los dibujos del catálogo que no miden el lienzo de 327x504: cuántos son, qué dice la base y el trabajo que quedó pendiente |
| 02/09/2026 | [FUGA-DEL-ENV](docs/historia/FUGA-DEL-ENV.md) | El día que el servidor entregaba su `.env`: quién lo leyó, qué alcance tuvo, qué se hizo y la lección de la lista blanca |
| 01/09/2026 | [MUDANZA-AL-VPS](docs/historia/MUDANZA-AL-VPS.md) | De Vercel y Neon a un servidor propio: lo que cambió del código y cómo se migraron los datos |

## Especificaciones

Cada cambio pasa por Spec Kit y deja su carpeta en [specs/](specs/), con la especificación, el plan y
las tareas. La primera, [001](specs/001-reordenar-documentacion/spec.md), reordena esta documentación.

