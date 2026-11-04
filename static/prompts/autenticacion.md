# Autenticación de la 1Platform API

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/plataforma/autenticacion` y las skills `/skills/1platform-hub/SKILL`.
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

Implemente en el servidor la capa de autenticación de la 1Platform API:

- Dos claves de larga vida, sólo en el servidor: aplicación (`ak-XXXX…`) y usuario (`sk-XXXX…`).
- `POST /api/v1/auth/token` con `{"apiKey": "<ak>"}` devuelve el token de aplicación en `data.access_token`.
- `POST /api/v1/users/token`, con `Authorization: Bearer <token de aplicación>`, devuelve el token de usuario.
- Cada llamada lleva `Authorization: Bearer <token de aplicación>` y `x-user-token: <token de usuario>`.
- Los tokens valen 30 minutos: guárdelos en memoria y renuévelos un par de minutos antes; los canjes tienen un
  límite de 10 por minuto, así que un canje por llamada termina en `429`.
- Ante un `401`, vuelva a canjear una vez y reintente; si sigue, propague el error. Un `401` responde con
  `detail`, no con el sobre `{success, data, msg}`.
- Una clave revocada deja de funcionar en el acto: no la cachee más allá del token que produjo.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/plataforma/autenticacion.md
