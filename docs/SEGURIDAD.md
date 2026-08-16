# SEGURIDAD — MacroReborn

Documentación del sistema de contraseñas: qué problema resolvía, cómo
está implementado, cómo se migran los datos existentes y cuál es el
plan para activarlo en producción sin riesgos.

---

## 1. El problema original

Hasta la migración 013, el proyecto guardaba las contraseñas en TEXTO
PLANO en la columna `users.password`, y el login comparaba directo en
SQL (`WHERE username = ? AND password = ?`). Cualquier persona con
acceso a la base (o a una copia de respaldo filtrada) podía leer la
contraseña de todos los usuarios. Ese es el riesgo más grave del
proyecto y lo primero que se atacó.

## 2. La solución

- **bcryptjs**: se guarda solo un hash de la contraseña (código que no
  se puede revertir), con costo de trabajo 10.
- **Columna nueva `users.password_hash`** (migración 013). La columna
  vieja `password` se conserva durante la transición y se borra recién
  en la migración 014.
- **Módulo `api/_password.js`**: funciones puras (`hashContrasena`,
  `verificarHash`, `verificarContrasenaYMigrar`) + clase
  `PasswordService` que usan los handlers.

### 2.1 Qué hace cada operación

- **Registro**: guarda SOLO el hash. El texto plano nunca se escribe en
  la base.
- **Login**: busca al usuario por nombre y verifica:
  1. Si tiene `password_hash` → compara con bcrypt.
  2. Si todavía tiene texto plano (usuario viejo) → compara el texto;
     si coincide, pica la contraseña, guarda el hash y borra el texto
     plano **en la misma operación** (migración perezosa).
- **Cambio de contraseña**: verifica la actual (con migración incluida
  si hace falta) y guarda solo el hash de la nueva.
- **Borrado de cuenta**: verifica la contraseña antes de borrar
  (las FK con `ON DELETE CASCADE` limpian el resto; `likes` se borra a
  mano porque no tiene FK).

### 2.2 Por qué no se puede "perder" una contraseña

El borrado del texto plano y el guardado del hash ocurren en una única
instrucción SQL (`SET password_hash = ..., password = NULL`), y el hash
se genera a partir de la misma contraseña. No existe un estado
intermedio en el que el texto desaparezca sin que el hash quede
guardado y funcione.

## 3. Backfill (`scripts/migrar-passwords.js`)

La migración perezosa cubre a los usuarios que vuelven a entrar. El
backfill cubre al resto (los que nunca más entran), picando todas las
contraseñas en texto plano de una vez.

### 3.1 Alcance

Solo toca las columnas `password` / `password_hash` de la tabla
`users`. No borra usuarios ni modifica ninguna otra tabla. Es seguro
de re-ejecutar.

### 3.2 Protecciones (a propósito)

- **`--local`** → corre contra la maqueta PGlite (crea usuarios de
  prueba). Sin riesgo.
- **`--produccion`** → obligatorio para tocar la base real. Sin esa
  bandera, el script se niega a correr.
- **Confirmación escrita**: con `--produccion`, pide tipear "SI"
  antes de tocar nada; si no se tipea, cancela.
- **`--simular`** → solo muestra qué haría, no cambia nada.
- **Chequeo de migración**: con `--produccion` verifica que la
  columna `password_hash` exista (migración 013 aplicada); si no, se
  detiene sin cambios.

### 3.3 Uso

```bash
# Ver qué haría, contra la maqueta local:
node scripts/migrar-passwords.js --local --simular

# Ejecutar contra la maqueta local:
node scripts/migrar-passwords.js --local

# Ver qué haría contra la base real:
DATABASE_URL="postgres://..." node scripts/migrar-passwords.js --produccion --simular

# Ejecutar contra la base real (pedirá confirmación):
DATABASE_URL="postgres://..." node scripts/migrar-passwords.js --produccion
```

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

## 5. Plan de activación en producción

Orden estricto:

1. Aplicar la migración 013 (agrega `users.password_hash`).
2. Desplegar el código nuevo (incluye `api/_db.js`, `api/_password.js`,
   `api/auth.js`, `api/users.js`, `api/_pusher.js`).
3. Verificar: registrar un usuario de prueba y entrar con un usuario
   existente (se migra solo).
4. Correr el backfill con `--produccion` (los que nunca entran).
5. Verificar que no quede texto plano:
   `SELECT COUNT(*) FROM users WHERE password IS NOT NULL;` → debe dar 0.
6. Tras un período de gracia: aplicar la migración 014 (borrar
   `users.password`) y quitar la rama de comparación legacy de
   `api/_password.js`.

Si se despliega el código sin aplicar primero la 013, el registro y el
login fallan (la columna `password_hash` no existe). Por eso el orden
importa: migración primero, código después.

## 6. Deudas de seguridad conocidas (fuera de este alcance)

El trabajo actual solo cubre el hash de contraseñas. La API todavía:

- Confía en el `username` del cuerpo de la petición (no hay sesiones ni
  tokens reales; cualquiera puede actuar como otro usuario).
- No verifica permisos de moderación en varios endpoints
  (`suspend`/`reactivate`, asignación de insignias, resolución de
  reportes, etc.).
- No tiene rate limiting en login/registro.
- El frontend escapa parcialmente el contenido generado por usuarios
  (posible XSS en chat/comentarios).

Estos puntos son candidatos naturales para las próximas iteraciones.
