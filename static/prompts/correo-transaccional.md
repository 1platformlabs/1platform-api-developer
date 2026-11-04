# Correo transaccional

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/correo-transaccional` y las skills `/skills/1platform-hub/SKILL`, `/skills/correo-transaccional/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `correo` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. El servicio viene apagado: mientras no esté habilitado, admitir un aviso responde
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
