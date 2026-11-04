# Pagos en línea con la 1Platform API

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/pagos-en-linea` y las skills `/skills/1platform-hub/SKILL`, `/skills/pagos-en-linea/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `pagos` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Implemente en el backend del proyecto el cobro a un tercero con checkout seguro (QA por defecto):

1. Antes de cobrar, deje lista la recepción del resultado por webhook y la verificación de su firma.
2. Guarde su propia referencia del pedido y cree el cobro con `POST /api/v1/users/transactions`
   (`createPaymentTransaction`). Lleve al comprador a la URL de checkout que devuelve la respuesta.
3. Liquide el pedido cuando llegue el webhook del resultado, una sola vez por evento.
4. Concilie lo que no llegó con `GET /api/v1/users/transactions` (`listPaymentTransactions`) y
   `GET /api/v1/users/transactions/{transaction_id}` (`getPaymentTransactionById`). No cree un cobro nuevo para un
   pedido que ya tiene uno en curso.
5. Un reembolso (`POST /api/v1/users/transactions/{transaction_id}/refund`) mueve dinero: escríbalo sólo con la
   confirmación explícita del desarrollador.

Guía paso a paso: https://developer.1platform.pro/docs/saas/1platform-api/pagos-en-linea/cobrar-y-conciliar.md

El toolset `pagos` consulta transacciones; no crea cobros ni reembolsa. Esas operaciones se implementan por REST.
