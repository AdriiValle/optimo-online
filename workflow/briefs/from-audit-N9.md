- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. /nutricion/<id>/compra - 390 - el segmentado «Semana / Próximos 3 días» mide 40 px de alto (el resto de acciones primarias miden 44) - .tmp-verify/audit-N9/compra-390x844.png
  2. Impresión: el navegador headless no emula `print`; verificada inyectando las reglas `@media print` de la hoja como CSS de pantalla a 794 px: queda solo el informe (objetivos, menú de la semana, lista de la compra en 2 columnas), sin toolbar, pestañas ni sidebar - .tmp-verify/audit-N9/print-sim.png. No se ha comprobado el diálogo de impresión real ni los saltos de página.
  3. El campo «Buscar deportista» de la sidebar no muestra anillo de foco (outline none); es de la sidebar, anterior a N9, no de esta tarea.

Comprobado: la lista de Compra de Amanda (36 productos, 9–15 nov) coincide línea a línea con la que ve Ricardo en Nutrición > Compra; el aviso «Revisa 34 alimentos» (14 sin alimento · 20 sin sección · 20 sin unidad) se despliega con «Ver cuáles» y enlaza a Alimentos; el rango «Próximos 3 días» funciona. Informes muestra objetivos, menú y lista. scrollWidth = ancho de ventana a 1440 y a 390 en ambas rutas. Foco visible (2 px azul) en pestañas, navegación de semana y botón Imprimir. `npx tsc --noEmit` sale con 0 errores.
