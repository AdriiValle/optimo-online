# Plan: macros / micros / kcal del menú (día · semana · mes)

Plan de ejecución, sin código. Base: `lib/menu-import/parse-word-menu.ts`, `format-meal.ts`, `app/api/nutrition/menu-import/route.ts`, `db/schema.sql` (`meal_slots`, `athletes.weight_kg`, `day_plans.md_tag`), `WeekPanel` en `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`, `workflow/inbox/EJEMPLO DE MENU.md`, `analisis-menu-pablo-pdf.md`.

---

## 0. Lo que hay hoy (hechos)

- El import Word escribe `meal_slots` (comida/cena × 7 días × N semanas) con `title` (≤200 car.) y `preparation` (texto completo si pasa de 200). Formato: `[CARNE] Ensalada de espinacas… · Muslos de pollo al airfrayer con · Arroz`.
- **El Word no trae gramos.** Las cantidades de Amanda van aparte, **por tipo de día** (descanso / entreno / partido) y por parte del plato (verdura, proteína, hidrato, grasa) — así aparece en el PDF de Pablo.
- Cada celda ya viene casi estructurada: líneas separadas por ` · ` ≈ verdura / proteína / hidrato, más la etiqueta de proteína del día (`[CARNE]`, `[PESCADO]`, `[HUEVOS]`…).
- El vocabulario es pequeño: unas 60–80 materias primas repetidas (pollo, lubina, arroz, boniato, aguacate, quinoa…).
- `day_plans.md_tag` da el tipo de día (MD, MD-1, MD+1, libre…). `athletes.weight_kg` permite calcular g/kg.
- `WeekPanel` ya tiene los anillos y el donut con `value={null}`: listo para recibir datos sin rediseñar nada.

---

## 1. Decisión de fuente: **mix determinista**, LLM solo como ayuda opcional

| Opción | Veredicto |
|---|---|
| LLM lee el plato y devuelve kcal/macros | **No como fuente de cifras.** Inventa gramos y valores, no es reproducible y Amanda no lo puede auditar. Además cuesta dinero (no hay SDK en el repo). |
| Ingredientes + gramos como verdad | **Sí.** Es lo único que una nutricionista puede firmar. |
| Tabla de composición (BEDCA / USDA) | **Sí, como valores por 100 g.** |
| **Mix elegido** | Texto del plato → **parser determinista** (dividir en ` · `, `con`, `+`, `/`) → **casar con el catálogo** de alimentos por alias → **gramos según la plantilla de raciones de Amanda** por tipo de día y parte del plato → nutrientes = Σ gramos × valor/100 g. Amanda revisa y **confirma**. |

**Tabla de composición:** empezar con **USDA FoodData Central** (dominio público CC0, sin problema legal, trae fibra, sodio, hierro, calcio y vit. D). **BEDCA** (española, nombres y platos locales) es mejor de contenido, pero antes de usarla hay que revisar su licencia para uso comercial → opcional en O6. Como el catálogo es pequeño y lo cuidamos a mano, `foods.source` permite cambiar de fuente más adelante sin migrar nada.

**LLM (opcional, O5):** solo para proponer qué alimento es una línea que el parser no reconoce (p. ej. «salsa de guisantes + cottage»). Resultado = borrador `source='llm'`, nunca confirmado solo, nunca cifras directas.

---

## 2. Qué guardar en DB (aditivo en `db/schema.sql`, idempotente, mismo patrón RLS)

**`foods`** — catálogo global, valores por 100 g de porción comestible
`id uuid pk`, `name_es text unique`, `aliases text[]` (normalizados sin tildes ni mayúsculas), `source text` ('fdc' | 'bedca' | 'manual'), `source_ref text` (código FDC/BEDCA), `kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sodium_mg`, `iron_mg`, `calcium_mg`, `vit_d_ug` (`numeric`, null = desconocido, **no 0**), `updated_at`.
RLS: lectura para cualquier sesión; escritura admin + nutricionista.

**`meal_items`** — ingredientes de un plato
`id uuid pk`, `meal_slot_id uuid fk → meal_slots on delete cascade`, `food_id uuid fk → foods` (null mientras no case), `raw_text text` (la línea original), `role text` ('veg' | 'protein' | 'carb' | 'fat' | 'other'), `grams numeric` (null = sin cantidad), `origin text` ('rule' | 'manual' | 'llm'), `confirmed boolean default false`, `position int`.
RLS: igual que `meal_slots` (join a `athlete_id`: el deportista lee, la nutricionista asignada escribe, admin todo).

**`meal_slots`** + `items_text_hash text` — hash del texto (`preparation ?? title`) con el que se generaron los items. Si el re-import cambia el plato, el hash deja de coincidir → items **obsoletos**: no cuentan en totales y la UI pide «regenerar».

**`portion_templates`** — raciones de Amanda
`id`, `athlete_id uuid null` (null = plantilla general de la nutricionista), `day_type text` ('rest' | 'training' | 'match'), `slot meal_slot_kind`, `role`, `grams numeric`, unique (athlete_id, day_type, slot, role). Grasa de cocinado (aceite) como `role='fat'` con gramos explícitos: es la mayor fuente de error en kcal.

**Sin cache de totales.** Se calculan al leer (`sum(grams * food.x / 100)` agrupado por fecha): pocos datos, cero desincronización. Hay que medirlo en O4; solo si va lento, se añade una vista materializada.

**Tipo de día:** función pura `dayTypeFromMdTag(md_tag)` (MD → match, MD±1/entreno → training, libre/sin plan → rest). Sin columna nueva.

