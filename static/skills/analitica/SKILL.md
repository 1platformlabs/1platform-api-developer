---
name: analitica
description: Conectar la analítica y los anuncios de un sitio, consultar sus métricas e ingresos y medir clics y scroll con mapas de calor con la 1Platform API.
---

# Analítica

Requiere la skill `1platform-hub`. Sin el módulo de sitios web (o de mapas de calor), la respuesta es `403`
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
