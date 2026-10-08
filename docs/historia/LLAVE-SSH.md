# LA LLAVE SSH — las dos veces que se perdió, y lo que se hizo el 19/09/2026

> **De qué trata:** cómo se perdió dos veces en septiembre de 2026 la llave para entrar al servidor,
> la lección que dejó, y lo que se cambió el 19/09/2026: la llave nueva y la vieja fuera, también la
> de root.
>
> **Para quién:** Luis, y quien vaya a guardar o cambiar las llaves del servidor.
>
> **Revisado:** 05/10/2026

Salió el 05/10/2026, entera, de la guía para retomar el trabajo tras formatear el PC, que se quedó
con los pasos para recuperar el acceso: [RETOMAR](../guias/RETOMAR.md).

---

## Las dos veces que se perdió

**Septiembre de 2026:** se formateó el PC sin nada en local. Se
reconstruyó desde Drive.

**19 de septiembre de 2026:** se volvió a formatear. Esta vez la copia
del proyecto sí viajó a Drive y **sobrevivió todo** —código, git,
memorias, conversaciones—, pero la llave no estaba dentro del proyecto:
vivía en `G:\Mi unidad\02_Proyectos_Software\Proyectos de código\Oracle
Cloud - MacroReborn\`, y al reorganizar Drive esa carpeta desapareció.
Búsqueda exhaustiva de todo Drive y de `C:`, `D:`, `E:` y `F:`: **cero
archivos `.pem`**.

Las dos veces el fallo fue el mismo, y la lección es una sola: **lo que
viaja bien es lo que está DENTRO de la carpeta que se copia.** Lo que
está fuera se pierde aunque esté anotado, porque la anotación envejece
antes que el olvido.

---

## Lo que se hizo el 19/09/2026

Clave activa, la única que entra:

```
SHA256:NtNfiLpBLPf+zKj2oJbGsM5KbkJsjKNROogkcLG8Lr8   ed25519   macroreborn-vps-2026-09-19
```

Se quitó la anterior (`SHA256:xUnZ0B9e4opNR0nBIbcGM4uzpfG8ZNKe+9wcVPF4EwU`,
RSA 3072, comentario `generated-by-azure`) de **dos** sitios, no de uno:
estaba autorizada para `azureuser` **y también para `root`**, y como
`PermitRootLogin` está en `without-password`, quien tuviera ese `.pem`
entraba directamente como root. El `authorized_keys` de root quedó
vacío, así que ya no hay ninguna vía de acceso como root por SSH
(`PasswordAuthentication` está en `no`). Se administra con `sudo` desde
`azureuser`, como siempre.

Quedan copias de los dos archivos originales en el servidor, por si
acaso: `~/.ssh/authorized_keys.antes-limpieza-2026-09-19` y
`/root/.ssh/authorized_keys.antes-limpieza-2026-09-19`.
