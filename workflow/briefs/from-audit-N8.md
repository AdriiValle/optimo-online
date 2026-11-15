- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  - Foto no probada: el plato de prueba no tenia foto, asi que la reutilizacion de foto al buscar en mis platos queda sin verificar visualmente (ingredientes y macros si: 4 ingredientes, 486 kcal). Captura: .tmp-verify/audit-N8/a-picked2-1440.png
  - A 390 la barra de pestanas de Amanda (Menu / Seguimiento / Perfil / Compra / Plantillas y platos / Informes) se recorta y desplaza dentro de la propia barra; sin scroll horizontal de pagina (scrollWidth 390). Captura: .tmp-verify/audit-N8/a-plantillas-390.png
  - Foco visible comprobado solo en «Cambiar» del jugador (outline 2px azul); en el panel de Amanda se midieron tactiles (todos >=44) pero no se recorrio todo con Tab.

## Comprobado (resumen)
- tsc: `npx tsc --noEmit` sale con codigo 0 y sin errores.
- Plantilla: semana 9-15 nov de Ricardo guardada como «AUDIT-N8 semana» (14 platos) y aplicada a la semana del 30 nov: 14 platos nuevos y 69 ingredientes, igual que el origen (69). Capturas: a-tpl-saved-1440.png, a-applied-1440.png.
- Mis platos: «Guardar en mis platos» y «Buscar en mis platos» en una franja vacia traen el plato con sus 4 ingredientes y macros. Capturas: a-dish-saved2-1440.png, a-picked2-1440.png.
- Sustitucion: antes de aprobar, Hoy del jugador no muestra «Cambiar» (p-hoy-390-before.png). Tras aprobar 100 g Patata = 120 g Boniato aparece «Cambiar» en la Patata (250 g) y al pulsarlo sale Boniato 300 g (p-cambiar-390.png). Boton 44 px de alto.
- Nota del dia: editada en el panel de Amanda (Menu > Nota del dia) y visible para el jugador como «Nota de Amanda» (p-hoy-390-after.png, p-hoy-1440.png).
- Sin scroll horizontal: scrollWidth 390 en plantillas, menu de Amanda y Hoy del jugador a 390; 1440 en 1440.
- Tactiles: acciones primarias de plantillas y menu a 390 miden 44 px de alto (unico elemento menor es el input del interruptor, no una accion primaria).

## Restaurado
Datos de prueba borrados y verificado por recuento: Ricardo vuelve a 42 franjas y 240 ingredientes; 0 plantillas, 0 platos, 0 sustituciones, 0 notas. browse.lock borrado.
Archivos propios de la auditoria en .tmp-verify/audit-N8/ (capturas y scripts).
