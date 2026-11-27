# Base de conocimiento

## Antes de implementar con el MCP

Use el MCP de One Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/base-de-conocimiento` y las skills `/skills/1platform-hub/SKILL`,
`/skills/base-de-conocimiento/SKILL`. Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a
implementar: valide método, ruta, campos, autenticación y errores. No invente operaciones cuando el contrato no las
encuentre.

Para las herramientas operativas, compruebe qué herramientas de la base lista su cliente.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos o
comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API. Indexar un documento
y cada búsqueda se cobran del saldo.

## Implementación

Use la skill `1platform-hub`. Sólo un administrador del espacio de trabajo administra la base (`403` `forbidden`);
apagada, `403` con `knowledge_disabled` o `module_disabled`. El espacio es siempre el de la cuenta que llama.

1. `POST /api/v1/knowledge/sources` (`createKnowledgeSource`) sube un documento en `multipart/form-data`: `file`
   (PDF, DOCX, TXT o Markdown), `title` y `audience` (`public` o `internal`, obligatoria). Responde `201` en
   `pending`; la indexación corre en segundo plano y se cobra antes de que el documento se pueda buscar.
2. `GET /api/v1/knowledge/sources` (`listKnowledgeSources`) lista las fuentes con su `status`; consulte hasta
   `ready` o `failed` (`failure_code` dice por qué; sin saldo, `insufficient_balance`).
3. `GET|PUT /api/v1/knowledge/sync` (`getKnowledgeSync`, `updateKnowledgeSync`) elige si entran las preguntas
   frecuentes publicadas (`faqs`) y qué sitios (`website_ids`, sólo los `eligible`). Sin cobro; apagar quita en el
   acto lo que aportó.
4. `POST /api/v1/knowledge/search` (`searchKnowledge`) prueba una búsqueda en fuentes públicas e internas. Se cobra
   siempre, también sin resultados (`charged`); no la ejecute sin confirmación del desarrollador.
5. `GET /api/v1/knowledge/usage` (`getKnowledgeUsage`) mide fuentes, fragmentos, límite, búsquedas de 30 días y las
   fuentes más citadas.
6. `POST /api/v1/knowledge/sources/{source_id}/reindex` (`reindexKnowledgeSource`) vuelve a cobrar la indexación;
   `DELETE /api/v1/knowledge/sources/{source_id}` (`deleteKnowledgeSource`) borra sin reembolso. Las dos responden
   `409` `knowledge_source_busy` mientras la fuente se procesa.

Para que un agente la use: `PUT /api/v1/agents/{agent_id}` (`updateAgent`) con `knowledge_enabled: true` y
`knowledge_audience` (`public` o `all`; un agente que conversa con clientes sólo `public`). El agente necesita tope de
gasto mensual (`setAgentBudget`): sin tope queda en modo propuesta y no busca.

Subir un documento y borrar una fuente se implementan por REST.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/base-de-conocimiento.md
