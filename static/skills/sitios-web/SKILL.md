---
name: sitios-web
description: Registrar sitios web propios, consultarlos y crear sitios servidos por la plataforma con la 1Platform API.
---

# Sitios web

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/sitios-web-y-contenido` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`.

1. `GET /api/v1/users/websites/mine` (`listMyWebsites`) para los sitios del usuario y
   `GET /api/v1/users/websites/{website_id}` (`getWebsite`) para uno en particular.
2. `POST /api/v1/users/websites` para registrar un sitio propio y `PATCH /api/v1/users/websites/{website_id}` para
   actualizarlo.
3. Sitio servido por la plataforma con dominio: `POST /api/v1/provisioning/tenants` crea el trabajo y
   `GET /api/v1/provisioning/tenants/{job_id}` informa su avance.
4. Generar contenido tiene costo en el saldo: `POST /api/v1/posts/content/` sólo con confirmación del desarrollador;
   el resultado se consulta con `GET /api/v1/posts/content/jobs/{job_id}`.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/sitios-web-y-contenido.md

El toolset `sitios` sólo consulta sitios y contenido; no registra sitios ni ejecuta generación.
