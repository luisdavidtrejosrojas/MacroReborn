# Mapa de contenido: de dónde sale cada sección y adónde va

**Plan**: [plan.md](plan.md) | **Criterio de cada tipo**: [research.md](research.md), D1 y D2

Este mapa es la propuesta de reparto, sección por sección, y el instrumento para comprobar que nada se
pierde (RF-015, CE-006). Al leer cada documento entero (RF-008) se puede ajustar: si una sección acaba
en otro sitio, se cambia aquí en el mismo commit. Las líneas son las del 05/10/2026, antes de mover
nada.

**Cómo se usa**: cuando una sección ya está en su destino, se escribe la fecha en «Hecho». Al final no
puede quedar ninguna fila sin fecha.

Destinos abreviados: `ref/` es `docs/referencia/`, `guias/` es `docs/guias/`, `listas/` es
`docs/listas/` e `historia/` es `docs/historia/`.

## `docs/DESARROLLO.md` (812 líneas): se reparte entero

| Sección de hoy | Líneas | Va a | Nota | Hecho |
|---|---|---|---|---|
| Título y §1 Qué cubre esta guía | 1-19 | `guias/DESARROLLO.md` | Cabecera nueva: queda como la guía del trabajo en local | 05/10/2026 |
| §2.1 `api/_db.js` | 22-40 | `ref/ARQUITECTURA.md` y `historia/MUDANZA-AL-VPS.md` | Lo vigente a la visión de conjunto; el «antes, con `neon()`», a historia | 05/10/2026 |
| §2.2 `api/_password.js` | 41-58 | `ref/CUENTAS.md` | | 05/10/2026 |
| §2.3 `api/_avisos.js` | 59-67 | `ref/AVISOS.md` y `historia/AVISOS-ROTOS.md` | Lo vigente a la referencia; que sustituyó a `_pusher.js`, a historia | 05/10/2026 |
| §2.4 Cambios en `api/auth.js` y `api/users.js` | 68-77 | `historia/CONTRASENAS-EN-CLARO.md` | Qué acciones pasaron al servicio de contraseñas | 05/10/2026 |
| §3.1 `scripts/pglite.js` | 80-92 | `guias/DESARROLLO.md` | | 05/10/2026 |
| §3.2 `scripts/servidor-local.js` | 93-120 | `guias/DESARROLLO.md` | | 05/10/2026 |
| §3.3 `scripts/migrar-passwords.js` | 121-130 | `historia/CONTRASENAS-EN-CLARO.md` | Una línea en `ref/CUENTAS.md` | 05/10/2026 |
| §3.4 `tests/password.test.js` | 131-142 | `guias/DESARROLLO.md` y `ref/CUENTAS.md` | Cómo son las pruebas, a la guía; qué sujeta, a cuentas | 05/10/2026 |
| §3.5 `tests/monedas.test.js` | 143-150 | `ref/ECONOMIA.md`, §Las pruebas | Estaba caducada: contaba las reglas de antes del 04/10 (ventana de diez minutos, tope diario). La fila de `ref/ECONOMIA.md` ya dice lo que cubre hoy, comprobado en la prueba | 05/10/2026 |
| §3.6 `tests/migrations.test.js` | 151-157 | `ref/ECONOMIA.md`, §Las pruebas | El contrato de la migración 015 | 05/10/2026 |
| §3.7 `scripts/smoke-local.js` | 158-174 | `guias/DESARROLLO.md` | | 05/10/2026 |
| §3.8 Verificación manual en navegador | 175-200 | `guias/DESARROLLO.md` | | 05/10/2026 |
| §4 Despliegue de estos cambios | 201-231 | `historia/CONTRASENAS-EN-CLARO.md` | Fue el despliegue de bcrypt; lo general está en `guias/DESPLEGAR.md` | 05/10/2026 |
| §5 Convenciones del proyecto | 232-252 | La constitución | Todo estaba en la constitución (reglas I, XIX, XXX, V, XI y XXVI) y en `ref/ARTE.md` (por qué `_png.js` y `_lienzo.js` van a mano): nada pendiente para `guias/SUMARSE.md` | 05/10/2026 |
| §6 El lienzo del catálogo | 253-404 | `historia/LIENZO-DEL-CATALOGO.md` | Resumen en `ref/ARTE.md` §3; sus pendientes, enlazados desde «Lo que sigue abierto» de `ref/ARTE.md` | 05/10/2026 |
| §7 La marca de «imagen no encontrada» | 405-521 | `historia/IMAGEN-NO-ENCONTRADA.md` | Resumen en `ref/AVATARES.md` | 05/10/2026 |
| §8 Probar contra los datos de verdad | 522-614 | `guias/DESARROLLO.md` | Sección propia; el código y el `CLAUDE.md` la citan por su ancla | 05/10/2026 |
| §9 Los avisos en vivo, salvo lo de abajo | 615-632 y 651-812 | `ref/AVISOS.md` | | 05/10/2026 |
| §9 «Por qué llevaba dos semanas roto» | 633-650 | `historia/AVISOS-ROTOS.md` | Resumen en `ref/AVISOS.md` | 05/10/2026 |

