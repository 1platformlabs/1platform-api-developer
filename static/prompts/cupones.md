# Cupones

## Antes de implementar con el MCP

Use el MCP de One Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/cupones` y las skills `/skills/1platform-hub/SKILL`, `/skills/cupones/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `coupons` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos o
comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Cupones se habilita por espacio de trabajo; apagado, `403` con `module_disabled` o
`COUPONS_DISABLED`.

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

Con el servidor MCP (toolset `coupons`): listar, consultar y exportar, listar tiendas, crear y editar un cupón. El
MCP no emite lotes, no crea cupones de tienda ni canjea.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/cupones.md
