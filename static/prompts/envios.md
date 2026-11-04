# Envíos

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/envios` y las skills `/skills/1platform-hub/SKILL`, `/skills/envios/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `envios` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. El código de error de Envíos viaja en `data.code`.

1. `POST /api/v1/businesses/{businessId}/deliveries`: crea el envío en `draft` con la sucursal (`branch_id`), el
   punto de entrega (`dropoff`) y el paquete. Se puede editar con `PATCH` mientras está en `draft`.
2. Despacho con flota propia (`mode` `own_fleet`):
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/dispatch` con el repartidor, y el avance con
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/status` (`picked_up` antes de `delivered`).
3. Despacho con mensajería (`mode` `courier`): primero
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/quote`, y al despachar envíe `expected_quoted_at`
   con el `quote.quoted_at` que vio. Despachar con mensajería pide un envío real: sólo con confirmación del
   desarrollador.
4. Estado: `GET /api/v1/businesses/{businessId}/deliveries/{deliveryId}` (`getDelivery`) o
   `GET /api/v1/businesses/{businessId}/deliveries` (`listDeliveries`).
5. Rastreo público para el destinatario: `GET /api/v1/deliveries/tracking/{handle}`, sin credenciales, con el
   `tracking_handle` del envío.
6. Cancelar: lea `can_cancel` y `cancel_mode` antes de ofrecerlo y llame a
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/cancel`.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/envios.md

El toolset `envios` sólo consulta envíos; registrar, cotizar y despachar se implementa por REST.
