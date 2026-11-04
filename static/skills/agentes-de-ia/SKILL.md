---
name: agentes-de-ia
description: Instalar agentes desde el catálogo, fijar su tope de gasto, dispararlos, consultar sus ejecuciones y resolver las acciones que dejan para una persona con la 1Platform API.
---

# Agentes de IA

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/agentes-de-ia` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Sin el módulo de agentes, las operaciones responden `403` `module_disabled`.

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
