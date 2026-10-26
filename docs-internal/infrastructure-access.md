# Integración de acceso

El portal incorpora «Acceder» en la barra de escritorio y en el drawer nativo.
El pie añade acceso y solicitud. Ambos destinos se construyen desde `WEBSITE_URL`;
el portal no procesa credenciales ni crea cuentas.

## Dependencia de publicación

El PR compañero de `1platform-website` (rama `fix/infrastructure-access`)
contiene el renderer y `docs/infrastructure-access/activation.json`.
Antes de publicar este portal, publicar el website y activar ambas rutas y
sus documentos EN/ES en el tenant `oneplatform`, siguiendo su README.
Comprobar 200 en `/es/acceso/` y `/es/solicitar-acceso/` antes del merge de
Developer. El manifiesto público medido el 26-10-2026 aún no las incluía.

Un PR de este repositorio publica QA automáticamente; su link continúa al
website configurado. Esa publicación no activa el tenant ni prueba login.
Producción sólo se publica al merge, fuera del alcance de esta integración.

## Verificación

`check:public-ui` comprueba la entrada y los enlaces del pie en docs y referencia,
con controles negativos. `check:docs-runtime` comprueba 320/390/844/1291/1440 px,
hit target sin solapamiento, drawer y Escape. Las pruebas locales bloquean red
externa; el resto del runtime y la búsqueda siguen cubiertos por sus guards.

Falta el banco real autorizado con
`/verify-epic-e2e 1platform-infraestructura-branding` usando el comando del
monorepo. Continuar desde `landing-access-developer` y `landing-access-website`
en `/Users/staimer/Documents/1platform-worktrees/`, rama
`fix/infrastructure-access` en ambos. Configurar website local, API/DB/seeds
privados, puertos propios y, si se prueba la referencia, `SCALAR_PROXY_URL=''`,
servidores Core/Atlas locales y CORS. Los checks no acreditan autenticación real.

`AGENTS.md` y `CLAUDE.md` del workspace no cambian.
