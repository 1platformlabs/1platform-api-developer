---
name: retiros
description: Consultar el saldo retirable, registrar dónde recibir el dinero y pedir retiros de lo cobrado con la 1Platform API.
---

# Retiros

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/retiros` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Retiros viene apagado: sin él, `403` `CASH_OUT_DISABLED`. El código de error viaja en
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
