# Lista de calidad de la especificación: que los juegos no puedan leer la sesión

**Para qué**: comprobar que la especificación está completa y clara antes de planificar.
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

- **Sobre "sin detalles de implementación":** el contexto nombra archivos porque explica dónde está el
  riesgo y lo que depende de él, comprobado en el código de hoy. Las historias, los requisitos y los
  criterios hablan de lo que puede o no puede hacer un juego y de lo que ve quien juega. Cómo se
  separan los juegos (una dirección propia u otra forma) lo decide el plan; los supuestos solo dicen que
  suele necesitar una dirección, porque Luis tiene que saberlo antes.
- **Primera revisión (2026-10-09):** pasa todo salvo una cosa: queda una marca [NEEDS CLARIFICATION]
  (Historia 4, RF-008 y CE-007), qué pasa con las partidas que los juegos guardan en el navegador. Es una
  decisión de Luis, y afecta a quien más juega. Las cifras salen de recuentos en producción, solo de
  lectura y sin nombres.
- **Segunda revisión (2026-10-09):** Luis respondió que las partidas pasan solas al sitio aparte, nunca
  con la sesión ni con lo del sitio, y que él puede entrar en IONOS. Sin marcas, pasa todo. Se añadió el
  total de personas distintas (84), porque la suma por motor contaba dos veces a quien jugó a varios.
