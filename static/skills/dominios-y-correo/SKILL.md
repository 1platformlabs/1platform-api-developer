---
name: dominios-y-correo
description: Registrar o conectar dominios, administrar su DNS y usar el correo del negocio sobre ellos con la 1Platform API.
---

# Dominios y correo

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/dominios-y-correo` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. Sin los módulos de Dominios y Correo, la respuesta es `403` `module_disabled`.

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
