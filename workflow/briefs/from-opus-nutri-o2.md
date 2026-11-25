# from-opus-nutri-o2

- **Hecho:** sí (commit `fc04efb` en `dev`)
- **Qué cambió (rutas):**
  - `lib/nutrition/parse-dish.ts`: parser puro `parseDish(text, catalog)` que devuelve `{ category, items: {raw_text, role, food_id?}[] }`. Quita `[CATEGORÍA]`, separa líneas por ` · ` e ingredientes por `con` / `+` / `,` / `y` (sin cortar dentro de paréntesis). `A/B` = alternativas: casa la primera opción que sea un alimento y `raw_text` guarda el original (riesgo 2 del plan). El rol sale del alimento; si no casa, de la posición (verdura · proteína · hidrato).
  - `lib/nutrition/food-catalog.ts`: `FOOD_CATALOG`, unos 47 alimentos con `name_es`, `aliases` y `role`, sacados de EJEMPLO DE MENU. Sin nutrientes. Los `id` son slugs locales.
  - `scripts/verify-dish-parse.ts`: `npx tsx scripts/verify-dish-parse.ts [ruta.md]`. Lista cada plato con ✓/✗ y sale con código 1 si se casan menos del 90 % de las líneas.
- **Resultado:** 14 platos únicos (las semanas 3 y 4 son plantilla y se saltan) → 76 líneas, 75 casadas (**98,7 %**). La única no casada es «Ensalada de colores», que es ambigua de verdad y queda para que Amanda la corrija.
- **Duda:**
  1. Separé también por `,` y ` y `, que el brief no pedía. Sin eso, «Ensalada de tomate, melva y aguacate» sería un solo item con un solo alimento, y la melva y el aguacate se perderían de los macros. Cada item lleva un solo `food_id`, así que hay que separarlos.
  2. El esquema de `foods` del plan no tiene `role`, y el parser lo necesita para dar a aguacate y nueces el rol `fat` y no el de verdura.
- **Recomendación:**
  - Para el punto 2: que O1 siembre `foods` a partir de `FOOD_CATALOG` (`name_es` y `aliases`) y que O3 cruce el id de la DB con el catálogo por `name_es` para sacar el `role`. Si se prefiere tenerlo en DB, la alternativa es añadir `foods.default_role` en O1.
  - Los condimentos (sal, pimienta, ajo, cúrcuma…) salen con `role='other'`. O3 tiene que decidir si se quedan sin gramos sin que eso deje el plato como «no cuantificado».
- **Bloquea a Adrián:** no.

## Para Adrián
El parser ya convierte cada plato del Word en ingredientes del catálogo: 98,7 % de las líneas casadas en el menú de ejemplo (75 de 76).
