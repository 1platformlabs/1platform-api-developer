---
name: crecimiento
description: Consultar el catálogo de servicios de alcance, verificar perfiles y sitios, cotizar, hacer pedidos con saldo y aceptar o reportar su entrega con la One Platform API.
---

# Crecimiento

## Consulta con el MCP

Antes de implementar, use el MCP de One Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/crecimiento` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. Crecimiento no tiene herramientas operativas en el MCP: use REST.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Crecimiento se habilita por espacio de trabajo y por cuenta; apagado, `403` con
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
