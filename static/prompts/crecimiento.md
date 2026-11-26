# Crecimiento

## Antes de implementar con el MCP

Use el MCP de One Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/crecimiento` y las skills `/skills/1platform-hub/SKILL`, `/skills/crecimiento/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Crecimiento no tiene toolset en el MCP: las tres herramientas de documentación funcionan sin claves, y todas las
operaciones se implementan por REST.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos o
comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Crecimiento se habilita por espacio de trabajo y por cuenta; apagado, `403` con
`module_disabled` o `growth_disabled`. Los montos van en USD como texto.

1. `GET /api/v1/growth/catalog` trae servicios, medios y reglas. Cada servicio indica su `kind` (`auto` se cobra al
   pedir, `custom` se reserva y se cobra al aceptar), su `target`, su `pricing_model` y los `fields` que pide.
2. `GET /api/v1/growth/destinations` lista perfiles y sitios; sólo uno `verified` recibe pedidos.
   `POST /api/v1/growth/destinations` agrega uno `pending` con un `code` que la persona pega en su perfil o sitio.
3. `POST /api/v1/growth/orders/quote` cotiza sin cobrar; `blocked` aparece sólo cuando hoy no se puede pagar.
4. `POST /api/v1/growth/orders` pide con `Idempotency-Key` obligatoria (8 a 64 caracteres) y `accept_terms: true`.
   Repetir con la misma clave y cuerpo devuelve el mismo pedido sin cobrar dos veces. Pedir cobra o reserva saldo:
   no lo ejecute sin confirmación del desarrollador.
5. `GET /api/v1/growth/orders` y `GET /api/v1/growth/orders/{order_id}` siguen el pedido.
6. Acciones: `cancel`, `accept`, `changes` y `report` (con `text`) y `refill`, bajo
   `/api/v1/growth/orders/{order_id}/`. Una acción que el estado no permite responde `409`
   `growth_order_invalid_transition`.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/crecimiento.md
