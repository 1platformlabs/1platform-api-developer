# Documentación de 1Platform

Portal Docusaurus para integrar las APIs de 1Platform y Atlas. La entrada pública
abre **Primeros pasos** directamente; la referencia interactiva conserva Scalar.

```bash
pnpm install --frozen-lockfile
pnpm start
pnpm typecheck
pnpm build
```

Use Node 24 y la versión pnpm del manifiesto. Consulte [CLAUDE.md](CLAUDE.md) para
arquitectura, diseño aprobado, fuentes visuales, autenticación, guards y entrega.

- Guía: `/docs/saas/1platform-api/getting-started`
- Referencia Core: `/api-reference/1platform-api`
- Referencia Atlas: `/api-reference/atlas-api`
- Producción: `https://developer.1platform.pro`

El portal tiene una única marca pública. `WEBSITE_URL` y `DEVELOPER_URL` configuran
los orígenes del entorno, sin resolución de tenant. El contacto comercial es
`https://wa.me/50253946564`.

`pnpm fetch-openapi` actualiza ambas copias públicas en `static/openapi/` y sustituye
valores ilustrativos de credenciales. Build no hace descargas. El número de
operaciones se deriva del contrato, nunca del snapshot visual del prototipo.
Una adaptación de publicación corrige las dos descripciones de autenticación
heredadas que llamaban `ak-...`/`sk-...` a los JWT. Conserva los esquemas, headers,
requisitos y operaciones; su guard verifica esa preservación.

La identidad vigente usa Manrope, navy opaco y tokens compartidos con el website.
No sustituya el renderer de Scalar ni retire su búsqueda, autenticación o esquemas
para aproximar una captura. La revisión visual se hace por separado de los guards.

La capa de integración cambia únicamente el anfitrión de las rutas del plugin;
no vuelve a implementar operaciones. El HTML inicial tiene el título de la página.
Al cargar, Scalar agrega su título y el título Markdown del contrato: la referencia
Core conserva esos tres `h1` visibles. No se altera el contrato ni su renderer para
reducirlos, y el guard del HTML inicial no acredita la jerarquía completa del runtime.

La revisión local de esta épica sirve `build-local/` en 4473, con enlaces al website
en `http://1platform.localhost:4460`. Ese preview y las sondas públicas de contratos
son independientes del banco de APIs, DB y autenticación de `/verify-epic-e2e`.

Para ese banco, `SCALAR_PROXY_URL=''` desactiva el proxy externo y permite llamadas
directas. `ONEP_API_SERVER_URL` y `ATLAS_API_SERVER_URL` reemplazan sólo los servidores
del runtime de cada referencia; no reescriben OpenAPI. Configure los orígenes de las
APIs del banco, sin `/api/v1` (las rutas del contrato ya lo incluyen), y habilite CORS
para el origen del portal, previsto en `http://localhost:3301`. Las APIs, DB privada,
seeds y claves de prueba pertenecen al banco autorizado; no a este preview visual.
Las URL configuradas requieren HTTPS excepto loopback HTTP, y rechazan credenciales,
query y fragmentos. Si las variables no existen, se conservan el proxy y servidores
públicos actuales. `pnpm check:scalar-environment` verifica estas reglas sin red.

Los PRs ejecutan CI y el canal QA automáticamente. El merge despliega producción;
la épica de branding entrega PR para revisión, sin merge ni despliegue productivo.
QA usa cPanel y exige checksum + estado terminal del activador. Producción usa
nginx; su canal cPanel permanece deshabilitado. `pnpm check:serving` requiere
Docker y prueba la configuración real de nginx 1.27 con el build local, en un
puerto loopback efímero. No es una ejecución del banco de APIs ni de producción.
