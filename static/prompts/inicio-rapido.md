# Primera llamada a la 1Platform API

Escriba en el servidor del proyecto un cliente mínimo de la 1Platform API, en QA:

1. Lea `ONEPLATFORM_APP_KEY` (`ak-XXXX…`) y `ONEPLATFORM_USER_KEY` (`sk-XXXX…`) de variables de entorno. Nunca las
   escriba en el código ni las mande al navegador.
2. Base: `https://api-qa.1platform.pro/api/v1`.
3. Canjee la clave de aplicación con `POST /api/v1/auth/token` (cuerpo `{"apiKey": "<ak>"}`) y guarde
   `data.access_token`.
4. Con `Authorization: Bearer <token de aplicación>`, canjee la clave de usuario con `POST /api/v1/users/token`.
5. Llame a `GET /api/v1/users/profile` con `Authorization: Bearer <token de aplicación>` y
   `x-user-token: <token de usuario>`, e imprima `data`.
6. Guarde los dos tokens en memoria y renuévelos antes de que venzan (30 minutos). No canjee en cada llamada.

Contrato: https://developer.1platform.pro/openapi/1platform-api.json. No invente campos que no estén ahí.
