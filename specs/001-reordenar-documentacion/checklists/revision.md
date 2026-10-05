# Lista de revisión: cada documento, leído entero y comparado con el sistema

**Para qué**: dejar constancia de que cada documento se leyó entero y se comparó con el código, con
`infra/` y, si habla del servidor, con el VPS solo con órdenes de lectura (RF-008, CE-004, research
D7).
**Creada**: 2026-10-05, vacía. Se rellena en la implementación, una fila por documento.
**Especificación**: [spec.md](../spec.md)

**Cómo se rellena**: al terminar de revisar un documento se escribe la fecha, con qué se comparó, cada
afirmación caducada y cómo quedó, y lo que no se pudo comprobar (con su motivo). Una afirmación
caducada nunca se queda sin corregir: si no se puede arreglar en esta spec, pasa a «Pendiente de
probar» con su motivo.

## Punto de partida

Lo que había antes de tocar nada (T001): cuántas pruebas y archivos de prueba, cuánto tarda
`npm test`, y que `npm run test:smoke` falla solo en la comprobación de monedas (la causa de la spec
002).

| Fecha | Pruebas | Archivos de prueba | `npm test` tarda | Prueba de humo |
|---|---|---|---|---|
| 05/10/2026 | 1.331 en 270 suites: 1.330 pasan y 1 se salta | 93 | 81 s, con Node 24.19 en el PC de Luis | Falla solo en la comprobación de monedas (`monedas.monto` entre 10 y 30), la causa de la spec 002 |

## Referencia

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/referencia/ARQUITECTURA.md` | | | | |
| `docs/referencia/ARTE.md` | | | | |
| `docs/referencia/AVATARES.md` | | | | |
| `docs/referencia/AVISOS.md` | 05/10/2026 | `api/_avisos.js`, `api/_avisos-sse.js`, `js/avisos.js`, `cluster.js`, el pase de `api/_auth.js` y `api/content.js`, y el bloque de `/api/avisos` en `infra/nginx/macroreborn.conf` | «8000 bytes por aviso»: el código corta en 7000, con margen; «nginx corta a los 60 segundos»: ese bloque lo sube a una hora, y el latido queda por la otra razón; «los diez avisos del sitio»: cifra que cambia sola, fuera; «las 22 páginas», con su «entonces» |  |
| `docs/referencia/CUENTAS.md` | | | | |
| `docs/referencia/ECONOMIA.md` | | | | |
| `docs/referencia/MODERACION.md` | | | | |
| `docs/referencia/SEO.md` | | | | |
| `docs/referencia/TIENDA.md` | | | | |
| `docs/referencia/VPS.md` | | | | |

## Guías

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/guias/SUMARSE.md` | | | | |
| `docs/guias/DESARROLLO.md` | | | | |
| `docs/guias/DESPLEGAR.md` | | | | |
| `docs/guias/JUEGOS.md` | | | | |
| `docs/guias/CAMBIOS-DE-OTROS-DEVS.md` | | | | |
| `docs/guias/RETOMAR.md` | | | | |

