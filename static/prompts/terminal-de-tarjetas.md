# Terminal de tarjetas

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search`; use `docs_get_page`
para leer `/docs/saas/1platform-api/terminal-de-tarjetas` y las skills `/skills/1platform-hub/SKILL`, `/skills/terminal-de-tarjetas/SKILL`.
Consulte `api_get_operation` con el `operationId` de cada llamada que vaya a implementar: valide método, ruta,
campos, autenticación y errores. No invente operaciones cuando el contrato no las encuentre.

Para las herramientas operativas, seleccione el toolset `terminal` y compruebe lo que su cliente lista.
Las tres herramientas de documentación funcionan sin claves. Leer el contrato no significa que esa operación
pueda ejecutarse como herramienta MCP: implemente por REST las operaciones que no estén disponibles.
Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown y el OpenAPI públicos e indique que no verificó el MCP.

Trabaje en QA por defecto. Mantenga claves y tokens en el servidor; canjee las claves por JWT según la skill común.
Implemente y pruebe el flujo sin ejecutar escrituras sobre cuentas reales. Una ejecución que cambie datos, envíe
mensajes o comprometa dinero requiere un pedido explícito; no confunda preparar código con operar la API.

## Implementación

Use la skill `1platform-hub`. El cobro presencial está disponible y se hace en la app de la terminal, en el teléfono
del comercio: no hay una operación para iniciar un cargo; la API registra y consulta los cobros ya hechos.

1. `GET /api/v1/businesses` (`listBusinessesForUser`) para el `businessId`. El comercio necesita NIT y usted, rol de
   administrador en la sucursal.
2. `POST /api/v1/businesses/{businessId}/terminal-requests` abre la solicitud (una abierta por comercio; otra da
   `409`). Corrija con `PATCH` y adjunte documentos con
   `POST /api/v1/businesses/{businessId}/terminal-requests/{requestId}/documents`.
3. `POST /api/v1/businesses/{businessId}/terminal-requests/{requestId}/submit` la envía.
4. `GET /api/v1/businesses/{businessId}/terminal-requests/{requestId}` muestra el estado, lo que falta y, si se aprobó,
   el código de activación.
5. `GET /api/v1/users/terminal-payments/{paymentId}` (`getTerminalPayment`) consulta un cobro hecho con la terminal.

Con el servidor MCP (toolset `terminal`): solicitudes y su estado, sólo lectura.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/terminal-de-tarjetas.md
