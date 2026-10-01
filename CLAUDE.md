# 1Platform API Developer

Portal técnico de una sola identidad pública: **1Platform**. No resuelve tenants
ni permite elegir marca. La guía de entrada es
`/docs/saas/1platform-api/getting-started`; las guías de Atlas describen un producto
independiente de 1Platform Labs y conservan sus rutas técnicas.

## Entorno y comandos

Los manifiestos mandan: Docusaurus 3.9.2, React 19, TypeScript 5.6,
`@scalar/docusaurus` 0.7.36, Node 24, pnpm 10.34.5. No actualizar dependencias
como parte de un ajuste visual. Instalar con `pnpm install --frozen-lockfile`.

- `pnpm start`: desarrollo en 3001
- `pnpm typecheck`: TypeScript real; build sólo transpila
- `pnpm build`: genera `build/`, sin descargar contratos
- `pnpm serve`: sirve la build en 3001
- `pnpm fetch-openapi`: refresca ambas referencias públicas y sanea ejemplos
- `pnpm check:tells`, `pnpm check:chrome-contrast`, `pnpm check:contract`,
  `pnpm check:anchors`, `pnpm check:openapi-examples`, `pnpm check:public-ui`
- Cada guard tiene `:self-test`; ejecutar ambos antes de abrir PR
- `pnpm check:reference`: valida aliases de operaciones contra ambos contratos;
  incluye sus casos sintéticos en el mismo comando
- `pnpm check:scalar-environment`: prueba configuración y aislamiento de servidores,
  proxy directo, URLs rechazadas y defaults, sin llamadas de red

`WEBSITE_URL` y `DEVELOPER_URL` configuran orígenes HTTP(S) sin credenciales,
con defaults `https://1platform.pro` y `https://developer.1platform.pro`.
Usar el origen del website real del banco local para probar enlaces cruzados;
no guardar localhost en el código, los contratos ni los destinos públicos.

## Diseño aprobado

Fuente visual vigente: épica `1platform-infraestructura-branding`, prototipo
`prototipo/documentacion/` DEL WORKSPACE RAÍZ. La copia antigua de
`developer-docs-photographic-prototype` es histórica. No modificar el prototipo
para acomodar diferencias de producto. Comparar capturas equivalentes en
escritorio, 360/390/430 y horizontal; tolerancia geométrica de ±2 px en elementos
comparables. Builds, guards y capturas con dimensiones correctas no prueban fidelidad.

Los tokens canónicos son `src/styles/brand-tokens.json` del website; este repo
mantiene su espejo exacto en `src/css/brand-tokens.json`. Docusaurus los inyecta
como `--brand-*`; `src/css/custom.css` define roles y mapas Infima/Scalar. Los
roles de marca no llevan hex repetidos en los componentes.

- Navy `#0d1c3a`, navy profundo `#08152f`, azul `#2854a7`
- Texto `#172640`, texto secundario `#5c697b`
- Superficie secundaria `#f2f5f7`, selección `#edf2fa`
- Manrope variable autoalojada para interfaz; JetBrains Mono para código
- Navbar navy OPACO, lectura clara, código navy uniforme; colores HTTP funcionales
- Navegación: Soluciones, Infraestructura, IA, Blog, Documentación, Contacto
- CTA: Hablemos de su proyecto, `https://wa.me/50253946564`
- Documentación abre Primeros pasos, sin portada intermedia
- Copy comercial formal, sin punto final en títulos y subtítulos

Mantener navbar y footer coordinados con el website. Conservar búsqueda local,
skip link, foco visible, menús técnicos y drawer nativo; targets de al menos 44 px.
No swizzlear Navbar, Layout ni Root. El masthead usa un wrapper de DocRoot/Layout.
No controles de animación nuevos, proveedores internos ni claims sin evidencia.
El gradiente del token `--masthead-shade` sólo asegura contraste sobre la foto
aprobada; no habilita gradientes decorativos arbitrarios.

