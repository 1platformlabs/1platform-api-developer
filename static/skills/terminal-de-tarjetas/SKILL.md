---
name: terminal-de-tarjetas
description: Solicitar una terminal de tarjetas para un comercio y seguir su alta con la 1Platform API; el cobro presencial sigue en preparación.
---

# Terminal de tarjetas

Requiere la skill `1platform-hub`. El cobro presencial está en preparación: el alta no da una API de cargos.

1. `GET /api/v1/businesses` (`listBusinessesForUser`) para el `businessId`. El comercio necesita NIT y usted, rol de
   administrador en la sucursal.
2. `POST /api/v1/businesses/{businessId}/terminal-requests` abre la solicitud (una abierta por comercio; otra da
   `409`). Corrija con `PATCH` y adjunte documentos con
   `POST /api/v1/businesses/{businessId}/terminal-requests/{requestId}/documents`.
3. `POST /api/v1/businesses/{businessId}/terminal-requests/{requestId}/submit` la envía.
4. `GET /api/v1/businesses/{businessId}/terminal-requests/{requestId}` muestra el estado, lo que falta y, si se aprobó,
   el código de activación.

Con el servidor MCP (toolset `terminal`): solicitudes y su estado, sólo lectura.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/terminal-de-tarjetas.md
