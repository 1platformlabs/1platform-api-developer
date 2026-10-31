# Facturación electrónica con la 1Platform API

Implemente la emisión de facturas electrónicas FEL de Guatemala a nombre de un comercio (QA por defecto):

1. Obtenga el `businessId` con `GET /api/v1/businesses` (`listBusinessesForUser`).
2. Compruebe que la facturación del comercio está activa con
   `GET /api/v1/businesses/{businessId}/invoicing/activation`. Sin activación, emitir responde `409`; la activación
   se hace una sola vez y la guía explica el orden.
3. Elija la sucursal con `GET /api/v1/businesses/{businessId}/branches`.
4. Emita con `POST /api/v1/businesses/{businessId}/invoices` (`createInvoice`). Emitir es un acto fiscal: escríbalo
   sólo con la confirmación explícita del desarrollador.
5. Consulte el resultado certificado con `GET /api/v1/businesses/{businessId}/invoices/{invoiceId}` (`getInvoice`) y
   descargue el PDF con `GET /api/v1/businesses/{businessId}/invoices/{invoiceId}/pdf`.
6. Anular (`DELETE /api/v1/businesses/{businessId}/invoices/{invoiceId}`, `cancelInvoice`) también es un acto fiscal.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/facturacion-electronica/emitir-una-factura.md
