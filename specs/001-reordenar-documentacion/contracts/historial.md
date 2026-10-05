# Contrato: el historial de cambios

`docs/historia/HISTORIAL.md`: qué cambió en el proyecto y cuándo, para el equipo y en lenguaje técnico
(RF-007). Las decisiones que hay detrás están en [research.md](../research.md), D6.

## Forma

```markdown
# HISTORIAL — qué cambió y cuándo

> **De qué trata:** todo lo que cambió en MacroReborn, semana a semana, desde la primera subida.
>
> **Para quién:** el equipo de desarrollo.
>
> **Revisado:** DD/MM/AAAA

Cómo se mantiene: una línea con la regla de RF-017 y el enlace a la guía para sumarse.

## Semana del 28/09 al 04/10/2026

- **04/10, economía** (Luis): los precios pasan a ir por rareza y los saldos se rehacen con las
  reglas nuevas. [ECONOMIA](../referencia/ECONOMIA.md),
  [`1a2b3c4`](https://github.com/valenmgg/MacroReborn/commit/1a2b3c4).
- **...**

## Semana del 21 al 27/09/2026

...

## Semana del 20 al 26/07/2026

- **23/07, todo** (valenmgg): primera subida del código a GitHub. [`96260a0`](https://github.com/valenmgg/MacroReborn/commit/96260a0).
```

## Reglas

- **Semanas** de lunes a domingo, la más reciente arriba. Las semanas sin commits no aparecen.
- **Cada cambio**: día (DD/MM), área (con el nombre que usa `ARQUITECTURA.md`), quién, qué cambió en
  una o dos frases técnicas y los enlaces a donde se explica.
- **Enlaces**, por este orden de preferencia: el documento de referencia o de historia, la
  especificación (`specs/NNN-nombre/spec.md`) y, si no hay otro, los commits. Los commits se enlazan en
  GitHub; en un cambio de muchos commits, el primero y el último, con cuántos son.
- **Agrupar**: muchos commits sobre lo mismo en la misma semana son un solo cambio («la barra de
  navegación, rehecha en 23 subidas entre el 12 y el 14/08»).
- **Commits sin asunto útil** («Add files via upload», «Update X»): se cuenta lo que cambiaron, leído de
  los archivos que tocaron. Ninguno queda sin contar (historia 5, escenario 2).
- **Sin datos sensibles** (regla XXV), aunque el commit los traiga.
- **La fecha**: la de autor del commit en lo reconstruido; desde ahora, la de la unión a `main`.

## Cómo sigue vivo (RF-017)

Como última tarea de cada especificación, antes de unirla a `main`:

1. Si la semana de hoy no tiene sección, se crea arriba del todo.
2. Se añade el cambio con la fecha de la unión, su área, quién y el enlace a su `spec.md`.
3. Va en el mismo commit que cierra la spec, o en uno propio justo antes de la unión.

La 001 es la primera en hacerlo. La regla queda escrita en `docs/guias/SUMARSE.md` y en el `CLAUDE.md`.
