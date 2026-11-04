# Ventas

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/ventas` y las skills `/skills/1platform-hub/SKILL`, `/skills/ventas/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `ventas` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Ventas lo habilita el equipo de la plataforma: apagado, `403` con `data.code`
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
