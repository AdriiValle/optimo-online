# from-rd-B2 · Admin: análisis del deportista

- **Hecho:** sí
- **Bloquea a Adrián:** no

## Qué cambió (rutas)
- `app/a/[id]/analisis.tsx`: solo presentación; la lógica de rango, periodo personalizado y vista de día sigue igual.
  - Periodo: los chips pasan a **segmentado** `.segmented.an-seg` (`aria-pressed`, pulgar deslizante con `--seg-index` cuando hay un preset activo). El periodo personalizado lleva fechas y un botón «Aplicar»: tintado si no está activo, relleno si lo está (además, las fechas se marcan con borde de acento).
  - Gráficos al estilo Salud: se dibujan en **píxeles reales** (ancho medido con ResizeObserver, sin `preserveAspectRatio="none"`), así que puntos y barras no se deforman. Llevan rejilla con marcas Y «redondas» a la derecha, línea de **media** discontinua, área plana `--fill-quaternary`, el último dato resaltado, fechas inicio/fin debajo y «Sin datos en este periodo» dentro del gráfico si la serie está vacía. Datos en tinta `--label` (sin azul decorativo).
  - Tarjetas de métrica: título Headline y cifras «Último/Media» en Title 2 con unidad (`h`, `/100`, `ms`, `lpm`, `/10`); decimales con coma.
  - Cabecera del periodo: «16 oct – 14 nov» (Title 3) y «30 días».
  - Molestias: lista agrupada con separadores y contador.
  - Vista de día: baldosas (6 métricas) más el bloque de molestias. El aviso «Viendo un solo día» lleva el botón plain «Ver tendencias» (44 px).
  - Estados vacíos (`an-empty`) con el primitivo `.state` de F3: «Sin registros todavía» (60 días sin datos) y «Sin datos en este periodo».
- `app/styles/admin.css`: he reescrito todo el bloque `.an-*`. Las reglas de preferencia de B2 van al final (`prefers-contrast: more`). Con `.an-chart .an-bar` piso la regla de transición de F3 en `components.css:686`, que pintaba todas las barras de negro.

## Verificado (admin `adriivalle`, capturas en `.tmp-verify/rd-B2/`)
- 1440: rango de 30 días, preset de 7 días, vista de día, foco con teclado (anillo azul en el segmentado) y vacío total. 390: rango de 30 días, vista de día, periodo personalizado y periodo vacío.
- Funciona cambiar de rango, aplicar un periodo personalizado, pasar a la vista de día pulsando un día del calendario y volver con «Ver tendencias».
- `scrollWidth` a 390 = 390 en todas las capturas. `npx tsc --noEmit` limpio. Sin errores de consola.
- Táctiles: «Aplicar» y las fechas miden 44 px. El segmentado mide 32 (pista de 36) con puntero fino y 44 (botones de 40) con `pointer: coarse`, como dice el design system (`--tap-compact` solo con puntero fino).
- Datos de prueba: 31 diarios temporales de Francisco Gago, ya borrados (`deleted 31`). Se pueden volver a crear con `npx tsx .tmp-verify/rd-B2/seed.ts seed` y borrar con `npx tsx .tmp-verify/rd-B2/seed.ts clean`. Lock del navegador liberado.

## Duda
- A 1440 el análisis vive en la columna de 640 de `/a/[id]` (`.page` de `page.tsx`/`home-client`, de la pista A). Por eso «escritorio ancho» se queda en 2 columnas de gráficos dentro de esa columna. Ensanchar solo el panel desde `admin.css` rompería la alineación con la cabecera y las pestañas.
- Restos de otros dueños que ya no se usan: `.an-chips button` en `a11y.css:27` (la clase ya no existe) y la regla de transición `.an-chart .an-line/.an-dot/.an-bar` en `components.css:685-686`. No los he tocado.

## Recomendación
- Si Adrián quiere el admin más ancho en `/a/[id]`, que A1/B4 añada a `page.tsx` una clase de página de admin (p. ej. `page page--wide`, max 1080). El CSS de `.an-grid` ya pasa a 2 columnas y aguantaría 3 con una regla `@media` más. No hace falta para cerrar B2.
- T-común puede borrar en la Oleada 3 las dos reglas sobrantes de `a11y.css` y `components.css`.
