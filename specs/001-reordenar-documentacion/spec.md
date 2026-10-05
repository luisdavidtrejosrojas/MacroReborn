# Especificación: reordenar la documentación

**Rama**: `001-reordenar-documentacion`
**Creada**: 2026-10-05
**Estado**: Borrador
**Pedido**: Luis, 05/10/2026, al adoptar Spec Kit: "Una primera spec que reordene la documentación y
todo quede bien".

## Contexto

MacroReborn tiene mucha documentación y buena: 15 documentos en `docs/` (unas 5.700 líneas), más el
`README.md`, el `CLAUDE.md` y la constitución. Pero creció a golpe de sesión de trabajo y hoy:

- Cuatro documentos no aparecen en el índice del `README.md`: los cambios de otros devs, la economía, la
  moderación y la tienda.
- Algunas frases ya no son verdad. Por ejemplo, varias notas dicen que el repositorio es público, y hoy es
  privado.
- La documentación de referencia (cómo es el sistema hoy) está mezclada con investigaciones e historias
  (cómo se llegó ahí). `docs/DESARROLLO.md` tiene 812 líneas que combinan las dos cosas.
- No hay una visión de conjunto del sistema, ni un historial de cambios por versión, ni una guía para que
  otra persona del equipo se sume. La constitución pide las tres (reglas XIX y XXXII).
- `docs/SUGERENCIAS.md`, escrito el 05/10, lleva emojis, y la regla XXX los prohíbe en la documentación
  nueva.

Esta especificación pide que la documentación quede ordenada, al día y fácil de recorrer, sin perder
nada de lo que ya cuenta. No cambia el comportamiento del sitio.

## Aclaraciones

### Sesión 2026-10-05

- P: ¿Desde cuándo se reconstruye el historial de cambios? → R: Desde el inicio del proyecto (agosto de
  2026), a partir del historial de git y agrupado por semanas.
- P: ¿Dónde va el contenido histórico o de investigación? → R: En una carpeta de historia, un documento
  por tema. En el documento de referencia queda un resumen de dos líneas con el enlace.
- P: ¿Los documentos se reparten en subcarpetas por tipo? → R: Sí: referencia, guías, listas vivas e
  historia. Se actualizan todas las menciones que los citan.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - Encontrar rápido lo que se busca (Prioridad: P1)

