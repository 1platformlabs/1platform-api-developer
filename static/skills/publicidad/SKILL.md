---
name: publicidad
description: Preparar campañas publicitarias, consultar sus límites y seguir su publicación con la 1Platform API, sólo en espacios habilitados.
---

# Publicidad

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/publicidad` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. La integración publicitaria sigue en preparación: un borrador o una operación
documentada no acreditan campañas operativas. Compruebe la habilitación del espacio antes de comprometer presupuesto.

1. Consulte `GET /api/v1/ads/settings` y `GET /api/v1/ads/objectives` para límites y objetivos.
2. La persona conecta su cuenta mediante `GET /api/v1/ads/connection/authorize` y elige su marca con
   `PUT /api/v1/ads/connection/brand`. Si la conexión no está disponible, informe el bloqueo.
3. `POST /api/v1/ads/campaigns` crea un borrador; se edita con `PATCH /api/v1/ads/campaigns/{campaign_id}`.
4. Financiar con `POST /api/v1/ads/campaigns/{campaign_id}/fund` usa saldo y requiere `Idempotency-Key`.
   Publicar con `POST /api/v1/ads/campaigns/{campaign_id}/publish` compromete presupuesto: ejecute estas
   operaciones sólo con autorización explícita de la persona.
5. Consulte `GET /api/v1/ads/campaigns/{campaign_id}/results`; distinga ausencia de datos de resultados en cero.
6. Cerrar con `POST /api/v1/ads/campaigns/{campaign_id}/close` inicia la liquidación; no prometa devolución inmediata.

El MCP no expone herramientas de gestión de campañas. Use sus herramientas de documentación para implementar
el cliente REST; el toolset `analitica` consulta métricas e ingresos de sitios y no sustituye esta integración.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/publicidad.md
