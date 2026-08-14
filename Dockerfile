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
FROM nginx:alpine AS runtime

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
