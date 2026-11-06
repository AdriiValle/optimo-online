# Plan: look del menú de Amanda (idea Nutrigo, piel Óptimo + Apple)

Plan sin código. Base leída: `app/nutricion/[athleteId]/nutricion-athlete-client.tsx` (`WeekGrid`, `MonthCalendar`, `NutModal`, `MealSlotForm`), `meal-items-editor.tsx` (O4), `app/api/meals/[id]/photo/route.ts`, `lib/queries.ts` (`nutritionTotals`), `lib/menu-import/format-meal.ts`, `lib/nutrition/parse-dish.ts`, `workflow/context/design-system.md`, `app/globals.css`, `workflow/inbox/EJEMPLO DE MENU.md`.

Pack de tacto: **`apple-design`** (Emil Kowalski, SKILL.md público; lo lee el worker de UI, no se instala). De Nutrigo solo tomamos **la idea**: plato como tarjeta, la proteína manda, ficha con foto. **No** su lima, ni su tipo, ni su layout.

---

## 1. Objetivo

Que Amanda abra la semana y **lea el menú de un vistazo** (qué proteína toca cada comida, qué plato es), no una hoja de cálculo. Al tocar un plato se abre su **ficha**: foto grande, ingredientes (O4) y macros reales de esa comida. Después, Amanda **sube sus fotos** desde esa ficha.

Restricciones que no se mueven: semana en columnas (días arriba, MD-x se queda), rail de deportistas a la izquierda, **sin scroll del viewport** en desktop (≥1280), móvil 375 sin regresión, paleta Óptimo intacta, sin LLM (O5 fuera).

## 2. Las 4 decisiones (cerradas)

1. **Semana en columnas.** Días arriba con MD-x; franjas en filas. No se gira.
2. **Color por categoría de proteína** (carne / pescado / huevos / legumbres), tonos tierra desaturados como **tokens nuevos**. Nada de lima.
3. **Fotos:** placeholder por categoría ya (O1–O2); subida de Amanda en O3 del mismo plan.
4. **Ficha al clic** (drawer a la derecha en desktop, sheet en móvil): foto, ingredientes O4, macros. El rail se queda.

## 3. Hechos de hoy (lo que duele)

- `formatImportedMeal` guarda el título como `[CARNE] Ensalada… · Muslos de pollo… · Arroz`: el corchete se come el ancho y el plato que importa (la proteína, línea 2) queda cortado.
- El Word solo trae comida y cena. Desayuno, media mañana y merienda salen **vacías toda la semana** y aun así se llevan filas de 32–44 px.
- La celda es texto plano sobre `--surface` con filete: todas iguales, sin jerarquía.
- Categorías que llegan del Word: `CARNE`, `PESCADO`, `HUEVOS`, `LEGUMBRES/P. VEGETAL` y la mixta `HUEVOS/PESCADO`.
- La foto ya existe: `meal_slots.photo_bytes` (bytea), `POST /api/meals/[id]/photo` (admin + nutricionista, ≤400 KB, jpeg/png/webp/gif). Pero una foto de móvil pesa 2–5 MB → hoy casi siempre falla. No hay `DELETE` de foto.
- `nutritionTotals` ya suma **por comida** dentro del bucle, pero solo devuelve totales por día: la ficha no tiene macros de su comida.
- La edición abre `NutModal` (sheet centrado) con `MealSlotForm` + `MealItemsEditor` apilados.

## 4. Look (tokens)

Se añaden a `:root` en `app/globals.css` y a una sección nueva «Categoría de proteína» en `workflow/context/design-system.md` (es la única ampliación de paleta; la marca no cambia).

```css
/* Categoría de proteína: tierra desaturada. Ink = filete/punto/etiqueta sobre blanco; tint = fondo de la celda y placeholder. */
--cat-carne: #9A5B45;      --cat-carne-tint: #F4EAE5;      /* terracota */
--cat-pescado: #557083;    --cat-pescado-tint: #E7EDF1;    /* pizarra */
--cat-huevos: #8F7234;     --cat-huevos-tint: #F5EFE1;     /* ocre */
--cat-legumbres: #687A4E;  --cat-legumbres-tint: #ECEFE4;  /* oliva */
--cat-none: var(--secondary); --cat-none-tint: var(--fill-secondary);
```

Contraste medido: ink sobre blanco 4.5–5.3:1 (vale para etiqueta pequeña); `--text` sobre tint ≥14:1. **`--secondary` sobre tint da 3.1:1 → no sirve**: dentro de una celda teñida la línea secundaria va en `--accent-hover`.

