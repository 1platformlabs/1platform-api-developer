---
name: ventas
description: Definir qué se vende, seguir a cada prospecto en el embudo y cerrar la venta cobrando la reserva con la 1Platform API.
---

# Ventas

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
