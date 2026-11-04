# Dominios y correo

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/dominios-y-correo` y las skills `/skills/1platform-hub/SKILL`, `/skills/dominios-y-correo/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `dominios,correo` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Sin los módulos de Dominios y Correo, la respuesta es `403` `module_disabled`.

1. `GET /api/v1/domains/check` para disponibilidad y precio, y `GET /api/v1/domains` para los dominios del usuario.
2. Registrar (`POST /api/v1/domains`) y renovar (`POST /api/v1/domains/{domain_id}/renew`) se pagan con el saldo:
   sólo con confirmación del desarrollador. Un dominio comprado en otro lado se conecta con
   `POST /api/v1/domains/external` y se comprueba con `POST /api/v1/domains/{domain_id}/verify`.
3. `PUT /api/v1/domains/{domain_id}/dns` **reemplaza todos** los registros: envíe siempre la lista completa.
4. Correo: `POST /api/v1/domains/{domain_id}/mail/addresses` crea la dirección. `GET /api/v1/mail/threads` y
   `GET /api/v1/mail/threads/{thread_id}` leen las conversaciones. Iniciar o responder envía correo real y exige
   `Idempotency-Key`: sólo con confirmación del desarrollador.

Con el servidor MCP (toolset `dominios` y `correo`): dominios, disponibilidad, precios, transferencias, registros de
correo y conversaciones, sólo lectura. Registrar, renovar, cambiar DNS y enviar correo se hace por la API.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/dominios-y-correo.md
