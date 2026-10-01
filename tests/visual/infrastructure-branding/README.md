# Revisión visual de infraestructura

Estas capturas corresponden a la implementación Docusaurus/Scalar de la épica
`1platform-infraestructura-branding`. No reutilizar las imágenes históricas de
`../product-composition/` para aprobar este diseño.

- `docs-desktop-1440.jpg`: Primeros pasos, 1440 × 1100
- `docs-mobile-390.jpg`: Primeros pasos, 390 × 844
- `api-desktop-1440.jpg`: referencia Core, 1440 × 1100
- `api-mobile-390.jpg`: referencia Core, 390 × 844

El navegador entregó JPEG/JFIF. Se conservan sus bytes originales; la extensión
refleja el formato real, sin conversión ni alteración de las capturas revisadas.

Referencia independiente vigente: `epics/1platform-infraestructura-branding/prototipo/documentacion/`
en el workspace raíz, servida en 4463. Implementación local en 4473. Comparar el
mismo contenido, ruta, estado y viewport; registrar geometría, tipografía y color.
La tolerancia de geometría comparable es ±2 px. Preservar búsqueda y funciones
nativas de Scalar, aunque el prototipo sólo simule su interacción.

Regresión adicional del 1 de octubre de 2026, comprobada personalmente por el
coordinador a 360 px: la tabla nativa de autenticación usa scroll horizontal
interno (ancho 324 px, contenido 367 px); el documento conserva 360 px sin
overflow. Tab enfoca la tabla y Flecha derecha desplaza 40 px, con foco visible
y semántica de tabla preservada. La captura `table360.jpg` está en la evidencia
visual de la épica. No se modifica el DOM ni el contrato de Scalar.

Diferencia deliberada: Scalar conserva el título nativo y el título Markdown
del contrato. Junto con el masthead, la referencia Core tiene tres `h1` visibles
en runtime; el anfitrión SSR tiene uno. No modificar el contrato ni parchear
encabezados generados para hacer coincidir el conteo del prototipo.

`pnpm check:public-ui` comprueba HTML, contratos públicos y dimensiones de las capturas.
Ese guard no compara píxeles ni declara aprobación visual. La revisión personal,
las diferencias y las pruebas de 360/430/horizontal se registran en el progreso
de la épica por el coordinador. El banco de APIs/DB/autenticación queda separado
y requiere `/verify-epic-e2e` autorizado antes del merge.
