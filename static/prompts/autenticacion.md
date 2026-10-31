# Autenticación de la 1Platform API

Implemente en el servidor la capa de autenticación de la 1Platform API:

- Dos claves de larga vida, sólo en el servidor: aplicación (`ak-XXXX…`) y usuario (`sk-XXXX…`).
- `POST /api/v1/auth/token` con `{"apiKey": "<ak>"}` devuelve el token de aplicación en `data.access_token`.
- `POST /api/v1/users/token`, con `Authorization: Bearer <token de aplicación>`, devuelve el token de usuario.
- Cada llamada lleva `Authorization: Bearer <token de aplicación>` y `x-user-token: <token de usuario>`.
- Los tokens valen 30 minutos: guárdelos en memoria y renuévelos un par de minutos antes; los canjes tienen un
  límite de 10 por minuto, así que un canje por llamada termina en `429`.
- Ante un `401`, vuelva a canjear una vez y reintente; si sigue, propague el error. Un `401` responde con
  `detail`, no con el sobre `{success, data, msg}`.
- Una clave revocada deja de funcionar en el acto: no la cachee más allá del token que produjo.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/plataforma/autenticacion.md
