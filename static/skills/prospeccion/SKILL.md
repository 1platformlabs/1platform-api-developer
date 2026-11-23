---
name: prospeccion
description: Definir objetivos de prospección, cargar prospectos, revisar los borradores que prepara el agente y registrar envíos y respuestas con la One Platform API.
---

# Prospección

## Consulta con el MCP

Antes de implementar, use el MCP de One Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/prospeccion` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Prospección está en preparación: nace apagada y la habilita el equipo de la
plataforma; apagada, `403` con `data.code` `prospecting_disabled`.

1. `GET /api/v1/prospecting/goals/{goalId}/readiness` dice qué falta: canal, reunión, ventas, agente y precio.
2. `POST /api/v1/prospecting/goals` crea el objetivo. Nace en modo borrador: no se envía nada.
3. Prospectos: `POST .../prospects` o `POST .../prospects/import`; el tablero es `GET .../board`.
4. Los borradores se guardan con `PUT /api/v1/prospecting/prospects/{prospectId}/messages/{sequence}`; las reglas
   incumplidas llegan en `checks`.
5. Aprobar, enviar y marcar enviado los hace una persona. Nunca los ejecute por iniciativa propia: `POST
   /api/v1/prospecting/messages/{messageId}/approve` exige el `content_hash` revisado y `.../send` contacta a un
   tercero real, sólo con confirmación del desarrollador y con el objetivo en modo real.
6. Un `409` trae `data.code`; los topes diarios son `prospecting_daily_cap`, no `429`.

Con el servidor MCP (toolset `prospeccion`): objetivos, preparación, embudo, métricas y prospectos sin datos de
contacto; alta e importación de prospectos. El MCP no aprueba, envía, marca enviado, cambia el modo, traspasa,
excluye empresas ni lee datos de contacto.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/prospeccion.md
