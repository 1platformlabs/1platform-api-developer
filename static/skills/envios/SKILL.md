---
name: envios
description: Registrar, cotizar, despachar, rastrear y cancelar envíos de un comercio con la 1Platform API.
---

# Envíos

Requiere la skill `1platform-hub`. El código de error de Envíos viaja en `data.code`.

1. `POST /api/v1/businesses/{businessId}/deliveries`: crea el envío en `draft` con la sucursal (`branch_id`), el
   punto de entrega (`dropoff`) y el paquete. Se puede editar con `PATCH` mientras está en `draft`.
2. Despacho con flota propia (`mode` `own_fleet`):
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/dispatch` con el repartidor, y el avance con
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/status` (`picked_up` antes de `delivered`).
3. Despacho con mensajería (`mode` `courier`): primero
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/quote`, y al despachar envíe `expected_quoted_at`
   con el `quote.quoted_at` que vio. Despachar con mensajería pide un envío real: sólo con confirmación del
   desarrollador.
4. Estado: `GET /api/v1/businesses/{businessId}/deliveries/{deliveryId}` (`getDelivery`) o
   `GET /api/v1/businesses/{businessId}/deliveries` (`listDeliveries`).
5. Rastreo público para el destinatario: `GET /api/v1/deliveries/tracking/{handle}`, sin credenciales, con el
   `tracking_handle` del envío.
6. Cancelar: lea `can_cancel` y `cancel_mode` antes de ofrecerlo y llame a
   `POST /api/v1/businesses/{businessId}/deliveries/{deliveryId}/cancel`.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/envios.md
