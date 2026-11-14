# from-rd-C1: Nutrición (Amanda) estilo Apple

**Hecho:** sí

## Qué cambió (sin commit, rama `feat/rediseno-apple`)

### `app/styles/nutri.css`
Reescritas las partes del workspace. Los bloques de C2 y C3 (modal, import, ficha, anillos/WeekPanel y drawer) se han copiado tal cual.

- **Por debajo de 1280 (pila de navegación):**
  - Large Title en el h1.
  - Nota del calendario en footnote.
  - «Menú del día» en Title 3 con la fecha en subhead.
  - Estado vacío del índice sobre tarjeta blanca.
  - Las tarjetas no llevan margen extra.
- **A partir de 1280:**
  - **Disposición:** sidebar de `--sidebar-w` pegada a la toolbar, con alto de viewport y scroll propio.
  - **Sidebar:**
    - Fondo `--surface-sidebar` con filete `--separator-soft`.
    - Calendario compartido en versión compacta, dentro de una tarjeta blanca. Lo sobrescribo con selector acotado `.nut-ws-list-above .cal-compact`; `player.css` no se toca.
    - Buscador en cápsula gris de 36 px, con foco visible mediante `:focus-within`.
    - Filas de 44 px. La fila seleccionada va en `--accent` con texto blanco.
  - **Zona de trabajo:** tarjeta blanca sin sombra.
  - **Toolbar:**
    - Flechas en `--accent-text` (32 px con ratón, 44 px en táctil) y título en Title 2.
    - Segmentado Día/Semana/Mes con el primitivo `.segmented`.
    - «Perfil» e «Importar menú Word» en gris compacto.
    - Entre 1280 y 1439 px el título baja a Title 3 y la columna del título se lleva el espacio sobrante, para que «Sábado 14 de noviembre de 2026» se lea entero.
  - **Rejilla y vistas:**
    - Selección en acento: tinte en la cabecera del día y anillo de 2 px en la celda o el día del mes.
    - «Hoy» lleva una cápsula oscura.
    - Celdas vacías en `--bg`, con «+» al pasar el ratón (siempre visible con `hover:none`).
    - Se mantienen las tarjetas de categoría de proteína (tinte + filete) y los puntos de color en Mes.
    - Las vistas Día y Mes usan los mismos tokens.
  - **Índice:** panel derecho «Elige un deportista».
  - **Accesibilidad:** el h1 queda solo para lectores de pantalla (el contexto lo dan la toolbar y la cabecera).
- **Final de la hoja:** reglas para `prefers-reduced-motion` y `prefers-contrast: more`, aplicadas solo a mis clases.

### Archivos TSX
`app/nutricion/page.tsx`, `app/nutricion/athlete-nav.tsx` y `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`:

- Marcado del intento anterior de C1, que ya estaba en el árbol y se mantiene sin más cambios en esta sesión.
- Índice con `list-group` y estados `.state`.
- Buscador con lupa.
- Toolbar con `nut-step-btn` y `.segmented` (`aria-pressed`).

`athlete-nav-shared.ts` no se ha tocado.

## Verificación
Capturas en `.tmp-verify/rd-C1/`:
- `c1440_*`: semana, día, mes, drawer, índice y `final`.
- `c1280_*`: semana, día, alta con «+» y foco.
- `c768_*` y `c390_*`.

Resultados:
- 1440 y 1280 muestran sidebar, toolbar y las vistas Día/Semana/Mes con las categorías visibles. 768 y 390 se apilan sin romperse.
- `scrollWidth`: 390 → 390 y 768 → 768. No hay scroll horizontal.
- Comprobado que funcionan:
  - Las flechas cambian de semana (9–15 a 16–22 y vuelta).
  - Los botones Día, Semana y Mes cambian de vista.
  - Clic en un plato abre el drawer.
  - Clic en una celda vacía («+») abre el editor «Desayuno · Lunes 9…».
  - Cambiar de deportista desde la sidebar navega bien. Solo hay uno asignado, así que no se ha probado con dos.
- Foco con teclado: outline de 2 px en `--accent` en celdas, filas y botones.
- Alturas medidas: las filas de la sidebar ≥ 44 px; los controles de toolbar, 32 px con ratón y 44 px en táctil.
- `npx tsc --noEmit` sale limpio.
- No hay errores nuevos en consola. Solo aparece el aviso de React «Each child in a list should have a unique key» en `HeaderMarkup`, con un hijo que viene de `[athleteId]/page.tsx`. Ya existía antes de este trabajo y no está en mis archivos.
- No he creado datos de prueba. El candado `browse.lock` está borrado.

## Duda
1. **Servidor de 3001:** no estaba levantado (la conexión se rechazaba). Lo arranqué yo con `npm run dev` en segundo plano y lo dejo corriendo.
2. **Aviso de `key` en la cabecera:** viene de S2/BrandHeader más `[athleteId]/page.tsx`, que están fuera de mi lista de archivos.
3. **Filas finas en táctil:** en la vista Semana las filas «finas» (28 px) llegan por estilo en línea, así que desde CSS no se pueden llevar a 44 px en táctil a partir de 1280. Afecta sobre todo a iPad horizontal. En la vista Día sí las subo a 44 px con `pointer: coarse`.
4. **Este Windows tiene activo `prefers-reduced-transparency`:** no he puesto reglas para esa preferencia porque el workspace no usa materiales translúcidos.

## Recomendación
- **Para el punto 2:** que S2 o el master añada `key` (o use un `Fragment`) en lo que `[athleteId]/page.tsx` pasa a `leading`/`trailing` de BrandHeader.
- **Para el punto 3:** si se quiere 44 px en iPad, cambiar el `gridTemplateRows` en línea de WeekGrid a `minmax(28px, auto)` o similar, dentro de una tarea propia. Lo dejo fuera por no ser necesario para cerrar el brief.

**Bloquea a Adrián:** no
