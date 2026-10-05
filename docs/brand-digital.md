---
title: Integración de la identidad digital
draft: true
---

# Integración de la identidad digital

Registro interno del 2026-10-04. `draft: true` excluye este documento del portal
público construido. Rama `feat/landing-logos-digital`, base `ee8ade2`.

## Alcance

`src/theme/Logo` utiliza el logo digital v2 existente en el prototipo canónico
de infraestructura. El componente ya es compartido por cabecera, menú móvil y
footer: no se duplica el marcado del pie. El nombre accesible del enlace y su
destino configurado se conservan. `docusaurus.config.ts` apunta al favicon de
esa misma identidad.

Se preservan Manrope, navegación, tokens, contenido editorial, búsqueda y
Scalar. No se modifican contratos, orígenes públicos por defecto ni dependencias.

## Procedencia y encuadre

Los dos archivos de `static/img/brand/` se copiaron sin modificaciones desde
el root del workspace. No hay regeneración ni edición de bitmaps.

| Archivo | SHA-256 |
| --- | --- |
| `1platform-logo-v2-digital.png` | `cfee773b722a46f69937e83f00e5496412108d656cd3c86993ede41f2cbc1e08` |
| `1platform-favicon-v2-digital.ico` | `9719d368d6261c6fc04f1a25ee331b3e687039ee8f78da9098c6a06eba194bc0` |

El PNG mide 2042 × 770. El marco CSS usa el bounding box de alpha > 8 con
2 px de margen: `(119, 193, 1932, 548)`, igual al prototipo. La imagen se
posiciona proporcionalmente dentro de un marco con `overflow: hidden`, sin
alterar sus bytes ni proporciones. El logo ocupa 180 × 35,25 px en escritorio
y en el footer, o 160 × 31,33 px en las cabeceras móviles de hasta 680 px.
La superficie interactiva conserva un mínimo de 46 px.

`filter: brightness(0) invert(1)` muestra la marca en blanco en sus tres
superficies oscuras. El favicon conserva los colores del archivo original.

## Verificación local

Entorno: Node 24.18.0 y pnpm 10.34.5. Dependencias instaladas mediante
`pnpm install --frozen-lockfile`; lockfile sin cambios.

| Comando | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | Correcto |
| `pnpm typecheck` | Correcto |
| `pnpm build` | Correcto; advertencias conocidas de anclas de Scalar |
| `pnpm check:tells` y `pnpm check:tells:self-test` | Correctos |
| `pnpm check:chrome-contrast` y `pnpm check:chrome-contrast:self-test` | Correctos |
| `pnpm check:public-ui` y `pnpm check:public-ui:self-test` | Correctos |
| `pnpm check:editorial-tone` | Correcto, 70 documentos/categorías |
| `pnpm check:anchors` | Correcto, 126 anclas contra el contrato |
| `git diff --check` | Correcto |

`check:public-ui` midió 180646/184320 bytes gzip de JS inicial,
419100/430080 de JS total y 21919/25600 de CSS. Sus cuatro capturas existentes
sólo pasaron la comprobación de dimensiones; no son evidencia visual nueva.

Comprobación del HTML construido en Inicio, referencia Core y referencia Atlas:
logo presente en cabecera, drawer nativo y footer; favicon correcto. Ambos assets
mantienen el SHA-256 del original en `static/` y `build/`. El documento interno
queda fuera de su ruta pública y del sitemap por `draft: true`.

Las advertencias de build corresponden al catálogo de Scalar generado en runtime,
como documenta `CLAUDE.md`; el guard específico verifica las anclas del contrato.
No se modificó ni debilitó ningún guard.

## Preview para revisión

```bash
export PATH="/Users/staimer/.nvm/versions/node/v24.18.0/bin:$PATH"
pnpm exec docusaurus serve --host 127.0.0.1 --port 4493 --no-open
```

Se sirve `build/` en `http://127.0.0.1:4493/`. Entrada:
`/docs/saas/1platform-api/getting-started`; referencia: `/api-reference/1platform-api`.
Este build conserva los orígenes públicos por defecto. Una revisión de enlaces
cruzados con el website local requiere un build independiente configurado con
`WEBSITE_URL` y `DEVELOPER_URL`; no se guardan destinos localhost en el código.

El coordinador revisó en Chrome la cabecera de escritorio y, a 360 px, la
cabecera y el drawer nativo con el nuevo logo. Las capturas históricas del
repositorio no certifican esta identidad. No se ejecutó el banco con APIs,
base de datos privada ni autenticación real. Entrega mediante una rama de
integración; sin merge ni publicación productiva por esta tarea.

`CLAUDE.md` no cambia: mantiene vigente el contrato del prototipo canónico y sus
reglas de entrega. Los archivos `AGENTS.md` y `CLAUDE.md` del workspace tampoco
se modifican.
