# Links de pago con la 1Platform API

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/links-de-pago` y las skills `/skills/1platform-hub/SKILL`, `/skills/links-de-pago/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `pagos` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Implemente en el servidor la creación y el seguimiento de links de pago (QA por defecto):

1. Obtenga el `businessId` con `GET /api/v1/businesses` (`listBusinessesForUser`). No lo fije en el código.
2. Cree el link con `POST /api/v1/businesses/{businessId}/payment-links` (`createPaymentLink`): monto, concepto y,
   si hace falta, vigencia y `merchant_reference`. Si envía `customer_email`, la plataforma le manda el enlace a
   esa persona en el acto: hágalo sólo cuando el desarrollador lo pida.
3. Comparta la URL del link que devuelve la respuesta; quien paga no necesita cuenta.
4. Consulte el estado con `GET /api/v1/businesses/{businessId}/payment-links/{linkId}` (`getPaymentLink`) o liste
   con `GET /api/v1/businesses/{businessId}/payment-links` (`listPaymentLinks`).
5. Cancele un link activo con `POST /api/v1/businesses/{businessId}/payment-links/{linkId}/cancel`
   (`cancelPaymentLink`).
6. Para enterarse del pago sin consultar, configure los webhooks y verifique su firma.

Campos y estados exactos: https://developer.1platform.pro/openapi/1platform-api.json. Guía:
https://developer.1platform.pro/docs/saas/1platform-api/links-de-pago.md

El toolset `pagos` permite leer, crear y cancelar links; crear mediante MCP omite `customer_email` y no envía el enlace por correo.
