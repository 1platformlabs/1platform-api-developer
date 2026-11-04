---
name: telemetria
description: Medir errores, rendimiento y disponibilidad de un sitio o aplicación y definir avisos con la 1Platform API.
---

# Telemetría

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/telemetria` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Telemetría la enciende el equipo de la plataforma: apagada, `403`
`telemetry_disabled`.

1. `POST /api/v1/users/telemetry/projects` crea el proyecto y entrega sus dos credenciales;
   `GET /api/v1/users/telemetry/projects/{project_id}` trae la etiqueta para el sitio.
2. `GET /api/v1/users/telemetry/projects/{project_id}/install-status` dice si la etiqueta ya reporta y, si no, por qué.
3. Errores: `GET /api/v1/users/telemetry/projects/{project_id}/issues` y
   `PATCH /api/v1/users/telemetry/projects/{project_id}/issues/{issue_id}` para resolver, ignorar o reabrir.
4. `GET /api/v1/users/telemetry/projects/{project_id}/performance`, `…/logs` y `…/usage` para rendimiento, registros y
   consumo.
5. Avisos: `POST /api/v1/users/telemetry/projects/{project_id}/alert-rules` y monitores con
   `POST /api/v1/users/telemetry/projects/{project_id}/monitors`.

Con el servidor MCP (toolset `telemetria`): proyectos, errores, último evento, registros, rendimiento y uso, y marcar
un error como resuelto o ignorado. Crear proyectos, monitores y reglas se hace por la API.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/telemetria.md
