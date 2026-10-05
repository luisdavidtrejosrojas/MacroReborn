# Validación: cómo se comprueba que la documentación quedó bien

**Especificación**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Los escenarios que demuestran, al final, que la spec se cumple. Se hacen juntos, en la fase de pulido
(regla IV). Lo que no se pueda hacer en el momento se apunta como «Pendiente de probar» en
[checklists/revision.md](checklists/revision.md) y no bloquea.

## Antes de empezar

- Rama `001-reordenar-documentacion`, sin cambios a medias (`git status` limpio).
- Node 20.19 o más nuevo y `npm ci` hecho.
- Para el escenario 6, la llave del VPS (`~/.ssh/macroreborn-vps-key`).

## 1. Las pruebas, en verde (RF-016, CE-003, CE-004, CE-002)

```bash
npm test
node --test tests/documentacion.test.js     # solo la de la documentación, en menos de un segundo
```

**Se espera**: todo en verde, con las seis comprobaciones de
[contracts/prueba-documentacion.md](contracts/prueba-documentacion.md) activas.

**Y que falle cuando debe**: en la copia limpia del escenario 5 (nunca en la carpeta del proyecto),
se cambia una ruta de un enlace del `README.md` y se borra la línea «Revisado» de un documento.
`node --test tests/documentacion.test.js` falla dos veces, y cada mensaje dice el archivo, la línea y
qué corregir.

## 2. Encontrar rápido lo que se busca (historia 1, CE-001, CE-008)

Desde el `README.md` en GitHub, cada pregunta se contesta en dos clics como mucho:

| # | Pregunta | Se espera llegar a |
|---|---|---|
| 1 | ¿Cómo despliego? | `docs/guias/DESPLEGAR.md` |
| 2 | ¿Cómo funciona la tienda? | `docs/referencia/TIENDA.md` |
| 3 | ¿Qué queda por arreglar? | `docs/listas/AUDITORIA.md` |
| 4 | ¿Cómo preparo el entorno y paso las pruebas? | `docs/guias/SUMARSE.md` |
| 5 | ¿Cómo agrego un juego? | `docs/guias/JUEGOS.md` |
| 6 | ¿Cómo pruebo con los datos de verdad? | La sección de los datos de verdad de `docs/guias/DESARROLLO.md` |
| 7 | ¿Dónde están los respaldos y cómo se recupera uno? | `docs/referencia/VPS.md`, sección de respaldos |
| 8 | ¿Cuánto cuesta una prenda y cómo se ganan monedas? | `docs/referencia/ECONOMIA.md` |
| 9 | ¿Cómo se banea a alguien? | `docs/referencia/MODERACION.md` |
| 10 | ¿Qué cambió la semana pasada? | `docs/historia/HISTORIAL.md` |

Además, cada documento de `docs/` sale en el índice con su frase y dice al principio de qué trata,
para quién es y cuándo se revisó (la prueba ya lo vigila).

## 3. Confiar en lo que dice (historia 2, RF-008, CE-004)

- [checklists/revision.md](checklists/revision.md) tiene una fila por documento, todas con fecha de
  lectura y sin afirmaciones caducadas pendientes.
- Ninguna frase dice que el repositorio es público:

  ```bash
  grep -rn -i "público\|publico" docs README.md CLAUDE.md .gitignore memoria-claude/LEEME.md
  ```

  Lo que salga habla de otra cosa (lo público del sitio) o es historia con su fecha.
- fail2ban queda contado en un solo sitio y coincide con el servidor, mirado solo con lectura:

  ```bash
  ssh -i ~/.ssh/macroreborn-vps-key azureuser@macroreborn.com "systemctl is-active fail2ban"
  ```

- El despliegue lo explica entero solo `docs/guias/DESPLEGAR.md`; los demás enlazan, y el
  `CLAUDE.md` lo resume (research D9).

## 4. Entender el sistema de un vistazo (historia 3)