## Referencia viva con Scalar

`plugins/scalar-reference/index.cjs` delega assets/configuración al plugin oficial
mediante sus hooks Docusaurus y cambia sólo el componente anfitrión de la ruta.
`src/components/ApiReferencePage` coloca el título/tabs antes del contenedor y usa
la API pública `window.Scalar.createApiReference`. El runtime está fijado en CDN a
1.72.3; una actualización requiere repetir revisión funcional y visual.

No sustituir Scalar por `reference.json`, el renderer ni las operaciones HTML del
prototipo. Scalar conserva búsqueda, catálogo, autenticación, parámetros, esquemas,
respuestas, ejemplos, selector de entorno, descargas y constructor de solicitudes.
La envoltura destruye la instancia al salir y permite reintentar errores de carga.
`agent.disabled` y `mcp.disabled` deshabilitan asistentes y conectores externos
sin configurar, también en localhost. Se mantienen los clientes HTTP nativos.
La localización oficial `locale: 'es'` traduce el chrome de Scalar; su entrada
móvil nativa se rotula «Explorar endpoints». No traduce ni reescribe el contrato.
Estas opciones están documentadas en la [configuración oficial de Scalar](https://scalar.com/products/api-references/configuration).
Scalar 1.72.3 no ofrece una opción de nivel de heading para su introducción.
Conservar su semántica nativa: Core agrega dos `h1` del contrato al `h1` del
anfitrión. No parchear el DOM ni modificar u ocultar `info.title`/`info.description`
para obtener un solo tag. El guard del build comprueba sólo el anfitrión SSR;
no presentar su resultado como una afirmación de un único `h1` en runtime.
Los hashes existentes por tag/método/ruta se mantienen; `#operation/<operationId>`
se traduce al hash nativo a partir del contrato cargado, sin lista fija de endpoints.

Referencias: `/api-reference/1platform-api` y `/api-reference/atlas-api`.
Copias completas bajo `static/openapi/`, fuentes públicas sobrescribibles mediante
`ONEP_API_OPENAPI_URL` y `ATLAS_API_OPENAPI_URL`. No hay fetch implícito durante build.
El fetch usa un límite de 30 segundos y no imprime URLs configuradas ni errores
que puedan contener credenciales. Mantiene el fallback histórico al cache con
WARN explícito si falla la red.
Revisar ese resultado: fallback no equivale a contrato fresco.

`openapi-examples.mjs` sustituye únicamente valores ilustrativos de claves/JWT en
`example`, `examples`, `default` y ejemplos de credenciales en `description`. No altera paths, métodos, required, schemas,
security ni nombres de campos. El guard no imprime credenciales. No pegar ejemplos
reales en documentación, logs ni PRs.

La fuente Core todavía describía los JWT como `ak-...`/`sk-...` en sus dos
`securitySchemes`, aunque `bearerFormat` ya era `JWT`. `openapi-auth-descriptions.mjs`
corrige únicamente esas dos descripciones al publicar. Evidencia: el backend
`app/dependencies/auth.py` decodifica JWT de ambos headers y
`app/services/auth/{app_token_service,auth_service}.py` los genera. El guard prueba
inmutabilidad y preservación de type/scheme/bearerFormat/in/name/security/operaciones;
un cambio estructural aguas arriba exige revisar la adaptación, no reconstruir el
esquema. No se modificó el backend.

## Contenido, autenticación y compatibilidad

El contrato OpenAPI es fuente de requests/responses/esquemas. La prosa explica
orden y motivo, y enlaza las operaciones. Conservar el guard de drift y sus
excepciones existentes para formatos comunes y webhooks salientes.

Las claves API NO son los JWT de headers: canjear la clave de aplicación por JWT
en `POST /api/v1/auth/token` y la del usuario en `POST /api/v1/users/token` con el
JWT de aplicación. Llamadas protegidas usan `Authorization: Bearer $APP_TOKEN`
y `x-user-token: $USER_TOKEN`. La primera consulta es `/api/v1/users/profile`;
`/users/me` no existe en el contrato verificado.

Raíz, `/docs`, `/docs/quick-start` y la antigua vista general Core redirigen a
Primeros pasos. `/api-docs` redirige a la referencia Core. Mantener aliases de
flows/webhooks/productos retirados y rutas técnicas de Atlas. Las entradas públicas
tienen también 301 en el `.htaccess` de QA y el nginx activo de PROD, conservando
query. `pnpm check:serving` usa Docker/nginx 1.27 local para comprobar ambas
formas de los aliases, destinos, rutas reales, 404 y aislamiento por Host.
No copiar noindex del
prototipo. Mantener canonical/hreflang/sitemap; fuente española única, sin selector
de idioma porque no existe una segunda traducción.

## CI y entrega

PR: typecheck, build, guards+self-tests, CodeQL y SonarCloud informativo. El PR
también dispara build/deploy de QA (`developer-qa.1platform.pro`) automáticamente.
El merge a main dispara producción: no mergear como parte de implementación.
La versión de publicación se calcula desde tags en el pipeline productivo, sin
reescribir `package.json`; no adelantar ese bump en un PR de implementación.
QA usa cPanel. PROD usa nginx/SSH; el job cPanel productivo tiene `if: false`.
El probe de QA compara `index_sha` contra `/index.html` explícitamente y exige
`.deployed_version` exacta, sin cuarentena de esa versión. El adaptador propio
de QA hace efectiva su configuración y conserva el core original como backup;
ver `deploy/cpanel/README.md`. La comprobación productiva valida root301 con
Location exacta, index/guía200 y negativos404, y su healthcheck usa `/index.html`.
la raíz pública `/` ahora responde 301 hacia la guía y devuelve otros bytes al
seguir ese redirect. No reemplazar el fingerprint por un mero HTTP 200 ni una
coincidencia temporal anterior al estado terminal.

`check:public-ui` lee HTML real, metadatos, CTA, búsqueda, accesibilidad y budgets.
Sus capturas son evidencia de revisión separada: comprobar dimensiones no acredita el
contenido. Archivar diferencias y comparaciones actuales en la épica.

Al cerrar implementación pedir `/verify-epic-e2e 1platform-infraestructura-branding`
usando `.claude/commands/verify-epic-e2e.md` DEL MONOREPO. Necesita autorización
humana, worktree/branch actuales, puertos separados, API/DB/seeds privados para
operaciones autenticadas. No llamar una API productiva mutante para probar el UI.

Banco local previsto: portal en `http://localhost:3301` y website en su origen
local configurado. Antes de construirlo, declarar `SCALAR_PROXY_URL=''` para
desactivar el proxy remoto, `ONEP_API_SERVER_URL` con el origen del Core local y
`ATLAS_API_SERVER_URL` con el de Atlas local si se verifica esa referencia. La
opción pública `servers` de Scalar afecta sólo la instancia correspondiente y no
modifica los archivos del contrato. Usar orígenes sin `/api/v1`: las operaciones ya
incluyen ese prefijo. Cada API debe permitir CORS desde el origen exacto del portal,
incluidos los headers de autenticación del contrato. Son necesarios DB privada,
seeds de aplicación/usuario y canje de claves por JWT válidos para el banco.

Sin esas variables, se conservan los servidores publicados y el proxy predeterminado.
Un proxy vacío significa solicitudes directas; un servidor vacío es un error.
URLs de servidor: sólo origen HTTPS, o HTTP en localhost/`.localhost`/127.0.0.0/8/::1.
URLs del proxy pueden incluir path con las mismas reglas de transporte. Ambos
rechazan credenciales, query y fragmentos, y sus errores no imprimen valores.
La validación usa casos positivos/negativos, no accede a APIs ni simula E2E.
