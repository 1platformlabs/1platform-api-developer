---
name: pagos-en-linea
description: Cobrar a un tercero con checkout seguro, recibir el resultado por webhook y conciliar con la 1Platform API.
---

# Pagos en línea

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/pagos-en-linea/cobrar-y-conciliar` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere las skills `1platform-hub` y `webhooks`.

1. Deje listo el receptor de webhooks con verificación de firma antes de cobrar.
2. Guarde la referencia del pedido y cree el cobro con `POST /api/v1/users/transactions`
   (`createPaymentTransaction`). Lleve al comprador a la URL de checkout de la respuesta.
3. Liquide el pedido al recibir el webhook del resultado, una sola vez por evento.
4. Concilie con `GET /api/v1/users/transactions` (`listPaymentTransactions`) y
   `GET /api/v1/users/transactions/{transaction_id}` (`getPaymentTransactionById`). No cree un cobro nuevo para un
   pedido que ya tiene uno en curso.
5. Reembolsar (`POST /api/v1/users/transactions/{transaction_id}/refund`) mueve dinero: sólo con confirmación
   explícita del desarrollador.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/pagos-en-linea/cobrar-y-conciliar.md

El toolset `pagos` consulta transacciones; no crea cobros ni reembolsa. Esas operaciones se implementan por REST.
