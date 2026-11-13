# Webhooks de la 1Platform API

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/plataforma/webhooks` y las skills `/skills/1platform-hub/SKILL`, `/skills/webhooks/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `cuenta` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Implemente un receptor de webhooks de la 1Platform API:

1. Exponga un endpoint HTTPS `POST` que lea el **cuerpo crudo** antes de parsearlo.
2. Verifique `X-Webhook-Signature` (`sha256=<hex>`): HMAC-SHA256 con el secreto del espacio de trabajo sobre
   `"{X-Webhook-Timestamp}." + cuerpo crudo`, comparado en tiempo constante. Rechace con `401` una firma inválida
   y un `X-Webhook-Timestamp` con más de 5 minutos de desfase.
3. Procese cada evento una sola vez: guarde el par (identificador del recurso, evento) y responda `200` a un
   duplicado sin reprocesarlo.
4. Responda `2xx` rápido y haga el trabajo pesado en segundo plano; la plataforma reintenta lo que no recibe.
5. El secreto vive sólo en el servidor y la configuración de las URL se consulta con
   `GET /api/v1/webhooks/config/`.
6. Hay ocho eventos: siete de transacciones (`on_approved`, `on_denied`, `on_cancelled`, `on_expired`,
   `on_dismiss`, `on_refunded`, `on_reversed`) y `on_terminal_charge_completed`, el final de un cobro remoto a
   terminal. Este último trae `{"event": "terminal_charge.completed", "data": {...}}` con `amount` como texto y un
   `status` final (`approved`, `denied`, `cancelled`, `expired`, `timeout` o `unreconciled`); puede llegar un segundo
   evento `approved` del mismo cobro. Deduplíquelo por `X-1Platform-Event-Id`. Cuerpo:
   https://developer.1platform.pro/docs/saas/1platform-api/reference/webhooks-payload.md

Firma y ejemplos en tres lenguajes:
https://developer.1platform.pro/docs/saas/1platform-api/reference/webhooks-security.md

El MCP permite consultar la documentación de webhooks, pero no administra sus destinos ni sus secretos.
