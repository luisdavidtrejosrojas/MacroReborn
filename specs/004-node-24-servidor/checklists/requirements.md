# Lista de calidad de la especificación: Node 24 en el servidor

**Para qué**: comprobar que la especificación está completa y clara antes de aprobarla.
**Creada**: 2026-10-08
**Especificación**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs)
- [x] Centrada en lo que aporta a quien usa el sitio y a quien trabaja en él
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

- **Sobre "sin detalles de implementación" y "no dependen de una tecnología":** aquí el producto es la
  propia versión de Node del servidor, así que la especificación la nombra, como la 003 nombraba la CI.
  Los criterios miden lo que se ve desde fuera (la versión que contesta, lo que responde la web, el
  tiempo sin servicio); cómo se hace, va en el plan de la misma página.
- **Primera revisión (2026-10-08):** queda una marca [NEEDS CLARIFICATION], la pregunta 1 (si los
  parches de la rama 24 llegan solos o a mano), que aparece en la historia 4, en RF-009 y en D7. Todo lo
  demás pasa.
- **Segunda revisión (2026-10-08):** Luis respondió A: los parches de la 24 se instalan solos, con las
  actualizaciones automáticas. La respuesta está en la sección de aclaraciones; la historia 4, RF-009 y
  D7 la recogen, con su criterio (CE-008), y ya pasa todo.
