# Publicidad

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/publicidad` y las skills `/skills/1platform-hub/SKILL`, `/skills/publicidad/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `cuenta` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. La integración publicitaria sigue en preparación: un borrador o una operación
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
