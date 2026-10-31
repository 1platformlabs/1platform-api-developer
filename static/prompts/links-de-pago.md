# Links de pago con la 1Platform API

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
