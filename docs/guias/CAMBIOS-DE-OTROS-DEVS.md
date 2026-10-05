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
