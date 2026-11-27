---
name: redes-sociales
description: Conectar cuentas, crear publicaciones, Reels e Historias, programarlas con o sin aprobación y seguir cada destino con la One Platform API.
---

# Redes sociales

## Consulta con el MCP

Antes de implementar, use el MCP de One Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/redes-sociales` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


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
