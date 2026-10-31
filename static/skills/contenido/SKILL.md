---
name: contenido
description: Investigar keywords, generar artículos, seguir su trabajo y pedir la indexación de la página publicada con la 1Platform API.
---

# Contenido

Requiere la skill `1platform-hub` y un sitio registrado (skill `sitios-web`). Sin el módulo de sitios web, `403`
`module_disabled`.

1. Keywords: `POST /api/v1/posts/keywords/` para un dominio y `POST /api/v1/posts/keywords/topic/` para un tema.
2. `POST /api/v1/posts/content/` encola un artículo. Generar contenido cobra saldo: sólo con confirmación del
   desarrollador.
3. `GET /api/v1/posts/content/jobs/{job_id}` hasta que el trabajo termine; `GET /api/v1/users/categories` para
   clasificar.
4. `POST /api/v1/posts/indexing/` pide la indexación de la URL ya publicada.
5. `GET /api/v1/users/websites/{website_id}/searchconsole/performance` para el rendimiento de búsqueda de un sitio
   verificado.

Con el servidor MCP (toolset `sitios`): artículos, trabajos de generación, categorías y rendimiento de búsqueda, sólo
lectura. El MCP no genera contenido ni pide indexaciones.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/sitios-web-y-contenido/generar-contenido.md