## `docs/AVATARES-SERVIDOR.md` (1.094 líneas): pasa a `ref/AVATARES.md` y a historia

| Sección de hoy | Líneas | Va a | Nota | Hecho |
|---|---|---|---|---|
| Título y entrada («el plan») | 1-17 | `historia/AVATARES-AL-SERVIDOR.md` | `ref/AVATARES.md` estrena cabecera | 05/10/2026 |
| §1 Por qué, y por qué ahora | 18-39 | `historia/AVATARES-AL-SERVIDOR.md` | El porqué en dos líneas en la referencia | 05/10/2026 |
| §2 Lo medido el 21/09/2026 | 40-108 | `historia/AVATARES-AL-SERVIDOR.md` | | 05/10/2026 |
| §3 Lo que se decidió | 109-135 | `ref/AVATARES.md` | Las decisiones vigentes, con su porqué | 05/10/2026 |
| §4 Por qué en disco y no en Postgres | 136-164 | `ref/AVATARES.md` y `historia/AVATARES-AL-SERVIDOR.md` | El porqué en corto; el razonamiento largo, a historia | 05/10/2026 |
| §5 Las fases 1 a 5, con lo validado y medido | 165-455 | `historia/AVATARES-AL-SERVIDOR.md` | Lo que dejan en pie (compositor, guardar y servir, `imagenDeAvatar()`, `/prendas/` con firma) se describe en `ref/AVATARES.md` | 05/10/2026 |
| §5 «Cómo mirarlo con los ojos» | 208-227 | `guias/DESARROLLO.md` | `npm run revision:avatares` | 05/10/2026 |
| §6 Lo que esto NO compra | 456-485 | `ref/AVATARES.md` | | 05/10/2026 |
| §7 Lo que muerde si no se sabe | 486-507 | `ref/AVATARES.md` | | 05/10/2026 |
| §8 La forma de la URL: el resultado y su porqué | 508-537 | `ref/AVATARES.md` | | 05/10/2026 |
| §8 Lo que hacía macrojuegos y la propuesta | 538-590 | `historia/AVATARES-AL-SERVIDOR.md` | | 05/10/2026 |
| §9 El freno, y por qué existe | 591-620 | `ref/AVATARES.md` | | 05/10/2026 |
| §10 Vender ranuras | 621-666 | `ref/AVATARES.md`, «Lo que queda» | | 05/10/2026 |
| §11 Cómo probarlo en tu máquina | 667-705 | `guias/DESARROLLO.md` | | 05/10/2026 |
| §12 Previsualizaciones: el cuadro automático, dónde viven y su dirección | 706-713, 800-840 y 896-934 | `ref/AVATARES.md` | | 05/10/2026 |
| §12 Lo que se aprendió de macrojuegos | 714-799 | `historia/AVATARES-AL-SERVIDOR.md` | | 05/10/2026 |
| §12 La herramienta y la revisión de todas | 841-895 | `guias/DESARROLLO.md` | `npm run revision:previsualizaciones` | 05/10/2026 |
| §12 Más adelante: corregir una prenda sola | 935-955 | `ref/AVATARES.md`, «Lo que queda» | | 05/10/2026 |
| §13 La foto de perfil: qué es, el cuadro de cada modelo y dónde se usa | 956-966 y 976-1029 | `ref/AVATARES.md` | | 05/10/2026 |
| §13 Cómo se decidió y el relleno al desplegarla | 967-975 y 1030-1039 | `historia/AVATARES-AL-SERVIDOR.md` | | 05/10/2026 |
| §14 El pelo de atrás | 1040-1094 | `ref/AVATARES.md` | | 05/10/2026 |

