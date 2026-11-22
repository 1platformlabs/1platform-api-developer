# Prospección

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/prospeccion` y las skills `/skills/1platform-hub/SKILL`, `/skills/prospeccion/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `prospeccion` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. Prospección está en preparación: nace apagada y la habilita el equipo de la
plataforma; apagada, `403` con `data.code` `prospecting_disabled`.

1. `GET /api/v1/prospecting/goals/{goalId}/readiness` dice qué falta: canal, reunión, ventas, agente y precio.
2. `POST /api/v1/prospecting/goals` crea el objetivo. Nace en modo borrador: no se envía nada.
3. Prospectos: `POST .../prospects` o `POST .../prospects/import`; el tablero es `GET .../board`.
4. Los borradores se guardan con `PUT /api/v1/prospecting/prospects/{prospectId}/messages/{sequence}`; las reglas
   incumplidas llegan en `checks`.
5. Aprobar, enviar y marcar enviado los hace una persona. Nunca los ejecute por iniciativa propia: `POST
   /api/v1/prospecting/messages/{messageId}/approve` exige el `content_hash` revisado y `.../send` contacta a un
   tercero real, sólo con confirmación del desarrollador y con el objetivo en modo real.
6. Un `409` trae `data.code`; los topes diarios son `prospecting_daily_cap`, no `429`.

Con el servidor MCP (toolset `prospeccion`): objetivos, preparación, embudo, métricas y prospectos sin datos de
contacto; alta e importación de prospectos. El MCP no aprueba, envía, marca enviado, cambia el modo, traspasa,
excluye empresas ni lee datos de contacto.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/prospeccion.md
