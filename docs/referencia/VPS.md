# VPS — el servidor de producción

> **De qué trata:** cómo está montado el sitio en su servidor propio y cómo se opera: la máquina, lo
> instalado, la configuración y los secretos, los respaldos, el cron, el dominio, la seguridad y el
> rendimiento.
>
> **Para quién:** quien opera el servidor, y el equipo de desarrollo cuando un cambio lo toca.
>
> **Revisado:** 05/10/2026

Cómo se llegó aquí desde Vercel y Neon lo cuenta [LA MUDANZA AL VPS](../historia/MUDANZA-AL-VPS.md),
y cómo se despliega un cambio, [DESPLEGAR](../guias/DESPLEGAR.md).

---

## 1. La máquina

| | |
|---|---|
| Dirección | `macroreborn.com` (y `www`), que apuntan a la máquina. La IP está en Bitwarden, y `git remote -v` la enseña en el remoto `vps` |
| Usuario SSH | `azureuser` (con la llave `~/.ssh/macroreborn-vps-key`, ed25519 desde el 19/09/2026) |
| OS | Ubuntu 24.04.4 LTS |
| Arquitectura | **ARM64 (aarch64)** |
| Recursos | 2 vCPU, 950 MB de RAM, 55 GB libres en disco (05/10/2026) |
| Ruta del proyecto | `/home/azureuser/MacroReborn` |

La arquitectura ARM importa al instalar cosas nuevas: hay que elegir
paquetes `arm64`, no `amd64`. Node, Postgres y nginx tienen paquetes
ARM nativos en Ubuntu, así que no hubo que compilar nada.

Los 950 MB de RAM son el recurso escaso. Por eso hay **2 GB de swap**
en `/swapfile` (activado en `/etc/fstab`) y el pool de conexiones a
Postgres está limitado a 10. Sin swap, Node y Postgres juntos pueden
hacer que el kernel mate procesos bajo carga.

## 2. Piezas instaladas

```
navegador -> nginx (:443 HTTPS) -> node cluster.js, dos procesos (:3000) -> postgres (:5432, local)
             (:80 redirige a :443)
```

- **PostgreSQL 16**: base `macroreborn`, rol `macroreborn`. Solo
  escucha en `127.0.0.1`, no está expuesto a internet. El cliente `psql`
  es el 18, que se instaló para volcar la base de Neon.
