# Analítica

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/analitica` y las skills `/skills/1platform-hub/SKILL`, `/skills/analitica/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `analitica` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Sin el módulo de sitios web (o de mapas de calor), la respuesta es `403`
`module_disabled`.

1. Tráfico: el usuario autoriza con la URL de `GET /api/v1/analytics/oauth/authorize`; confirme con
   `GET /api/v1/analytics/oauth/status`. `POST /api/v1/analytics/setup` crea la propiedad (`202`) y
   `GET /api/v1/analytics/status` sigue la creación hasta `active`.
2. Instale la etiqueta de `GET /api/v1/analytics/streams/tag` en el `<head>` del sitio y consulte
   `GET /api/v1/analytics/overview`, `GET /api/v1/analytics/page` o `GET /api/v1/analytics/realtime`.
3. Anuncios: autorización con `GET /api/v1/adsense/oauth/authorize`, vínculo con `POST /api/v1/adsense/connect` e
   ingresos con `GET /api/v1/adsense/earnings/overview`. El desglose por página y las alertas responden `403` sin un
   plan que las incluya.
4. Mapas de calor: `POST /api/v1/users/heatmap/sites` registra el sitio y entrega la etiqueta;
   `GET /api/v1/users/heatmap/sites/{site_id}/pages` y `GET /api/v1/users/heatmap/sites/{site_id}/maps/{kind}` leen
   los resultados.

Con el servidor MCP (toolset `analitica`): estado y métricas, ingresos y alertas de anuncios, sitios y páginas de mapas
de calor. Autorizar, crear la propiedad y registrar sitios se hace por la API.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/analitica.md
