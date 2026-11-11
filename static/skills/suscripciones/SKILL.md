---
name: suscripciones
description: Configurar planes y clientes de un comercio, emitir invitaciones a un plan y seguir sus cobros recurrentes con la 1Platform API.
---

# Suscripciones

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/suscripciones` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Viene apagado: mientras tanto, las operaciones bajo `/businesses/{businessId}/…`
responden `503` `subscriptions_disabled`. Las renovaciones se cobran automáticamente según la frecuencia del plan publicado.

1. `GET /api/v1/businesses` (`listBusinessesForUser`) para el `businessId`.
2. `POST /api/v1/businesses/{businessId}/subscription-plans` crea el plan en borrador y
   `POST /api/v1/businesses/{businessId}/subscription-plans/{planId}/publish` lo publica.
3. `POST /api/v1/businesses/{businessId}/customers` registra un cliente y
   `GET /api/v1/businesses/{businessId}/customers` lo busca.
4. `POST /api/v1/businesses/{businessId}/subscription-plans/{planId}/invitations` emite la invitación, que es un link
   de pago.
5. `GET /api/v1/businesses/{businessId}/subscriptions` y
   `GET /api/v1/businesses/{businessId}/subscriptions/{subscriptionId}` para lo vendido.

Con el servidor MCP (toolset `suscripciones`): planes, suscripciones y clientes, sólo lectura.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/suscripciones.md
