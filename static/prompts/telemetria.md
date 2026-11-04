# Telemetría

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/telemetria` y las skills `/skills/1platform-hub/SKILL`, `/skills/telemetria/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `telemetria` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Telemetría la enciende el equipo de la plataforma: apagada, `403`
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
