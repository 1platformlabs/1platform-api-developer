# Canal de deploy a cPanel — developer.1platform.pro

Este sitio se despliega a la cuenta cPanel compartida **`mascehgw`** en
`business138.web-hosting.com` (origen `66.29.132.45`), la misma donde ya viven
`1platform.pro`, `app.1platform.pro`, `bowerfans.com` y `adclicker.com`.

Antes del **2026-07-31** se desplegaba con `rsync -e ssh` contra `65.109.101.46`
(Hetzner + WHM). Ese box tiene 55 cuentas y 168 dominios y se está vaciando;
`developer.1platform.pro` salió de ahí ese día.

## Por qué un zip por FTPS y no rsync

**La cuenta compartida no tiene SSH.** El único shell que se consigue es el que
da `cron`. De ahí sale toda la forma del canal:

```
CI  ──FTPS──►  .deploy/incoming/{app.zip, app.zip.sha256, latest.json}
                     │
                cron */5  ──►  activate.sh
                     │
                     ├─ verifica sha256 del zip
                     ├─ extrae a  .deploy/releases/<version>/public
                     ├─ verifica el árbol contra MANIFEST.sha256
                     ├─ re-apunta  ../public  (symlink)  ← swap atómico
                     └─ health check + poda (deja 1 release previo)
```

## El canal es checksum-gated de punta a punta, y no es decorativo

Medido el **2026-07-31** migrando `psicoguia.org` a esta misma cuenta: **FTPS
contra este host trunca subidas grandes de forma no determinista** — el cliente
reporta el tamaño completo, el servidor cierra con `451` y el archivo queda
corto, en offsets distintos en cada intento. Partirlo en trozos no lo arregla.

Por eso `activate.sh` verifica el `sha256` **antes** de extraer y el
`MANIFEST.sha256` **después**: un zip truncado no activa nada, se queda el
release anterior sirviendo. Una subida rota no puede publicar un sitio roto.

## Un job verde NO significa que el release esté vivo

La activación la hace un cron, minutos después de que CI termina. El paso
`Verify the release actually activated` es lo que lo prueba: consulta la home
hasta que el `sha256` del documento servido coincida con el `index_sha` del
bundle, y además exige que la respuesta traiga `x-turbo-charged-by: litespeed`
(o sea, que salió del origen cPanel y no de otro lado).

El health check anterior —esperar un `200` en la home— **no distinguía el build
nuevo del viejo**: habría dado verde sirviendo todavía la versión anterior.

## El contrato de servido vive en `htaccess/docs.htaccess`

El origen viejo **no tenía `.htaccess` propio** y heredaba el de WordPress de su
directorio padre (`public_html/`, de la landing que ya migró y se llevó su
`index.php`). Medido antes de migrar:

| Ruta | Origen viejo | Acá |
|---|---|---|
| `/no-existe` | **500** (`RewriteRule . /index.php` sobre un `index.php` ausente) | **404** con la 404 de Docusaurus |
| `/img/`, `/openapi/`, `/api-reference/` | **200** con el listado de directorio de Apache | **404** |

No se replicó el defecto a propósito. Copiar bit-a-bit habría shipeado un 500 en
cada URL tipeada mal y un índice navegable de los assets.

## `assemble.sh` y su guard que se disparaba solo

`assemble.sh` falla el build si el `.htaccess` fuerza HTTPS, porque bajo el modo
SSL de esta zona Cloudflare habla HTTP con el origen y un redirect a `https://`
sería un bucle infinito.

⚠️ Ese guard **descarta las líneas de comentario antes de buscar**. Sin ese
filtro se dispara contra su propia documentación: alcanza con que el `.htaccess`
explique «no pongas un `RewriteRule ... https://`» para que el build falle para
siempre. Pasó al escribir este canal, el 2026-07-31. **La copia de
`1platform-website/deploy/cpanel/assemble.sh` todavía tiene el guard sin el
filtro** — está latente ahí hasta que alguien documente la regla dentro del
archivo.

## `activate.sh` tiene gemelos

Este archivo es, a propósito, idéntico en lógica ejecutable a
`1platform-website/deploy/cpanel/activate.sh` y
`1platform-dashboard/deploy/cpanel/activate.sh`. Un arreglo en uno que no se
porte a los otros deja el defecto **latente** en los que no se tocaron.

```bash
diff <(grep -vE '^\s*#|^\s*$' deploy/cpanel/activate.sh) \
     <(grep -vE '^\s*#|^\s*$' ../1platform-website/deploy/cpanel/activate.sh)
```

## Secrets (environment `PROD`)

| Secret | Para qué |
|---|---|
| `CPANEL_FTP_HOST` | `business138.web-hosting.com` — el **host de origen**, nunca `developer.1platform.pro`: FTP no atraviesa Cloudflare |
| `CPANEL_FTP_USER` | cuenta FTP chrooteada al docroot del canal |
| `CPANEL_FTP_PASS` | su password |

Los tres se leen juntos: si están los tres, publica; si no está ninguno, saltea
con un `notice` y deja el bundle como artifact; si están **algunos**, falla — no
se sube medio canal ni se reporta éxito sobre él.

`HETZNER_SSH_KEY`, `HETZNER_HOST`, `HETZNER_USER`, `HETZNER_PORT` y
`HETZNER_DEPLOY_PATH` quedaron **sin uso** al migrar. No se borraron desde acá
porque son secrets del entorno y pueden estar compartidos; conviene retirarlos
cuando se decomise el box.

## Rollback

`activate.sh` retiene el release anterior. Para volver, apuntar el symlink a
mano vía la API de cPanel o publicar de nuevo el bundle previo (queda como
artifact `cpanel-bundle-prod` durante 14 días).