---

## 3. Relación con el import Word existente

- **No se toca el parseo de semanas/días.** El import sigue escribiendo `meal_slots` igual.
- Tras el upsert, nuevo paso opcional (flag en el form, `withItems=1`): por cada slot cuyo hash cambió → borrar los items **no confirmados** y generar borradores con el parser + plantilla del tipo de día de esa fecha. Los items confirmados de un plato que ha cambiado se quedan, pero como obsoletos (no se borran datos firmados por Amanda).
- El parser lee `preparation ?? title` y quita el prefijo `[CATEGORÍA]` (sirve como pista de `role='protein'`).
- El Word sigue sin necesitar gramos. Si en el futuro Amanda los pone en la celda («120 g pollo»), el parser los lee con `origin='manual'`.

---

## 4. Regla UI: no inventar números

- Un plato **cuenta** solo si todos sus items tienen `food_id` + `grams`, `confirmed = true` y el hash vigente.
- Día / semana / mes: se suman solo los platos que cuentan, y siempre con su cobertura: **«1.840 kcal · 3/5 platos cuantificados»**. Con 0 platos que cuenten → se queda «pendiente», como ahora.
- Medias por día (g/kg/día, fibra/día…) = suma ÷ **días con al menos un plato que cuente**, no ÷ días del periodo.
- g/kg: solo si `weight_kg` no es null; si no, «pendiente · falta peso».
- Micros con algún `food` sin valor (null) → «≥ X» o pendiente, nunca se rellena con 0.
- Sodio: la sal añadida no se sabe → nota fija «sin sal de mesa».
- `pct` de los anillos (respecto al objetivo) sigue a `null` hasta que existan objetivos por deportista (fuera de este plan).

---

## 5. Oleadas

| # | Qué | Toca | Criterio de hecho |
|---|---|---|---|
| **O1** | Esquema (`foods`, `meal_items`, `portion_templates`, `meal_slots.items_text_hash`) + RLS + script `db:seed-foods` con unas 80 materias primas sacadas de los menús reales (valores FDC, `source_ref` por fila). | `db/schema.sql`, `db/seed-foods.ts`, `package.json` | `db:migrate` corre 2 veces sin error; el seed inserta N filas y es idempotente; con RLS, el deportista no puede insertar en `foods` ni en `meal_items`. |
| **O2** | Parser puro `lib/nutrition/parse-dish.ts`: texto → `{raw_text, role, food_id?}[]`. Script `scripts/verify-dish-parse.ts` sobre `EJEMPLO DE MENU.md`. | `lib/nutrition/**`, `scripts/` | El script lista todas las líneas: ≥90 % casadas con un food; las no casadas salen por nombre (se añaden alias/foods y se repite). Sin DB ni UI. |
| **O3** | Gramos: `portion_templates` + `dayTypeFromMdTag` + generador de borradores; endpoint `POST /api/nutrition/meal-items/draft` (rango de fechas) y `PUT` para editar/confirmar. Paso opcional en el import. | `lib/nutrition/**`, `app/api/nutrition/**`, `lib/queries.ts`, ruta de import | Con la plantilla cargada, una semana importada genera borradores con gramos; re-importar el mismo Word no duplica nada; cambiar un plato marca sus items obsoletos; confirmados intactos. |
| **O4** | UI (brief aparte a Sonnet): editor de ingredientes en el modal del plato (alimento, g, confirmar) + `WeekPanel` alimentado por `nutritionTotals(athleteId, from, to)`. | `app/nutricion/**`, `globals.css` | Un día calculado a mano (hoja aparte) coincide con la UI ±1 kcal / ±0,5 g; un día sin confirmar se ve «pendiente»; la cobertura «x/y platos» es correcta en día, semana y mes. |
| **O5** *(opcional, decide Adrián: coste API)* | LLM para líneas no casadas → propuesta `origin='llm'` sin confirmar. | `lib/nutrition/llm-*.ts` | Nunca confirma solo; si se apaga el flag, el flujo O1–O4 sigue igual. |
| **O6** *(opcional, decide Adrián: licencia)* | Valores BEDCA para los foods del catálogo. | seed | Licencia revisada por escrito; `source='bedca'` en las filas cambiadas; los totales de un día de control se recalculan y la diferencia queda documentada. |

Orden: O1 → O2 → O3 → O4. O2 se puede hacer en paralelo con O1 (es puro). O5 y O6 no bloquean nada.

---

## 6. Riesgos

1. **Raciones de Amanda:** sin `portion_templates` reales no hay gramos → todo sigue pendiente. *Mitigación:* pedirle la tabla «cantidades por tipo de día» (ya existe en sus PDF) antes de O3; mientras tanto, gramos solo manuales.
2. **Platos con alternativas** («Lubina/Merluza», «Atún o Lubina»): se toma la primera opción y se marca `raw_text`; Amanda corrige. No se hace la media.
3. **Aceite y salsas** cambian mucho las kcal: siempre una línea `fat` explícita, que viene de la plantilla.
4. **Crudo vs cocido** (arroz, pasta, legumbre): el catálogo fija una convención (**en crudo**) y se muestra en la UI junto a los gramos.
5. **Re-import** que pisa el plato: lo resuelve el hash + no borrar items confirmados.
6. **Exactitud percibida:** son estimaciones de planificación, no ingesta real → texto «estimado del menú planificado».

---

## 7. Fuera de alcance

Objetivos por deportista (los `pct` de los anillos), registro de lo que se come de verdad, desayuno y snacks automáticos (el Word no los trae en la tabla), lista de la compra.
