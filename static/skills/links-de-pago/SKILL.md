---
name: links-de-pago
description: Crear, consultar, listar y cancelar links de pago de un comercio con la 1Platform API.
---

# Links de pago

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/links-de-pago` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub` (tokens, entornos y errores).

1. `GET /api/v1/businesses` (`listBusinessesForUser`) para obtener el `businessId`.
2. `POST /api/v1/businesses/{businessId}/payment-links` (`createPaymentLink`): monto, concepto y, opcionalmente,
   vigencia y `merchant_reference`. Con `customer_email` la plataforma envía el enlace a esa persona en el acto:
   inclúyalo sólo si el desarrollador lo pide.
3. Comparta la URL que devuelve la respuesta. Quien paga no necesita cuenta.
4. `GET /api/v1/businesses/{businessId}/payment-links/{linkId}` (`getPaymentLink`) para el estado, o
   `GET /api/v1/businesses/{businessId}/payment-links` (`listPaymentLinks`) con filtro por `status`.
5. `POST /api/v1/businesses/{businessId}/payment-links/{linkId}/cancel` (`cancelPaymentLink`) para que deje de
   aceptar pagos.
6. Para enterarse del pago sin consultar, use la skill `webhooks`.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/links-de-pago.md

El toolset `pagos` permite leer, crear y cancelar links; crear mediante MCP omite `customer_email` y no envía el enlace por correo.
