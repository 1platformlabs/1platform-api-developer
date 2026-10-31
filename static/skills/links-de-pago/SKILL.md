---
name: links-de-pago
description: Crear, consultar, listar y cancelar links de pago de un comercio con la 1Platform API.
---

# Links de pago

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
