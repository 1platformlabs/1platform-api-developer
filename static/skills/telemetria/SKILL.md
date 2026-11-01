---
name: telemetria
description: Medir errores, rendimiento y disponibilidad de un sitio o aplicación y definir avisos con la 1Platform API.
---

# Telemetría

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
