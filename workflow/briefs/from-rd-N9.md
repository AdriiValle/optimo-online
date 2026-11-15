# from-rd-N9 · Amanda: Compra e Informes (PDF/impresión)

**Hecho:** sí (sin commit, rama `feat/rediseno-apple`; el commit lo hace el master).

## Qué cambió (rutas)
- `app/nutricion/[athleteId]/compra/page.tsx`: sustituye el placeholder. Lista de la compra de la semana o de los próximos 3 días (`?rango=3d&desde=`), con navegación entre semanas. Usa `shoppingForRange` / `buildShoppingList` (las mismas funciones que la API del jugador), así que es la misma lista. Aviso «Revisa N alimentos» con el recuento (sin alimento del catálogo · sin sección · sin unidad de compra), el botón «Revisar alimentos» a `/nutricion/alimentos` y un desplegable «Ver cuáles». Sin casillas: «ya lo tengo» es del jugador; aquí sale como texto «Ya lo tiene en casa». Al pie, enlace al informe de esa semana.
- `app/nutricion/[athleteId]/compra/food-gaps.ts`: nuevo. Consulta de solo lectura sobre `foods` (sección y unidad o envase) para los alimentos de la lista.
- `app/nutricion/[athleteId]/compra/shopping-sections.tsx`: nuevo. Muestra la lista por secciones, compartida por Compra e Informes. En modo `compact` (el del informe) no lleva notas de sección ni el «ya lo tiene».
- `app/nutricion/[athleteId]/informes/page.tsx`: sustituye el placeholder. Informe semanal (`?semana=`) con:
  - cabecera (deportista, semana, fecha de generación);
  - **Objetivos diarios**: ficha, meta, alergias e intolerancias, tabla Entreno/Partido/Descanso con objetivo y margen, y micronutrientes. Marca las cifras fijadas por Amanda;
  - **Menú de la semana**: lunes a domingo, con el MD y el tipo de día;
  - **Lista de la compra**: empieza en página nueva al imprimir.
- `app/nutricion/[athleteId]/informes/report-data.ts`: nuevo. Junta los datos del informe en una sola pasada de solo lectura (day_plans, comidas, perfil, `dailyTargets`/`overrideFor`, compra).
- `app/nutricion/[athleteId]/informes/print-button.tsx`: nuevo (cliente). Botón «Imprimir o guardar PDF» que llama a `window.print()`.
- `app/styles/nutri.css`: añadidos al final los bloques `.nut-buy-*` (Compra) y `.nut-rep-*` (Informes), con `@page nut-rep` (A4 vertical) y un `@media print` que deja solo `.nut-rep` en tinta negra. Las preferencias del sistema (reduced-motion y contrast) van al final de la hoja.
- No he tocado `lib/`, `db/`, la API ni la BD. No he creado datos de prueba.

## Verificación (localhost:3001, usuaria amanda, Ricardo Visus)
- 390×844: `scrollWidth` = 390 en Compra (semana y 3 días) e Informes.
- 1440×900: las dos páginas se ven bien.
- Impresión: `browse pdf` da `.tmp-verify/rd-N9/informe.pdf` (3 páginas). Con los estilos de impresión emulados no queda ningún elemento visible fuera de `.nut-rep` (`print_emul.png`).
- Acciones principales de 44 px de alto (flechas de semana y botón de imprimir). El foco con teclado se ve (outline).
- Consola sin errores en las dos páginas. Los errores CORS del log vienen del signout del script de capturas, no de estas páginas.
- `npx tsc --noEmit` limpio.
- Capturas en `.tmp-verify/rd-N9/`. Lock `.tmp-verify/browse.lock` borrado.

## Duda
Con los datos de dev, el aviso de Compra sale siempre: «Revisa 34 alimentos» (14 sin alimento del catálogo, 20 sin sección, 20 sin unidad de compra), porque el catálogo no tiene rellenas la sección, la unidad ni el envase.

## Recomendación
Dejarlo así: el aviso es justo lo que pide el brief y desaparece solo a medida que Amanda complete los alimentos en `/nutricion/alimentos`. Cuando no falta nada, se ve «Todos los alimentos tienen sección y unidad.».

## Bloquea a Adrián
No.
