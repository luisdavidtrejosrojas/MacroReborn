# Especificación: los volcados con contraseñas en claro (spec corta)

**Rama**: `006-volcados-en-claro`
**Creada**: 2026-10-09
**Estado**: Aprobada por Luis el 09/10/2026
**Tipo**: spec corta (regla XIX): especificación, plan y tareas en esta página, aprobados una vez.
**Pedido**: Luis, 09/10/2026: el «A» para el punto 86 de la auditoría, después de desplegar la 005.

## Contexto

El 01/09/2026, en la mudanza de Neon al VPS, la base se volcó con `pg_dump` en `~/respaldos/` del
servidor ([MUDANZA-AL-VPS](../../docs/historia/MUDANZA-AL-VPS.md)). Ese día 21 cuentas guardaban su
contraseña en texto plano: las que no habían vuelto a entrar desde que el sitio las pica con bcrypt. El
16/09 se picaron en la base las que quedaban, y se comprobó que validan contra su hash nuevo
([CONTRASENAS-EN-CLARO](../../docs/historia/CONTRASENAS-EN-CLARO.md)): el hash de hoy es de la misma
contraseña, salvo que alguien la haya cambiado después. Los volcados se quedaron como estaban, y la
limpieza de 14 días solo borra `diarios/` (punto 86 de la auditoría).

Comprobado el 09/10, solo leyendo y solo contando, sin enseñar ninguna contraseña ni ningún nombre:

| Dónde | Qué hay | Contraseñas en claro |
|---|---|---|
| Servidor, `~/respaldos/neon-completo-2026-09-01-2333.sql` | La base de Neon del 01/09, entera: 63 cuentas | 21, y las 21 cuentas siguen hoy |
| Servidor, `~/respaldos/neon-solodatos-2026-09-01-2333.sql` | La misma, solo los datos | Las mismas 21 |
| Servidor, los dos `neon-*-2332.sql` | Vacíos (0 bytes): el intento de un minuto antes | 0 |
| Servidor, el resto de `~/respaldos/` | Los diarios (desde el 25/09) y los de «antes de» del 24/09 y el 04/10 | 0 |
| La base de hoy | `users.password` sigue existiendo, sin ningún valor | 0 |
| PC de Luis, `datos-locales/` | Tres respaldos de producción, del 17 y el 22/09 | 0 |
| PC de Luis, su carpeta de usuario y D:, E: y F: | Ni volcados de Neon ni la carpeta «MacroReborn - respaldos» que nombra la mudanza, que era del PC de antes del formateo del 19/09 | — |
| Google Drive | Sin mirar, por decisión de Luis (D5) | — |

No hay señales de que hayan salido de ahí. Nunca estuvieron en git, y la web no los sirve: su ruta da 404,
y con `..` da 400 o 404. Los registros de nginx, que llegan hasta el 25/09, no tienen ninguna petición a
ellos aparte de esa comprobación. Y en el servidor solo los puede leer la cuenta `azureuser` (y root),
porque su carpeta personal es 750.

Pero quien tuviera esos archivos podría entrar en esas 21 cuentas. También en otros sitios, si alguien
repite la contraseña.

## Aclaraciones

### Sesión 2026-10-09

- P: ¿Qué se hace con los dos volcados? → R: Borrarlos (D1).
- P: ¿Se mira Google Drive, por si la copia de la mudanza viajó allí antes del formateo? → R: No (D5).
  Luis preguntó para qué serviría, y la respuesta fue: solo para poder decir que no queda ninguna copia.
  Si viajó, está en su cuenta de Google, no en un servidor abierto a internet, que es el riesgo de este
  punto.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - En el servidor no queda ninguna contraseña en claro (Prioridad: P1)

Los volcados del 01/09 se borran del servidor, y el resto de los respaldos sigue igual.

**Por qué esta prioridad**: son contraseñas que probablemente siguen valiendo, en una máquina abierta a
internet.

**Prueba independiente**: recorrer los respaldos del servidor contando las contraseñas en claro.

**Escenarios de aceptación**:

1. **Dado** el servidor, **cuando** se recorre `~/respaldos/`, **entonces** ningún archivo lleva
   contraseñas en claro.
2. **Dados** los demás respaldos guardados a propósito, **cuando** se termina, **entonces** siguen con
   su nombre, su tamaño y su fecha.

---

### Historia 2 - La documentación lo cuenta (Prioridad: P2)

Los documentos dejan de decir que esos volcados están, y la auditoría cierra el punto 86.

**Por qué esta prioridad**: para que nadie los busque ni los dé por guardados.

**Prueba independiente**: leer VPS, CUENTAS y la auditoría.

**Escenarios de aceptación**:

1. **Dada** la documentación, **cuando** se lee, **entonces** dice qué se hizo con los volcados y cuándo,
   y el punto 86 tiene su fecha y su nota.

---

### Casos límite

- Borrar en el servidor no se deshace. Luis decidió que no se guarda nada (D1), y el borrado espera su
  OK en ese momento.
- Los respaldos diarios no pueden traer de vuelta las contraseñas en claro: la base de hoy no tiene
  ninguna.
- El disco del servidor puede guardar restos de lo borrado hasta que se escriba encima. No se intenta
  borrar «a fondo» (D3): lo que importa es que ningún archivo los tenga.

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: Ningún archivo del servidor DEBE llevar contraseñas en claro.
- **RF-002**: Los dos volcados del 01/09 DEBEN borrarse, con los dos archivos vacíos de al lado (D1 y
  D2).
- **RF-003**: Los demás archivos de `~/respaldos/` NO DEBEN cambiar.
- **RF-004**: Lo que se borre en el servidor DEBE borrarse con el OK de Luis en ese momento (regla XXI).
- **RF-005**: La documentación DEBE dejar de decir que esos volcados están, y la auditoría DEBE cerrar el
  punto 86 con su fecha.
- **RF-006**: Al unirse a `main`, el historial DEBE tener su entrada.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Ningún archivo del servidor tiene contraseñas en claro. Hoy hay 2, con 21 cada uno.
- **CE-002**: El resto de `~/respaldos/` sigue igual, con el mismo nombre, tamaño y fecha. Solo cambian
  los diarios, que entran y salen solos.
- **CE-003**: La documentación cuenta lo que se hizo, y `npm test` está en verde con Node 22 y 24 (con
  la prueba de la documentación).

## Supuestos

- Nadie necesita la base de Neon del 01/09. El sitio corre en el VPS desde ese día, con respaldos diarios
  y los de «antes de» del 24/09 y el 04/10, y esos volcados no se han usado nunca.
- No se avisa a las 21 cuentas ni se les cambia la contraseña. No hay señales de que los volcados
  salieran, y sin correos ni recuperación de cuenta (punto 61), forzar el cambio las dejaría fuera.
- La copia que la mudanza dejó en el PC se perdió con el formateo del 19/09. Si algún día aparece en
  Google Drive una carpeta «MacroReborn - respaldos» o archivos `neon-*.sql`, se borran.

## Fuera de alcance

