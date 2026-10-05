# CAMBIOS-DE-OTROS-DEVS — cómo entra lo que manda otra persona

> **De qué trata:** cómo se meten en el proyecto los cambios que otra persona manda, en un zip o en una
> rama: el método para fundirlos, qué pedirle para la próxima vez y qué hacer si llega algo con las
> rutas de antes de la documentación.
>
> **Para quién:** quien funde el trabajo de otra persona, y quien lo manda.
>
> **Revisado:** 05/10/2026

---

## 1. El método

Lo que llega nunca se copia encima: una carpeta entera trae, además de lo que esa persona cambió,
copias de su base, y si su base es vieja, copiarlas deshace el trabajo de los demás (regla XXVII de la
constitución). Así que, archivo por archivo:

1. **Encontrar su base**: el commit en el que todos sus archivos sin tocar coinciden con el
   repositorio.
2. **Sacar su cambio** contra esa base (`git diff`).
3. **Fundirlo** con el código de hoy a tres bandas (`git merge-file`: la base, lo nuestro y lo suyo) y
   resolver a mano los conflictos. Si su base es el último commit, no hay nada que fundir: su cambio
   entra tal cual.
4. **Revisarlo**, probarlo (`npm test` y el servidor local) y mirarlo en capturas, en móvil y en PC.
5. **Contar qué no entró y por qué**, y qué se arregló al meterlo.

Entra como su propia especificación (una spec corta si es pequeño), con un commit por cambio. Los dos
casos que dieron forma al método, el del 28/09/2026 y el del 03/10/2026, están en
[CASOS DE OTROS DEVS](../historia/CASOS-DE-OTROS-DEVS.md).

---

## 2. Para la próxima vez

Lo que ahorraría casi todo el trabajo de fundir, para pedírselo a quien mande
cambios:

- **Partir del código de hoy**, no de una copia guardada: `git pull`
  antes de empezar.
- **Mandar solo lo que se cambió**, mejor como rama o parche de Git
  (`git diff`, `git format-patch`) que como carpetas enteras.
- **No mandar herramientas de prueba propias** (como `mock-backend.js`)
  dentro de las páginas.
