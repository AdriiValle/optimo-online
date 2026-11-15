# rd-N3 - Nutrición jugador: lista de la compra

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Vista COMPRA: lista generada del menú. Rango semana o próximos 3 días; suma meal_items (confirmados) por alimento (food_id; los sin food_id agrupados por raw_text normalizado en 'Otros / revisar'); secciones por pasillo (foods.aisle: Fruta y verdura, Carne, Pescado, Huevos y lácteos, Panadería y cereales, Legumbres y despensa, Aceites y salsas, Congelados, Otros); cantidades en unidad de compra con foods.unit_name/unit_g ('6 huevos'), gramos redondeados a 50 g (carne y pescado a 100 g) si no hay unidad, foods.pack_g para 'bolsa/pack' opcional, foods.staple en sección 'Despensa: revisa que tengas' sin cantidad; casilla 'ya lo tengo' por línea guardada en shopping_checks; compartir como texto agrupado (navigator.share con fallback a copiar al portapapeles) e imprimir (@media print). Lógica pura y testeable en lib/nutrition/shopping.ts; consultas en lib/nutrition/shopping-queries.ts; API en app/api/nutrition/shopping/*. NO edites lib/queries.ts. Si foods.aisle está vacío, deduce una sección por defecto con una función de reglas por nombre (lista de palabras clave) en shopping.ts para que la lista salga útil desde el primer día.

## Archivos
- SI (solo estos): `app/a/[id]/nutrition/*`, `app/a/[id]/nutrition-pane.tsx`, `app/api/nutrition/shopping/*`, `lib/nutrition/shopping.ts`, `lib/nutrition/shopping-queries.ts`, `app/styles/nutri-shared.css`
- NO: lib/queries.ts, db/. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Compra a 390 genera la lista de la semana con secciones, cantidades sumadas entre platos y unidades de compra; cambiar de rango recalcula.
- 'Ya lo tengo' se guarda y se mantiene al recargar; compartir y copiar funcionan; imprimir da una hoja limpia.
- Estados: sin menú en el rango; alimentos sin sección en 'Otros'.
- La lógica de suma/redondeo está en lib/nutrition/shopping.ts y coincide con un cálculo manual de un ejemplo (el ejecutor deja el ejemplo en su from-rd).
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-N3/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-N3`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-N3/`.

## Al terminar
Escribe `workflow/briefs/from-rd-N3.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
