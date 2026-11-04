# Retiros

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/retiros` y las skills `/skills/1platform-hub/SKILL`, `/skills/retiros/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `retiros` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Retiros viene apagado: sin él, `403` `CASH_OUT_DISABLED`. El código de error viaja en
`code`, en la raíz de la respuesta.

1. `GET /api/v1/users/cash-out/summary` para el saldo retirable por moneda y si hay un método listo. Es distinto del
   saldo prepagado y nunca se suman.
2. `GET /api/v1/users/cash-out/movements` y `GET /api/v1/users/cash-out/payouts` para el estado de cuenta y los
   retiros.
3. Toda escritura (métodos, `POST /api/v1/users/cash-out/quote`, `POST /api/v1/users/cash-out/payouts`) exige un token
   de una sesión iniciada por una persona con enlace mágico; con un token canjeado desde `sk-…` responde `403`
   `CASH_OUT_SESSION_REQUIRED`. Pedir un retiro mueve dinero: sólo con confirmación de la persona, y con el mismo
   `idempotency_key` al reintentar.

Con el servidor MCP (toolset `retiros`): saldo retirable, movimientos, retiros y cobros que pueden pasar al saldo
retirable, sólo lectura. El MCP no pide retiros ni registra métodos.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/retiros.md
