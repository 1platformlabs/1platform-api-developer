---
name: cupones
description: Crear cupones de descuento, emitir lotes de códigos únicos, pausarlos o archivarlos y comprobar qué descontaría un código con la One Platform API.
---

# Cupones

## Consulta con el MCP

Antes de implementar, use el MCP de One Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/cupones` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Cupones se habilita por espacio de trabajo; apagado, `403` con `module_disabled`
o `COUPONS_DISABLED`.

1. `POST /api/v1/coupons` crea un cupón: `type` (`percentage` o `fixed_amount`), `value_minor` y `currency`. Sin
   `code` el servidor genera uno de 12 caracteres; un código repetido responde `409` `COUPON_CODE_EXISTS`.
2. `GET /api/v1/coupons` lista (cursor; filtros `status`, `batch`, `q`) y `GET /api/v1/coupons/{coupon_id}` consulta.
3. `PATCH /api/v1/coupons/{coupon_id}` edita; `status` pasa entre `active` y `paused`, y `archived` es final.
4. `POST /api/v1/coupons/batches` emite hasta 500 códigos y exige `Idempotency-Key`; `GET /api/v1/coupons/export`
   los descarga en CSV.
5. `POST /api/v1/coupons/redemptions/validate` comprueba qué descontaría un código, sin reservar ni consumir nada;
   un código que no aplica responde `422` `COUPON_INVALID` con su `reason`.
6. Las tiendas: `GET /api/v1/coupons/stores` y `GET|POST /api/v1/coupons/stores/{slug}`. Una tienda puede cobrar una
   tarifa al emitir un cupón de un solo uso: no lo ejecute sin confirmación del desarrollador.

Con el servidor MCP (toolset `cupones`): listar, consultar y exportar, listar tiendas, crear y editar un cupón. El
MCP no emite lotes, no crea cupones de tienda ni canjea.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/cupones.md
