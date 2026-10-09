# Especificación: Node 24 en el servidor (spec corta)

**Rama**: `004-node-24-servidor`
**Creada**: 2026-10-08
**Estado**: Aprobada por Luis el 08/10/2026, con la enmienda v1.0.2 de la constitución
**Tipo**: spec corta (regla XIX): especificación, plan y tareas en esta página, aprobados una vez.
**Pedido**: Luis, 08/10/2026: el camino que eligió al retomar el proyecto («la spec 003 ahora, y
después la 004 y la 005») y el «A» para lanzar esta.

## Contexto

**El servidor corre Node 20, sin parches de seguridad desde el 30/04/2026.** Tiene la 20.20.2, la
última de la rama 20 (24/03/2026), y según el calendario oficial de Node la rama 20 llegó al final de
su vida el 30/04/2026. Nadie lo vio: VPS solo nombra la versión, y las actualizaciones automáticas del
servidor solo cubren los paquetes de Ubuntu, no el repositorio de NodeSource del que viene Node.

| Rama | Soporte de seguridad hasta | |
|---|---|---|
| Node 20 | 30/04/2026 | la del servidor |
| Node 22 | 30/04/2027 | la otra que prueba la CI |
| Node 24 | 30/04/2028 | la del PC de Luis; la última, la 24.21.0 (07/09/2026) |

**Cómo está instalado, medido el 08/10 en el servidor (solo lectura):** Ubuntu 24.04 en arm64; Node con
apt, del repositorio de NodeSource `node_20.x`, configurado en un solo archivo
(`/etc/apt/sources.list.d/nodesource.sources`); el servicio arranca con `/usr/bin/node cluster.js`.
Nada más usa Node: ningún cron, y ninguna de las cuatro dependencias (`pg`, `bcryptjs`, `jpeg-js` y el
driver de Neon) tiene código nativo que haya que recompilar.

**Lo que ya se sabe de Node 24, medido el 08/10 en el PC:**

- `npm test` (1.338 pruebas) y la prueba de humo pasan con Node 24, sin ningún aviso de funciones
  obsoletas.
- Lo que arranca en producción, `cluster.js` con `server.js`, no lo arranca ninguna prueba. Arrancado a
  mano contra una base que no existe, se comporta igual con Node 24 que con Node 20: los dos procesos,
  las páginas con 200, las rutas sensibles con 404, la URI mal formada con 400, y un fallo de la base
  contesta 500 sin tumbar nada.

**Dónde se nombra Node 20 como la versión a usar:** `package.json` (`>=20.19.0`), la matriz de la CI
(20 y 22), la regla XXII de la constitución («pruebas en Node 20 y 22»), CLAUDE.md, SUMARSE,
ARQUITECTURA, VPS y un comentario de `api/_ruta-estatica.js`.

**La CI de GitHub no arranca** desde el 08/10, por el cupo de minutos (spec 003): la comprobación de la
rama se hace en el PC con los Node oficiales de nodejs.org, como en la 003.

## Aclaraciones

### Sesión 2026-10-08

- P: ¿Los parches de seguridad de Node 24 se instalan solos o a mano? → R: Solos (Luis, opción A): el
  repositorio de NodeSource entra en las actualizaciones automáticas, como los paquetes de Ubuntu, y
  solo trae parches de la rama 24. Se mira y se apunta cuándo entra en vigor un parche: si el servidor
  reinicia el servicio al actualizar o si espera al siguiente reinicio.

## Escenarios de uso y pruebas *(obligatorio)*

### Historia 1 - El sitio sigue igual, con un Node que recibe parches (Prioridad: P1)

La comunidad no nota el cambio, salvo unos segundos de reinicio: entrar, jugar, las monedas, el chat y
los avisos en vivo funcionan como antes, pero sobre una versión con soporte de seguridad hasta 2028.

**Por qué esta prioridad**: el servidor está abierto a internet con un Node sin parches.

**Prueba independiente**: las comprobaciones de DESPLEGAR en la web real, antes y después.

**Escenarios de aceptación**:

1. **Dado** el servidor con Node 20, **cuando** se cambia a Node 24 y se reinicia el servicio,
   **entonces** las páginas, la API pública y los avisos en vivo responden como antes.
2. **Dado** el cambio, **cuando** se mira el registro del servicio, **entonces** no hay errores nuevos.

---

### Historia 2 - Si algo falla, se vuelve atrás en minutos (Prioridad: P1)

Antes de tocar nada, la versión de ahora queda guardada en el servidor, con los pasos para volver a
ella escritos. Si algo sale mal, se vuelve a Node 20.20.2 en minutos, sin depender de descargar nada.

**Por qué esta prioridad**: es el servidor de producción, y solo hay uno.

**Prueba independiente**: comprobar que el paquete guardado es el de la 20.20.2 y está entero, antes del
cambio.

**Escenarios de aceptación**:

1. **Dado** el paquete de Node 20.20.2 guardado y los pasos en VPS, **cuando** el sitio falla con Node
   24, **entonces** se vuelve a la 20.20.2 y se reinicia en menos de 5 minutos.

---

### Historia 3 - Quien trabaja en el proyecto sabe qué Node usar (Prioridad: P2)

La documentación, `package.json` y la CI dicen lo mismo: el servidor usa Node 24, y se admite desde la
22.

**Por qué esta prioridad**: hoy dicen 20, que ya no tiene soporte.

**Prueba independiente**: buscar «Node 20» en la documentación y la configuración.

**Escenarios de aceptación**:

1. **Dado** el repositorio, **cuando** se busca qué versión usar, **entonces** todo dice 24 para el
   servidor y 22 como mínima, y Node 20 solo sale en la historia.

---

### Historia 4 - Node no vuelve a quedarse sin parches sin que nadie lo vea (Prioridad: P2)

Los parches de la rama 24 llegan al servidor solos, con las actualizaciones automáticas que ya instalan
cada mañana los de Ubuntu, y la fecha en que se acaba la 24 queda apuntada para pasar a la siguiente
antes.

**Por qué esta prioridad**: es lo que dejó la 20 cinco meses sin parches.

**Prueba independiente**: una prueba en seco de las actualizaciones automáticas, y leer VPS y la
auditoría.

**Escenarios de aceptación**:

1. **Dado** un parche nuevo de la 24, **cuando** corren las actualizaciones automáticas, **entonces** se
   instala sin que nadie haga nada, y nunca se instala otra rama.
2. **Dado** VPS, **cuando** alguien busca cómo se actualiza Node, **entonces** lo encuentra, con cuándo
   entra en vigor un parche y la fecha del 30/04/2028.

---

### Casos límite

- El reinicio deja el sitio unos segundos sin servicio, como cualquier despliegue: nginx contesta 502 en
  ese rato. Se hace mirando antes que haya poca gente conectada.
- Si NodeSource no tuviera la rama 24 para arm64, no se instala nada: se comprueba antes de tocar.
- Si apt falla a mitad (la red, por ejemplo), sigue la versión de antes, y está el paquete guardado.
- Con Node cambia npm (de la 10 a la 11). Solo se usa en el servidor al desplegar, si cambia
  `package-lock.json`.
- La memoria: el servicio usa unos 160 MB de los 950 de la máquina; se mira después del cambio.
- Quien tenga Node 22 en su PC puede seguir trabajando: se admite hasta su fin, el 30/04/2027.
- El servidor no se despliega en esta spec: lo que cambia del repositorio no lo sirve el sitio, y su
  copia se pondrá al día con el próximo despliegue.
- Un parche automático que rompiera algo: se vuelve con apt a la versión anterior de la 24, que sigue en
  el repositorio, con los mismos pasos que la vuelta atrás. Todavía nada avisa si el sitio falla
  (punto 71).

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: El servidor DEBE correr Node 24, la última de esa rama al cambiarlo.
- **RF-002**: Antes de cambiar nada, la vuelta atrás DEBE estar lista: el paquete de Node 20.20.2
  guardado en el servidor, comprobado, y los pasos escritos en VPS.
