# Validación: cómo se comprueba que los juegos ya no ven la sesión

**Rama**: `008-aislar-juegos` | **Especificación**: [spec.md](spec.md) | **Contratos**:
[rutas](contracts/rutas-http.md), [mensajes](contracts/mensajes.md), [marco](contracts/marco-del-juego.md)

Cada apartado dice qué se comprueba, cómo y qué tiene que salir. Lo que no se pueda mirar en el momento
queda «Pendiente de probar» (regla IV).

## Antes de empezar

- Los Node oficiales 24.21.0 y 22.23.3 en `D:\node-oficial\` (CLAUDE.md), y Edge.
- Los puertos 3001 y 3002 libres (`netstat -ano`). Si Luis tiene un servidor en el 3001, se usa
  `PORT=3101`, y los juegos van al 3102. Nunca se cierra un proceso sin mirar su línea de órdenes.
- **El «antes» se mide antes de cambiar nada** (apartado 2): con `scripts/revision-juegos.js` recién
  hecho y el resto del código todavía como en `main`.

## 1. Las pruebas automáticas (CE-008, RF-010)

```bash
/d/node-oficial/v24.21.0/node-v24.21.0-win-x64/node.exe --test
/d/node-oficial/v24.21.0/node-v24.21.0-win-x64/node.exe scripts/smoke-local.js
/d/node-oficial/v22.23.3/node-v22.23.3-win-x64/node.exe --test
/d/node-oficial/v22.23.3/node-v22.23.3-win-x64/node.exe scripts/smoke-local.js
```

Todo en verde, con las pruebas nuevas de research D11: lo que sirve cada dirección, el marco de cada
tipo de juego, el puente y la actividad, la mudanza (con `fake-indexeddb`), las claves del sitio y que
Macro Snake no carga nada de fuera. La prueba de humo pide un juego a las dos direcciones.

## 2. El «antes»: los juegos tal como están

Con el servidor local de siempre (`npm run db:local`), y antes de los cambios del servidor y del
navegador:

```bash
node scripts/revision-juegos.js --base http://localhost:3001 --sonda --salida <carpeta>/antes
node scripts/revision-juegos.js --base http://localhost:3001 --sonda --movil --salida <carpeta>/antes-movil
```

Salen dos informes, en PC y en móvil (RF-004), con cuántos juegos cargan, sus capturas y, con la sonda,
lo que hoy es el problema: desde dentro de los 107 de terceros se lee la clave de prueba de la web y se
llega a la página.

## 3. Las dos direcciones, en el PC (RF-003, RF-009, contrato de rutas)

Con el servidor local nuevo, que escucha en el 3001 y en el 3002:

| Orden | Tiene que salir |
|---|---|
| `curl -sI http://localhost:3001/html/juegos/pvz.html` | `302` y `Location: http://localhost:3002/html/juegos/pvz.html` |
| `curl -sI http://localhost:3002/html/juegos/pvz.html` | `200`, `Content-Security-Policy: frame-ancestors http://localhost:3001 http://127.0.0.1:3001` y `X-Robots-Tag: noindex`, sin `X-Frame-Options` |
| `curl -s http://localhost:3002/html/juegos/pvz.html` | el puente, justo después de `<head>` |
| `curl -sI http://localhost:3002/api/users` | `404` |
| `curl -sI http://localhost:3001/html/juegos/macro-snake.html` | `200` |
| `curl -sI http://localhost:3002/html/juegos/..%2f..%2fserver.js` | `400` o `404` |

## 4. Jugar sin arriesgar la cuenta (historia 1, CE-001, CE-002, CE-003)

```bash
node scripts/revision-juegos.js --base http://localhost:3001 --sonda --comparar <carpeta>/antes/informe.json --salida <carpeta>/despues
node scripts/revision-juegos.js --base http://localhost:3001 --sonda --movil --comparar <carpeta>/antes-movil/informe.json --salida <carpeta>/despues-movil
```

- Desde dentro de los 107 de terceros, la clave de prueba de la web **no** se lee (0 de 107), y la
  página que los contiene **no** se alcanza (0 de 107).
- En Edge, con la cuenta `demo`, en un juego de terceros, la consola del marco del juego da `null` con
  `localStorage.getItem("macroSessionToken")`, un error de seguridad con `parent.document`, y la página no
  se mueve con `top.location = "https://example.com"`.
- Abrir `http://localhost:3001/html/juegos/pvz.html` en la barra de direcciones acaba en el 3002.

## 5. Los juegos funcionan igual (historia 2, CE-004, CE-006)

