# HISTORIAL — qué cambió y cuándo

> **De qué trata:** todo lo que cambió en MacroReborn, semana a semana, desde la primera subida, el
> 23/07/2026: cada cambio con su día, su área, quién lo hizo y dónde se explica.
>
> **Para quién:** el equipo de desarrollo.
>
> **Revisado:** 08/10/2026

**Cómo se mantiene.** Cada especificación añade aquí su entrada como última tarea, antes de unirse a
`main`, con la fecha de esa unión ([la regla](../guias/SUMARSE.md#3-commits-y-ramas)). Lo de antes se reconstruyó el
05/10/2026 a partir de los commits, con su fecha de autor. Las semanas van de lunes a domingo, la más
reciente arriba, y los enlaces a commits llevan a GitHub, que pide entrar con una cuenta del equipo.

---

## Semana del 05 al 11/10/2026

- **08/10, el navegador** (Luis): la spec 002 funde lo que SamuMacro subió el 06/10. Se queda su
  arreglo de la barra fija, con un respaldo para los navegadores que no entienden `clip`, y
  `comunidad-ranking.html` vuelve a pedir sus siete hojas y scripts con las versiones de antes. Con la
  barra fija otra vez, los saltos a una parte de la página quedan debajo de ella, no tapados, y el
  aviso de cuenta suspendida deja de pisarla. En Comunidad, la ventana de `MRModal`, que desde el 28/09
  salía al final de la página, vuelve a salir encima. Una prueba nueva avisa si una página pide un
  archivo con otra versión que las demás. [Spec 002](../../specs/002-fundir-arreglo-barra/spec.md).
- **08/10, documentación** (Luis): la spec 001 reordena la documentación por tipos (referencia,
  guías, listas vivas e historia), la revisa entera contra el código, el servidor y la web, y la
  completa: el índice del README, ARQUITECTURA, SUMARSE, DESPLEGAR y este historial, con una prueba que
  vigila que no cite nada que no exista. Los hallazgos que pedían cambiar código o servidor entraron en
  la auditoría, y la constitución pasa a la v1.0.1.
  [Spec 001](../../specs/001-reordenar-documentacion/spec.md).
- **06/10, el navegador** (SamuMacro): la barra queda fija al bajar por la página (`overflow-x: clip`
  en vez de `hidden`), en tres subidas directas a `main`. Con ellas, `comunidad-ranking.html` volvió a
  versiones viejas de sus scripts; eso lo arregla la
  [spec 002](../../specs/002-fundir-arreglo-barra/spec.md), antes de desplegar.
  [`84e703a`](https://github.com/valenmgg/MacroReborn/commit/84e703a) a
  [`eb3b224`](https://github.com/valenmgg/MacroReborn/commit/eb3b224) (3 commits).
- **05/10, cuentas** (Luis): los nombres de usuario dejan de distinguir mayúsculas. El perfil, entrar
  y el registro buscan con una sola regla: el nombre exacto, o la única cuenta que coincida sin mirar
  mayúsculas; el registro no deja crear uno que ya existe escrito de otra forma. Punto 31 de la
  auditoría. [CUENTAS](../referencia/CUENTAS.md#los-nombres-de-usuario),
  [`d30b7d5`](https://github.com/valenmgg/MacroReborn/commit/d30b7d5) a
  [`afc854c`](https://github.com/valenmgg/MacroReborn/commit/afc854c) (5 commits).
- **05/10, lo que pidió la comunidad** (Luis): todas las ideas del canal viejo de sugerencias de
  Discord, una por fila, con lo que hay hoy en la web y una recomendación; la exportación del canal
  queda fuera de git. [SUGERENCIAS](../listas/SUGERENCIAS.md),
  [`291b0f4`](https://github.com/valenmgg/MacroReborn/commit/291b0f4) a
  [`8540aa2`](https://github.com/valenmgg/MacroReborn/commit/8540aa2) (3 commits).
- **05/10, forma de trabajar** (Luis): llega Spec Kit 1.1.0, con sus comandos para Claude y la
  extensión de git; la constitución de MacroReborn, v1.0.0, con su plantilla propia; y el `CLAUDE.md`
  con cómo se trabaja, se prueba y se despliega. [SUMARSE](../guias/SUMARSE.md#2-cómo-se-trabaja-spec-kit),
  [`549f4b9`](https://github.com/valenmgg/MacroReborn/commit/549f4b9) a
  [`0050e55`](https://github.com/valenmgg/MacroReborn/commit/0050e55) (4 commits).

## Semana del 28/09 al 04/10/2026

- **04/10, avatares** (Luis): una capa nueva, el pelo de atrás, justo debajo del pelo: en el editor
  (solo en los personajes que ya tienen alguno), el Bazar, el panel de arte y el taller.
  [AVATARES](../referencia/AVATARES.md#el-pelo-de-atrás-dos-capas-de-pelo),
  [`5aef728`](https://github.com/valenmgg/MacroReborn/commit/5aef728) a
  [`0779bd5`](https://github.com/valenmgg/MacroReborn/commit/0779bd5) (6 commits).
- **04/10, monedas** (Luis): la economía nueva. Cada prenda tiene su rareza y la rareza da el precio,
  también al subirla y en el Bazar, que filtra por ella; se gana cada 10 minutos jugados, por la
  racha, los niveles, las misiones (un 25 % más) y los logros, que ahora comprueba el servidor; el
  minuto solo cuenta con alguien delante; el saldo de cada uno solo lo ve su dueño (punto 57); y los
  saldos se rehicieron con las reglas nuevas, sin que nadie perdiera.
  [ECONOMIA](../referencia/ECONOMIA.md), [SALDOS-REHECHOS](SALDOS-REHECHOS.md),
  [`02b7c1b`](https://github.com/valenmgg/MacroReborn/commit/02b7c1b) a
  [`481ab59`](https://github.com/valenmgg/MacroReborn/commit/481ab59) (15 commits).
- **03/10, la barra y Comunidad** (Luis, con el zip de otro dev de ese día): la barra nueva, con el
  logo, la página actual resaltada y un «+» junto a las monedas que lleva al Bazar, igual en modo
  claro; en Comunidad, fuera la pestaña General y vuelve el panel Conectados; y el perfil en modo claro,
  con el diseño de referencia de macrojuegos. [CASOS-DE-OTROS-DEVS](CASOS-DE-OTROS-DEVS.md),
  [`56129fe`](https://github.com/valenmgg/MacroReborn/commit/56129fe) a
  [`84ef737`](https://github.com/valenmgg/MacroReborn/commit/84ef737) (10 commits).
- **28/09, moderación** (Luis): advertir, suspender y banear hacen algo de verdad. La tabla
  `sanciones` (migración 026) y `api/_sanciones.js`; una cuenta baneada pierde la sesión y no entra, y
  una suspendida no escribe; el panel, contra el servidor. Y la parte 2: lo que escribió una cuenta
  baneada sale tapado y en rojo, su perfil lo dice y sale de las listas, del buscador y de los
  rankings. Puntos 16 y 17. [MODERACION](../referencia/MODERACION.md),
  [ACTIVAR-LA-MODERACION](ACTIVAR-LA-MODERACION.md),
  [`b044de2`](https://github.com/valenmgg/MacroReborn/commit/b044de2) a
  [`f2f04ac`](https://github.com/valenmgg/MacroReborn/commit/f2f04ac) (34 commits).
- **28/09, avatares** (Luis): la foto de perfil, la cara de cada avatar recortada con el cuadro de su
  modelo, en todas las miniaturas: la barra, el portal, el buscador, Explorar, Comunidad, el chat, las
  reseñas, los perfiles y las Ligas.
  [AVATARES](../referencia/AVATARES.md#la-foto-de-perfil-la-cara-con-un-cuadro-por-modelo),
  [`d3e8388`](https://github.com/valenmgg/MacroReborn/commit/d3e8388) a
  [`635ef2d`](https://github.com/valenmgg/MacroReborn/commit/635ef2d) (11 commits).
- **28/09, perfiles y Comunidad** (Luis, con los zips de otro dev del 22 y el 23/09): la tarjeta nueva
  del perfil, con el avatar entero, el nombre dentro de la imagen, el nivel en número, la medalla de
  logros y Online/Offline, también en el perfil de los demás; fuera el bloque «Identidad gamer»; el
  avatar y la barra de XP en el botón de usuario; y Comunidad rediseñada, con las pestañas Hoy, Esta
  semana y Este mes ordenando de verdad. [CASOS-DE-OTROS-DEVS](CASOS-DE-OTROS-DEVS.md),
  [`b8ee8bb`](https://github.com/valenmgg/MacroReborn/commit/b8ee8bb) a
  [`51cd7aa`](https://github.com/valenmgg/MacroReborn/commit/51cd7aa) (16 commits).
- **28/09, tienda** (Luis, con el diseño de un zip de otro dev): el Bazar sustituye a la tienda.
  `tienda.html` redirige con la misma prenda, y el editor, Comunidad, la barra y el sitemap llevan al
  Bazar. [TIENDA](../referencia/TIENDA.md),
  [`9be76d8`](https://github.com/valenmgg/MacroReborn/commit/9be76d8) a
  [`83560a1`](https://github.com/valenmgg/MacroReborn/commit/83560a1) (7 commits).
- **28/09, forma de trabajar** (Luis): cómo se metieron los zips del 22 y el 23/09, y qué pedir para
  los siguientes. [CAMBIOS-DE-OTROS-DEVS](../guias/CAMBIOS-DE-OTROS-DEVS.md),
  [`3727a8c`](https://github.com/valenmgg/MacroReborn/commit/3727a8c).
- **28/09, juegos** (Luis): sale el 30, The Binding of Isaac, que no cargaba: del catálogo, del sitemap
  y su archivo y su portada, y su ficha dice que no está. El 27 apunta a su archivo, y una prueba
  comprueba que cada juego tiene el suyo y su portada. Punto 22.
  [JUEGOS](../guias/JUEGOS.md#7-quitar-un-juego),
  [`139ffb4`](https://github.com/valenmgg/MacroReborn/commit/139ffb4) a
  [`093593c`](https://github.com/valenmgg/MacroReborn/commit/093593c) (9 commits).
- **28/09, misiones y logros** (Luis): las misiones avisan al cumplirse, y una cumplida espera a que se
  cobre, en Mi día y en Progreso, también la de la semana anterior. Sus definiciones pasan a
  `api/_misiones.js`, las notificaciones aceptan la cuenta en vez del nombre, y el historial apunta el
  juego a la cuenta de la sesión. Puntos 84 y 85.
  [`36bb48c`](https://github.com/valenmgg/MacroReborn/commit/36bb48c) a
  [`91ecf9f`](https://github.com/valenmgg/MacroReborn/commit/91ecf9f) (11 commits).

## Semana del 21 al 27/09/2026

- **25/09, cuentas** (Luis): la sesión se renueva mientras se usa, con un tope de 30 días, y el
  navegador guarda el pase renovado y avisa si ya no vale; antes, a los siete días todo lo que se
  escribía fallaba en silencio. Tras entrar se vuelve a la página de antes (`?volver=`). Punto 83.
  [CUENTAS](../referencia/CUENTAS.md#lo-que-no-cubre),
  [`dc27ef7`](https://github.com/valenmgg/MacroReborn/commit/dc27ef7) a
  [`463de5d`](https://github.com/valenmgg/MacroReborn/commit/463de5d) (5 commits).
- **25/09, monedas** (Luis): el pulso cuenta un minuto por minuto, lo decide el servidor y con la
  pestaña oculta no cuenta; y si el reparto falla, el saldo no se vuelve 0. Puntos 18 y 82.
  [ECONOMIA](../referencia/ECONOMIA.md#4-solo-con-alguien-delante),
  [`b7afa63`](https://github.com/valenmgg/MacroReborn/commit/b7afa63) a
  [`97bfacb`](https://github.com/valenmgg/MacroReborn/commit/97bfacb) (3 commits).
- **25/09, misiones y logros** (Luis): la racha se cuenta sola al jugar, las misiones se pueden cumplir
  y se cobran en Mi día, y fuera el «Registrar hoy» de Progreso. Puntos 15, 25, 80 y 81; el 26,
  aplazado. [`a5c4e4d`](https://github.com/valenmgg/MacroReborn/commit/a5c4e4d) a
  [`a8a3805`](https://github.com/valenmgg/MacroReborn/commit/a8a3805) (5 commits).
- **24/09, tienda** (Luis): la tienda, con página propia (`tienda.html`) y todo el catálogo a la venta:
  toda prenda publicada tiene precio (migración 022), la compra cobra y apunta a la vez
  (`sql.transaccion`), el saldo es privado (`mis-monedas`), y la barra, el candado del editor y el
  escaparate de Comunidad llevan a ella. El equipo de arte pone y cambia el precio de sus prendas.
  Puntos 24, 78 y 79. [TIENDA](../referencia/TIENDA.md),
  [`09f787f`](https://github.com/valenmgg/MacroReborn/commit/09f787f) a
  [`a99c388`](https://github.com/valenmgg/MacroReborn/commit/a99c388) (24 commits).
- **24/09, cuentas** (Luis): un nombre de usuario con código ya no se ejecuta: la página de amigos, el
  panel de estadísticas, la barra y el aviso de menciones lo escapan, y el registro rechaza los que
  rompen el HTML o no se ven. Punto 77. [CUENTAS](../referencia/CUENTAS.md#los-nombres-de-usuario),
  [`31e75ae`](https://github.com/valenmgg/MacroReborn/commit/31e75ae) a
  [`371ec2a`](https://github.com/valenmgg/MacroReborn/commit/371ec2a) (5 commits).
- **24/09, avatares** (Luis): las fases 3 y 5 del avatar compuesto. Todas las páginas enseñan una sola
  imagen por persona, nunca prendas sueltas, y si falta el compuesto se compone al pedirlo; el servidor
  dibuja la vista previa del editor; fuera el índice público de prendas; y las prendas sueltas solo se
  sirven con firma, para el equipo de arte, sin caché en nginx.
  [AVATARES-AL-SERVIDOR](AVATARES-AL-SERVIDOR.md#las-fases),
  [`c260e14`](https://github.com/valenmgg/MacroReborn/commit/c260e14) a
  [`bc765d9`](https://github.com/valenmgg/MacroReborn/commit/bc765d9) (38 commits).
- **23 y 24/09, avatares** (Luis): las previsualizaciones de cada prenda, la fase 4. El 23/09, cómo se
  dibujan y la herramienta para elegir su cuadro, con las de macrojuegos al lado; el 24/09, automáticas,
  un cuadro por prenda, guardadas en disco (migración 021), servidas en `/previsualizaciones/` y
  enseñadas en el editor y en la tienda, que deja de tener cajas vacías (punto 23).
  [AVATARES](../referencia/AVATARES.md#las-previsualizaciones-automáticas-y-corregibles-una-a-una-más-adelante),
  [`69342ca`](https://github.com/valenmgg/MacroReborn/commit/69342ca) a
  [`f58c5db`](https://github.com/valenmgg/MacroReborn/commit/f58c5db) (35 commits).
- **22/09, el navegador** (Luis): por qué está como está, sin framework, y qué se haría empezando de
  cero. [FRONTEND](FRONTEND.md), [`fa30a7d`](https://github.com/valenmgg/MacroReborn/commit/fa30a7d).
- **21/09, avatares** (Luis): se decide que el servidor componga cada avatar, y se hacen las fases 1 y
  2: el compositor; un solo formato, JPG sobre blanco; el avatar se compone al guardarlo y se guarda en
  disco (migración 019); cada persona tiene su dirección, que no cambia nunca; el relleno de los que ya
  había; un freno para no tumbar la máquina; las ranuras pasan a ser de cada persona (migración 020); y
  Comunidad pide una imagen por avatar y no quince. [AVATARES-AL-SERVIDOR](AVATARES-AL-SERVIDOR.md),
  [`daf380b`](https://github.com/valenmgg/MacroReborn/commit/daf380b) a
  [`8d516f2`](https://github.com/valenmgg/MacroReborn/commit/8d516f2) (24 commits).
- **21/09, avisos en vivo** (Luis): `/api/avisos` pide un pase de un minuto, que no vale como sesión, y
  el buzón y los bloqueos solo salen por la línea de su dueño. Punto 3.
  [AVISOS](../referencia/AVISOS.md#quién-puede-oír-qué),
  [`6d4b382`](https://github.com/valenmgg/MacroReborn/commit/6d4b382) a
  [`cab05ac`](https://github.com/valenmgg/MacroReborn/commit/cab05ac) (8 commits).
- **21/09, notificaciones y noticias** (Luis): cada mención en un comentario de perfil llega una sola
  vez: el navegador deja de crear la suya. Punto 76.
  [`b932d32`](https://github.com/valenmgg/MacroReborn/commit/b932d32) a
  [`3422874`](https://github.com/valenmgg/MacroReborn/commit/3422874) (5 commits).
- **21/09, arte** (Luis): las prendas salen del repositorio, entonces público, porque el sitio ya las
  servía desde la base; el historial de GitHub se queda como está (punto 75, descartado) y lo que
  faltaba por publicar ya está en GitHub (punto 13). Y la regla de `api/_png.js` se aclara: no es «sin
  librerías», es «sin depender de nadie de fuera». [ARTE](../referencia/ARTE.md#7-lo-que-queda),
  [`bbe813a`](https://github.com/valenmgg/MacroReborn/commit/bbe813a) a
  [`4154e9d`](https://github.com/valenmgg/MacroReborn/commit/4154e9d) (5 commits).
- **21/09, trabajo en local** (Luis): `npm run db:traer` estaba roto: ahora busca la llave del VPS en
  vez de adivinarla. [DESARROLLO](../guias/DESARROLLO.md#probar-contra-los-datos-de-verdad),
  [`0b77ac6`](https://github.com/valenmgg/MacroReborn/commit/0b77ac6).

## Semana del 14 al 20/09/2026

- **19/09, servidor y producción** (Luis): se recupera el acceso al servidor tras perder la llave SSH
  por segunda vez, y la guía para retomar se pone al día. [LLAVE-SSH](LLAVE-SSH.md),
  [`726c2f1`](https://github.com/valenmgg/MacroReborn/commit/726c2f1) y
  [`9aca97f`](https://github.com/valenmgg/MacroReborn/commit/9aca97f).
- **18/09, lo que hay por arreglar** (Luis): la auditoría del proyecto, catorce revisiones en paralelo
  más una del servidor en vivo, deja 74 cosas por arreglar en una lista viva dentro del repositorio. Y
  la guía para volver a trabajar tras formatear, con la copia de la memoria de Claude y sus
  conversaciones, fuera de git. [AUDITORIA](../listas/AUDITORIA.md), [RETOMAR](../guias/RETOMAR.md),
  [`f16515d`](https://github.com/valenmgg/MacroReborn/commit/f16515d) a
  [`18fe82e`](https://github.com/valenmgg/MacroReborn/commit/18fe82e) (6 commits).
- **18/09, servidor y navegador** (Luis): los primeros urgentes de la auditoría: la ruta de los
  archivos estáticos se resuelve una sola vez, así que ya no se tumba el proceso ni se cuela el arte
  por una barra de más (10 y 11); una sola función de escapado cierra los tres XSS almacenados (2, 4 y
  5); y quien actúa lo dice la sesión, no el cuerpo de la petición (7, 8 y 9).
  [AUDITORIA](../listas/AUDITORIA.md),
  [`270b0de`](https://github.com/valenmgg/MacroReborn/commit/270b0de) a
  [`d202784`](https://github.com/valenmgg/MacroReborn/commit/d202784) (6 commits).
- **17/09, forma de trabajar** (Luis): las imágenes de los anuncios de Discord no entran en git.
  [`f05f5ae`](https://github.com/valenmgg/MacroReborn/commit/f05f5ae) y
  [`55943e5`](https://github.com/valenmgg/MacroReborn/commit/55943e5).
- **16 y 17/09, arte** (Luis): proteger el trabajo del equipo de dibujo. El catálogo público solo
  entrega lo que alguien lleva puesto, la ruta adivinable de las prendas deja de servir arte, la
  autoría va dentro de cada dibujo, una prenda nueva tiene que venir en el lienzo canónico (y el
  catálogo se lleva a él), los términos de uso dicen a quién pedir una retirada, y un aviso salta
  cuando una IP pide muchas prendas distintas seguidas. [ARTE](../referencia/ARTE.md),
  [`0193c5d`](https://github.com/valenmgg/MacroReborn/commit/0193c5d) a
  [`a915bfa`](https://github.com/valenmgg/MacroReborn/commit/a915bfa) (18 commits).
- **16/09, avisos en vivo** (Luis): fuera Pusher. Los avisos salen por una conexión propia,
  Server-Sent Events servidos por la misma máquina, después de dos semanas sin funcionar sin que nadie
  lo notara. [AVISOS](../referencia/AVISOS.md), [AVISOS-ROTOS](AVISOS-ROTOS.md),
  [`6ad28a5`](https://github.com/valenmgg/MacroReborn/commit/6ad28a5) a
  [`9d429eb`](https://github.com/valenmgg/MacroReborn/commit/9d429eb) (9 commits).
- **16/09, cuentas** (Luis): se rellenan con bcrypt las contraseñas en claro que quedaban, y los
  documentos dejan de darlo por pendiente. [CONTRASENAS-EN-CLARO](CONTRASENAS-EN-CLARO.md),
  [`45ea013`](https://github.com/valenmgg/MacroReborn/commit/45ea013).
- **16/09, avatares** (Luis): una prenda quitada o retirada deja de pintar la marca de imagen rota, y el
  atributo `hidden` vuelve a esconder imágenes. [IMAGEN-NO-ENCONTRADA](IMAGEN-NO-ENCONTRADA.md),
  [`0cd8f16`](https://github.com/valenmgg/MacroReborn/commit/0cd8f16) y
  [`f445e66`](https://github.com/valenmgg/MacroReborn/commit/f445e66).
- **16/09, trabajo en local** (Luis): una copia local de la base de producción para probar con datos de
  verdad, y el panel de arte se puede probar en local.
  [DESARROLLO](../guias/DESARROLLO.md#probar-contra-los-datos-de-verdad),
  [`625b72a`](https://github.com/valenmgg/MacroReborn/commit/625b72a) a
  [`adc3107`](https://github.com/valenmgg/MacroReborn/commit/adc3107) (3 commits).
- **14 al 16/09, arte** (Luis): el panel del equipo de arte, para subir, publicar y retirar prendas sin
  repartir un identificador que alguien lleve puesto; y el vestidor y el taller: un maniquí que se viste
  con el catálogo, mover, escalar y espejar la prenda, publicar horneando el ajuste, y el taller en su
  propia página, en seis pasos. [`3e27fe9`](https://github.com/valenmgg/MacroReborn/commit/3e27fe9) a
  [`053443a`](https://github.com/valenmgg/MacroReborn/commit/053443a) (22 commits).
- **14 al 16/09, el navegador** (Luis): dejar de pedir de más. Los bucles que pedían los «me gusta»
  548.726 veces al día y refrescaban la sesión del perfil unas 70 veces por segundo; el editor que se
  descargaba entero al abrir el perfil (357 imágenes, 2,9 MB); las páginas que se bajaban el ranking o
  un PNG entero para pintar un número o un avatar; y las imágenes, que ahora esperan a verse.
  [`ddf2773`](https://github.com/valenmgg/MacroReborn/commit/ddf2773) a
  [`1846f70`](https://github.com/valenmgg/MacroReborn/commit/1846f70) (15 commits).
- **14 y 15/09, avatares** (Luis): el catálogo de avatares pasa a la base (migración 018), con sus
  tablas y el script que lo importa. Las prendas se sirven desde la base, también por su ruta de
  siempre; el editor y todas las páginas se construyen desde el catálogo, que lleva también las
  retiradas, solo para dibujar; y el orden de las capas y la ruta de las prendas viven en un solo sitio,
  `js/core.js`. [`fb0ec2b`](https://github.com/valenmgg/MacroReborn/commit/fb0ec2b) a
  [`8d3b4a7`](https://github.com/valenmgg/MacroReborn/commit/8d3b4a7) (15 commits).
- **14 y 15/09, servidor y producción** (Luis): las cachés, con ETag en los estáticos, versión en las URL
  de scripts y estilos, y sin guardar como `immutable` los 404 de imagen, porque `immutable` no se puede
  retirar; HTTP/2, apagado desde el primer día; el cron del ranking, roto desde la mudanza; y la rama de
  la mudanza al VPS se une a `main` (pull request #14), con la integración continua sin Node 18.
  [VPS](../referencia/VPS.md#caché-del-navegador-immutable-es-una-promesa-que-no-se-retira),
  [`e5d35fd`](https://github.com/valenmgg/MacroReborn/commit/e5d35fd) a
  [`6d0cf88`](https://github.com/valenmgg/MacroReborn/commit/6d0cf88) (8 commits).

## Semana del 31/08 al 06/09/2026

- **02/09, servidor y producción** (Luis): la mudanza de Vercel y Neon a un servidor propio. Un
  adaptador para hablar con un Postgres normal, `server.js` para servir el sitio sin Vercel y un
  lanzador en cluster para usar los dos núcleos; la configuración del servidor, guardada en `infra/`, y
  el despliegue, documentado; los estáticos con su propia zona de ritmo en nginx, y un script para medir
  la capacidad. Los datos se habían migrado el 01/09. [MUDANZA-AL-VPS](MUDANZA-AL-VPS.md),
  [VPS](../referencia/VPS.md),
  [`9158e05`](https://github.com/valenmgg/MacroReborn/commit/9158e05) a
  [`289c6ef`](https://github.com/valenmgg/MacroReborn/commit/289c6ef) (7 commits).
- **02/09, servidor y producción** (Luis): el servidor entregaba su `.env` y el código del proyecto por
  HTTP. Deja de hacerlo, con una lista blanca, y fail2ban gana una cárcel para los escaneos.
  [FUGA-DEL-ENV](FUGA-DEL-ENV.md),
  [`39745b1`](https://github.com/valenmgg/MacroReborn/commit/39745b1) a
  [`60ddcbe`](https://github.com/valenmgg/MacroReborn/commit/60ddcbe) (3 commits).
- **02/09, avatares** (Luis): el servidor valida las prendas de cada avatar; el editor carga sus
  imágenes solo cuando se ven, y los avatares PNG se sirven como imagen y no dentro de cada lista.
  [`50b44ca`](https://github.com/valenmgg/MacroReborn/commit/50b44ca) a
  [`ca518e6`](https://github.com/valenmgg/MacroReborn/commit/ca518e6) (3 commits).

## Semana del 17 al 23/08/2026

- **21/08, descubrir juegos** (SamuMacro): la portada pasa un rato a ser una página de «En
  mantenimiento», y vuelve a la de siempre.
  [`f534d2b`](https://github.com/valenmgg/MacroReborn/commit/f534d2b) y
  [`4c358c4`](https://github.com/valenmgg/MacroReborn/commit/4c358c4).
- **20 y 21/08, perfiles** (SamuMacro): la actividad reciente, del perfil y de la comunidad, se guarda
  en el servidor (`api/content.js` y `js/motor/actividad.js`).
  [`645fd05`](https://github.com/valenmgg/MacroReborn/commit/645fd05) a
  [`b0cbb2c`](https://github.com/valenmgg/MacroReborn/commit/b0cbb2c) (3 commits).
- **20/08, el navegador** (SamuMacro): la barra de navegación, rehecha con el estilo de macrojuegos
  (`css/navbar-macrojuegos.css`), con su menú en Android, el buscador y los colores de la hoja de
  inicio, en 24 subidas (una de ellas, sin cambios).
  [`e16f1d4`](https://github.com/valenmgg/MacroReborn/commit/e16f1d4) a
  [`3e975d7`](https://github.com/valenmgg/MacroReborn/commit/3e975d7) (24 commits).
- **20/08, avatares** (SamuMacro): el avatar PNG personalizado, solo para el administrador, que lo
  guarda desde su panel y que las listas enseñan en lugar del de prendas.
  [`a41c938`](https://github.com/valenmgg/MacroReborn/commit/a41c938).
- **20/08, comunidad y rankings** (SamuMacro): el sistema de ranking de los originales y del progreso
  (`api/originales-ranking.js` y `api/progreso.js`).
  [`a03db86`](https://github.com/valenmgg/MacroReborn/commit/a03db86).
- **19 y 20/08, perfiles** (SamuMacro): el perfil clásico en modo claro, con el diseño de macrojuegos
  (`css/perfil-macrojuegos-light.css` y `js/perfil-tarjeta-clasica.js`).
  [`de76d01`](https://github.com/valenmgg/MacroReborn/commit/de76d01) a
  [`bda2ca6`](https://github.com/valenmgg/MacroReborn/commit/bda2ca6) (6 commits).
- **19 y 20/08, misiones y logros** (SamuMacro): las funciones de Mi día.
  [`52ac855`](https://github.com/valenmgg/MacroReborn/commit/52ac855) a
  [`6b42e2f`](https://github.com/valenmgg/MacroReborn/commit/6b42e2f) (3 commits).
- **19/08, notificaciones y noticias** (SamuMacro): las notificaciones en tiempo real en todas las
  páginas (`js/notificaciones.js` y `js/realtime.js`), y las que crea el servidor por logros, XP y
  amigos (`api/_notifications.js`).
  [`71bf914`](https://github.com/valenmgg/MacroReborn/commit/71bf914) a
  [`225bb2d`](https://github.com/valenmgg/MacroReborn/commit/225bb2d) (3 commits).
- **18 y 19/08, el navegador** (SamuMacro): «Morpho», una mezcla que toca casi todas las páginas y
  scripts; una actualización masiva de estilos; el tema común, `css/theme-canonical.css`, con más
  contraste; cómo se ven las páginas nuevas; y arreglos en los scripts del perfil.
  [`a5ff8a7`](https://github.com/valenmgg/MacroReborn/commit/a5ff8a7) a
  [`2b9e863`](https://github.com/valenmgg/MacroReborn/commit/2b9e863) (14 commits).
- **18/08, comunidad y rankings** (SamuMacro): Macro Snake, el primer juego original de la casa (el
  113), con su página de originales, su ranking propio (`api/originales-ranking.js`, migración 017) y
  la competición; y las Ligas (`liga-global.html`) y la actividad de la comunidad
  (`actividad-comunidad.html`).
  [`b659a1c`](https://github.com/valenmgg/MacroReborn/commit/b659a1c) a
  [`3b23feb`](https://github.com/valenmgg/MacroReborn/commit/3b23feb) (19 commits).
- **18/08, misiones y logros** (SamuMacro): la página de progreso, con las misiones, la racha y su API
  (`api/progreso.js`, migración 016), y Mi día.
  [`d481a3b`](https://github.com/valenmgg/MacroReborn/commit/d481a3b) a
  [`68a233a`](https://github.com/valenmgg/MacroReborn/commit/68a233a) (11 commits).
- **18/08, descubrir juegos** (SamuMacro): Explorar; la portada nueva, con su centro de todo y el portal
  (`js/home-portal.js` y `portal-growth.js`, con copias en la raíz que hoy no carga ninguna página); y
  retoques del catálogo.
  [`26ab698`](https://github.com/valenmgg/MacroReborn/commit/26ab698) a
  [`54a7f71`](https://github.com/valenmgg/MacroReborn/commit/54a7f71) (15 commits).
- **18/08, perfiles** (SamuMacro): el bloque «Identidad gamer» del perfil, que salió el 28/09, y
  retoques del perfil.
  [`85b96e0`](https://github.com/valenmgg/MacroReborn/commit/85b96e0) a
  [`fc0caf9`](https://github.com/valenmgg/MacroReborn/commit/fc0caf9) (7 commits).
- **18/08, el servidor** (SamuMacro): una subida grande, «cambios-drasticos», que toca la API entera y
  muchas páginas, y otras cuatro a `api/_auth.js`, `api/users.js`, `api/content.js` y `js/core.js`;
  sus asuntos no dicen qué cambian.
  [`bd37ac1`](https://github.com/valenmgg/MacroReborn/commit/bd37ac1) a
  [`c57ab68`](https://github.com/valenmgg/MacroReborn/commit/c57ab68) (5 commits).
- **18/08, el navegador** (SamuMacro): la barra, las hojas de inicio y de Explorar, las categorías y las
  colecciones, una subida que toca 21 páginas a la vez, y cinco subidas que no cambiaron nada.
  [`dc90f83`](https://github.com/valenmgg/MacroReborn/commit/dc90f83) a
  [`1015790`](https://github.com/valenmgg/MacroReborn/commit/1015790) (12 commits).
- **18/08, monedas** (Luis): las monedas por tiempo jugado: un servicio con su migración (015), los
  premios en el pulso de XP y el gasto en la tienda, sus pruebas y la prueba de humo, y el orden de
  despliegue, documentado. Entra por el pull request #10. [ECONOMIA](../referencia/ECONOMIA.md),
  [`0ec81ba`](https://github.com/valenmgg/MacroReborn/commit/0ec81ba) a
  [`9166f38`](https://github.com/valenmgg/MacroReborn/commit/9166f38) (7 commits).
- **18/08, cuentas** (Luis): el navegador recupera una sesión local que el servidor ya no acepta
  (pull requests #11 y #12).
  [`657f78f`](https://github.com/valenmgg/MacroReborn/commit/657f78f) a
  [`997ffbe`](https://github.com/valenmgg/MacroReborn/commit/997ffbe) (4 commits).
- **18/08, el navegador** (Luis): una limpieza de lo que ya no cargaba ninguna página (el perfil retro,
  `home.js`, `comunidad.js`, la portada de prueba y tres archivos sueltos), que entra por el pull
  request #13; y una prueba en el README.
  [`7bc8596`](https://github.com/valenmgg/MacroReborn/commit/7bc8596) a
  [`a5bb611`](https://github.com/valenmgg/MacroReborn/commit/a5bb611) (3 commits).
- **17 y 18/08, avatares** (valenmgg y Luis): dibujos nuevos y retocados de Cereza y Tora (bocas,
  caras, pieles y guantes), subidos por la web y por dos pull requests (#8 y #9).
  [`e7f9228`](https://github.com/valenmgg/MacroReborn/commit/e7f9228) a
  [`a5d51e4`](https://github.com/valenmgg/MacroReborn/commit/a5d51e4) (10 commits).
- **17/08, el navegador** (SamuMacro): las portadas de los juegos se quedan solo en JPEG (fuera las 109
  PNG) y los 626 dibujos de las prendas se comprimen; y retoques en doce páginas, la barra, el perfil y
  el ranking. [SEO](../referencia/SEO.md#5-imágenes),
  [`e4cfacd`](https://github.com/valenmgg/MacroReborn/commit/e4cfacd) a
  [`7d77ea8`](https://github.com/valenmgg/MacroReborn/commit/7d77ea8) (5 commits).

## Semana del 10 al 16/08/2026

- **16/08, cuentas** (Luis, y la unión de valenmgg): las contraseñas pasan a bcrypt, con migración
  perezosa. `api/_db.js`, el conector único de la base; `api/_password.js` y las migraciones 013 y 014;
  la base de práctica, PGlite, con sus pruebas, y el servidor local; el relleno de las que quedaban en
  claro; la integración continua en GitHub Actions; y la primera documentación, el README y las guías
  de desarrollo y de seguridad. Entra por los pull requests #2 y #6. [CUENTAS](../referencia/CUENTAS.md),
  [CONTRASENAS-EN-CLARO](CONTRASENAS-EN-CLARO.md),
  [`55e81c5`](https://github.com/valenmgg/MacroReborn/commit/55e81c5) a
  [`911428e`](https://github.com/valenmgg/MacroReborn/commit/911428e) (20 commits).
- **16/08, juegos** (Luis): Superfighters (el 111, Flash con Ruffle) e I Am Hall Security (el 112,
  HTML5 por iframe), con la guía para agregar un juego. Pull requests #4 y #7.
  [JUEGOS](../guias/JUEGOS.md#5-casos-reales),
  [`460b735`](https://github.com/valenmgg/MacroReborn/commit/460b735) a
  [`ef5fd90`](https://github.com/valenmgg/MacroReborn/commit/ef5fd90) (11 commits).
- **16/08, avatares** (SamuMacro): llegan los dibujos de las prendas de todos los personajes, 454
  archivos nuevos, con retoques de fondos, pieles y de Tora; y ocho subidas que no cambiaron nada.
  [`efc43f2`](https://github.com/valenmgg/MacroReborn/commit/efc43f2) a
  [`637509f`](https://github.com/valenmgg/MacroReborn/commit/637509f) (14 commits).
- **14/08, juegos** (SamuMacro): las portadas de los juegos pasan a JPEG, 110 nuevas, y el catálogo las
  usa; los scripts de catorce páginas se cargan con `defer`; y dos subidas no cambiaron nada.
  [`9c04340`](https://github.com/valenmgg/MacroReborn/commit/9c04340) a
  [`5c32156`](https://github.com/valenmgg/MacroReborn/commit/5c32156) (6 commits).
- **14/08, tienda** (SamuMacro): la primera tienda de avatares, con monedas: su tabla y sus precios
  (migración 012) y su API; y una subida sin cambios.
  [`e0f9dbe`](https://github.com/valenmgg/MacroReborn/commit/e0f9dbe) a
  [`77a8c3e`](https://github.com/valenmgg/MacroReborn/commit/77a8c3e) (3 commits).
- **14/08, moderación** (SamuMacro): el panel de administración (`admin.html` y `js/admin.js`) y sus
  estadísticas (`api/system.js`).
  [`a09015e`](https://github.com/valenmgg/MacroReborn/commit/a09015e) a
  [`0de71b2`](https://github.com/valenmgg/MacroReborn/commit/0de71b2) (4 commits).
- **13 y 14/08, perfiles** (SamuMacro): la actividad de cada persona, con sus reseñas y valoraciones de
  juegos, en el perfil propio y en el de los demás (`js/motor/actividad.js`).
  [`4bbe7e9`](https://github.com/valenmgg/MacroReborn/commit/4bbe7e9) a
  [`f4d9275`](https://github.com/valenmgg/MacroReborn/commit/f4d9275) (12 commits).
- **13/08, comunidad y rankings** (SamuMacro): Comunidad y el ranking, juntos en
  `comunidad-ranking.html`; el ranking por tiempo jugado y su historial (migraciones 010 y 011), que el
  servidor recalcula los lunes con un cron de Vercel (`vercel.json`).
  [`7350a50`](https://github.com/valenmgg/MacroReborn/commit/7350a50) a
  [`edf4471`](https://github.com/valenmgg/MacroReborn/commit/edf4471) (11 commits).
- **13/08, amigos** (SamuMacro): bloquear a otra persona (migración 009), en el perfil de los demás, el
  chat, las menciones y las notificaciones; y una subida sin cambios.
  [`d07cab0`](https://github.com/valenmgg/MacroReborn/commit/d07cab0) a
  [`6b397bb`](https://github.com/valenmgg/MacroReborn/commit/6b397bb) (19 commits).
- **12 al 14/08, avatares** (SamuMacro): retoques y dibujos nuevos de Cereza y Tora: pieles, pelos,
  espaldas y remeras. [`92fcc46`](https://github.com/valenmgg/MacroReborn/commit/92fcc46) a
  [`f35ac27`](https://github.com/valenmgg/MacroReborn/commit/f35ac27) (5 commits).
- **12/08, perfiles** (SamuMacro): el perfil propio y el de los demás crecen: comentarios y actividad en
  tiempo real (`js/perfil-realtime.js`), insignias, amigos favoritos (migración 007), favoritos e
  historial de juegos, y la galería de diseños de avatar guardados, con votos (migración 008); y cinco
  subidas sin cambios. [`209764c`](https://github.com/valenmgg/MacroReborn/commit/209764c) a
  [`6c82078`](https://github.com/valenmgg/MacroReborn/commit/6c82078) (47 commits).
- **12/08, avisos en vivo** (SamuMacro y valenmgg): los avisos en tiempo real, con Pusher (el antiguo
  `_pusher.js` y `js/realtime.js`), en nueve páginas. [AVISOS-ROTOS](AVISOS-ROTOS.md),
  [`b1f3347`](https://github.com/valenmgg/MacroReborn/commit/b1f3347) a
  [`fdabb43`](https://github.com/valenmgg/MacroReborn/commit/fdabb43) (5 commits).
- **12/08, comunidad y rankings** (SamuMacro): la página del ranking (`ranking.html` y `js/ranking.js`).
  [`34a98f8`](https://github.com/valenmgg/MacroReborn/commit/34a98f8) a
  [`9d9a12a`](https://github.com/valenmgg/MacroReborn/commit/9d9a12a) (3 commits).
- **12/08, juegos** (SamuMacro): el catálogo (`juegos.html`) y la ficha de cada juego (`juego.html`),
  con sus estilos. [`b7ba752`](https://github.com/valenmgg/MacroReborn/commit/b7ba752) a
  [`e8c2c7e`](https://github.com/valenmgg/MacroReborn/commit/e8c2c7e) (7 commits).
- **12/08, descubrir juegos** (valenmgg): dos retoques de la portada.
  [`225e99e`](https://github.com/valenmgg/MacroReborn/commit/225e99e) y
  [`ec4bf7a`](https://github.com/valenmgg/MacroReborn/commit/ec4bf7a).
- **11 al 13/08, juegos** (SamuMacro): el catálogo, reescrito entero (sus 99 entradas), y juegos nuevos:
  Crazy Zombie 8 y 9, Earn to Die, Sports Head Football y Pokémon Emerald Rogue.
  [JUEGOS](../guias/JUEGOS.md), [`8f63882`](https://github.com/valenmgg/MacroReborn/commit/8f63882) a
  [`00b7d31`](https://github.com/valenmgg/MacroReborn/commit/00b7d31) (8 commits).
- **11 al 16/08, perfiles** (SamuMacro): el aspecto del perfil: el perfil retro, la tarjeta clásica
  (`js/perfil-tarjeta-clasica.js`) y una hoja de referencia del modo claro.
  [`70be7d4`](https://github.com/valenmgg/MacroReborn/commit/70be7d4) a
  [`22f1bda`](https://github.com/valenmgg/MacroReborn/commit/22f1bda) (14 commits).
- **11 al 15/08, el navegador** (SamuMacro): arreglos para el móvil, el menú en móvil
  (`js/nav-toggle.js`) y la barra en todas las páginas, y retoques de casi todas las hojas de estilo;
  una de las subidas no cambió nada.
  [`bfded78`](https://github.com/valenmgg/MacroReborn/commit/bfded78) a
  [`6283ff7`](https://github.com/valenmgg/MacroReborn/commit/6283ff7) (20 commits).
- **11/08, notificaciones y noticias** (SamuMacro y valenmgg): notificaciones más interactivas, con
  menciones y un botón para responder desde las reseñas y los perfiles; valenmgg retoca las
  notificaciones y limpia parte de una copia suelta del proyecto, `MacroReborn-fixes/`; y dos subidas
  sin cambios. [`1eee211`](https://github.com/valenmgg/MacroReborn/commit/1eee211) a
  [`87a38e9`](https://github.com/valenmgg/MacroReborn/commit/87a38e9) (10 commits).

## Semana del 03 al 09/08/2026

- **09/08, avatares** (valenmgg): opciones nuevas de avatar para Tora y Cereza.
  [`95a344b`](https://github.com/valenmgg/MacroReborn/commit/95a344b) y
  [`cad9c80`](https://github.com/valenmgg/MacroReborn/commit/cad9c80).
- **08/08, chat** (valenmgg): los mensajes nuevos salen arriba.
  [`df23e64`](https://github.com/valenmgg/MacroReborn/commit/df23e64) a
  [`1fe91b0`](https://github.com/valenmgg/MacroReborn/commit/1fe91b0) (4 commits).
- **07/08, juegos** (valenmgg): la «1.0 final»: cada juego pasa a tener su página en `html/juegos/` y su
  portada, 63 de cada, con retoques del chat, las noticias y los perfiles; y el avatar del buscador, de
  su tamaño. [JUEGOS](../guias/JUEGOS.md),
  [`1f3835d`](https://github.com/valenmgg/MacroReborn/commit/1f3835d) y
  [`1dd45c1`](https://github.com/valenmgg/MacroReborn/commit/1dd45c1).
- **05/08, perfiles** (valenmgg): la «Version 1.0», con una copia suelta de algunos archivos en
  `MacroReborn-fixes/`, y las correcciones finales de Neon y de los avatares: la actividad y los
  favoritos del perfil de los demás, y el buscador.
  [`ea5ae7a`](https://github.com/valenmgg/MacroReborn/commit/ea5ae7a) y
  [`909cc61`](https://github.com/valenmgg/MacroReborn/commit/909cc61).
- **03 y 04/08, el servidor** (valenmgg): el sitio pasa a tener base de datos, un PostgreSQL en Neon. El
  registro, el login, la biografía y el avatar se guardan en ella, y la API se reorganiza de 13
  funciones a 4 (`auth`, `social`, `users` y `system`) para caber en el plan gratuito de Vercel. Cómo
  se salió de ahí, en [MUDANZA-AL-VPS](MUDANZA-AL-VPS.md).
  [`573d49c`](https://github.com/valenmgg/MacroReborn/commit/573d49c) a
  [`a3e8324`](https://github.com/valenmgg/MacroReborn/commit/a3e8324) (22 commits).

## Semana del 27/07 al 02/08/2026

- **30/07, perfiles** (valenmgg): un cambio en `js/perfil.js`.
  [`7a04329`](https://github.com/valenmgg/MacroReborn/commit/7a04329).

## Semana del 20 al 26/07/2026

- **23/07, todo** (valenmgg): la primera subida del sitio a GitHub: las páginas, sus estilos, sus
  scripts y las imágenes, en dos tandas que se juntan con una fusión; y dos subidas sin cambios.
  [`96260a0`](https://github.com/valenmgg/MacroReborn/commit/96260a0) a
  [`16f053a`](https://github.com/valenmgg/MacroReborn/commit/16f053a) (5 commits).