- **RF-003**: El cambio en el servidor DEBE hacerse solo con el OK de Luis en ese momento (regla XXI).
- **RF-004**: Tras el cambio, el sitio DEBE pasar las comprobaciones de DESPLEGAR y la de los avisos en
  vivo, sin errores nuevos en el registro del servicio.
- **RF-005**: La CI DEBE probar la versión del servidor y la mínima que se admite: Node 24 y 22.
- **RF-006**: `package.json` DEBE pedir Node 22 o más.
- **RF-007**: La documentación DEBE dejar de nombrar Node 20 como la versión a usar, y la regla XXII de
  la constitución DEBE dejar de nombrar versiones concretas (enmienda PATCH, v1.0.2).
- **RF-008**: VPS DEBE contar cómo está instalado Node, cómo se actualiza, cómo se vuelve atrás y hasta
  cuándo tiene soporte la 24, e `infra/` DEBE tener la copia del archivo del repositorio de NodeSource.
- **RF-009**: Los parches de la rama 24 DEBEN instalarse solos, con las actualizaciones automáticas del
  servidor, y nunca otra rama.
- **RF-010**: La auditoría DEBE tener el punto del Node sin parches, cerrado con la fecha del cambio.
- **RF-011**: Lo que hace el sitio NO cambia: ni `api/`, ni `js/`, ni `css/`, ni las páginas, salvo un
  comentario.
- **RF-012**: Al unirse a `main`, el historial DEBE tener su entrada.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: El servidor contesta con la versión 24 cuando se le pregunta (hoy, la 20.20.2).
- **CE-002**: En la web real, las comprobaciones de DESPLEGAR dan lo mismo que antes del cambio: 200 en
  las páginas, 404 en las rutas sensibles, 400 en la URI mal formada y la API pública contestando; y la
  conexión de avisos abre.
- **CE-003**: El sitio está sin servicio una sola vez, lo que tarda un reinicio: segundos.
- **CE-004**: En los 15 minutos siguientes, 0 errores nuevos en el registro del servicio y una memoria
  parecida a la de antes (unos 160 MB).
- **CE-005**: En el PC, `npm test` y la prueba de humo en verde con Node 22 y 24 oficiales, y el arranque
  de producción igual que con Node 20.
- **CE-006**: 0 menciones a Node 20 como versión a usar en la documentación y la configuración (fuera de
  la historia y las specs).
- **CE-007**: La vuelta atrás, si hiciera falta, devuelve Node 20.20.2 en menos de 5 minutos, sin
  descargar nada.
- **CE-008**: Una prueba en seco de las actualizaciones automáticas cuenta con el repositorio de
  NodeSource (hoy, no).

## Supuestos

- NodeSource publica la rama 24 para arm64, como publica la 20; se comprueba antes de instalar.
- La versión que instale NodeSource es la última oficial de la 24 (hoy, la 24.21.0); la comprobación en
  el PC se hace con esa.
- El cambio no toca la base de datos: no hace falta respaldo aparte (el de cada noche sigue).
- Luis da su OK al cambio del servidor en el momento de hacerlo, aunque haya aprobado la spec.

## Fuera de alcance

- Vigilar el servidor y avisar si algo falla (punto 71 de la auditoría).
- El cupo de minutos de GitHub Actions (spec 003) y el paso de sus máquinas a Ubuntu 26 (19/10/2026).
- Quitar el driver de Neon de las dependencias: va con dar de baja Neon (VPS, «Lo que falta»).
- Desplegar el código: no cambia nada de lo que sirve el sitio.

## Plan

**Qué cambia**: en el servidor, el repositorio de NodeSource y el paquete `nodejs`; en el repositorio,
`package.json`, `.github/workflows/ci.yml`, la constitución y su plantilla, `infra/`, la documentación y
un comentario de `api/_ruta-estatica.js`.

**Decisiones**:

- **D1. Node 24 con apt, de NodeSource, como hoy la 20.** Se cambia `node_20.x` por `node_24.x` en
  `nodesource.sources` y se instala `nodejs`. `/usr/bin/node` sigue en su sitio, así que la unidad de
  systemd no cambia. Descartado: el binario oficial en otra carpeta (otra ruta en la unidad y parches a
  mano, descargando) y nvm (pensado para personas, no para servicios).
- **D2. La vuelta atrás, preparada antes.** Se guardan en el servidor el paquete de Node 20.20.2
  (`apt-get download`), comprobado, y una copia de `nodesource.sources`. Volver es reponer el archivo,
  instalar ese paquete permitiendo bajar de versión y reiniciar.
- **D3. El servidor se cambia con la rama abierta, y con el OK de Luis.** No es un despliegue de código:
  el código del servidor no cambia. Así su comprobación queda apuntada en la spec antes de unir.
- **D4. La CI prueba Node 22 y 24**: la del servidor y la mínima que se admite, con la prueba de humo en
  las dos. Descartado: solo la 24 (dejaría sin probar a quien tenga la 22) y seguir con la 20 (sin
  soporte).
- **D5. `package.json` pide Node 22 o más.**
- **D6. La regla XXII sin versiones concretas** (enmienda PATCH, v1.0.2, con su informe de
  sincronización y la plantilla igual): «las pruebas y la prueba HTTP de humo, con la versión de Node del
  servidor y la mínima que se admite». Así no hay que enmendarla en cada cambio de versión. Luis la
  aprueba al aprobar esta spec.
- **D7. Los parches de la 24, solos.** NodeSource entra en las actualizaciones automáticas con un archivo
  propio en `/etc/apt/apt.conf.d/`, sin tocar el que trae el paquete, que admite solo ese repositorio:
  como es el de la rama 24, nunca trae otra. Se comprueba con una prueba en seco, y se mira y se apunta
  si el servidor reinicia el servicio al actualizar o si el parche espera al siguiente reinicio.
  Descartado: a mano, que es lo que dejó la 20 sin parches.
- **D8. La comprobación en el PC, con los Node oficiales de nodejs.org** (22.23.3 y 24.21.0, comprobados
  con sus sumas), mientras la CI no arranque.
- **D9. El punto 91 de la auditoría**, en el bloque 1: el Node sin parches, cerrado con la fecha del
  cambio.

**Cómo se comprueba**: en el PC, `npm test`, la prueba de humo y el arranque de producción con Node 22 y
24 oficiales. En el servidor, antes y después del cambio, las comprobaciones de DESPLEGAR, la conexión de
avisos, el registro del servicio, la memoria y `node --version`.

**Documentación**: VPS (cómo está instalado Node, cómo se actualiza, cómo se vuelve atrás y hasta
cuándo), ARQUITECTURA, SUMARSE, CLAUDE.md, `infra/` con su LEEME, la auditoría y el historial, al unir.

## Tareas

Un commit por tarea, subido a `origin` al cerrarla.

- [X] T001 `package.json` pide Node 22 o más, y la CI prueba Node 22 y 24 (RF-005, RF-006, D4, D5).
- [ ] T002 La constitución pasa a la v1.0.2: la regla XXII sin versiones, con su plantilla y su informe
  (RF-007, D6).
- [ ] T003 La documentación: ARQUITECTURA, SUMARSE, CLAUDE.md y el comentario de
  `api/_ruta-estatica.js` (RF-007).
- [ ] T004 Comprobar en el PC: `npm test`, la prueba de humo y el arranque de producción con Node 22 y
  24 oficiales (CE-005, D8).
- [ ] T005 Con el OK de Luis, el servidor: la vuelta atrás guardada y comprobada, Node 24 instalado,
  NodeSource en las actualizaciones automáticas, el servicio reiniciado y las comprobaciones de antes y
  después (RF-001 a RF-004, RF-009, D1 a D3, D7).
- [ ] T006 Lo que cuenta el cambio: VPS, las copias en `infra/` y el punto 91 de la auditoría, cerrado
  (RF-008, RF-010, D9).
- [ ] T007 La entrada del historial y la unión a `main`, con `npm test` en verde en `main` (RF-012).
