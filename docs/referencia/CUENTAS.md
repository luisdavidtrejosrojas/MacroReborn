# CUENTAS — las contraseñas y los nombres de usuario

> **De qué trata:** cómo se guardan y se comprueban las contraseñas (el hash con bcrypt, qué hace cada
> operación y las pruebas que lo sujetan), qué nombre de usuario se acepta y por qué no distingue
> mayúsculas, lo que este sistema no cubre y lo que queda de cuando las contraseñas se guardaban en
> claro.
>
> **Para quién:** el equipo de desarrollo.
>
> **Revisado:** 05/10/2026

Hasta septiembre de 2026 las contraseñas se guardaban en claro. Cómo se pasó a bcrypt sin que nadie
perdiera el acceso lo cuenta [CONTRASENAS-EN-CLARO](../historia/CONTRASENAS-EN-CLARO.md).

---

## Cómo se guardan

- **bcryptjs**: se guarda solo un hash de la contraseña, que no se puede revertir, con costo de
  trabajo 10 (`COSTO_HASH`).
- **La columna `users.password_hash`** (migración 013). La vieja, `password`, sigue existiendo sin
  su NOT NULL (migración 014), vacía en todas las cuentas desde el 16/09/2026. Borrarla está en
  [Lo que queda](#lo-que-queda).
- **`api/_password.js`** es el único sitio que sabe hashear y verificar contraseñas: las funciones
  `hashContrasena`, `verificarHash` y `verificarContrasenaYMigrar`, y la clase `PasswordService`
  (`registrar`, `verificar`, `cambiarContrasena` y `eliminarCuenta`).

### Qué hace cada operación

- **Registrarse** (`api/auth.js`): guarda SOLO el hash. El texto plano nunca se escribe en la base.
- **Entrar** (`api/auth.js`): busca la cuenta por su nombre y:
  1. si tiene `password_hash`, lo compara con bcrypt;
  2. si todavía tuviera texto plano, compara el texto y, si coincide, guarda el hash y borra el texto
     en la misma operación (la migración perezosa). Desde el 16/09/2026 no queda ninguna cuenta así,
     pero la rama sigue.
- **Cambiar la contraseña** (`api/users.js`): verifica la actual y guarda solo el hash de la nueva.
- **Borrar la cuenta** (`api/auth.js`): verifica la contraseña antes de borrar.

### Por qué no se puede "perder" una contraseña

El borrado del texto plano y el guardado del hash ocurren en una única
instrucción SQL (`SET password_hash = ..., password = NULL`), y el
hash se genera a partir de la misma contraseña. No existe un estado
intermedio en el que el texto desaparezca sin que el hash quede
guardado y funcione.

## El relleno (`scripts/migrar-passwords.js`)

Pasó a bcrypt, de una vez, las contraseñas en claro de quienes no habían vuelto a entrar. Se corrió el
16/09/2026 y no queda ninguna; el script sigue en el repositorio. Su alcance, sus protecciones y cómo
se usa: [el relleno](../historia/CONTRASENAS-EN-CLARO.md#backfill-scriptsmigrar-passwordsjs).

## Pruebas

`tests/password.test.js` (correr con `npm test`) crea su propia base de
práctica y ejercita los handlers reales:

- El registro guarda solo el hash, nunca el texto plano.
- El login acepta la contraseña correcta y rechaza la incorrecta, sin
  filtrar campos de contraseña en la respuesta.
- Un usuario legacy (texto plano) entra y queda migrado a hash en el
  momento.
- El cambio de contraseña verifica la actual, guarda el hash nuevo y
  deja de aceptar la vieja.
- El borrado de cuenta exige la contraseña correcta y elimina al
  usuario.
- El registro rechaza nombres de usuario duplicados.

## Los nombres de usuario

**Qué nombre se acepta**, desde el 24/09/2026 (`api/_nombre-usuario.js`): entre 3 y 25 caracteres,
contados como los ve una persona (una letra decorativa como 𝕊 cuenta uno); sin espacios al principio
ni al final; sin `` < > " ' ` & / \ ``, que rompen el HTML, un atributo o una ruta; y sin nada
invisible: controles, marcas de dirección ni espacios de ancho cero, que dejan hacerse pasar por otra
cuenta. Todo lo demás pasa: letras decorativas, runas, símbolos, la ñ y los espacios por dentro. El
registro lo comprueba y devuelve el error en palabras que el formulario enseña tal cual. Nació del
punto 77 de la [auditoría](../listas/AUDITORIA.md), un nombre que llevaba código: el arreglo de verdad
fue escapar al pintar, y esto es la otra mitad.

**Las mayúsculas no separan cuentas**, desde el 05/10/2026 (punto 31). `cuentaPorNombre()`, en
`api/_utils.js`, busca primero el nombre exacto; si no lo hay, la única cuenta que coincida sin mirar
mayúsculas; y si coinciden varias, ninguna, porque no se puede saber de quién es. La usan el perfil
(`/api/users?username=`), entrar, cambiar la contraseña, borrar la cuenta y `getUserId()`, y el
registro tampoco las distingue: «Ana» no se crea si ya existe «ana», y el aviso dice que entre con su
cuenta. Antes se crearon así dos parejas de cuentas, que siguen separadas: juntarlas es cosa de cada
persona. `api/social.js` y `api/_sanciones.js` buscan por el nombre exacto a propósito, porque reciben
el guardado, el de las listas y los perfiles.

Lo sujetan `tests/nombres-de-usuario.test.js` (la regla, el registro y la página de amigos con nombres
maliciosos) y `tests/nombres-mayusculas.test.js`.

## Lo que no cubre

Este documento es solo de las contraseñas. Lo de alrededor, que cuando se hizo tampoco existía, hoy
está en otros sitios:

- **La sesión**: un pase firmado (`api/_auth.js`) que caduca a los siete días sin entrar, se renueva
  mientras se usa y obliga a entrar de nuevo a los 30 días. Que cerrar sesión no lo invalide es el
  punto 12 de [AUDITORIA](../listas/AUDITORIA.md), y qué juegos pueden leerlo, el punto 1.
- **El límite al entrar**: nginx deja llegar a `/api/auth` (entrar, registrarse y borrar la cuenta)
  cinco veces por minuto y por IP, más cinco de margen: la zona `login`, en
  `infra/nginx/macroreborn-limites.conf`.
- **Quién puede moderar**: [MODERACION](MODERACION.md).
- **Escapar lo que escribe la gente**: los puntos 2, 4, 5 y 77 de [AUDITORIA](../listas/AUDITORIA.md),
  ya arreglados, y el 73, las copias de la función de escapar.

## Lo que queda

- **Borrar `users.password` y la rama del texto plano** de `api/_password.js`. Es el último paso del
  plan de activación y queda pendiente a propósito, tras un período de gracia. El plan entero, y cómo
  se comprobó que nadie perdió el acceso:
  [la activación](../historia/CONTRASENAS-EN-CLARO.md#plan-de-activación-en-producción).
- **Las contraseñas en claro de antes del 16/09/2026 que quedan fuera de la base.** En el servidor ya
  no queda ninguna: los diarios de entonces se borraron solos a los 14 días, y los dos volcados de Neon
  del 01/09/2026, con las 21 que había ese día, el 09/10/2026
  ([spec 006](../../specs/006-volcados-en-claro/spec.md)). Quedan dos sitios posibles:
  - la base de Neon, que sigue como el 01/09 si el proyecto sigue vivo
    ([VPS, lo que falta](VPS.md#9-lo-que-falta));
  - una base de antes de esa fecha bajada para probar, que en un portátil no se borra sola
    ([DESARROLLO](../guias/DESARROLLO.md#probar-contra-los-datos-de-verdad)).

  La copia que la mudanza dejó en el PC no está en el de ahora, formateado el 19/09/2026
  ([MUDANZA-AL-VPS](../historia/MUDANZA-AL-VPS.md)).