Luis, Claude o alguien del equipo llega con una pregunta concreta ("¿cómo despliego?", "¿cómo funciona
la tienda?", "¿qué queda por arreglar?") y desde la entrada de la documentación llega en pocos pasos al
documento que la responde.

**Por qué esta prioridad**: es el uso de cada día. Si no se encuentra algo, se vuelve a investigar o se
hace mal.

**Prueba independiente**: con solo el índice nuevo, encontrar la respuesta a diez preguntas típicas, cada
una en dos clics como mucho.

**Escenarios de aceptación**:

1. **Dado** el `README.md`, **cuando** alguien busca cómo desplegar, **entonces** llega a las
   instrucciones en dos clics como mucho.
2. **Dado** cualquier documento de `docs/`, **cuando** se mira el índice, **entonces** aparece con una
   frase que dice qué contiene y para quién es.
3. **Dado** un documento cualquiera, **cuando** se abre, **entonces** dice al principio de qué trata, a
   quién va dirigido y cuándo se revisó por última vez.

---

### Historia 2 - Confiar en lo que dice la documentación (Prioridad: P1)

Quien lee un documento puede fiarse de que describe el sistema tal como es hoy: sin frases caducadas, sin
dos documentos que se contradicen y con un solo documento de referencia por tema.

**Por qué esta prioridad**: una documentación que miente es peor que ninguna. Con Spec Kit, cada cambio
futuro actualizará su documento de referencia, así que hay que partir de un estado limpio.

**Prueba independiente**: una lista de revisión con cada documento marcado como revisado contra el estado
actual, y ninguna afirmación pendiente de corregir.

**Escenarios de aceptación**:

1. **Dado** un tema (por ejemplo, el despliegue), **cuando** aparece en varios documentos, **entonces**
   solo uno lo explica entero y los demás enlazan a él.
2. **Dado** un dato que cambió (el repositorio pasó a privado), **cuando** se busca en toda la
   documentación, **entonces** ninguna frase dice lo contrario.

---

### Historia 3 - Entender el sistema de un vistazo (Prioridad: P2)

Quien llega nuevo, o Claude al empezar una sesión, entiende en una sola lectura cómo está hecho
MacroReborn: sus partes, cómo se conectan y dónde vive cada cosa. Desde ahí sabe a qué documento ir para
el detalle.

**Por qué esta prioridad**: hoy esa visión hay que armarla leyendo varios documentos largos.

**Prueba independiente**: alguien que no conoce el proyecto explica, tras leer solo ese documento, qué
partes tiene el sistema y dónde mirar cada una.

**Escenarios de aceptación**:

1. **Dado** el documento de visión de conjunto, **cuando** se lee, **entonces** nombra cada parte del
   sistema (páginas, servidor, base de datos, servidor de producción, pruebas) y enlaza su documento de
   detalle.

---

### Historia 4 - Sumarse al equipo y a la forma de trabajar (Prioridad: P2)

Una persona del equipo que hoy no usa Spec Kit puede preparar su entorno, entender cómo se trabaja
(especificaciones, ramas, commits, pruebas, despliegue) y empezar, siguiendo una sola guía.

**Por qué esta prioridad**: Luis quiere que lo ideal sea que los demás también lo usen (regla XXXII).

**Prueba independiente**: siguiendo solo la guía, alguien prepara el entorno y pasa las pruebas
automáticas.

**Escenarios de aceptación**:

1. **Dado** un equipo nuevo, **cuando** se sigue la guía, **entonces** al final se pueden correr las
   pruebas y abrir el sitio en local.
2. **Dado** un cambio que alguien quiere hacer, **cuando** lee la guía, **entonces** sabe qué pasos de
   Spec Kit seguir, cómo nombrar los commits y que desplegar necesita el OK de Luis.

---

### Historia 5 - Saber qué cambió y cuándo (Prioridad: P3)

Cualquiera puede ver qué cambió en el sitio y cuándo, sin leer el historial de commits uno a uno.

**Por qué esta prioridad**: la constitución pide el historial de cambios (regla XIX). Sirve para el
equipo y para explicar a la comunidad qué cambió.

**Prueba independiente**: elegir tres cambios conocidos (la economía nueva, el pelo de atrás, los nombres
sin mayúsculas) y encontrarlos en el historial con su fecha.

**Escenarios de aceptación**:

1. **Dado** el historial de cambios, **cuando** se busca un cambio publicado, **entonces** aparece con
   su fecha y un enlace a donde se explica.

---

### Casos límite

- **Contenido histórico:** una investigación larga (por ejemplo, cómo se encontró un error) no puede
  perderse al separarla de la referencia. Tiene que seguir siendo fácil de encontrar.
- **Enlaces y menciones:** si un documento se mueve o se renombra, deben seguir funcionando los enlaces
  entre documentos y las menciones desde el código (muchos comentarios citan, por ejemplo, "punto 31 de
  docs/AUDITORIA.md" o "docs/DESARROLLO.md §8").
- **Listas vivas:** `docs/AUDITORIA.md` y `docs/SUGERENCIAS.md` no pierden filas ni cambian sus números
  (regla XXXI).
- **Datos sensibles:** al mover contenido no puede aparecer ninguna IP entera, correo ni dato personal
  (regla XXV).
- **Emojis:** se quitan de la documentación nueva (`SUGERENCIAS.md`). Los de documentos anteriores se
  dejan, como dice la regla XXX.
- **Fuera de git:** `memoria-claude/LEEME.md` y `sugerencias-discord/` no entran en git, pero también se
  revisan si dicen algo caducado.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: La documentación DEBE tener una entrada única, el `README.md`, que diga qué es MacroReborn,
  para quién es cada documento y enlace a todos.
- **RF-002**: Todo documento de `docs/` DEBE aparecer en el índice con una frase sobre su contenido.
- **RF-003**: Cada documento DEBE decir al principio de qué trata, a quién va dirigido y la fecha de su
  última revisión.
- **RF-004**: La documentación DEBE distinguir cinco tipos y el índice DEBE agruparla así:
  - referencia del sistema: cómo es hoy;
  - guías: cómo hacer algo;
  - listas vivas: lo pendiente;
  - historia y decisiones: por qué está como está;
  - especificaciones: `specs/`.
- **RF-005**: DEBE existir un documento de visión de conjunto del sistema que nombre cada parte y enlace
  su documento de detalle.
- **RF-006**: DEBE existir una guía para sumarse con estos contenidos:
  - preparar el entorno;
  - cómo se trabaja con Spec Kit, incluido cómo lo instala otro dev y cómo lo usa con su asistente;
  - cómo se nombran los commits y cómo se usan las ramas;
  - cómo se prueba y cómo se despliega;
  - que la constitución manda.
- **RF-007**: DEBE existir un historial de cambios ordenado por fecha, desde el inicio del proyecto
  (agosto de 2026), reconstruido a partir del historial de git y agrupado por semanas. Cada entrada dice
  qué cambió y enlaza a donde se explica.
- **RF-008**: Cada documento DEBE revisarse contra el estado actual del proyecto, y toda afirmación
  caducada DEBE corregirse.
- **RF-009**: Cada tema DEBE tener un único documento de referencia; si aparece en otros, esos enlazan al
  de referencia en lugar de repetirlo.
- **RF-010**: El contenido histórico o de investigación DEBE conservarse entero en una carpeta de
  historia, un documento por tema. En el documento de referencia DEBE quedar un resumen de dos líneas con
  el enlace.
- **RF-011**: Los documentos DEBEN repartirse en subcarpetas por tipo (referencia, guías, listas vivas e
  historia). Después de moverlos DEBEN funcionar todos los enlaces entre documentos y todas las menciones
  a documentos desde el código y sus comentarios, el `CLAUDE.md`, el `.gitignore` y la constitución.
- **RF-012**: Todo lo nuevo o reescrito DEBE cumplir la constitución:
  - español;
  - sin emojis, quitando los de `docs/SUGERENCIAS.md`;
  - sin datos sensibles;
  - listas vivas intactas.
- **RF-013**: La entrada DEBE enlazar la constitución, el `CLAUDE.md` y la carpeta `specs/`, y explicar
  en una línea qué es cada uno.
- **RF-014**: DEBE quedar escrito qué documento de referencia corresponde a cada área del sistema, para
  que cada especificación futura sepa cuál actualizar (regla XIX).
- **RF-015**: Ningún contenido actual DEBE perderse: lo que hoy cuenta un documento DEBE seguir contado
  en alguno.

### Entidades clave

- **Documento**: un archivo de documentación. Tiene un tipo (referencia, guía, lista viva, historia o
  especificación), un tema, a quién va dirigido y la fecha de su última revisión.
- **Índice**: la lista de todos los documentos, agrupada por tipo, en la entrada.
- **Entrada del historial**: una fecha, qué cambió y dónde se explica.
- **Área del sistema**: una parte del sitio (juegos, avatares, tienda, economía, moderación, cuentas,
  servidor...) con su documento de referencia.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Desde la entrada, cualquier documento se alcanza en dos clics como mucho.
- **CE-002**: El 100 % de los documentos de `docs/` está en el índice.
- **CE-003**: Cero enlaces rotos entre documentos y cero menciones rotas desde el código, comprobado de
  forma automática.
- **CE-004**: Cada documento tiene su fecha de revisión, y la lista de revisión no deja ninguna
  afirmación caducada sin corregir.
- **CE-005**: Una persona nueva prepara su entorno y pasa las pruebas siguiendo solo la guía, en menos de
  30 minutos.
- **CE-006**: Ningún contenido se pierde: cada sección de antes se encuentra en algún documento de
  después.
- **CE-007**: Cero emojis en la documentación nueva o reescrita.
- **CE-008**: Las diez preguntas típicas de la historia 1 se responden desde el índice.

## Supuestos

- Solo se toca documentación (el `README.md`, `docs/`, el `CLAUDE.md` y los comentarios del código que
  citen rutas de documentos si alguna cambia). El comportamiento del sitio no cambia.
- No se escriben especificaciones retroactivas de lo que ya existe; así lo decidió Luis el 05/10/2026.
  Lo existente se documenta en `docs/` y lo nuevo entra por Spec Kit.
- Las listas vivas mantienen su formato y su numeración.
- `memoria-claude/` y `sugerencias-discord/` siguen fuera de git (regla XXV).
- Los documentos conservan su nombre de archivo dentro de su nueva subcarpeta, salvo que haya un buen
  motivo; lo que cambia es la ruta.
- La constitución cita rutas de documentos (por ejemplo `docs/AUDITORIA.md` y `docs/VPS.md`). Se
  corrigen con una enmienda PATCH (v1.0.1) que Luis aprueba, como pide su sección de gobierno.
- La integración continua está en rojo por una causa ajena (la prueba de humo de monedas). No bloquea esta
  especificación, pero esta rama no se une a `main` hasta que esté en verde o Luis decida otra cosa
  (regla XXII).
