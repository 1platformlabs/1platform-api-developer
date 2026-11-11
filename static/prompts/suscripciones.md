# Suscripciones

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/suscripciones` y las skills `/skills/1platform-hub/SKILL`, `/skills/suscripciones/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `suscripciones` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Viene apagado: mientras tanto, las operaciones bajo `/businesses/{businessId}/…`
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
