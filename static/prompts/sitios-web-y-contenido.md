# Sitios web

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/sitios-web-y-contenido` y las skills `/skills/1platform-hub/SKILL`, `/skills/sitios-web/SKILL`, `/skills/contenido/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `sitios` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`.

1. `GET /api/v1/users/websites/mine` (`listMyWebsites`) para los sitios del usuario y
   `GET /api/v1/users/websites/{website_id}` (`getWebsite`) para uno en particular.
2. `POST /api/v1/users/websites` para registrar un sitio propio y `PATCH /api/v1/users/websites/{website_id}` para
   actualizarlo.
3. Sitio servido por la plataforma con dominio: `POST /api/v1/provisioning/tenants` crea el trabajo y
   `GET /api/v1/provisioning/tenants/{job_id}` informa su avance.
4. Generar contenido tiene costo en el saldo: `POST /api/v1/posts/content/` sólo con confirmación del desarrollador;
   el resultado se consulta con `GET /api/v1/posts/content/jobs/{job_id}`.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/sitios-web-y-contenido.md

Para el flujo de generación e indexación, lea también la skill `contenido`; el MCP no ejecuta esas escrituras.

