# Canal cPanel — QA activo y fallback de producción

El canal **activo de producción** desde el 14 de agosto de 2026 es
`deploy_hetzner` en `prod.yml`: imagen `nginx:1.27-alpine`, configuración
`deploy/docker/nginx.conf` y healthcheck de `docker-compose.prod.yml`. El job
cPanel de producción conserva `if: false`. No habilitarlo para esta épica.
QA sí utiliza este canal cPanel en `developer-qa.1platform.pro`.

El fallback histórico de producción apunta a la cuenta compartida **`mascehgw`** en
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
`Verify the release actually activated` consulta `/index.html`, cuyos bytes
ensambla y firma el bundle. La raíz pública conserva su redirección HTTP 301 a
Primeros pasos. `verify-release.mjs` exige que el `sha256` servido coincida con
`index_sha`, HTTP 200 y `x-turbo-charged-by: litespeed`, además de una lectura
FTPS privada: `.deployed_version` debe coincidir exactamente con la versión del
bundle y `.failed_version` debe ser distinta. Una coincidencia durante el swap
no basta. Sin acceso al estado privado, el probe exige 130 s consecutivos: los
seis curls de hasta 15 s y seis pausas de 5 s permiten un rollback a los 120 s.
El test de rollback a 90 s impide reintroducir la ventana insuficiente de 45 s.

El health check anterior —esperar un `200` en la home— **no distinguía el build
nuevo del viejo**: habría dado verde sirviendo todavía la versión anterior.

### Salud de QA tras la redirección de la raíz

`qa-health-config.sh` descarga `.health_url`, `.health_marker`, `.failed_version`
y el log del activador a temporales privados del runner, sin publicarlos como
artifacts ni imprimir sus contenidos. `health_config.py` sólo permite migrar
el docroot de `developer-qa.1platform.pro` cuando confirma la raíz configurada,
la regla HTTP 301 hacia la guía en el bundle y un rollback 301 de la versión en
cuarentena en su log. No exige que la raíz revertida conserve el redirect de la
versión fallida. Cambia la salud a `/index.html`, preservando el marker si todavía figura
en el build; si el título anterior quedó obsoleto, utiliza el canonical exacto
del portal. Conserva la exigencia de HTTP 200 + marker del activador.

El diagnóstico demostró que el archivo migrado era válido y el activador remoto
idéntico al original, pero seguía fallando con 301. `activate-docs.sh` es un
adaptador **exclusivo de QA** que hace efectiva la configuración de ese docroot
ante overrides heredados del cron. Valida el origen exacto, marker no vacío y
que `CPANEL_DEPLOY_ROOT` sea su propio directorio. Sólo registra booleans sobre
los overrides y propaga el exit status del activador original, incluido rollback.

`health_adapter.py` sólo instala sobre el SHA normalizado ya verificado
`fa5d955390006396e9070a4d653b83f3d9d5bc3536a4111b26d93f1b16524c83`, o reconoce
el adaptador actual byte por byte. Guarda el original como
`bin/activate-core.<sha>.sh`, verifica que el backup conserva exactamente sus
bytes. Sube ambos archivos a `.part` y comprueba sus bytes por lectura FTPS
**antes** de promoverlos; un upload truncado que reporte éxito preserva la entrada
anterior. Publica primero el core verificado y después la entrada mediante rename.
El core `activate.sh` del repo
permanece idéntico a sus gemelos; no se cambia cron, Dashboard ni otros docroots.
Una edición desconocida bloquea la instalación. Para actualizar el adaptador
en otra revisión se debe inspeccionar y autorizar explícitamente su SHA anterior;
no añadir aceptación por texto parcial. El backup permite restaurar la entrada
original por FTPS si se revierte esta configuración.

Los tests locales comprueban instalación, idempotencia, rechazo de cambios
ajenos, límites del docroot, marker, estado terminal y propagación de errores,
sin contactar el host. La lectura terminal sólo publica booleans. El test
`pnpm check:serving` ejercita nginx real local, incluidos 301 y Location exactos,
query conservada, rutas públicas, 404 y Host ajeno, sin ejecutar producción.

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
