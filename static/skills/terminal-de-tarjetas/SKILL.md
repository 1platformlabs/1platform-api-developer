---
name: terminal-de-tarjetas
description: Solicitar una terminal de tarjetas para un comercio, activarla, enviarle cobros remotos y consultar sus cobros presenciales con la 1Platform API.
---

# Terminal de tarjetas

## Consulta con el MCP

Antes de implementar, use el MCP de 1Platform: busque el tema con `docs_search` y lea
`/docs/saas/1platform-api/terminal-de-tarjetas` mediante `docs_get_page`.
Use `api_get_operation` con cada `operationId` de la guía para comprobar el contrato vigente. Las consultas de
documentación no requieren claves. Si el MCP no está conectado, siga
https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md y consulte las fuentes públicas;
indique esa limitación. No invente herramientas operativas: compruebe cuáles lista el MCP y use REST para las demás.
Implemente en QA; ejecutar escrituras requiere un pedido explícito, aunque el código ya esté preparado.


Requiere la skill `1platform-hub`. El cobro presencial está disponible y se hace en la app de la terminal, en el teléfono
del comercio, con la tarjeta presente. La API no cobra la tarjeta por su cuenta: consulta los cobros ya hechos y
puede **enviar un cobro remoto** a una terminal conectada para que el cajero lo complete.

1. `GET /api/v1/businesses` (`listBusinessesForUser`) para el `businessId`. El comercio necesita NIT y usted, rol de
   administrador en la sucursal.
2. `POST /api/v1/businesses/{businessId}/terminal-requests` abre la solicitud (una abierta por comercio; otra da
   `409`). Corrija con `PATCH` y adjunte documentos con
   `POST /api/v1/businesses/{businessId}/terminal-requests/{requestId}/documents`.
3. `POST /api/v1/businesses/{businessId}/terminal-requests/{requestId}/submit` la envía.
4. `GET /api/v1/businesses/{businessId}/terminal-requests/{requestId}` muestra el estado, lo que falta y, si se aprobó,
   el código de activación.
5. `GET /api/v1/users/terminal-payments/{paymentId}` (`getTerminalPayment`) consulta un cobro hecho con la terminal.

Cobros remotos (en preparación: la plataforma los habilita; mientras tanto el envío responde `403` con
`code` = `terminal_charges_disabled`). Guía: https://developer.1platform.pro/docs/saas/1platform-api/terminal-de-tarjetas/cobros-remotos.md

1. `GET /api/v1/businesses/{business_id}/terminals` (`listBusinessTerminals`) da los `terminal_id` conectados y
   `remote_charges_enabled`. Rol de administrador o cajero del comercio.
2. `POST /api/v1/businesses/{business_id}/terminal-charges` (`createTerminalCharge`) envía el cobro: `amount` como
   texto decimal en la moneda de la terminal (`currency` es `null` hasta ligar el pago), `reference` del pedido e
   `idempotency_key` en el cuerpo. La clave es por intento: la misma clave con el mismo cuerpo devuelve el mismo cobro
   (`200`, `Idempotent-Replayed: true`), también uno `rejected`; tras un rechazo reintente con una clave nueva. Un
   `202` con `status` = `submitting` no se reenvía: se consulta. `409 terminal_charge_reference_in_use` significa que
   la referencia ya tiene un cobro vivo o aprobado.
3. `GET /api/v1/businesses/{business_id}/terminal-charges/{charge_id}` (`getTerminalCharge`) y
   `GET /api/v1/businesses/{business_id}/terminal-charges` (`listTerminalCharges`) siguen el estado: `submitting`,
   `created`, `in_progress`, `approved`, `denied`, `cancelled`, `expired`, `timeout`, `rejected` o `unreconciled`
   (No confirmado: revise el pago). Un `timeout` todavía puede aprobarse: consulte antes de volver a cobrar;
   `reference_conflict: true` marca un pedido cobrado dos veces.
4. `POST /api/v1/businesses/{business_id}/terminal-charges/{charge_id}/cancel` (`cancelTerminalCharge`) cancela un
   cobro que el cajero todavía no tomó.
5. El evento `on_terminal_charge_completed` avisa el estado final (ver la skill `webhooks`).

Con el servidor MCP (toolset `terminal`): solicitudes, su estado y el detalle de un pago con terminal; crear,
corregir y retirar una solicitud. El envío y los documentos se completan en el panel. También terminales conectadas
y cobros remotos: enviar, consultar, listar y cancelar. Enviar un cobro hace sonar una terminal física con un monto:
confirme monto, terminal y referencia con la persona antes de ejecutarlo.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/terminal-de-tarjetas.md