- **Node 20.20.2** corriendo `cluster.js` bajo systemd (ver
  [el modo cluster](#modo-cluster)).
- **nginx** como proxy inverso.
- **ufw**: solo 22, 80 y 443 abiertos.

## 3. Cómo habla el código con la base

`api/_db.js` elige el driver por la `DATABASE_URL`, y `api/_pg.js` habla con el Postgres de esta
máquina sin que los handlers cambien su forma de escribir las consultas. Lo cuenta entero
[ARQUITECTURA](ARQUITECTURA.md#cómo-se-conectan), y cómo era antes de la mudanza,
[LA MUDANZA AL VPS](../historia/MUDANZA-AL-VPS.md).

## 4. Configuración y secretos

`/home/azureuser/MacroReborn/.env` (permisos `600`, **no está en git**):

```
DATABASE_URL=postgresql://macroreborn:<contraseña>@127.0.0.1:5432/macroreborn
PORT=3000
SESSION_SECRET=<secreto>
CRON_SECRET=<secreto>
```

La contraseña de Postgres y el `SESSION_SECRET` se generaron **en el
servidor** con `openssl rand`. Las dos se rotaron el 2 de septiembre de
2026 porque el archivo estuvo sirviéndose por HTTP (lo cuenta
[LA FUGA DEL .ENV](../historia/FUGA-DEL-ENV.md)); las actuales nunca han
salido de la máquina. `CRON_SECRET` es la llave con la que el cron
semanal le pide al sitio que recalcule el ranking (ver
[el cron semanal](#6-el-cron-semanal)).

Los avisos en vivo no necesitan nada aquí: van por Server-Sent Events
desde esta misma máquina ([AVISOS](AVISOS.md)).

### Cómo se carga el `.env`

`server.js` lee el `.env` del proyecto antes de cualquier otro `require`, porque
los handlers resuelven su conexión al importarse. Se hace a mano en
vez de con `dotenv` para no sumar una dependencia por diez líneas. Lo
que ya venga del entorno tiene prioridad sobre el archivo.

## 5. Operación

```bash
sudo systemctl status macroreborn     # ver estado
sudo systemctl restart macroreborn    # reiniciar tras un cambio
journalctl -u macroreborn -f          # ver logs en vivo
journalctl -u macroreborn -n 100      # ultimos 100
```

El servicio tiene `Restart=always`, así que si el proceso muere systemd
lo levanta a los 5 segundos. Está `enabled`: arranca solo al reiniciar
la máquina.

### Desplegar un cambio

Lo explica entero [DESPLEGAR](../guias/DESPLEGAR.md): las migraciones primero, `git push vps main`
desde el PC (el servidor se actualiza solo), el reinicio y la comprobación.

### Base de datos

```bash
cd ~/MacroReborn && set -a && source .env && set +a
psql "$DATABASE_URL"                       # consola
psql "$DATABASE_URL" -f migrations/0XX.sql # aplicar una migracion
```

Consultar la base de producción es solo en modo lectura (regla XX de la constitución), con
`PGOPTIONS="-c default_transaction_read_only=on"`.

### Respaldos

`~/respaldar.sh` corre todas las noches a las 3:30 por crontab, deja un
`.sql.gz` en `~/respaldos/diarios/` y borra los de más de 14 días. Ahí
mismo quedan los que se lanzan a mano con el script, con su hora en el
nombre, y se borran igual. Copia del script en `infra/scripts/respaldar.sh`.

Fuera de esa limpieza, en `~/respaldos/`, quedan las copias guardadas a propósito, que no se borran
nunca solas. Al 05/10/2026: las de antes de una operación delicada (`antes-de-...sql.gz`, la última
del 04/10/2026), los volcados de Neon de la mudanza, del 01/09/2026, que llevan contraseñas en claro
([CUENTAS](CUENTAS.md#lo-que-queda)), los originales del arte del 21/09/2026 y dos copias del
repositorio (`.bundle`) del 15/09/2026, de antes y después de limpiar su historia.

```bash
~/respaldar.sh                      # lanzar uno a mano
ls -lh ~/respaldos/diarios/         # ver los que hay
cat ~/respaldos/respaldo.log        # historial del cron
```

Para restaurar uno:

```bash
cd ~/MacroReborn && set -a && source .env && set +a
gunzip -c ~/respaldos/diarios/macroreborn-FECHA.sql.gz | psql "$DATABASE_URL"
```

Ahora los datos viven en una sola máquina, sin la red de seguridad que
daba un servicio administrado, así que estas copias son la única vuelta
atrás. Conviene bajar una a otro lado de vez en cuando: un respaldo que
solo existe en el servidor que respalda no protege de perder el servidor.
`npm run db:traer` baja uno de paso
([DESARROLLO](../guias/DESARROLLO.md#probar-contra-los-datos-de-verdad)).

## 6. El cron semanal

Los lunes a las 8 se recalcula el ranking. Lo hacía un cron de Vercel;
aquí es una entrada del crontab de `azureuser` que llama a
`~/recalcular-ranking.sh` (copia en `infra/scripts/recalcular-ranking.sh`).
El script pide `/api/system?action=recalcular-ranking` al propio sitio,
con el `CRON_SECRET` del `.env`, y apunta el resultado:

```
0 8 * * 1 /home/azureuser/recalcular-ranking.sh >> /home/azureuser/ranking-cron.log 2>&1
```

El crontab entero, con la línea de los respaldos, está en `infra/scripts/crontab.txt`.

## 7. Dominio y HTTPS

El sitio vive en **https://macroreborn.com** (y `www`), con el dominio
comprado en IONOS.

En la zona DNS de IONOS hay dos registros A, `@` y `www`, apuntando a la
IP del VPS. Lo demás que aparece ahí (`MX`, el `TXT` de SPF, los
`CNAME` de DKIM/DMARC) es del correo y no se toca. No hay registros
AAAA a propósito: el VPS solo tiene IPv4, y un AAAA suelto mandaría a
los visitantes con IPv6 a la página aparcada de IONOS — un fallo que se
manifiesta como "a unos les carga y a otros no".

El certificado es de Let's Encrypt, emitido con certbot para ambos
nombres, y `certbot.timer` lo renueva solo (comprobado con
`certbot renew --dry-run`; el 05/10/2026 vencía el 30/11/2026). nginx
redirige todo el tráfico HTTP a HTTPS con un 301. Las copias de la
configuración de nginx de antes de cada cambio grande se guardan en
`/etc/nginx/respaldos/`, nunca dentro de `sites-enabled/`, donde nginx
las cargaría como un segundo sitio.

Si hay que rehacer el certificado:

```bash
sudo certbot --nginx -d macroreborn.com -d www.macroreborn.com
sudo certbot certificates      # ver los que hay y cuando vencen
```

## 8. Seguridad y rendimiento

Vercel absorbía parte de esto por su cuenta. En un VPS hay que ponerlo,
porque el servidor está expuesto directamente a internet. A las pocas
horas de existir el dominio ya aparecieron escáneres automáticos
(`l9scan` y varias IPs de centros de datos): rastrean los registros de
certificados nuevos y llegan solos, sin que nadie comparta el enlace.

La configuración de nginx y de fail2ban tiene su copia en `infra/`, con la IP del administrador
cambiada por el marcador `TU.IP.AQUI`; el 05/10/2026 coincidía con el servidor directiva a directiva.

### La lista blanca de estáticos

`server.js` solo entrega lo que pasa `esPublico()`: los tipos de archivo que un navegador necesita,
por **lista blanca de extensión**, y nunca nada de las carpetas privadas (`api/`, `scripts/`, `docs/`,
`migrations/`...) ni lo que empieza por punto; nginx repite reglas equivalentes. Una lista negra de
rutas se queda corta en cuanto alguien añade un archivo nuevo al proyecto, y así se estuvo sirviendo
el `.env` hasta el 2/09/2026 (lo cuenta [LA FUGA DEL .ENV](../historia/FUGA-DEL-ENV.md)).

Si algún día se cambia esa función, la comprobación rápida es:

```bash
for R in /.env /.git/config /package.json /server.js; do
  curl -s -o /dev/null -w "%{http_code} $R\n" https://macroreborn.com$R
done   # las cuatro deben dar 404
```

### fail2ban, apagado

**Está parado y deshabilitado desde el 17/09/2026, por decisión de Luis**: estaba baneando a un
administrador del sitio, porque el propio sitio mandaba ráfagas de peticiones que acababan en 429. El
18/09 se midieron tres causas; la principal, que el XP y los minutos se contaban por petición, es el
punto 18 de [la auditoría](../listas/AUDITORIA.md), arreglado el 25/09/2026. Volver a encenderlo lo
decide Luis:

```bash
sudo systemctl enable --now fail2ban
```

Lo que hay que saber si se enciende. Tiene seis cárceles en `/etc/fail2ban/jail.local` (copia en
`infra/fail2ban/`): `sshd`, `nginx-http-auth`, `nginx-botsearch`, `nginx-bad-request`,
`nginx-limite` (caza a quien acumula respuestas 429) y **`nginx-hostil`**, que es la que de verdad
detecta los escaneos.

Dos cosas que hubo que arreglar, y que conviene conocer porque las dos
fallaban en silencio:

1. **El backend va en cada cárcel, no en `[DEFAULT]`.** Con
   `backend = systemd` heredado, las cárceles de nginx ignoran su
   `logpath` y no vigilan nada. Se ve con
   `fail2ban-client get <cárcel> logpath`: si dice *"No file is currently
   monitored"*, esa cárcel no está haciendo nada. En `sshd` **sí** es
   correcto que lo diga: esa lee del journal.

2. **Los filtros de serie no cazan lo que nos llega.**
   `nginx-bad-request` solo cuenta respuestas `400`, y la lista de rutas
   de `nginx-botsearch` no incluye ninguna de las que nos pidieron de
   verdad (`.env`, `.git/config`, `/v2/_catalog`, `/actuator/env`,
   `/telescope/requests`). Medido con `fail2ban-regex` sobre el log real:
   de las 64 peticiones de un escaneo, entre los dos cazaban **2**. Por
   eso existe `filter.d/nginx-hostil.conf`, con las rutas reales; caza
   27 rutas distintas y ningún archivo legítimo del sitio.

Antes de dar por buena una cárcel nueva, conviene medirla contra el log
de verdad — que es lo que delató a las otras dos:

```bash
sudo fail2ban-regex /var/log/nginx/access.log \
     /etc/fail2ban/filter.d/nginx-hostil.conf
```

La IP del administrador está en `ignoreip` para no quedarse fuera por
error. **Si esa IP cambia, hay que actualizarla** antes de encenderlo, o
un descuido puede dejar sin acceso SSH.

```bash
sudo fail2ban-client status              # carceles activas
sudo fail2ban-client status sshd         # bloqueados en una carcel
sudo fail2ban-client set sshd unbanip X  # desbloquear a alguien
```

### Límites de peticiones

En `/etc/nginx/conf.d/macroreborn-limites.conf` (copia en `infra/nginx/`) y aplicados en el sitio:

| Zona | Límite | Para qué |
|---|---|---|
| `general` | 30/s por IP, ráfaga 60 (20 en `/api/avisos`) | Navegación normal (una visita son 12-15 peticiones) |
| `login` | 5/min por IP | Fuerza bruta sobre `/api/auth` |
| `estaticos` | 200/s por IP, ráfaga 600 | Los `.css`, `.js` e imágenes, que una página pide de golpe |
| `porip` | 40 conexiones (100 en los estáticos) | Agotamiento de conexiones |

Devuelven `429`, no el `503` por defecto: es lo que un cliente bien
hecho entiende como "vas demasiado rápido".

Detalle importante: **la app responde `200` con `success:false` a un
login fallido**, no `401`. Por eso fail2ban no puede distinguir los
intentos fallidos leyendo el log, y la barrera real contra la fuerza
bruta es el límite de nginx. Si algún día se cambia a `401`, se puede
añadir una cárcel que los cuente directamente.

### Caché del navegador: `immutable` es una promesa que no se retira

Los estáticos se servían todos con `Cache-Control: public, max-age=2592000,
immutable`. `immutable` le dice al navegador que **ni siquiera pregunte**: no
hace una petición condicional, usa lo que tiene y punto. Para una imagen que
no se edita en sitio está bien. Para el código del navegador fue un error, y
costó un fallo en producción.

**Qué pasó (14 de septiembre de 2026).** El HTML no está cacheado y el JS sí,
durante 30 días. Al desplegar el editor de avatares dinámico, quien había
visitado el sitio en las semanas anteriores recibió el `perfil.html` nuevo —que
ya no trae los divs del catálogo— junto con el `perfil.js` viejo, que espera
encontrarlos. El editor le salía vacío.

**Cómo se reconoció.** En la consola de un navegador afectado, los errores
apuntaban a líneas de `ranking.js` que en el código actual ya no existen. Si una
traza señala líneas que no se corresponden con el archivo desplegado, lo que
corre es código cacheado, no el que está en el servidor.

**Lo que hay ahora, en dos capas:**

1. `server.js` manda `ETag` y `Last-Modified` en los estáticos, y contesta `304`
   sin leer el disco si el navegador ya tiene esa versión. nginx sirve `.js` y
   `.css` con `max-age=300, must-revalidate`: fresco cinco minutos, luego se
   pregunta, y la pregunta se contesta con una respuesta vacía. Un despliegue
   llega a todo el mundo en cinco minutos.
2. Los HTML piden scripts y hojas con `?v=<fecha>`. Empezó el 14/09/2026 para
   escapar de las entradas `immutable` que ya estaban guardadas en los
   navegadores, que es lo único que una entrada así permite hacer —cambiar la
   URL—. No hace falta tocarlo en cada despliegue, porque la capa 1 se encarga;
   se sube cuando un cambio en un archivo no puede convivir esos cinco minutos
   con la versión vieja de otro, como la barra nueva del 03/10/2026. Por eso
   hoy conviven varias fechas, una por archivo: la de cada uno se sube en
   todas las páginas que lo piden. `tests/versiones.test.js` lo vigila, y así
   salta también una página que se quedó atrás por una copia vieja, como la
   de Comunidad del 06/10/2026 (la
   [spec 002](../../specs/002-fundir-arreglo-barra/spec.md)).

**La regla.** `immutable` solo en URLs que lleven la huella de su contenido,
como las de los avatares compuestos con su `?v=<huella>`: ahí no hay nada que
invalidar, porque si el contenido cambia la URL cambia sola. Todo lo que se
edite en sitio —el código del navegador— tiene que revalidar.

### Cabeceras de seguridad

`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y
`Strict-Transport-Security`, más `server_tokens off` para no anunciar la
versión de nginx. Un `add_header` dentro de un `location` cancela los del
`server`, así que los bloques que ponen los suyos repiten las cuatro.

### Compresión de las respuestas JSON

`gzip` estaba activo pero solo cubría HTML: faltaba `gzip_types`, así que
cada `/api/users` enviaba 1,38 MB sin comprimir. Ahora cubre también el JSON,
el CSS y el JavaScript.

### Modo cluster

`cluster.js` arranca un proceso por núcleo (máximo 2) y systemd lanza ese
en vez de `server.js`. Antes un único proceso usaba un solo núcleo y se
veía al 90% de CPU con el otro ocioso.

Es seguro porque **lo que la app guarda en memoria entre peticiones se
sabe repartido entre procesos**: las sesiones son pases firmados, que no
guardan nada en el servidor; los frenos (las ráfagas de `api/_rafaga.js`,
las composiciones de avatar y la vista previa) cuentan cada uno en su
proceso, y con dos el techo real es el doble, a sabiendas; y las
sanciones en pie se recargan cada 30 segundos y, al cambiar una, se avisa
a los demás procesos. Los avisos en vivo cruzan los procesos con
`LISTEN`/`NOTIFY` de Postgres ([AVISOS](AVISOS.md)). Lo nuevo que guarde
estado en memoria tiene que resolver lo mismo, o cada proceso tendrá su
propia copia.

Para volver atrás: cambiar `ExecStart` a `server.js` (queda copia en
`/etc/systemd/system/macroreborn.service.antes-cluster`) y `daemon-reload`.

### Medidas

Del 02/09/2026, con 63 usuarios:

| | 1 proceso | 2 procesos |
|---|---|---|
| Portada | 6022 pet/s | **8401 pet/s** |
| `/api/users` | 52 pet/s | **68 pet/s** |

Por HTTPS y contra la red real, la portada daba ~800-1200 pet/s, que son
varios miles de usuarios simultáneos.

El cuello de botella era `/api/users`: 34 veces más lento que el resto.
No por la base de datos —esa consulta tardaba **0,064 ms**—, sino porque
la columna `avatar` ocupaba **1340 kB de los 1382 kB** de la respuesta:
se enviaban los avatares completos de todos los usuarios en cada llamada,
y Node se iba al 90% de CPU serializando. Eso ya no pasa: el 05/10/2026
`/api/users` pesaba 169 kB.

### La base y la memoria

La base ocupaba 127 MB el 21/09/2026 y cabía entera en `shared_buffers`
(128 MB), la memoria que Postgres reserva para leer rápido. El 05/10/2026
ocupa 179 MB y ya no cabe, aunque el 99,99 % de las lecturas siguen
saliendo de memoria: 140 de esos 179 MB son las dos tablas que guardan
mucho más de lo que se lee, `activity_log` (62 MB) y `originales_scores`
(78 MB), el punto 68 de [la auditoría](../listas/AUDITORIA.md). Si el
sitio se notara lento al leer, es lo primero que mirar.

## 9. Lo que falta

1. **Rotar la contraseña de Neon**, que se compartió por chat durante
   la migración. (La del VPS ya está rotada: lo cuenta
   [LA FUGA DEL .ENV](../historia/FUGA-DEL-ENV.md).)

2. **Dar de baja Neon** cuando el VPS lleve un tiempo estable. Conviene
   conservar el snapshot hasta entonces. Después se puede quitar
   `@neondatabase/serverless` de `package.json` y la rama de Neon de
   `_db.js`.

3. **Decidir si se vuelve a encender fail2ban**, ahora que su causa
   principal, el punto 18 de la auditoría, está arreglada (ver
   [fail2ban, apagado](#fail2ban-apagado)).

### Resuelto

- **Las variables de Pusher** en `.env`, para que volvieran los avisos en
  tiempo real. No se pusieron, y ya no hacen falta: los avisos dejaron de
  necesitar un tercero. Se sostienen desde esta misma máquina con
  Server-Sent Events, y el paquete `pusher` salió de `package.json`. El
  porqué entero está en [AVISOS](AVISOS.md). **(16/09/2026)**

- **Publicar los cambios en git.** El código de la migración estaba en el
  VPS y en el PC, pero sin commit. Ya está publicado. **(16/09/2026)**

- **Borrar `vercel.json`.** Ya no está en el repositorio. **(comprobado el 05/10/2026)**

(Esta lista llegó a estar numerada 1, 4, 5, 6: se habían borrado dos
puntos sin renumerar el resto, así que no había forma de saber si se
habían hecho o se habían perdido. Si se quita uno, que se quite entero o
que baje a «Resuelto».)