- Las dos comparaciones, en PC y en móvil: **0 juegos que cargaban y ya no**. Las páginas de capturas,
  lado a lado, se miran enteras. Los que ya no cargaban antes (punto 21) salen igual en las dos.
- Si alguno se rompe por estar aparte, se arregla su envoltorio y se vuelve a revisar ese juego.
- La pantalla completa: la del botón de la página y la de un juego que la tenga dentro (un emulador).
- Macro Snake: se abre desde la web (`localhost:3001`), sin `sandbox`, y se juega. Su récord lo guarda
  `/api/originales-ranking`, que el servidor local no tiene: se mira en la web real (apartado 8).
- En PC (1366×800) y en móvil (390×844): la página de jugar con tres juegos de terceros de motores
  distintos y con Macro Snake, con capturas (regla XXVIII).

## 6. El XP cuenta igual (historia 3, CE-005)

En el PC, con `demo`, en un juego de terceros:

- Tocando dentro del juego (en Edge por el protocolo de depuración, una tecla cada 30 segundos), cada
  minuto sale un pulso a `/api/users?action=xp` y el XP de `demo` sube.
- Sin tocar nada, a los tres minutos dejan de salir pulsos. Al volver a tocar, vuelven.
- Las pruebas cubren lo que no se ve aquí: el aviso que viene de otra dirección o de otra ventana no
  cuenta, y la regla de los diez minutos sigue para los cuatro juegos de otras webs.

## 7. Las partidas pasan solas (historia 4, CE-007)

En el PC, con el servidor nuevo:

1. En Edge, en la web (`localhost:3001`), sin abrir ningún juego, se dejan en el navegador partidas de
   prueba con la forma de cada motor: claves `ejs-settings` y de Flash en `localStorage`; las bases
   `/data/saves`, `EmulatorJS-states`, `/idbfs` y `localforage`; y, como cachés, `EmulatorJS-roms` y
   `UnityCache`. Y también claves del sitio, con una sesión de mentira.
2. Se abre un juego de terceros. El aviso de carga dice «Pasando tus partidas guardadas…» un momento.
3. En el marco del juego (`localhost:3002`) están las claves de los juegos y las cuatro bases con sus
   registros. **No** están las cachés, **ni ninguna clave del sitio**, ni la sesión de mentira. En la web
   queda la marca `mrPartidasMudadas` con las cuentas.
4. Al abrir otro juego no se repite.
5. Se cambia a mano una clave en el 3002, se quita la marca de la web y se vuelve a abrir un juego: la
   clave cambiada **no** vuelve a lo de antes.
6. Una partida de verdad: en `main`, en el emulador de un juego, se guarda un estado en el navegador. Con
   la rama, ese estado se carga en el mismo juego. Si no da tiempo: «Pendiente de probar».

## 8. En la web real (RF-011, D14)

Antes de desplegar el código, la revisión contra la web real, como «antes» de producción:
`node scripts/revision-juegos.js --base https://macroreborn.com --sonda --salida <carpeta>/web-antes`. No
entra con ninguna cuenta.

Después de cada paso del despliegue, cada uno con el OK de Luis:

| Paso | Se comprueba |
|---|---|
| DNS | `dig +short A juegos.macroreborn.com` da la IP del servidor, y `dig +short AAAA` no da nada |
| Certificado | `sudo certbot certificates`: tres nombres, y el vencimiento |
| nginx | `sudo nginx -t`; `curl -sI https://juegos.macroreborn.com/html/juegos/pvz.html` da `200` sin `X-Frame-Options`; `curl -sI https://juegos.macroreborn.com/api/users` da `404` |
| Código | las comprobaciones de DESPLEGAR; `curl -sI https://macroreborn.com/html/juegos/pvz.html` da `302` a la dirección de los juegos; la cabecera `frame-ancestors` |
| Juegos | la revisión con la sonda contra la web real: 0 de 107 leen la clave; 0 rotos frente a «web-antes» |
| Luis, con su cuenta | en un juego de terceros, unos minutos: el XP sube. Una partida de Macro Snake: el récord sale en el top |
| El servicio | sin errores en su registro, sin respuestas 5xx en nginx, la memoria como siempre |

## 9. Deshacer

- **El código**: volver al commit anterior y reiniciar ([DESPLEGAR](../../docs/guias/DESPLEGAR.md#5-deshacer)).
  Los juegos vuelven a abrirse en la web.
- **nginx**: el bloque nuevo puede quedarse, porque solo sirve envoltorios. Si hay que quitarlo, se
  vuelve a la copia de `/etc/nginx/respaldos/`, con `nginx -t` antes de recargar.
- **Las partidas**: no se pierden. Lo de cada navegador sigue también en la web, y lo pasado a la
  dirección de los juegos se queda allí.
