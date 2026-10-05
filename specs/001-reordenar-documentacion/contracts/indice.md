# Contrato: el índice del `README.md`

La entrada única de la documentación (RF-001). Es también lo primero que se ve del repositorio en
GitHub. Este es su esqueleto; el texto de cada fila se escribe al final, con los documentos ya en su
sitio.

```markdown
# MacroReborn

Dos o tres líneas: qué es MacroReborn y dónde está (macroreborn.com).

## Por dónde empezar

- Si llegas nuevo, o vuelves tras un tiempo: [SUMARSE](docs/guias/SUMARSE.md).
- Para entender cómo está hecho: [ARQUITECTURA](docs/referencia/ARQUITECTURA.md).
- Para desplegar: [DESPLEGAR](docs/guias/DESPLEGAR.md).

## Las reglas

- [La constitución](.specify/memory/constitution.md): una línea sobre qué es y que manda.
- [CLAUDE.md](CLAUDE.md): una línea.
- [specs/](specs/): una línea; cada cambio, con su especificación, su plan y sus tareas.

## Referencia: cómo es hoy

| Documento | Para quién | Qué cuenta |
|---|---|---|
| [ARQUITECTURA](docs/referencia/ARQUITECTURA.md) | ... | ... |

## Guías: cómo hacer algo

(misma tabla)

## Listas vivas: lo pendiente

(misma tabla)

## Historia y decisiones: por qué está como está

| Fecha | Documento | Qué cuenta |
|---|---|---|
| | [HISTORIAL](docs/historia/HISTORIAL.md) | Qué cambió cada semana desde el 23/07/2026 |
| 21/09/2026 | [AVATARES-AL-SERVIDOR](docs/historia/AVATARES-AL-SERVIDOR.md) | ... |

## Especificaciones

Una línea: cómo se trabaja con Spec Kit, y el enlace a `specs/` y a la guía para sumarse.
```

**Reglas**:

- Cada `.md` de `docs/` aparece en su sección, con su frase (RF-002, CE-002) **(prueba)**.
- Las secciones van en este orden, que es el de RF-004.
- En historia, la fila lleva la fecha del suceso y las filas van de más nuevo a más viejo, con el
  historial de cambios primero.
- El `README.md` solo enlaza: no explica nada que esté en otro documento (RF-009). Lo que hoy explica
  (stack, cómo probar, convenciones) se va a su sitio ([mapa-de-contenido.md](../mapa-de-contenido.md)).
- Qué documento lleva cada área no se repite aquí: está en `ARQUITECTURA.md` (RF-014).
