# Agentes de IA

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/agentes-de-ia` y las skills `/skills/1platform-hub/SKILL`, `/skills/agentes-de-ia/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `agentes` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Sin el módulo de agentes, las operaciones responden `403` `module_disabled`.

1. `GET /api/v1/agents/catalog` (`listAgentCatalog`) para elegir una plantilla y `GET /api/v1/agents/tools` para
   saber qué herramientas incluye el plan.
2. `POST /api/v1/agents/catalog/{slug}/install` crea el agente activo. Fije el tope del ciclo con
   `PUT /api/v1/agents/{agent_id}/budget` y léalo con `GET /api/v1/agents/{agent_id}/budget`.
3. Una ejecución consume saldo: `POST /api/v1/agents/{agent_id}/run` sólo con confirmación del desarrollador. Responde
   `202` en `pending`; `409` significa que ya corre el máximo de ejecuciones simultáneas.
4. `GET /api/v1/agents/{agent_id}/runs/{run_id}` hasta `completed`, `failed` o `stopped`.
   `POST /api/v1/agents/{agent_id}/runs/{run_id}/stop` la detiene.
5. Las decisiones humanas: `GET /api/v1/agent-actions` y, con la decisión tomada,
   `PATCH /api/v1/agent-actions/{action_id}/consume`.

Con el servidor MCP (toolset `agentes`): leer agentes, catálogo, herramientas, presupuesto, ejecuciones y acciones, y
detener una ejecución. Instalar, disparar y resolver acciones se hace por la API.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/agentes-de-ia.md