## Listas vivas

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/listas/AUDITORIA.md` | | | | |
| `docs/listas/SUGERENCIAS.md` | | | | |

## Historia

En la historia no se corrige lo que se contó: se comprueba que se pasó entero, que sus enlaces
funcionan y que no lleva datos sensibles. Si algo que cuenta ya no es así, se añade una nota con fecha.

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `docs/historia/HISTORIAL.md` | | | | |
| `docs/historia/FRONTEND.md` | | | | |
| `docs/historia/AVATARES-AL-SERVIDOR.md` | 05/10/2026 | Con lo que era `AVATARES-SERVIDOR.md`: su entrada, §1, §2, §4, §5 (menos «Cómo mirarlo con los ojos»), lo de macrojuegos de §8 y §12, y de §13 cómo se decidió y el relleno; todo movido por script | Nada: es historia. Los títulos pierden su número y los de la foto de perfil y las previsualizaciones ganan contexto |  |
| `docs/historia/LIENZO-DEL-CATALOGO.md` | 05/10/2026 | Con §6 de `DESARROLLO.md`, de donde salió entera (149 líneas, movidas por script) | Nada: es historia | |
| `docs/historia/IMAGEN-NO-ENCONTRADA.md` | 05/10/2026 | Con §7 de `DESARROLLO.md`, de donde salió entera (115 líneas, movidas por script) | Nada: es historia |  |
| `docs/historia/AVISOS-ROTOS.md` | 05/10/2026 | Con §9 de `DESARROLLO.md` («Por qué llevaba dos semanas roto», 17 líneas) y la frase de §2.3 sobre `_pusher.js` | Nada: es historia |  |
| `docs/historia/MUDANZA-AL-VPS.md` | 05/10/2026 | Con §3 (menos 3.4) y §7 de `VPS.md` y con §2.1 de `DESARROLLO.md`, de donde salieron enteras | Nada: es historia. Su cita a la §3.3 de `VPS.md`, que ya no existe, pasa a un enlace dentro del propio documento |  |
| `docs/historia/FUGA-DEL-ENV.md` | 05/10/2026 | Con «La fuga del `.env`» de §9 de `VPS.md`, de donde salió entera | Nada: es historia. Sus tres IP de fuera, tapadas (regla XXV) |  |
| `docs/historia/CONTRASENAS-EN-CLARO.md` | 05/10/2026 | Con §1, §3 y §5 de `CUENTAS.md` y §2.4, §3.3 y §4 de `DESARROLLO.md`, de donde salieron enteras; §2.2 de `DESARROLLO.md` se fundió en §2 de `CUENTAS.md` | Nada: es historia. Sus tres citas a `CUENTAS.md` pasaron a enlaces dentro del propio documento |  |
| `docs/historia/LLAVE-SSH.md` | 05/10/2026 | Con §1.1 (el relato y la lección) y §1.2 de `RETOMAR.md`, de donde salieron enteras | Nada: es historia |  |
| `docs/historia/SALDOS-REHECHOS.md` | 05/10/2026 | Con §5 de `ECONOMIA.md`, de donde salió entera | Nada: es historia |  |
| `docs/historia/ACTIVAR-LA-MODERACION.md` | 05/10/2026 | Con §5 de `MODERACION.md`, de donde salió entera | Nada: es historia. Lo que sigue vigente (las columnas viejas sin usar, comprobado en el código) se queda también resumido en la referencia |  |
| `docs/historia/CASOS-DE-OTROS-DEVS.md` | 05/10/2026 | Con §1 y §2 de `CAMBIOS-DE-OTROS-DEVS.md`, de donde salieron enteras | Nada: es historia. La guía se queda con el método, sacado de lo que se repite en los dos casos |  |

## Fuera de `docs/`

| Documento | Leído entero | Comparado con | Caducado y corregido | Pendiente de probar |
|---|---|---|---|---|
| `README.md` | | | | |
| `CLAUDE.md` | | | | |
| `infra/LEEME.md` | | | | |
| `.gitignore` (sus comentarios) | | | | |
| `memoria-claude/LEEME.md` (fuera de git) | 05/10/2026 | La copia y la memoria viva | Decía que el repositorio es público (es privado, comprobado el 05/10/2026); «nueve archivos» de memoria (son dieciséis); la carpeta de Claude para una ruta en `C:` estaba mal calculada; la receta de refresco empezaba con `rm -rf` y se llevaba el propio `LEEME.md` y el zip; citaba la auditoría con su ruta de antes. Todo corregido | |
| La memoria de Claude, la viva y su copia (fuera de git) | 05/10/2026, solo sus citas a documentos | Las rutas nuevas | 12 citas en seis archivos con las rutas de antes; las dos que citaban por número (1.1 a 1.3 de `RETOMAR.md`, la sección 3 de `ECONOMIA.md`) citan ahora por tema. La copia tenía 13 archivos y ahora tiene los 17 de la viva | |
| `sugerencias-discord/` (fuera de git; solo guarda la exportación) | | | | |

## Validación final

Los resultados de los escenarios de [quickstart.md](../quickstart.md), con su fecha.

| Escenario | Resultado | Fecha |
|---|---|---|
| 1. Las pruebas, en verde | | |
| 2. Las diez preguntas en dos clics | | |
| 3. Confiar en lo que dice | | |
| 4. La visión de conjunto | | |
| 5. Sumarse en menos de 30 minutos (Claude, sobre una copia limpia) | | |
| 5. Sumarse en menos de 30 minutos (una persona del equipo) | | |
| 6. El historial | | |
| 7. Nada se pierde | | |
| 8. Sin emojis ni datos sensibles | | |
| 9. Fuera del repositorio | | |
| 10. La constitución v1.0.1 | | |
