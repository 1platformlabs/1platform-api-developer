---
name: 1platform-hub
description: Punto de partida para integrar la 1Platform API — claves y tokens, entornos, sobre de respuesta y errores. Úsela antes que cualquier receta de producto.
---

# 1Platform API — punto de partida

Lea esta skill antes de cualquier receta de producto de 1Platform. Las recetas dan por hechas estas reglas.

## Fuentes de verdad

- Contrato: https://developer.1platform.pro/openapi/1platform-api.json. Nunca invente una operación, un campo o un
  código de error que no esté ahí.
- Documentación en Markdown: https://developer.1platform.pro/llms.txt.

## Credenciales y tokens

1. Dos claves de larga vida, **sólo en el servidor**: aplicación (`ak-XXXX…`) y usuario (`sk-XXXX…`). Se piden
   desde el Panel, sección API; las de QA y producción son distintas.
2. `POST /api/v1/auth/token` con `{"apiKey": "<ak>"}` → token de aplicación en `data.access_token`.
3. `POST /api/v1/users/token`, con `Authorization: Bearer <token de aplicación>` → token de usuario.
4. Cada llamada: `Authorization: Bearer <token de aplicación>` y `x-user-token: <token de usuario>`.
5. Los tokens valen 30 minutos. Guárdelos en memoria y renuévelos antes; el canje admite 10 por minuto.

## Entornos

| Entorno | Base |
|---|---|
| QA (por defecto) | `https://api-qa.1platform.pro/api/v1` |
| Producción | `https://api.1platform.pro/api/v1` |

QA se pide al contacto comercial. Cambie a producción sólo cuando el desarrollador lo indique.

## Respuestas y errores

- Sobre: `{success, data, msg}`. El código legible por máquina está en `data.code` o, en algunas familias, en
  `code` en la raíz: lea los dos.
- `401`, `422` y algunos `403` responden con `detail` en lugar del sobre.
- `403` con `module_disabled`: el módulo está apagado en el espacio de trabajo; no es un error del código.
- `429`: espere; no reintente en bucle. `402`: saldo insuficiente.
- Los códigos de cada operación están en su `x-error-codes` del OpenAPI.

## Comercio

Las operaciones de comercio necesitan un `businessId`: obténgalo con `GET /api/v1/businesses`
(`listBusinessesForUser`). Nunca lo tome del navegador ni lo fije en el código.
