---
name: suscripciones
description: Configurar planes y clientes de un comercio y emitir invitaciones a un plan con la 1Platform API; el cobro recurrente sigue en preparación.
---

# Suscripciones

Requiere la skill `1platform-hub`. Viene apagado: mientras tanto, las operaciones bajo `/businesses/{businessId}/…`
responden `503` `subscriptions_disabled`. El cobro recurrente está en preparación: no prometa renovaciones.

1. `GET /api/v1/businesses` (`listBusinessesForUser`) para el `businessId`.
2. `POST /api/v1/businesses/{businessId}/subscription-plans` crea el plan en borrador y
   `POST /api/v1/businesses/{businessId}/subscription-plans/{planId}/publish` lo publica.
3. `POST /api/v1/businesses/{businessId}/customers` registra un cliente y
   `GET /api/v1/businesses/{businessId}/customers` lo busca.
4. `POST /api/v1/businesses/{businessId}/subscription-plans/{planId}/invitations` emite la invitación, que es un link
   de pago.
5. `GET /api/v1/businesses/{businessId}/subscriptions` y
   `GET /api/v1/businesses/{businessId}/subscriptions/{subscriptionId}` para lo vendido.

Con el servidor MCP (toolset `suscripciones`): planes, suscripciones y clientes, sólo lectura.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/suscripciones.md
