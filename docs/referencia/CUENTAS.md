# SEGURIDAD — sistema de contraseñas

Documentación del sistema de seguridad de contraseñas del proyecto:
el hash con bcrypt, la migración de los datos existentes y el plan
para activarlo en producción.

---

## 1. De dónde viene

Hasta septiembre de 2026 las contraseñas se guardaban en claro. Cómo se pasó a bcrypt sin que nadie
perdiera el acceso lo cuenta [CONTRASENAS-EN-CLARO](../historia/CONTRASENAS-EN-CLARO.md).

## 2. La solución

- **bcryptjs**: se guarda solo un hash de la contraseña (no se puede
  revertir), con costo de trabajo 10.
- **Columna nueva `users.password_hash`** (migración 013). La columna
  vieja `password` se conserva durante la transición (sin su
  restricción NOT NULL, ver migración 014) y se borra recién en una
  migración futura, después del período de gracia.
- **Módulo `api/_password.js`**, el único lugar que sabe hashear y
  verificar contraseñas: funciones puras (`hashContrasena`,
  `verificarHash`, `verificarContrasenaYMigrar`) + clase
  `PasswordService` (`registrar`, `verificar`, `cambiarContrasena` y
  `eliminarCuenta`).

### 2.1 Qué hace cada operación

- **Registro** (`api/auth.js`): guarda SOLO el hash. El texto plano
  nunca se escribe en la base.
- **Login** (`api/auth.js`): busca al usuario por nombre y verifica:
  1. Si tiene `password_hash` → compara con bcrypt.
  2. Si todavía tiene texto plano (usuario viejo) → compara el texto;
     si coincide, pica la contraseña, guarda el hash y borra el texto
     plano en la misma operación (migración perezosa).
- **Cambio de contraseña** (`api/users.js`): verifica la actual (con
  migración incluida si hace falta) y guarda solo el hash de la nueva.
- **Borrado de cuenta** (`api/auth.js`): verifica la contraseña antes
  de borrar.

### 2.2 Por qué no se puede "perder" una contraseña

El borrado del texto plano y el guardado del hash ocurren en una única
instrucción SQL (`SET password_hash = ..., password = NULL`), y el
hash se genera a partir de la misma contraseña. No existe un estado
intermedio en el que el texto desaparezca sin que el hash quede
guardado y funcione.

## 3. El relleno (`scripts/migrar-passwords.js`)

Pasó a bcrypt, de una vez, las contraseñas en claro de quienes no habían vuelto a entrar. Se corrió el
16/09/2026 y no queda ninguna; el script sigue en el repositorio. Su alcance, sus protecciones y cómo
se usa: [el relleno](../historia/CONTRASENAS-EN-CLARO.md#backfill-scriptsmigrar-passwordsjs).

## 4. Pruebas

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

## 5. Lo que queda de la activación

- `users.password` sigue existiendo y `api/_password.js` conserva su rama para el texto plano: el
  último paso del plan, borrar las dos cosas tras un período de gracia, queda pendiente a propósito.
- Los respaldos sacados antes del 16/09/2026 llevan 17 contraseñas en claro. En el VPS se borran
  solos a los 14 días; una copia bajada a un portátil, no
  (ver `docs/guias/DESARROLLO.md#8-probar-contra-los-datos-de-verdad`).

El plan entero, y cómo se comprobó que nadie perdió el acceso:
[la activación](../historia/CONTRASENAS-EN-CLARO.md#plan-de-activación-en-producción).

## 6. Alcance (qué NO incluyó)

El sistema de hash de contraseñas no incluye (ni modifica):
sesiones/autenticación real, verificación de permisos de moderación en
los endpoints, rate limiting en login/registro y el escapado de
contenido generado por usuarios. Son candidatos para futuras
iteraciones.