- Google Drive (D5).
- Borrar la columna `users.password` y la rama del texto plano de `api/_password.js`, el último paso del
  [plan de activación](../../docs/historia/CONTRASENAS-EN-CLARO.md#plan-de-activación-en-producción).
  Lleva una migración, con su respaldo y su ensayo: va en su propia spec.
- Los respaldos bajados a `datos-locales/`. No llevan contraseñas en claro, y
  [DESARROLLO](../../docs/guias/DESARROLLO.md#probar-contra-los-datos-de-verdad) ya dice cómo se tratan.
- Las otras copias guardadas a propósito: las del repositorio (`.bundle`), el arte del 21/09 y las de
  «antes de».
- Cuánto se guardan los respaldos en general, que va con la política de privacidad (punto 60).

## Plan

**Qué cambia**: en el servidor, los cuatro `neon-*` de `~/respaldos/`. En la documentación, VPS, CUENTAS,
MUDANZA-AL-VPS, CONTRASENAS-EN-CLARO, la auditoría y el historial. No cambia ni el código ni la base.

**Decisiones**:

- **D1. Los dos volcados se borran** (Luis, 09/10). Nadie los ha usado desde la mudanza, y hay respaldos
  más nuevos de todo. Descartado: guardar una copia sin las contraseñas, que conservaría la base de Neon
  del 01/09 sin que nadie la necesite.
- **D2. Los dos vacíos, también fuera**: no tienen nada, y su nombre hace creer que hay cuatro copias.
- **D3. Se borran con `rm`, sin `shred`.** En un disco de Azure con journaling, `shred` no garantiza
  nada, y lo que se busca es que ningún archivo los tenga.
- **D4. Antes de tocar nada, la lista de `~/respaldos/`**, con el nombre, el tamaño y la fecha de cada
  archivo, para comprobar después que solo faltan esos cuatro.
- **D5. Google Drive no se mira** (Luis, 09/10): ver las aclaraciones y los supuestos.

**Cómo se comprueba**: el inventario del 09/10 otra vez, después de borrar, tiene que dar 0 archivos con
contraseñas en claro, con el resto de `~/respaldos/` igual que en la lista de antes. Y `npm test` con los
Node oficiales 22 y 24, mientras la CI de GitHub no arranque.

**Documentación**: VPS (los respaldos), CUENTAS (lo que queda), una nota en MUDANZA-AL-VPS y otra en
CONTRASENAS-EN-CLARO, el punto 86 de la auditoría, cerrado con su nota, y el historial, al unir.

## Tareas

Un commit por tarea, subido a `origin` al cerrarla.

- [X] T001 Con el OK de Luis en ese momento, en el servidor: la lista de `~/respaldos/`, los cuatro
  `neon-*` fuera (D1 y D2) y el inventario otra vez (RF-001 a RF-004, CE-001, CE-002).
- [X] T002 La documentación: VPS, CUENTAS, MUDANZA-AL-VPS y CONTRASENAS-EN-CLARO (RF-005).
- [X] T003 La auditoría: el punto 86, cerrado con su nota (RF-005).
- [X] T004 La entrada del historial y la unión a `main`, con `npm test` en verde con Node 22 y 24
  (RF-006, CE-003).

## Comprobación (09/10/2026)

**El borrado** (T001), con el OK de Luis en ese momento, a las 10:12 UTC: los cuatro `neon-*` de
`~/respaldos/`, cada uno por su nombre, con `rm`.

- **CE-001**: después, en el servidor no queda ninguna contraseña en claro. La base tiene 0, y también 0
  los 44 archivos `.sql` y `.sql.gz` de la carpeta personal y de `/tmp`: los tres de «antes de», los 23
  diarios y las 18 migraciones de una copia vieja del repositorio en `~/trabajo/MacroReborn`. Esa copia
  es del 16/09, no tiene volcados ni `.env`, y no la usa ningún proceso.
- **CE-002**: fuera de `diarios/` quedan ocho archivos, los mismos de la lista de antes, con su tamaño y
  su fecha. Son los tres respaldos de «antes de» y la lista de uno de ellos, el registro, el arte del
  21/09 y las dos copias del repositorio.
- **CE-003**: VPS, CUENTAS, MUDANZA-AL-VPS, CONTRASENAS-EN-CLARO y la auditoría cuentan lo que se hizo, y
  la prueba de la documentación pasa. `npm test` pasa las 1.358 pruebas sin ninguna en rojo y la prueba
  de humo sale en verde, con los Node oficiales 24.21.0 y 22.23.3 de `D:\node-oficial\`, como pide la
  regla XXII desde la v1.0.3.

**Lo que se vio por el camino**: la base de Neon, si el proyecto sigue vivo, está como el 01/09, con
las mismas 21 contraseñas en claro. El paso a bcrypt del 16/09 solo cambió la base del VPS, y la
contraseña de Neon se compartió por chat en la mudanza. Mirarlo y darlo de baja solo se puede hacer
desde la consola de Neon. Queda apuntado en VPS (lo que falta), CUENTAS y la nota del punto 86.
