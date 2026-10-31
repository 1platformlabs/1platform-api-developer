---
name: facturacion-electronica
description: Emitir, consultar y anular facturas electrónicas FEL de Guatemala a nombre de un comercio con la 1Platform API.
---

# Facturación electrónica (FEL, Guatemala)

Requiere la skill `1platform-hub`. Emitir y anular son actos fiscales: escriba ese código sólo con confirmación
explícita del desarrollador.

1. `GET /api/v1/businesses` (`listBusinessesForUser`) para el `businessId`.
2. `GET /api/v1/businesses/{businessId}/invoicing/activation`: sin activación, emitir responde `409`. La activación
   se hace una sola vez; el orden está en la guía.
3. `GET /api/v1/businesses/{businessId}/branches` para elegir la sucursal.
4. `POST /api/v1/businesses/{businessId}/invoices` (`createInvoice`) para emitir.
5. `GET /api/v1/businesses/{businessId}/invoices/{invoiceId}` (`getInvoice`) para el resultado certificado y
   `GET /api/v1/businesses/{businessId}/invoices/{invoiceId}/pdf` para el PDF.
6. `DELETE /api/v1/businesses/{businessId}/invoices/{invoiceId}` (`cancelInvoice`) para anular.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/facturacion-electronica/emitir-una-factura.md
