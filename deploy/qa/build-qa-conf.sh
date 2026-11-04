#!/usr/bin/env bash
# Deriva el nginx.conf de QA desde el de PROD (deploy/docker/nginx.conf), para
# que QA sirva con las MISMAS reglas (redirecciones, 404 de directorios, cache).
# Sólo cambia tres cosas, y falla si alguna no aparece exactamente donde se espera:
#   · escucha en 8080 (el contenedor de QA corre --read-only, mapeado :3050→8080);
#   · server_name developer-qa.1platform.pro (cualquier otro Host recibe 444);
#   · /__qa-version devuelve __GIT_SHA__, que el receptor del dedicado sustituye
#     por el SHA publicado: es el marcador de activación del release.
# Uso: build-qa-conf.sh <nginx.conf de PROD> <salida>
set -euo pipefail
src="${1:?falta el nginx.conf de origen}"; dst="${2:?falta la salida}"

cuenta() { grep -cF -- "$1" "$src" || true; }
[ "$(cuenta 'listen 80 default_server;')" -eq 1 ] || { echo "esperaba un único 'listen 80 default_server;'" >&2; exit 1; }
[ "$(cuenta 'listen 80;')" -eq 1 ] || { echo "esperaba un único 'listen 80;'" >&2; exit 1; }
[ "$(cuenta 'server_name developer.1platform.pro;')" -eq 1 ] || { echo "esperaba un único server_name de PROD" >&2; exit 1; }
[ "$(cuenta 'server_tokens off;')" -eq 1 ] || { echo "esperaba un único 'server_tokens off;'" >&2; exit 1; }

sed -e 's/listen 80 default_server;/listen 8080 default_server;/' \
    -e 's/listen 80;/listen 8080;/' \
    -e 's/server_name developer\.1platform\.pro;/server_name developer-qa.1platform.pro;/' \
    -e 's|^\([[:space:]]*\)server_tokens off;|&\n\1location = /__qa-version { default_type text/plain; add_header Cache-Control "no-store" always; return 200 "__GIT_SHA__\\n"; }|' \
    "$src" > "$dst"

[ "$(grep -c '__GIT_SHA__' "$dst")" -eq 1 ] || { echo "el marcador __GIT_SHA__ no quedó exactamente una vez" >&2; exit 1; }
grep -q 'server_name developer-qa\.1platform\.pro;' "$dst"
! grep -qE 'listen 80( |;)' "$dst" || { echo "quedó un listen 80" >&2; exit 1; }
