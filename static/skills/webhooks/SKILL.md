---
name: webhooks
description: Recibir webhooks de la 1Platform API con verificación de firma HMAC-SHA256, ventana de repetición e idempotencia.
---

# Webhooks

1. Endpoint HTTPS `POST` que lee el **cuerpo crudo** antes de parsearlo.
2. Firma: `X-Webhook-Signature` con formato `sha256=<hex>`. Calcule HMAC-SHA256 con el secreto del espacio de
   trabajo sobre `"{X-Webhook-Timestamp}." + cuerpo crudo` y compare en tiempo constante.
3. Rechace con `401` una firma inválida o un `X-Webhook-Timestamp` con más de 5 minutos de desfase.
4. Procese cada evento una sola vez: guarde el par (identificador del recurso, evento) y responda `200` a un
   duplicado sin reprocesarlo.
5. Responda `2xx` rápido y haga el trabajo en segundo plano; la plataforma reintenta lo que no recibe.
6. La configuración de las URL se consulta con `GET /api/v1/webhooks/config/` y se administra desde el Panel.

Seguridad y ejemplos: https://developer.1platform.pro/docs/saas/1platform-api/reference/webhooks-security.md
