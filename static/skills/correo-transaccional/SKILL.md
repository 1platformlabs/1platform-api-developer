---
name: correo-transaccional
description: Enviar avisos individuales desde una dirección verificada, con idempotencia, y consultar cupos y entrega con la 1Platform API.
---

# Correo transaccional

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/correo-transaccional` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. El servicio viene apagado: mientras no esté habilitado, admitir un aviso responde
`503` `transactional_email_disabled`.

1. `GET /api/v1/transactional-email/senders` para el remitente verificado y
   `GET /api/v1/transactional-email/limits` para cupos y reinicio.
2. `GET /api/v1/transactional-email/templates` para elegir la plantilla.
3. `POST /api/v1/transactional-email/messages` con clave de idempotencia envía correo real a una persona: sólo con
   confirmación del desarrollador. `202` confirma admisión, no entrega; repetir la misma clave devuelve el mismo
   mensaje. `422` `sender_not_verified` y `429` por cupo son rechazos, no fallas.
4. `GET /api/v1/transactional-email/messages/{message_id}` para el estado y los intentos, y
   `GET /api/v1/transactional-email/messages` para el historial.

Con el servidor MCP (toolset `correo`): remitentes, plantillas, cupos y mensajes. El MCP no envía correos.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/correo-transaccional.md
