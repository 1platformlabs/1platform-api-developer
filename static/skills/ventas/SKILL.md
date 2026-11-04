---
name: ventas
description: Definir qué se vende, seguir a cada prospecto en el embudo y cerrar la venta cobrando la reserva con la 1Platform API.
---

# Ventas

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/ventas` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Ventas lo habilita el equipo de la plataforma: apagado, `403` con `data.code`
`sales_disabled`. La automatización por mensajería sigue en preparación.

1. `GET /api/v1/sales/readiness` dice qué falta para vender: oferta y canal.
2. `GET /api/v1/sales/offers/presets` y `POST /api/v1/sales/offers` (administrador) para la oferta.
3. `GET /api/v1/sales/leads/board` para el embudo de una oferta y `GET /api/v1/sales/leads/{leadId}` para un
   prospecto. `PATCH /api/v1/sales/leads/{leadId}` lo mueve de etapa.
4. Escribirle a un prospecto (`POST /api/v1/sales/leads/{leadId}/messages`) envía un mensaje real y exige control
   manual (`PATCH /api/v1/sales/leads/{leadId}/control`): sólo con confirmación del desarrollador.
5. `GET /api/v1/sales/report` para el embudo, las ventas cerradas y su costo.

Con el servidor MCP (toolset `ventas`): preparación, canales, ofertas, prospectos, tablero y reporte, sólo lectura. El
MCP no escribe a prospectos ni crea cobros de reserva.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/ventas.md
