---
name: sitios-web
description: Registrar sitios web propios, consultarlos y crear sitios servidos por la plataforma con la 1Platform API.
---

# Sitios web

Requiere la skill `1platform-hub`.

1. `GET /api/v1/users/websites/mine` (`listMyWebsites`) para los sitios del usuario y
   `GET /api/v1/users/websites/{website_id}` (`getWebsite`) para uno en particular.
2. `POST /api/v1/users/websites` para registrar un sitio propio y `PATCH /api/v1/users/websites/{website_id}` para
   actualizarlo.
3. Sitio servido por la plataforma con dominio: `POST /api/v1/provisioning/tenants` crea el trabajo y
   `GET /api/v1/provisioning/tenants/{job_id}` informa su avance.
4. Generar contenido tiene costo en el saldo: `POST /api/v1/posts/content/` sólo con confirmación del desarrollador;
   el resultado se consulta con `GET /api/v1/posts/content/jobs/{job_id}`.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/sitios-web-y-contenido.md
