---
name: pagos-en-linea
description: Cobrar a un tercero con checkout seguro, recibir el resultado por webhook y conciliar con la 1Platform API.
---

# Pagos en línea

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
