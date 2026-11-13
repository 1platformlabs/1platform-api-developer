---
name: webhooks
description: Recibir webhooks de la 1Platform API con verificación de firma HMAC-SHA256, ventana de repetición e idempotencia.
---

# Webhooks

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/reference/webhooks-security` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


1. Endpoint HTTPS `POST` que lee el **cuerpo crudo** antes de parsearlo.
2. Firma: `X-Webhook-Signature` con formato `sha256=<hex>`. Calcule HMAC-SHA256 con el secreto del espacio de
   trabajo sobre `"{X-Webhook-Timestamp}." + cuerpo crudo` y compare en tiempo constante.
3. Rechace con `401` una firma inválida o un `X-Webhook-Timestamp` con más de 5 minutos de desfase.
4. Procese cada evento una sola vez: guarde el par (identificador del recurso, evento) y responda `200` a un
   duplicado sin reprocesarlo.
5. Responda `2xx` rápido y haga el trabajo en segundo plano; la plataforma reintenta lo que no recibe.
6. La configuración de las URL se consulta con `GET /api/v1/webhooks/config/` y se administra desde el Panel.
7. Hay ocho eventos: siete de transacciones (`on_approved`, `on_denied`, `on_cancelled`, `on_expired`,
   `on_dismiss`, `on_refunded`, `on_reversed`) y `on_terminal_charge_completed`, el final de un cobro remoto a
   terminal. Este último trae `{"event": "terminal_charge.completed", "data": {...}}` con `amount` como texto y un
   `status` final (`approved`, `denied`, `cancelled`, `expired`, `timeout` o `unreconciled`); puede llegar un segundo
   evento `approved` del mismo cobro. Deduplíquelo por `X-1Platform-Event-Id`. Cuerpo:
   https://developer.1platform.pro/docs/saas/1platform-api/reference/webhooks-payload.md

Seguridad y ejemplos: https://developer.1platform.pro/docs/saas/1platform-api/reference/webhooks-security.md

El MCP permite consultar la documentación de webhooks, pero no administra sus destinos ni sus secretos.
