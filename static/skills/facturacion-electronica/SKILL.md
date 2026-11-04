---
name: facturacion-electronica
description: Emitir, consultar y anular facturas electrónicas FEL de Guatemala a nombre de un comercio con la 1Platform API.
---

# Facturación electrónica (FEL, Guatemala)

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/facturacion-electronica/emitir-una-factura` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


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

El toolset `facturacion` sólo consulta facturas; no emite ni anula documentos fiscales.
