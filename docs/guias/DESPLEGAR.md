# DESPLEGAR — cómo se pone en producción un cambio

> **De qué trata:** los pasos para llevar un cambio de `main` al servidor, en orden: las migraciones,
> el código, el reinicio, la comprobación en la web real y cómo se deshace.
>
> **Para quién:** quien despliega, siempre con el OK de Luis (regla XXI de la constitución).
>
> **Revisado:** 05/10/2026

Se despliega desde `main` ya verificado, nunca desde una rama, y solo con el OK de Luis. Hace falta la
llave del servidor, `~/.ssh/macroreborn-vps-key`; dónde se guarda y cómo se recupera si se pierde lo
cuenta [RETOMAR](RETOMAR.md).

---

## 1. Las migraciones, primero

Si el cambio trae migraciones nuevas (`migrations/`), se aplican antes que el código que las usa: el
código nuevo escribe en columnas que hasta entonces no existen. Antes de tocar datos reales hay
respaldo completo y ensayo con ROLLBACK (regla XX). Cómo se abre la base en el servidor:
[VPS, la base de datos](../referencia/VPS.md#base-de-datos).

## 2. Subir el código

```bash
GIT_SSH_COMMAND='ssh -i ~/.ssh/macroreborn-vps-key' git push vps main
```

El remoto `vps` es el repositorio del servidor (`git remote -v` enseña su dirección). Tiene
`receive.denyCurrentBranch=updateInstead`, así que el push actualiza solo la copia de trabajo de
`~/MacroReborn`: no hace falta entrar a hacer `git pull`. Si cambió `package-lock.json`, además:

```bash
ssh -i ~/.ssh/macroreborn-vps-key azureuser@macroreborn.com "cd ~/MacroReborn && npm install --omit=dev"
```

## 3. Reiniciar el servicio

```bash
ssh -i ~/.ssh/macroreborn-vps-key azureuser@macroreborn.com "sudo -n systemctl restart macroreborn"
```

`azureuser` usa `sudo` sin contraseña, y `-n` hace que no se quede esperando una si algún día
cambiara.

## 4. Comprobar en la web real

Que el cambio está y que nada se rompió. Lo mínimo:

```bash
for R in / /comunidad-ranking.html; do curl -s -o /dev/null -w "%{http_code} $R\n" https://macroreborn.com$R; done
for R in /.env /.git/config /server.js; do curl -s -o /dev/null -w "%{http_code} $R\n" https://macroreborn.com$R; done   # las tres deben dar 404
curl -s -o /dev/null -w "%{http_code} URI mal formada\n" 'https://macroreborn.com/%C0%80'                                 # debe dar 400
```

Y lo propio del cambio, mejor por la API pública: por ejemplo,
`https://macroreborn.com/api/users?ligero=1&username=<nombre>` para algo de las cuentas. Si algo
falla, los registros del servicio: `journalctl -u macroreborn -n 100`.

## 5. Deshacer

Volver al commit anterior y reiniciar:

```bash
ssh -i ~/.ssh/macroreborn-vps-key azureuser@macroreborn.com "cd ~/MacroReborn && git reset --hard <commit anterior> && sudo -n systemctl restart macroreborn"
```

Lo que una migración cambió en la base no vuelve atrás con el código: deshacerlo es otra migración,
con su respaldo y su ensayo, como la primera (reglas XVII y XX).