- **Probar con el servidor local** (`npm run db:local`, ver
  [el servidor local](DESARROLLO.md#scriptsservidor-localjs--probar-en-el-navegador))
  y con `npm test`.

---

## 3. Si llega algo con las rutas de antes

El 05/10/2026 la documentación se repartió en carpetas por tipo (la
[spec 001](../../specs/001-reordenar-documentacion/spec.md)). Lo que alguien haya hecho sobre una
copia anterior cita los documentos por su ruta de antes: al fundirlo, cada
una se cambia por la de ahora. Si se cuela alguna, la prueba de la
documentación (`tests/documentacion.test.js`) lo dice con el archivo y la
línea.

| Antes, en `docs/` | Ahora |
|---|---|
| `ARTE.md` | [docs/referencia/ARTE.md](../referencia/ARTE.md) |
| `AUDITORIA.md` | [docs/listas/AUDITORIA.md](../listas/AUDITORIA.md) |
| `AVATARES-SERVIDOR.md` | [docs/referencia/AVATARES.md](../referencia/AVATARES.md) |
| `CAMBIOS-DE-OTROS-DEVS.md` | [docs/guias/CAMBIOS-DE-OTROS-DEVS.md](CAMBIOS-DE-OTROS-DEVS.md), este documento |
| `DESARROLLO.md` | [docs/guias/DESARROLLO.md](DESARROLLO.md) |
| `ECONOMIA.md` | [docs/referencia/ECONOMIA.md](../referencia/ECONOMIA.md) |
| `FRONTEND.md` | [docs/historia/FRONTEND.md](../historia/FRONTEND.md) |
| `JUEGOS.md` | [docs/guias/JUEGOS.md](JUEGOS.md) |
| `MODERACION.md` | [docs/referencia/MODERACION.md](../referencia/MODERACION.md) |
| `RETOMAR.md` | [docs/guias/RETOMAR.md](RETOMAR.md) |
| `SEGURIDAD.md` | [docs/referencia/CUENTAS.md](../referencia/CUENTAS.md) |
| `SEO.md` | [docs/referencia/SEO.md](../referencia/SEO.md) |
| `SUGERENCIAS.md` | [docs/listas/SUGERENCIAS.md](../listas/SUGERENCIAS.md) |
| `TIENDA.md` | [docs/referencia/TIENDA.md](../referencia/TIENDA.md) |
| `VPS.md` | [docs/referencia/VPS.md](../referencia/VPS.md) |

Algunas secciones, además, salieron de su documento a otro sitio: la historia a `docs/historia/`, y
lo que contaban dos documentos a la vez, a uno solo. Lo que alguien cite de antes con su sección se
busca aquí; el detalle, sección por sección, está en
[el mapa de contenido](../../specs/001-reordenar-documentacion/mapa-de-contenido.md).

| Antes | Ahora |
|---|---|
| `DESARROLLO.md`, §2: los módulos del backend | [ARQUITECTURA](../referencia/ARQUITECTURA.md#cómo-se-conectan); cómo era antes de la mudanza, [MUDANZA-AL-VPS](../historia/MUDANZA-AL-VPS.md); los avisos, [AVISOS](../referencia/AVISOS.md); los cambios del login, [CONTRASENAS-EN-CLARO](../historia/CONTRASENAS-EN-CLARO.md) |
| `DESARROLLO.md`, §3.3 y §4: el relleno de contraseñas y su despliegue | [CONTRASENAS-EN-CLARO](../historia/CONTRASENAS-EN-CLARO.md) |
| `DESARROLLO.md`, §3.4 a §3.6: qué sujeta cada prueba | [CUENTAS](../referencia/CUENTAS.md#pruebas) y [ECONOMIA](../referencia/ECONOMIA.md#6-las-pruebas) |
| `DESARROLLO.md`, §5: las convenciones | La constitución (`.specify/memory/constitution.md`) |
| `DESARROLLO.md`, §6: el lienzo del catálogo | [LIENZO-DEL-CATALOGO](../historia/LIENZO-DEL-CATALOGO.md) |
| `DESARROLLO.md`, §7: la marca de imagen no encontrada | [IMAGEN-NO-ENCONTRADA](../historia/IMAGEN-NO-ENCONTRADA.md) |
| `DESARROLLO.md`, §9: los avisos en vivo | [AVISOS](../referencia/AVISOS.md); por qué estuvieron rotos, [AVISOS-ROTOS](../historia/AVISOS-ROTOS.md) |
| `AVATARES-SERVIDOR.md`: la entrada, §1, §2, las fases de §5, lo de macrojuegos de §8 y §12, y cómo se decidió la foto de perfil | [AVATARES-AL-SERVIDOR](../historia/AVATARES-AL-SERVIDOR.md) |
| `AVATARES-SERVIDOR.md`: «Cómo mirarlo con los ojos», §11 y la herramienta de §12 | [DESARROLLO](DESARROLLO.md) |
| `ARTE.md`, §6: lo que se decidió no hacer | [AVATARES-AL-SERVIDOR](../historia/AVATARES-AL-SERVIDOR.md#lo-que-arte-descartó-el-16092026) |
| `SEGURIDAD.md`, §1, §3 y §5: el problema, el relleno y el plan de activación | [CONTRASENAS-EN-CLARO](../historia/CONTRASENAS-EN-CLARO.md) |
| `ECONOMIA.md`, §5: los saldos rehechos | [SALDOS-REHECHOS](../historia/SALDOS-REHECHOS.md) |
| `MODERACION.md`, §5: lo que se hizo al activarla | [ACTIVAR-LA-MODERACION](../historia/ACTIVAR-LA-MODERACION.md) |
| `CAMBIOS-DE-OTROS-DEVS.md`: los casos del 28/09 y del 03/10 | [CASOS-DE-OTROS-DEVS](../historia/CASOS-DE-OTROS-DEVS.md) |
| `VPS.md`, §3: cómo habla el código con la base | [ARQUITECTURA](../referencia/ARQUITECTURA.md#cómo-se-conectan); cómo se hizo, [MUDANZA-AL-VPS](../historia/MUDANZA-AL-VPS.md) |
| `VPS.md`, §5: «Desplegar un cambio» | [DESPLEGAR](DESPLEGAR.md) |
| `VPS.md`, §7: la migración de los datos | [MUDANZA-AL-VPS](../historia/MUDANZA-AL-VPS.md) |
| `VPS.md`, §9: la fuga del `.env` | [FUGA-DEL-ENV](../historia/FUGA-DEL-ENV.md) |
| `RETOMAR.md`, §1.1 y §1.2: la llave SSH que se perdió | [LLAVE-SSH](../historia/LLAVE-SSH.md) |
| `RETOMAR.md`, §2: dónde vive cada cosa | [ARQUITECTURA](../referencia/ARQUITECTURA.md#dónde-vive-cada-cosa) |
| `RETOMAR.md`, §3: levantar el entorno | [SUMARSE](SUMARSE.md#1-preparar-el-entorno) |
| `RETOMAR.md`, §4: desplegar | [DESPLEGAR](DESPLEGAR.md) |
| `RETOMAR.md`, §5: en qué punto está el trabajo | [HISTORIAL](../historia/HISTORIAL.md) |
| `RETOMAR.md`, §6: fail2ban y la memoria de la base | [VPS](../referencia/VPS.md#8-seguridad-y-rendimiento) |
| `README.md`: «Qué es el proyecto», «Stack» y «Sistemas documentados» | [ARQUITECTURA](../referencia/ARQUITECTURA.md) |
| `README.md`: «Cómo probar localmente» | [SUMARSE](SUMARSE.md#1-preparar-el-entorno) |
