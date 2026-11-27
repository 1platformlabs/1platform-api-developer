---
name: base-de-conocimiento
description: Subir documentos, sincronizar preguntas frecuentes y sitios, probar la búsqueda y medir el uso de la base de conocimiento que consultan los agentes, con la One Platform API.
---

# Base de conocimiento

## Consulta con el MCP

Antes de implementar, use el MCP de One Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/base-de-conocimiento` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado. Indexar y
buscar se cobran del saldo.


Requiere la skill `1platform-hub`. Sólo un administrador del espacio de trabajo administra la base (`403` `forbidden`);
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
