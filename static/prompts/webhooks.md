# Webhooks de la 1Platform API

Implemente un receptor de webhooks de la 1Platform API:

1. Exponga un endpoint HTTPS `POST` que lea el **cuerpo crudo** antes de parsearlo.
2. Verifique `X-Webhook-Signature` (`sha256=<hex>`): HMAC-SHA256 con el secreto del espacio de trabajo sobre
   `"{X-Webhook-Timestamp}." + cuerpo crudo`, comparado en tiempo constante. Rechace con `401` una firma inválida
   y un `X-Webhook-Timestamp` con más de 5 minutos de desfase.
3. Procese cada evento una sola vez: guarde el par (identificador del recurso, evento) y responda `200` a un
   duplicado sin reprocesarlo.
4. Responda `2xx` rápido y haga el trabajo pesado en segundo plano; la plataforma reintenta lo que no recibe.
5. El secreto vive sólo en el servidor y la configuración de las URL se consulta con
   `GET /api/v1/webhooks/config/`.

Firma y ejemplos en tres lenguajes:
https://developer.1platform.pro/docs/saas/1platform-api/reference/webhooks-security.md
