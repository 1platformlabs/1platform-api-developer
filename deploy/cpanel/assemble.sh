#!/usr/bin/env bash
#
# assemble.sh — build the cPanel bundle for developer.1platform.pro.
#
# Gemelo deliberado de `1platform-website/deploy/cpanel/assemble.sh`: mismo
# layout de bundle, mismo manifest, mismo fingerprint. Sólo cambian el
# generador (Docusaurus en vez de Astro), el directorio de build (`build/` en
# vez de `dist/`) y los archivos que se declaran obligatorios.
#
# Bundle layout (que es también el layout de release en el host):
#
#   <bundle>/public/           el árbol servido — build/ + .htaccess
#   <bundle>/MANIFEST.sha256   sha256 de cada archivo bajo public/, ordenado
#   <bundle>/BUNDLE_INFO       version / commit / built_at / files / index_sha
#
# `public/` va anidado un nivel a propósito: el symlink del docroot apunta A
# public/, así que MANIFEST.sha256 y BUNDLE_INFO quedan fuera de lo que HTTP
# puede alcanzar.
#
# Usage: assemble.sh [SRC] [OUT] [HTACCESS]
#   SRC       salida del build de Docusaurus       (default: build)
#   OUT       dir de salida limpio = raíz del zip  (default: cpanel-dist)
#   HTACCESS  contrato de servido a injertar       (default: deploy/cpanel/htaccess/docs.htaccess)
#
set -euo pipefail

SRC="${1:-build}"
OUT="${2:-cpanel-dist}"
HTACCESS="${3:-deploy/cpanel/htaccess/docs.htaccess}"

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

die() { echo "::error::assemble: $*" >&2; exit 1; }

[[ -d "$SRC" ]] || die "${SRC} no existe — corré 'pnpm build' primero"
[[ -n "$(ls -A "$SRC" 2>/dev/null)" ]] || die "${SRC} está vacío"
[[ -f "$HTACCESS" ]] || die "${HTACCESS} no existe — el contrato de servido no es opcional"

# Estos tres archivos SON el contrato del sitio de docs, no salida incidental:
#   index.html    la portada
#   404.html      lo que hace que /no-existe sea un 404 real y no un 200 blando
#   sitemap.xml   el único artefacto que prueba que se emitieron las rutas
# Un build que los pierda en silencio igual produce un build/ plausible, que es
# justo el fallo que un chequeo de tamaño no atrapa.
for required in index.html 404.html sitemap.xml; do
  [[ -f "${SRC}/${required}" ]] || die "${SRC}/${required} falta — no publico un sitio incompleto"
done

# Árbol limpio, para que un re-run nunca mezcle archivos viejos en el bundle.
rm -rf "$OUT"
mkdir -p "$OUT/public"

cp -R "${SRC}/." "${OUT}/public/"
cp "$HTACCESS" "${OUT}/public/.htaccess"

# La zona de Cloudflare habla HTTP con este origen. Un redirect a https en el
# .htaccess rebotaría cada petición para siempre. Se atrapa acá, en CI, en vez
# de descubrirlo como un bucle de redirects en producción.
#
# ⚠️ Las líneas de comentario se descartan ANTES de buscar. La versión sin ese
# filtro (la que sigue viva en 1platform-website/deploy/cpanel/assemble.sh) se
# dispara contra su propia documentación: basta con que el .htaccess explique
# «no pongas un RewriteRule ... https://» para que el build falle para siempre.
# Medido el 2026-07-31 escribiendo este mismo archivo.
if grep -vE '^[[:space:]]*#' "${OUT}/public/.htaccess" \
   | grep -qiE 'RewriteRule[^#]*https://|Redirect[[:space:]]+(301|permanent)[^#]*https://'; then
  die ".htaccess parece forzar HTTPS — eso es un bucle infinito bajo Cloudflare 'flexible'"
fi

# Manifest sobre el árbol servido. Rutas relativas a public/ y lista ordenada
# con LC_ALL=C, para que el mismo build/ produzca siempre el mismo manifest.
(
  cd "${OUT}/public"
  find . -type f | LC_ALL=C sort | while IFS= read -r f; do
    printf '%s  %s\n' "$(sha256_of "$f")" "${f#./}"
  done
) > "${OUT}/MANIFEST.sha256"

FILES="$(wc -l < "${OUT}/MANIFEST.sha256" | tr -d ' ')"

# El sha256 del documento de entrada es el fingerprint que el job de publish
# consulta. Es la única forma honesta de saber si el cron ACTIVÓ este release:
# la conclusión del propio workflow no dice nada, porque la activación pasa
# después.
INDEX_SHA="$(sha256_of "${OUT}/public/index.html")"

cat > "${OUT}/BUNDLE_INFO" <<EOF
version=${BUNDLE_VERSION:-dev}
commit=${BUNDLE_COMMIT:-unknown}
built_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
files=${FILES}
index_sha=${INDEX_SHA}
EOF

# El destino es una cuenta cPanel compartida con cuota de inodos compartida con
# todos los otros sitios. El disco no es la restricción que ata — lo es la
# CANTIDAD de archivos, y llegar al tope aparece como fallos de escritura raros,
# no como un mensaje claro. Se imprime en cada build para que el número quede
# visible en el log.
echo "assemble: bundle listo en ${OUT} ($(du -sh "$OUT" | cut -f1), ${FILES} archivos)"
echo "assemble: presupuesto de inodos → ${FILES} archivos x 2 releases retenidos ≈ $((FILES * 2)) inodos"
echo "assemble: fingerprint (sha256 de index.html) → ${INDEX_SHA}"
