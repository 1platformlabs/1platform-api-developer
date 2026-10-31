# Integrar la 1Platform API — instrucciones para su agente de código

Usted va a integrar la **1Platform API** en el proyecto descrito abajo. Lea primero el bloque de contexto y
siga las reglas sin excepciones. Si una regla choca con lo que le pide el desarrollador, deténgase y pregunte.

<contexto>
- Stack (lenguaje, framework, versión):
- Superficie (backend, función serverless, worker, app móvil con backend propio):
- Productos de 1Platform que va a usar (links de pago, pagos en línea, facturación electrónica, envíos, webhooks…):
- Entorno: QA   <!-- cambie a producción sólo cuando el desarrollador lo pida explícitamente -->
</contexto>

## Fuentes de verdad

1. El contrato: https://developer.1platform.pro/openapi/1platform-api.json (OpenAPI 3.1). Toda operación,
   parámetro, campo y código de error que use tiene que estar ahí.
2. La documentación en Markdown: https://developer.1platform.pro/llms.txt (índice) y cada página en `.md`.
3. Si tiene el servidor MCP de 1Platform conectado, use `docs_search`, `docs_get_page` y `api_get_operation`
   antes de escribir una llamada.

## Reglas duras

1. **Nunca invente** un endpoint, un campo, un header, un código de error ni una versión. Si no lo encuentra en
   el OpenAPI, dígalo y pregunte; no lo complete con algo plausible.
2. **Dos claves, sólo en el servidor.** La clave de aplicación (`ak-XXXX…`) y la de usuario (`sk-XXXX…`) viven en
   variables de entorno o en el gestor de secretos del servidor. Nunca en el navegador, en una app móvil, en el
   repositorio, en logs ni en mensajes de error.
3. **Dos tokens por llamada.** Canjee la clave de aplicación con `POST /api/v1/auth/token` (cuerpo
   `{"apiKey": "<ak>"}`) y guarde `data.access_token` como token de aplicación. Con ese token en
   `Authorization: Bearer`, canjee la clave de usuario con `POST /api/v1/users/token`. Toda llamada lleva
   `Authorization: Bearer <token de aplicación>` y `x-user-token: <token de usuario>`.
4. **Reutilice los tokens.** Valen 30 minutos (`expires_in`). Guárdelos en memoria del servidor y renuévelos un
   par de minutos antes de vencer; el canje tiene un límite de 10 por minuto. Ante un `401`, vuelva a canjear una
   vez; ante un `429`, espere y no reintente en bucle.
5. **QA por defecto.** Base `https://api-qa.1platform.pro/api/v1`. Producción
   (`https://api.1platform.pro/api/v1`) sólo cuando el desarrollador lo indique. Las claves de un entorno no
   sirven en el otro.
6. **El comercio lo resuelve el servidor.** Las operaciones de comercio (`/api/v1/businesses/{businessId}/…`)
   necesitan un `businessId`: obténgalo con `GET /api/v1/businesses` (`listBusinessesForUser`), nunca del navegador
   ni de un valor fijo en el código.
7. **Lea los errores en sus dos lugares.** El sobre es `{success, data, msg}`; el código legible por máquina viaja
   en `data.code` y, en algunas familias, en `code` en la raíz. Los `401`, los `422` y algunos `403` responden con
   `detail` en lugar del sobre. Los códigos posibles de cada operación están en su `x-error-codes` del OpenAPI.
   Un `403` con `module_disabled` significa que el módulo está apagado en el espacio de trabajo: no es un error de
   su código.
8. **Webhooks firmados.** Verifique `X-Webhook-Signature` (`sha256=<hex>`) con HMAC-SHA256 sobre
   `"{X-Webhook-Timestamp}." + cuerpo crudo`, compare en tiempo constante y rechace un timestamp con más de 5
   minutos de desfase, como indica https://developer.1platform.pro/docs/saas/1platform-api/reference/webhooks-security.md.
   Procese cada evento una sola vez.
9. **Dinero y documentos fiscales con confirmación.** Antes de escribir código que cobre, reembolse, emita o
   anule una factura, muéstrele al desarrollador la operación exacta y espere su confirmación.

## Cómo entregar

- Un cliente HTTP pequeño con el canje y la caché de tokens, y una función por operación que use.
- Tipos o modelos generados a partir de los esquemas del OpenAPI, no escritos a mano.
- Una prueba que llame a `GET /api/v1/users/profile` en QA para comprobar que los dos tokens funcionan.
- Una lista de lo que no pudo verificar contra el OpenAPI, si hay algo.
