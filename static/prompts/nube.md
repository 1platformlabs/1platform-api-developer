# Nube

## Antes de implementar con el MCP

Use el MCP de 1Platform antes de escribir código. Busque el producto con `docs_search` y use `docs_get_page`
para leer `/docs/saas/1platform-api/nube` y la skill `/skills/1platform-hub/SKILL`.
La Nube no tiene operaciones de API para crear servidores ni bases de datos: los recursos se acuerdan con el
equipo de 1Platform. No invente operaciones de aprovisionamiento; si `api_get_operation` no encuentra un
`operationId`, esa operación no existe en el contrato.

Si el MCP no está conectado, siga https://developer.1platform.pro/docs/saas/1platform-api/integrar-con-ia.md;
mientras tanto, consulte la guía en Markdown pública e indique que no verificó el MCP.

## Qué puede preparar

1. Un resumen del proyecto para solicitar la infraestructura: aplicación, tecnología, ambientes de desarrollo,
   pruebas y producción, carga esperada y requisitos de CPU, memoria, almacenamiento y base de datos.
2. La configuración de la aplicación para recibir los datos de conexión por variables de entorno, sin escribir
   contraseñas ni claves en el código ni en la solicitud inicial.
3. Un plan de despliegue que valide primero en pruebas y deje una forma de volver a la versión anterior.

Para pagos, facturación, delivery y los demás servicios, integre la API con la autenticación de dos tokens
según `/docs/saas/1platform-api/inicio-rapido`, y consulte `api_get_operation` para cada llamada que implemente.
Las credenciales de la API son distintas de los accesos a sus servidores y bases de datos.

Guía: https://developer.1platform.pro/docs/saas/1platform-api/nube.md