## `docs/VPS.md` (458 líneas): se queda en `ref/VPS.md`, menos la historia y el despliegue

| Sección de hoy | Líneas | Va a | Nota | Hecho |
|---|---|---|---|---|
| Título y entrada | 1-7 | `ref/VPS.md` | El título pierde «sin Vercel ni Neon» | 05/10/2026 |
| §1 La máquina | 8-27 | `ref/VPS.md` | Sin la IP (research D8) | 05/10/2026 |
| §2 Piezas instaladas | 28-40 | `ref/VPS.md` | | 05/10/2026 |
| §3.1 y §3.2 `api/_pg.js` y `api/_db.js` | 43-69 | `ref/ARQUITECTURA.md` y `historia/MUDANZA-AL-VPS.md` | Cómo elige conexión hoy, a la visión; qué se cambió, a historia | 05/10/2026 |
| §3.3 `api/social.js` y `api/system.js` | 70-76 | `historia/MUDANZA-AL-VPS.md` | | 05/10/2026 |
| §3.4 `server.js`: carga del `.env` | 77-83 | `ref/VPS.md`, §Configuración y secretos | Es como funciona hoy | 05/10/2026 |
| §3.5 `package.json` | 84-88 | `historia/MUDANZA-AL-VPS.md` | Si `@neondatabase/serverless` sigue, «Lo que falta» lo dice | 05/10/2026 |
| §4 Configuración y secretos | 89-109 | `ref/VPS.md` | | 05/10/2026 |
| §5 Operación: estado, base de datos y respaldos | 110-122 y 132-162 | `ref/VPS.md` | | 05/10/2026 |
| §5 «Desplegar un cambio» | 123-131 | `guias/DESPLEGAR.md` | Dice `git pull`: se corrige | 05/10/2026 |
| §6 El cron semanal | 163-175 | `ref/VPS.md` | | 05/10/2026 |
| §7 La migración de los datos | 176-210 | `historia/MUDANZA-AL-VPS.md` | | 05/10/2026 |
| §8 Dominio y HTTPS | 211-235 | `ref/VPS.md` | Sin la IP | 05/10/2026 |
| §9 Entrada de seguridad y rendimiento | 236-243 | `ref/VPS.md` | | 05/10/2026 |
| §9 La fuga del `.env` | 244-287 | `historia/FUGA-DEL-ENV.md` | IP de fuera tapadas; en `ref/VPS.md` queda el resumen y lo que dejó (la lista blanca) | 05/10/2026 |
| §9 fail2ban | 288-331 | `ref/VPS.md` | Se corrige con lo que diga el VPS | 05/10/2026 |
| §9 Límites, caché, cabeceras, compresión, cluster y medidas | 332-433 | `ref/VPS.md` | Las medidas, con su fecha | 05/10/2026 |
| §10 Lo que falta y Resuelto | 434-458 | `ref/VPS.md` | Cada punto, comprobado | 05/10/2026 |

## `docs/RETOMAR.md` (250 líneas): queda lo que solo hace Luis tras formatear

