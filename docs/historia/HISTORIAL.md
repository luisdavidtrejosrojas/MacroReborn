# HISTORIAL — qué cambió y cuándo

> **De qué trata:** todo lo que cambió en MacroReborn, semana a semana, desde la primera subida, el
> 23/07/2026: cada cambio con su día, su área, quién lo hizo y dónde se explica.
>
> **Para quién:** el equipo de desarrollo.
>
> **Revisado:** 05/10/2026

**Cómo se mantiene.** Cada especificación añade aquí su entrada como última tarea, antes de unirse a
`main`, con la fecha de esa unión ([SUMARSE](../guias/SUMARSE.md)). Lo de antes se reconstruyó el
05/10/2026 a partir de los commits, con su fecha de autor. Las semanas van de lunes a domingo, la más
reciente arriba, y los enlaces a commits llevan a GitHub, que pide entrar con una cuenta del equipo.

---

## Semana del 05 al 11/10/2026

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
