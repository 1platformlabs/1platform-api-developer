# Pagos en línea con la 1Platform API

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
