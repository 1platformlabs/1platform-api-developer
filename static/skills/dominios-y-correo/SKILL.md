---
name: dominios-y-correo
description: Registrar o conectar dominios, administrar su DNS y usar el correo del negocio sobre ellos con la 1Platform API.
---

# Dominios y correo

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
