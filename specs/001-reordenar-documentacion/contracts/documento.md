# Contrato: cómo es un documento de `docs/`

Lo que cumple todo documento de `docs/`, hoy y en cada spec futura. Las reglas marcadas con
**(prueba)** las vigila `tests/documentacion.test.js` ([prueba-documentacion.md](prueba-documentacion.md)).

## Dónde va y cómo se llama

- En `docs/referencia/`, `docs/guias/`, `docs/listas/` o `docs/historia/`, según el criterio de
  [research.md](../research.md), D1.
- Nombre en mayúsculas, con guiones, sin tildes ni eñes, terminado en `.md`: `CAMBIOS-DE-OTROS-DEVS.md`.
- Un documento nuevo se añade al índice del `README.md` en el mismo commit **(prueba)**.

## La cabecera (RF-003) **(prueba)**

Las cuatro primeras líneas con texto son el título y tres campos, en este orden y con estas etiquetas:

```markdown
# TÍTULO — subtítulo corto

> **De qué trata:** una o dos frases.
> **Para quién:** quién lo lee.
> **Revisado:** DD/MM/AAAA
```

- «Revisado» se cambia cuando alguien lee el documento entero y lo compara con el sistema, no cuando se
  toca una línea.
- En `docs/historia/`, «Revisado» es la fecha en que se comprobó que el texto se pasó entero, no la del
  suceso que cuenta. La fecha del suceso va en el título o en la primera línea.

## Enlaces y menciones (research D3)

- Entre documentos, enlace de Markdown relativo: `[ECONOMIA.md](../referencia/ECONOMIA.md)`. A una
  sección, con su ancla, que es el título como lo escribe GitHub:
  `[los precios](../referencia/ECONOMIA.md#2-los-precios)` **(prueba)**.
- Desde el código, la ruta desde la raíz, con ancla si hace falta:
  `docs/guias/DESARROLLO.md#probar-contra-los-datos-de-verdad` **(prueba)**.
- Los puntos de las listas, por número: «punto 31 de `docs/listas/AUDITORIA.md`».
- Nunca por número de sección («§8»).
- Fuera de `docs/historia/`, toda ruta del repositorio entre comillas invertidas existe, y todo
  `npm run X` también **(prueba)**. Un archivo que ya no existe se nombra sin carpeta («el antiguo
  `_pusher.js`») o se cuenta en historia.

## El contenido

- **Referencia**: cómo es hoy y por qué, en corto. Lo largo de cómo se llegó, a historia, con un
  resumen de dos líneas y el enlace (RF-010).
- **Un tema, un documento** (RF-009): si otro documento lo necesita, enlaza; como mucho, lo resume en
  una frase. La única excepción es el `CLAUDE.md` (research D9).
- **Lo pendiente** de un área va en una sección «Lo que queda» al final de su referencia, y
  `docs/listas/AUDITORIA.md` la enlaza (research D10).
- **Cifras que cambian solas** (pruebas, cuentas, páginas, prendas): con su fecha («unas 1.300
  pruebas al 05/10/2026») o fuera de la referencia.
- **Fechas** como en el resto de la documentación: «el 21/09/2026».
- **Sin emojis** en lo nuevo ni en los pasajes reescritos (regla XXX, CE-007). Los antiguos de los
  documentos que solo se revisan se quedan.
- **Sin datos sensibles** (regla XXV), sin excepciones: ni IP enteras (se escriben `172.x.x.x` o se
  nombra el dominio), ni correos (se nombran: «el correo de autor de la regla V», «el buzón que publica
  `terminos.html`»), ni datos personales ([research.md](../research.md), D8).
- Español, impersonal o con el registro que ya usa cada documento.
