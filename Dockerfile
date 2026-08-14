# developer.1platform.pro — imagen de producción.
#
# Multi-stage: el host del dedicado corre CentOS 7.9 con >1200 días de uptime y
# el build no puede depender de qué runtime tenga. La etapa `build` trae su
# propio Node; la imagen final sólo lleva nginx y el `build/` de Docusaurus.

# ── Etapa 1: construir el sitio ──────────────────────────────────────────────
# Node 24, el de `.nvmrc`, el mismo que usa el job `build` del pipeline: si CI y
# la imagen construyeran con runtimes distintos, el artefacto verificado en CI
# no sería el que se sirve.
FROM node:24-alpine AS build

WORKDIR /app

# Este repo usa pnpm (`packageManager` en package.json). Corepack lo activa en
# la versión exacta que el repo declara, en vez de instalar "el último".
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# `npm run build` corre `check-provider-leak.mjs` ANTES de docusaurus: el gate
# que impide publicar nombres de proveedores externos en superficie
# client-facing. Se invoca el script del repo, no `docusaurus build` a secas,
# para no saltearlo.
RUN pnpm run build

# ── Etapa 2: servir ──────────────────────────────────────────────────────────
# ⚠️ VERSIÓN FIJADA, y no es cosmético: `nginx:alpine` y `nginx:stable-alpine`
# (hoy 1.29/1.30) **NO ARRANCAN** en el dedicado. Medido el 2026-08-14 sobre el
# host real (CentOS 7.9, kernel 3.10):
#
#   nginx:alpine         → Exited (1) · pwrite() "/run/nginx.pid" failed (1: Operation not permitted)
#   nginx:stable-alpine  → Exited (1) · idéntico
#   nginx:1.27-alpine    → running ✅
#
# El molde del que sale este pipeline (`bower-dashboard`) nunca lo tocó porque
# su contenedor es Node, no nginx. Con un tag flotante el build sale verde, la
# imagen se publica, y el contenedor muere al arrancar: el pipeline sólo se
# entera si el health check sondea de verdad — por eso también existe ese probe.
FROM nginx:1.27-alpine AS runtime

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
