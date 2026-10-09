# Lista de calidad de la especificación: los volcados con contraseñas en claro

**Para qué**: comprobar que la especificación está completa y clara antes de aprobarla.
**Creada**: 2026-10-09
**Especificación**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs)
- [x] Centrada en lo que aporta a quien usa el sitio
- [x] Escrita para alguien no técnico
- [x] Todas las secciones obligatorias completas

## Requisitos completos

- [x] No quedan marcas [NEEDS CLARIFICATION]
- [x] Los requisitos se pueden comprobar y no son ambiguos
- [x] Los criterios de éxito se pueden medir
- [x] Los criterios de éxito no dependen de una tecnología
- [x] Todos los escenarios de aceptación están definidos
- [x] Los casos límite están identificados
- [x] El alcance está acotado
- [x] Dependencias y supuestos identificados

## Lista para planificar

- [x] Cada requisito funcional tiene criterios de aceptación claros
- [x] Los escenarios cubren los usos principales
- [x] La función cumple los resultados medibles de los criterios de éxito
- [x] No se cuelan detalles de implementación en la especificación

## Notas

- **Sobre "sin detalles de implementación":** es una spec corta, con el plan en la misma página. El
  contexto nombra archivos y rutas porque dice dónde está cada copia; las historias, los requisitos y
  los criterios hablan de lo que queda o no queda.
- **Primera revisión (2026-10-09):** pasa todo salvo una cosa: quedan dos marcas [NEEDS CLARIFICATION],
  las dos decisiones de Luis. D1 es qué se hace con los dos volcados, y D5 es cómo se mira Google
  Drive. Antes de escribir se comprobó cada copia, en el servidor y en el PC, solo leyendo y solo
  contando.
- **Segunda revisión (2026-10-09):** Luis respondió que se borran los dos volcados (D1) y que Google
  Drive no se mira (D5). Sin marcas, pasa todo. La historia de Drive, su requisito, su criterio y su
  tarea salen de la spec.
