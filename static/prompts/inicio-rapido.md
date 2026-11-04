# Primera llamada a la 1Platform API

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/inicio-rapido` y las skills `/skills/1platform-hub/SKILL`.
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

Escriba en el servidor del proyecto un cliente mínimo de la 1Platform API, en QA:

1. Lea `ONEPLATFORM_APP_KEY` (`ak-XXXX…`) y `ONEPLATFORM_USER_KEY` (`sk-XXXX…`) de variables de entorno. Nunca las
   escriba en el código ni las mande al navegador.
2. Base: `https://api-qa.1platform.pro/api/v1`.
3. Canjee la clave de aplicación con `POST /api/v1/auth/token` (cuerpo `{"apiKey": "<ak>"}`) y guarde
   `data.access_token`.
4. Con `Authorization: Bearer <token de aplicación>`, canjee la clave de usuario con `POST /api/v1/users/token`.
5. Llame a `GET /api/v1/users/profile` con `Authorization: Bearer <token de aplicación>` y
   `x-user-token: <token de usuario>`, e imprima `data`.
6. Guarde los dos tokens en memoria y renuévelos antes de que venzan (30 minutos). No canjee en cada llamada.

Contrato: https://developer.1platform.pro/openapi/1platform-api.json. No invente campos que no estén ahí.
