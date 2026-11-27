# Redes sociales

## Antes de implementar con el MCP

Use el MCP de One Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/redes-sociales` y las skills `/skills/1platform-hub/SKILL`, `/skills/redes-sociales/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `social` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos o
comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Requiere la skill `1platform-hub`. Redes sociales se habilita por espacio de trabajo: consulte primero
`GET /api/v1/social/config` (`enabled`, redes disponibles, aprobación, precio, `formats_enabled` y `format_rules`).

1. Un administrador conecta las cuentas: `POST /api/v1/social/connection/{network}/authorize` (URL para una ventana
   emergente), `GET /api/v1/social/connection/{network}/pages` y `POST /api/v1/social/accounts`.
2. `POST /api/v1/social/media` sube cada imagen o video (`multipart/form-data`, parte `file`).
3. `POST /api/v1/social/posts` crea un borrador con `text`, `media_ids` y `account_ids`. En `instagram` y `facebook`
   el formato va en `network_options.instagram|facebook.format`: `post` (predeterminado), `reel` (un video) o `story`
   (una imagen o un video de 3 a 60 s; la red no muestra el texto). Errores: `422` `social_format_media`,
   `social_video_too_short`, `social_video_too_long` y `409` `social_format_unavailable`.
4. `PATCH /api/v1/social/posts/{post_id}` combina `network_options` por clave: omitir `instagram`/`facebook` conserva
   el formato y `null` lo borra.
5. `POST /api/v1/social/posts/{post_id}/submit` con `publish_at` programa o envía a aprobación. Programar deja la
   publicación en cola para salir en la red, donde se cobra: no lo ejecute sin confirmación del desarrollador.
6. `GET /api/v1/social/posts/{post_id}` muestra cada destino (`targets`): estado, formato, `permalink`, `failure_code`
   y `hold_reason`. Un destino `uncertain` se resuelve con `POST /api/v1/social/targets/{target_id}/resolve`.

Con el servidor MCP (toolset `social`): leer configuración, cuentas, publicaciones, calendario, comentarios y analítica;
crear y editar un borrador con su formato, programarlo, moverlo y cancelarlo. Publicar al instante, aprobar y
responder comentarios van por REST.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/redes-sociales.md