| Sección de hoy | Líneas | Va a | Nota | Hecho |
|---|---|---|---|---|
| Título y entrada | 1-11 | `guias/RETOMAR.md` | | 05/10/2026 |
| §1 Lo que NO está en este repositorio | 12-23 | `guias/RETOMAR.md` | | 05/10/2026 |
| §1.1 La llave SSH se ha perdido dos veces | 24-56 | `historia/LLAVE-SSH.md` y `guias/RETOMAR.md` | El relato de las dos pérdidas y su lección, a historia; cómo recuperar el acceso por Azure es una guía y se queda, con la advertencia en dos líneas (cambiado al leerla) | 05/10/2026 |
| §1.2 Lo que se hizo el 19/09/2026 | 57-77 | `historia/LLAVE-SSH.md` | | 05/10/2026 |
| §1.3 Dónde vive ahora la llave, y por qué ahí | 78-124 | `guias/RETOMAR.md` | | 05/10/2026 |
| §2 Dónde vive cada cosa | 125-142 | `ref/ARQUITECTURA.md` y `guias/RETOMAR.md` | Lo general a la visión; lo de Luis (Bitwarden, Drive) se queda. Sin la IP | 05/10/2026 |
| §3 Levantar el entorno en un PC nuevo | 143-180 | `guias/SUMARSE.md` y `guias/RETOMAR.md` | Lo de todos a la guía para sumarse; lo que solo restaura Luis (llaves, `.env`, `datos-locales/`, memoria) se queda | 05/10/2026 |
| §4 Desplegar un cambio | 181-206 | `guias/DESPLEGAR.md` | | 05/10/2026 |
| §5 En qué punto está el trabajo | 207-234 | `historia/HISTORIAL.md` | En la semana del 14 al 20/09; la guía enlaza las listas, `specs/` y el historial | 05/10/2026 |
| §6 Lo que muerde si no se sabe | 235-250 | Cada trampa a su documento | fail2ban y la IP de `ignoreip`, a `ref/VPS.md`; las de formatear se quedan | 05/10/2026 |

## `docs/SEGURIDAD.md` (163 líneas): pasa a `ref/CUENTAS.md`

| Sección de hoy | Líneas | Va a | Nota | Hecho |
|---|---|---|---|---|
| Título y entrada | 1-8 | `ref/CUENTAS.md` | Título nuevo: las cuentas | 05/10/2026 |
| §1 El problema que se atacó | 9-16 | `historia/CONTRASENAS-EN-CLARO.md` | Una línea en la referencia | 05/10/2026 |
| §2 La solución | 17-50 | `ref/CUENTAS.md` | | 05/10/2026 |
| §3 Backfill | 51-84 | `historia/CONTRASENAS-EN-CLARO.md` | El script sigue en el repositorio: la referencia dice para qué sirve | 05/10/2026 |
| §4 Pruebas | 85-100 | `ref/CUENTAS.md` | | 05/10/2026 |
| §5 Plan de activación en producción | 101-156 | `historia/CONTRASENAS-EN-CLARO.md` | Ya se ejecutó | 05/10/2026 |
| §6 Alcance (qué no incluyó) | 157-163 | `ref/CUENTAS.md` | | 05/10/2026 |
| (nueva) Los nombres de usuario | | `ref/CUENTAS.md` | La regla de `api/_nombre-usuario.js` y el punto 31 de la auditoría (05/10/2026) | 05/10/2026 |

## Los que se mudan casi enteros