Reglas:
- El color **nunca es el único portador**: la categoría va también en texto (ficha) y en `aria-label` de la celda.
- Mixta (`HUEVOS/PESCADO`): color de la **primera**; la etiqueta muestra las dos.
- `LEGUMBRES/P. VEGETAL` → `legumbres`. Sin corchete o desconocida → `none`.
- `prefers-contrast: more`: tint → `--surface`, filete pasa de 3 px a 4 px en ink. `prefers-reduced-transparency`: sin cambio (no hay cristal nuevo).
- Placeholder = **campo de tint liso + nombre de la categoría en texto** abajo a la izquierda. Sin icono, sin emoji, sin degradado (el design-system prohíbe iconos en baldosa).
- Tacto (apple-design): press `--press-scale-lg` en celdas, drawer con `--dur-sheet var(--ease)`, reduced-motion → fundido. Sin librería nueva.

## 5. Piezas nuevas

**`lib/nutrition/protein-category.ts`** (puro, sin React):
- `splitCategory(title)` → `{ key: 'carne'|'pescado'|'huevos'|'legumbres'|'none', label: string|null, body: string }`. Mismo regex `^\[([^\]]*)\]\s*` que hoy vive en `parse-dish.ts` (que pasa a importarlo; salida idéntica).
- `dishLines(body)` → `{ headline, rest }`: si hay 3 líneas separadas por ` · `, `headline` = línea 2 (la proteína) y `rest` = líneas 1 y 3; si no, `headline` = todo. Se quita el «con» colgante del final de línea («Muslos de pollo al airfrayer con» → «Muslos de pollo al airfrayer»).

**Celda de plato** (semana y día): fondo tint de su categoría, filete izquierdo 3 px en ink, `headline` en 600 a 2 líneas máx., `rest` en 1 línea `--accent-hover` 0.6875rem. Si `hasPhoto`: miniatura 36 px redondeada a la izquierda (solo franjas principales). Sin `[CARNE]` visible nunca.

**Filas vacías colapsadas:** una franja sin ningún plato en los días visibles pasa a fila fina (24 px): etiqueta + «+» al pasar. El alto libre se lo reparten comida y cena. Se recalcula por semana.

**Mes:** los puntos de comida y cena se rellenan con el ink de su categoría (desayuno/snacks siguen en `--text`).

**Ficha (`MealDrawer`)**, nuevo `app/nutricion/[athleteId]/meal-drawer.tsx`:
- ≥1280: panel 400 px anclado a la derecha **dentro** de `.nut-ws-main`, encima de la semana (no la empuja, el rail no se mueve), fondo `--surface` + `--shadow-md` (nada de cristal sobre cristal), scroll interno, cerrar ≥36 px, Esc cierra, foco atrapado y vuelve a la celda. Clic en otra celda cambia la ficha sin cerrar.
- <1280: el mismo contenido dentro del `NutModal` actual (sheet abajo).
- Orden: héroe 16:10 (foto o placeholder) → etiqueta de categoría (ink sobre blanco) + `headline` como titular (−0.02em) + `rest` → **Macros** de esa comida: kcal grande `tabular-nums` + P/C/G (reusa `MacroDonut`); si faltan ingredientes por confirmar, «Faltan N por confirmar» y cifras con «≈» → **Ingredientes**: `MealItemsEditor` tal cual → **Editar plato** (disclosure cerrado): `MealSlotForm` con el título **sin** el corchete; al guardar se reantepone **el mismo** corchete, así el hash de ingredientes no cambia si Amanda no toca el texto. La categoría no se edita aquí (viene del Word).

## 6. Oleadas

### O1 — Tokens + celda tarjeta + filas vacías (UI → opus)

