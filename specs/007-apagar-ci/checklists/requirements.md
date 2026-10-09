# Lista de calidad de la especificación: apagar la integración continua de GitHub

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

- **Sobre "sin detalles de implementación":** es una spec corta, con el plan en la misma página. Aquí
  quien «usa» es el equipo, y la CI es justo de lo que trata; las historias y los criterios hablan de lo
  que pasa al subir y al unir.
- **Primera revisión (2026-10-09):** pasa todo. La decisión es de Luis (apagarla); el cómo y el texto
  nuevo de la regla XXII van en el plan (D1 y D3) para aprobarlos con la spec. Antes de escribir se
  comprobó, solo leyendo, que la cuenta de Luis puede apagar el flujo (permiso de escritura) y que las 38
  ejecuciones desde el 08/10 fallaron sin arrancar.