| Documento de hoy | Va a | Lo que sale | Hecho |
|---|---|---|---|
| `ARTE.md` (274) | `ref/ARTE.md` | Nada. §6 se corrige: el avatar compuesto en el servidor se adoptó el 21/09 (enlace a `ref/AVATARES.md`). §3 gana el resumen del lienzo y §7 el enlace a sus pendientes. Al revisarlo, el §6 de entonces pasó entero a `historia/AVATARES-AL-SERVIDOR.md` («Lo que ARTE descartó el 16/09/2026») y en su sitio queda el resumen con los enlaces | 05/10/2026 |
| `ECONOMIA.md` (199) | `ref/ECONOMIA.md` | §5 Los saldos rehechos (134-186) a `historia/SALDOS-REHECHOS.md`; en la referencia quedan el resumen y el aviso de que no se repite | 05/10/2026 |
| `TIENDA.md` (215) | `ref/TIENDA.md` | Nada. Se corrigen `js/tienda.js` y `css/tienda.css`, que no existen | 05/10/2026 |
| `MODERACION.md` (175) | `ref/MODERACION.md` | §5 Lo que se hizo al activarlo (142-152) a `historia/ACTIVAR-LA-MODERACION.md` | 05/10/2026 |
| `SEO.md` (206) | `ref/SEO.md` | Nada. Se corrigen las cifras (15 páginas) | 05/10/2026 |
| `JUEGOS.md` (253) | `guias/JUEGOS.md` | §6 Convenciones (212-223) se cambia por el enlace a la constitución, después de comprobar que no dice nada más | 05/10/2026 |
| `CAMBIOS-DE-OTROS-DEVS.md` (157) | `guias/CAMBIOS-DE-OTROS-DEVS.md` | §1 y §2, los casos del 28/09 y del 03/10 (8-144), a `historia/CASOS-DE-OTROS-DEVS.md`. Queda el método (lo que se repite de los dos casos, más §3) y gana la tabla «ruta vieja → ruta nueva» | 05/10/2026 |
| `FRONTEND.md` (151) | `historia/FRONTEND.md` | Entero: es el documento de decisión del 22/09. Resumen en `ref/ARQUITECTURA.md`; las cifras, con su fecha | 05/10/2026 |
| `AUDITORIA.md` (460) | `listas/AUDITORIA.md` | Nada. Filas y números intactos. Notas fechadas a los puntos 14 y 75 (el repositorio ya es privado) y la sección «Pendientes que viven en otros documentos» (research D10) | 05/10/2026 |
| `SUGERENCIAS.md` (605) | `listas/SUGERENCIAS.md` | Nada. Se quitan sus 12 emojis; estados intactos | 05/10/2026 |

## Fuera de `docs/`

| Archivo | Qué pasa | Hecho |
|---|---|---|
| `README.md` | Se rehace como entrada e índice. «Stack» y «Sistemas documentados» pasan a `ref/ARQUITECTURA.md`; «Cómo probar localmente», a `guias/SUMARSE.md`; «Convenciones», a la constitución. El `README.md` enlaza los tres | 05/10/2026 |
| `CLAUDE.md` | Rutas nuevas, resúmenes con su enlace (research D9) y la regla del historial (RF-017) | 05/10/2026 |
| `infra/LEEME.md` | Se revisa entero, como un documento más | 05/10/2026 |
| `.gitignore` | Rutas nuevas, y deja de decir que el repositorio es público | 05/10/2026 |
| Constitución y su plantilla propia | Enmienda v1.0.1 (research D12) | 05/10/2026 |
| Memoria de Claude, la viva y su copia | Rutas nuevas (research D11) | |
| `memoria-claude/LEEME.md` | Repositorio privado, recuento de archivos y una receta de refresco que no borra nada (research D11) | |

## Lo que se escribe nuevo

| Documento | Con qué se escribe | Hecho |
|---|---|---|
| `ref/ARQUITECTURA.md` | Lo que llega del `README.md`, `DESARROLLO.md` §2, `VPS.md` §3 y `RETOMAR.md` §2, más un párrafo por cada área sin documento propio, leído del código | |
| `ref/AVISOS.md` | `DESARROLLO.md` §2.3 y §9 | |
| `guias/SUMARSE.md` | `RETOMAR.md` §3, el «Cómo probar localmente» del `README.md`, lo práctico del `CLAUDE.md` y lo comprobado de Spec Kit (research D14) | 05/10/2026 |
| `guias/DESPLEGAR.md` | `VPS.md` §5, `RETOMAR.md` §4 y el `CLAUDE.md` | 05/10/2026 |
| `historia/HISTORIAL.md` | El historial de git, semana a semana (research D6) | 05/10/2026 |