- **SÍ:** `app/globals.css` (tokens `--cat-*`, celda, fila colapsada, puntos de mes, media queries de contraste), `workflow/context/design-system.md` (sección categoría), `lib/nutrition/protein-category.ts` (nuevo), `lib/nutrition/parse-dish.ts` (solo importar `splitCategory`, salida igual), `app/nutricion/[athleteId]/nutricion-athlete-client.tsx` (`WeekGrid` vistas semana y día, `MonthCalendar` puntos).
- **NO:** DB, APIs, import Word, `MealItemsEditor`, `WeekPanel`, rail (`athlete-nav*`), `NutModal`, vista del deportista (`app/a/...`).
- **Criterio de hecho:** semana real de Pablo/Visus a 1280×800 y 1440×900 sin scroll del viewport; ninguna celda muestra `[…]`; las 4 categorías + `none` se distinguen y el `aria-label` dice «Comida, lunes 3: Muslos de pollo al airfrayer (carne)»; desayuno/snacks vacíos salen en fila fina y comida/cena crecen; mes con puntos teñidos; 375 px sin scroll horizontal; `prefers-contrast: more` legible; `scripts/verify-meal-drafts.ts` igual que antes; `npm run build` verde. Commit: `style(nutricion): semana con tarjetas por categoría de proteína`.

### O2 — Ficha (drawer) con macros por comida (UI → opus)

- **SÍ:** `app/nutricion/[athleteId]/meal-drawer.tsx` (nuevo), `nutricion-athlete-client.tsx` (abrir drawer en ≥1280 en vez del modal; <1280 mismo contenido en `NutModal`), `app/globals.css` (drawer, héroe, placeholder grande), `lib/queries.ts` (`nutritionTotals` devuelve además `meals: { mealSlotId, quantified, missing, totals }[]` — campo **añadido**, el resto igual), `nutrition-summary.ts` si hace falta un helper.
- **NO:** esquema DB, `POST` de foto, import, `MealItemsEditor` por dentro, `WeekPanel`, rail, vista del deportista.
- **Criterio de hecho:** clic en celda → ficha a la derecha sin mover rail ni semana, sin scroll del viewport; cambiar de celda cambia la ficha; Esc y botón cierran y el foco vuelve a la celda; macros de la ficha cuadran con la suma del día (comida + cena = total del día cuando todo está confirmado); confirmar un ingrediente en la ficha refresca la ficha y el panel semanal; guardar el plato sin tocar el texto **no** marca ingredientes obsoletos; reduced-motion = fundido; <1280 sigue el sheet; build verde. Commit: `feat(nutricion): ficha de plato con foto, ingredientes y macros`.

### O3 — Subida de fotos de Amanda (UI → opus)

- **SÍ:** `lib/image-resize.ts` (nuevo, cliente: canvas → WebP, lado largo 1200 px, baja calidad hasta ≤300 KB; si el navegador no saca WebP, JPEG), `meal-drawer.tsx` (héroe = zona de soltar + «Elegir foto» + «Quitar foto»; vista previa inmediata), `app/api/meals/[id]/photo/route.ts` (`DELETE` mismos permisos que `POST`; `POST` acepta `applyToSame=1`), `lib/queries.ts` (`clearMealPhoto`; `setMealPhoto` con propagación: copia la foto a los `meal_slots` del mismo deportista con el mismo `md5(coalesce(nullif(preparation,''), title))` **que no tengan foto**), `MealSlotForm` (el input de foto usa el mismo resize).
- Por qué la propagación: el Word repite la misma semana 4 veces; sin esto Amanda sube cada foto 4 veces. Casilla «Usar en los N platos iguales» marcada por defecto, con N visible. Nunca pisa una foto existente.
- **NO:** cambiar almacenamiento (sigue bytea en Neon, sin Blob ni servicio de pago), tope de 400 KB del servidor, permisos (el deportista sigue sin subir), vista del deportista.
- **Criterio de hecho:** foto de móvil de 4 MB se sube sin error y pesa ≤300 KB en DB; arrastrar y soltar funciona en desktop, «Elegir foto» en móvil; la celda muestra la miniatura al momento; «Usar en N iguales» rellena esas N celdas y no toca las que ya tenían foto; «Quitar foto» vuelve al placeholder; un deportista con `POST`/`DELETE` recibe 404; build verde. Commit: `feat(nutricion): subida de fotos de Amanda con resize y platos iguales`.

## 7. Orden

O1 → O2 → O3, cada una en `dev`, un commit, verificada en preview antes de la siguiente. O2 depende de `protein-category.ts` (O1); O3 depende del héroe del drawer (O2). Merge a `main` lo decide Adrián al cerrar O3.

## 8. Riesgos anotados (no bloquean)

- Almacenamiento: fotos en bytea × propagación. A ~300 KB por foto y ~14 platos únicos por semana es poco para el piloto; si entran muchos deportistas, mover a deduplicado por hash o a Blob será otra conversación (dinero → Adrián).
- Platos escritos a mano sin corchete salen `none` (gris). Es correcto: no inventamos categoría.
