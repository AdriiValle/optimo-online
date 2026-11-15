# from-rd-N3: Nutrición jugador, lista de la compra

- **Hecho:** sí (sin commit, como pide el brief; lo hace el master).

## Qué cambió (rutas)
- `app/a/[id]/nutrition/shopping-view.tsx` (nuevo): vista **Compra**. Tiene:
  - segmentado Semana / Próximos 3 días y flechas ±7 o ±3 días, con «Ir a hoy»;
  - resumen «N productos por comprar · M ya en casa» y aviso de platos sin ingredientes confirmados;
  - Compartir (`navigator.share`, que pasa a copiar si no existe o falla) · Copiar (Clipboard API y, como respaldo, `execCommand`) · Imprimir (`window.print`);
  - secciones por pasillo con la casilla redonda «ya lo tengo», que se guarda al momento y se revierte con aviso si falla;
  - estados de carga (esqueleto), error, «Sin menú en estos días» y «Aún no hay ingredientes».
- `app/a/[id]/nutrition/actions.ts`: Server Actions `loadNutritionShopping` y `saveNutritionShoppingCheck`. Las dejó escritas un intento anterior de este brief y las mantengo.
- `app/a/[id]/nutrition-pane.tsx`: la pestaña Compra monta `ShoppingView`.
- `app/a/[id]/nutrition/segments.tsx`: quitado `NutritionSoon`, que mi cambio dejaba huérfano.
- `lib/nutrition/shopping.ts`: lógica pura, que ya venía del intento anterior:
  - pasillos, con reglas por nombre cuando `foods.aisle` está vacío;
  - despensa / staple;
  - unidades de compra (`unit_name/unit_g`, con piezas por defecto para huevo, fruta, yogur y tortilla);
  - redondeo a 50 g, o a 100 g en carne y pescado;
  - `pack_g`, rango y texto para compartir.
  - Retoque mío: el título de despensa salía con dos puntos repetidos en el texto compartido.
- `lib/nutrition/shopping-queries.ts`: lectura del rango (solo `meal_items` confirmados y vigentes por `text_hash`) y `setShoppingCheck` (marcar = upsert; desmarcar = borrar la fila).
- `app/styles/nutri-shared.css`:
  - bloque «Compra (rd-N3)» y `@media print` con la hoja limpia: solo la lista, a dos columnas, sin lo marcado y con un cuadro por línea;
  - reglas de reduced-motion y contrast al final de la hoja;
  - quitado `.nut-soon`, que quedó huérfano.
- Pruebas: `.tmp-verify/rd-N3/` (`shots.sh`, `shots2.sh`, `example.ts`, `checks-count.ts`, capturas y `print.pdf`).

## Ejemplo de cálculo manual (`npx tsx .tmp-verify/rd-N3/example.ts`)
| Alimento | Platos | Suma | Regla | Sale |
|---|---|---|---|---|
| Huevo | 120 + 240 | 360 g | 360/60 = 6 piezas (holgura de 0,1) | **6 huevos** |
| Pechuga de pollo | 180 + 200 + 150 | 530 g | carne: múltiplo de 100 hacia arriba | **600 g** |
| Arroz blanco (pack 1000) | 80 + 70 | 150 g | múltiplo de 50 + paquetes | **150 g · 1 paquete de 1 kg** |
| Espinacas | 120 + 45 | 165 g | múltiplo de 50 | **200 g** |
| Plátano (unidad 120 g) | 120 + 130 | 250 g | 250/120 = 2,08 → 2 | **2 plátanos** |
| Salmón (aisle «Pescado») | 140 | 140 g | pescado: 100 | **200 g** |
| Aceite de oliva | 10 + 10 | 20 g | básico | Despensa, sin cantidad |
| «Salsa casera…» (sin food_id) | 30 | 30 g | 50 | Otros / revisar · **50 g** |

La salida del script coincide con la tabla.

## Comprobado (localhost:3001, Ricardo, 390×844)
- Semana del 9 al 15 de noviembre: 36 productos en 7 secciones, `scrollWidth` = 390. Próximos 3 días (15 al 17 de noviembre): se recalcula a 19 productos. La semana del 30 de noviembre muestra «Sin menú en estos días», también con 390.
- «Ya lo tengo»: marqué 2 líneas y, tras recargar, siguen marcadas (Aguacate, Boniato). En 3 días se mantienen porque comparten `week_start`.
- Copiar muestra «Lista copiada». Compartir, con `navigator.share` simulado, recibe el título y el texto agrupado. El botón Compartir solo aparece si el navegador lo admite; si no, Copiar pasa a ser el botón principal.
- Imprimir, comprobado a PDF A4: una hoja con el título del rango y el resumen, a dos columnas, sin lo marcado, sin la interfaz de la app y con cuadros para tachar.
- Tamaños de toque: flechas 44×44, acciones 175×44, filas 358×44. El segmentado se ve a 32 y llega a 44 de toque, igual que el de N2. El foco con teclado se ve en filas y botones.
- `npx tsc --noEmit` limpio y consola sin errores.
- Datos de prueba borrados: `shopping_checks` tiene 0 filas.

## Duda
1. El brief pide la API en `app/api/nutrition/shopping/*`, pero el middleware reserva `/api/nutrition/*` a la nutricionista: el jugador recibiría 404. Usé Server Actions en `actions.ts`, el mismo patrón que Hoy (N1) y Semana (N2). No creé rutas en `/api/nutrition/shopping`.
2. Con los datos de Ricardo, 14 de 36 líneas caen en «Otros / revisar» sin cantidad: son `meal_items` sin `food_id` ni gramos («Carne picada», «Jamón», «Frutos secos»…). Va como pide el brief, pero la lista será más útil cuando Amanda empareje esos alimentos (N5).
3. La carpeta `app/a/[id]/nutrition/` está sin seguimiento en git, también con los archivos de N1 y N2. El master tiene que añadirla entera al commit.
4. Proceso: al empezar lancé `shots.sh` sin respetar `.tmp-verify/browse.lock`, que tenía rd-N6. Ese script cierra la sesión del navegador al arrancar, así que pudo afectar a rd-N6. Después esperé a que se liberara, tomé el lock y lo borré al acabar.

## Recomendación
- (1) Mantener las Server Actions. Si Amanda necesita la compra en su ficha (pestaña Compra del plan), crear entonces `app/api/nutrition/shopping/*` reutilizando `shoppingForRange`, que ya está separado.
- (2) Nada que hacer en N3. El emparejado de N5 y rellenar `foods.aisle/unit_name/unit_g` irán afinando la lista sola.
- (4) Pedir al master o a rd-N6 que revisen si su última verificación de navegador quedó a medias.

## Bloquea a Adrián
No.