Leyendo solo `docs/referencia/ARQUITECTURA.md`, se puede decir qué partes tiene el sistema (páginas,
servidor y API, base de datos y migraciones, servidor de producción, pruebas, herramientas locales,
`infra/`, datos fuera de git) y qué documento abrir para cada una. Su tabla de áreas tiene una fila por
área, también las que aún no tienen documento propio.

## 5. Sumarse en menos de 30 minutos (historia 4, CE-005)

Sobre una copia limpia, en la carpeta temporal de la sesión y nunca en la del proyecto:

```bash
git clone https://github.com/valenmgg/MacroReborn.git "$TMP/clon"
cd "$TMP/clon" && git checkout 001-reordenar-documentacion
```

Se sigue `docs/guias/SUMARSE.md` al pie de la letra, cronometrando, sin mirar nada más. El servidor
local se abre en otro puerto, para no chocar con el que Luis pueda tener en el 3001:

```bash
PORT=3101 npm run db:local      # http://localhost:3101, y se cierra al terminar
```

**Se espera**: las pruebas en verde y el sitio abierto en local, en menos de 30 minutos, y la guía
dice qué pasos de Spec Kit seguir, cómo nombrar los commits y que desplegar necesita el OK de Luis.
El tiempo se apunta en la lista de revisión. La prueba con una persona del equipo queda «Pendiente de
probar» hasta que alguien la haga. Al terminar, la copia se borra.

## 6. Saber qué cambió y cuándo (historia 5, RF-007, CE-009)

- En `docs/historia/HISTORIAL.md` se encuentran, cada uno con su fecha: la economía nueva, el pelo de
  atrás, los nombres sin distinguir mayúsculas y la llegada de Spec Kit.
- Cada semana con commits tiene su sección. Se comprueba con un script de un solo uso, en la carpeta
  temporal: saca las semanas de `git log --format=%ad --date=short` y busca cada
  `## Semana del ...` en el historial. Desde el 23/07/2026 son diez semanas, más las que vengan.
- La última entrada es la de esta spec, con la fecha de su unión a `main` (RF-017).

## 7. Nada se pierde (RF-015, CE-006)

Todas las filas de [mapa-de-contenido.md](mapa-de-contenido.md) tienen fecha en «Hecho».

## 8. Sin emojis ni datos sensibles (RF-012, CE-007)

Con dos búsquedas de un solo uso, en la carpeta temporal:

- **Emojis**: ninguno en `docs/` fuera de los antiguos de `AUDITORIA.md`, `JUEGOS.md`, `SEO.md` y
  `TIENDA.md`, que se quedan (regla XXX). `SUGERENCIAS.md`, cero.
- **Datos sensibles**: ninguna IP entera en `docs/`, el `README.md` o el `CLAUDE.md`, y ningún correo
  salvo el de autor de los commits y el buzón del proyecto (research D8). La búsqueda enseña las IP
  tapadas, nunca enteras. Las direcciones de SSH (`azureuser@macroreborn.com`) parecen correos y no lo
  son.

## 9. Fuera del repositorio (RF-011)

- La memoria de Claude, la viva y su copia, ya no cita rutas viejas: ninguna `docs/` seguida
  directamente de un nombre en mayúsculas.

  ```bash
  grep -rn "docs/[A-Z]" ~/.claude/projects/D--Macroreborn/memory memoria-claude/memory
  ```

- `docs/guias/CAMBIOS-DE-OTROS-DEVS.md` tiene la tabla «ruta vieja → ruta nueva» con los 15
  documentos de antes.
- `memoria-claude/LEEME.md` dice que el repositorio es privado y su receta de refresco no borra nada.

## 10. La constitución (research D12)

`.specify/memory/constitution.md` dice versión 1.0.1, con su informe de sincronización y la fecha de
la enmienda, y Luis la aprobó. Sus rutas pasan la prueba.
