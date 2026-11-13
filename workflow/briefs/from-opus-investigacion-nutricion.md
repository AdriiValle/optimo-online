# Resultado: investigación de apps de nutrición → propuesta para Amanda y jugadores

- **Hecho:** sí (solo informe; no se toca código ni `plan-rediseno-apple.md`).
- **Qué cambió (rutas):** `workflow/briefs/from-opus-investigacion-nutricion.md` (este archivo, nuevo).
- **Duda:** dos supuestos de datos que conviene que Amanda confirme antes de construir la lista de la compra: (a) si los gramos de `meal_items` son en crudo (así lo asume `lib/nutrition/portions.ts`: «Gramos de referencia, en crudo»); (b) si el jugador compra él mismo o la familia/club (cambia a quién se comparte la lista).
- **Recomendación:** construir con (a) = crudo, que es lo que ya dice el código, y (b) = el jugador compra y comparte por WhatsApp; las dos cosas se pueden cambiar después sin rehacer nada.
- **Bloquea a Adrián:** no.

Nota de método: las cifras de terceros se citan tal cual con fuente. Muchas fuentes de funciones son comparativas o blogs de competidores; donde la fuente oficial no lo confirma, lo indico. No encontré documentación propia de Whoop, Apple Health ni Mealfit sobre planificación de menús (ver §6).

---

## 0. Qué tenemos hoy (lectura mínima del repo)

- `meal_slots` (deportista, fecha, franja: desayuno/media mañana/comida/merienda/cena, título, preparación, foto).
- `meal_items` (plato → `food_id` opcional, `raw_text`, `role` veg/protein/carb/fat/other, `grams`, `origin` rule/manual/llm, `confirmed`).
- `foods` (nombre_es, alias, `source` fdc/bedca/manual, kcal, macros, fibra, sodio, hierro, calcio, vit. D). Hoy el seed es USDA SR Legacy (`db/seed-foods.ts`).
- `portion_templates` (gramos por tipo de día rest/training/match × franja × rol). `dayTypeFromMdTag` traduce MD±n → tipo de día.
- `athletes`: nacimiento, altura, peso, `diet_notes`, `supplements` (jsonb). **No hay** alergias, histórico de peso, registro de cumplimiento ni categoría de pasillo.
- Panel Amanda: vista Día/Semana/Mes, cajón del plato, editor de ingredientes, importación Word, resumen con anillos (`lib/nutrition/targets.ts`: Mifflin-St Jeor + g/kg de HC por tipo de día).
- Jugador (`app/a/[id]/nutrition-pane.tsx`): notas de dieta, suplementos y «Menú del día» (lista con foto, franja, título, preparación).

## 1. Tabla comparativa (función → quién la hace bien → adaptación propuesta)

| Función | Quién la hace bien | Qué copiar / qué no | Adaptación a nuestra app |
|---|---|---|---|
| Lista de la compra generada del plan | **Nutrium** (se genera del plan, el cliente elige 1–5 semanas, gramos con casilla de comprado, puede añadir cosas a mano) · **Eat This Much** (se actualiza al cambiar el plan, imprime/email) · **Yazio** (Pro) | Copiar: rango de semanas, casilla, añadir a mano. **No copiar** lo que Nutrium hace mal según reseñas: solo deja ver la semana en curso | Generar de `meal_items` de la semana elegida; casillas en el móvil; compartir texto |
| Agrupar por pasillo y sumar entre platos | **Mealime** (agrupa por sección y suma duplicados; fuentes de terceros) · **Recordatorios de iOS 17** (lista tipo «Compra» ordena sola por secciones y aprende al mover) | Copiar: secciones fijas + «Otros» al final; recordar la sección que corrige el usuario | Columna `foods.aisle`; lo no clasificado va a «Otros» |
| Despensa / «ya lo tengo» | **Eat This Much** (despensa virtual que descuenta) | Hay quejas de que acaba comprando de más o de menos. No copiar la despensa con inventario: es mantenimiento que nadie hace | Solo «ya lo tengo» por semana (casilla), sin inventario |
| Equivalencias / sustituciones | **Nutrium** (listas de equivalentes con cantidades recalculadas; imprimibles) · **DietoPro** (el paciente intercambia platos para mejorar adherencia) | Copiar: alternativas que define la nutricionista, con gramos recalculados | Tabla de equivalencias por rol (p. ej. 150 g pollo ↔ 170 g merluza) que Amanda aprueba |
| Plan periodizado por día de partido | **Hexis** (Carb Coding™; equipo detrás de «Fuel for the Work Required») · **TrainingPeaks** Fueling Insights (solo ciclismo con potencia, julio 2025) · Consenso **UEFA 2020** | Copiar: el día dice el «nivel de combustible», no un número de kcal | Ya existe `day_type`; mostrar al jugador «Día de carga / Día normal / Día suave» con color, sin kcal |
| Objetivos de nutrientes editables por el profesional | **Cronometer Pro** (objetivos por defecto DRI por edad/sexo, todos editables; el pro ve diario, objetivos, informes y gráficas del cliente) | Copiar: objetivos calculados + que Amanda pueda sobrescribirlos | `athlete_targets_override` (o jsonb en `athletes`) sobre `dailyTargets()` |
| Ocultar calorías al cliente | **Cronometer** (el usuario puede ocultar fila de energía/resumen; no confirmé un ajuste que controle el profesional) · **Healthie** (ajuste «Eating Disorder Settings» que desactiva Métricas, Fitness y Notas del cliente) | Copiar la idea de interruptor por deportista | Por defecto el jugador **no ve** kcal ni gramos de macros; Amanda puede activarlo |
| Seguimiento peso/medidas con gráficas | **Nutrium** (pestaña de medidas en la app del cliente) · **DietoPro** (seguimiento de evolución) · **Cronometer** (biométricos a medida, gráficas) | Copiar para Amanda. No mostrar el peso al jugador como protagonista | Tabla `body_measurements`; gráfica solo en el panel de Amanda |
| Plantillas de menú | **NutriAdmin** (desde cero, plantillas o generador IA; las reseñas dicen que el editor es difícil) · **DietoPro** (sistema experto para dietas) | Copiar plantillas. No copiar el generador IA ni editores complejos | «Guardar semana/día como plantilla» y «aplicar plantilla MD-1/MD/MD+1» |
| Informes / PDF | **NutriAdmin** (informes con plantillas que se rellenan con datos del cliente) · DietoPro (menús y listas en PDF o app; fuente genérica) | Copiar: un PDF semanal limpio | Vista imprimible del menú semanal + lista de la compra (`window.print`) |
| Registro / adherencia | **Nutrium** (diario de comidas o avisar de que ha completado) · DietoPro (registro de ingesta y mensajes asíncronos) · MyFitnessPal/Yazio/Garmin (registro con foto/código de barras, de pago) | Copiar: «hecho» de un toque por franja. **No copiar** registro por gramos, escáner, IA de fotos | `meal_checks` (franja, estado hecho/parcial/no, foto opcional) |
| Mensajes / notas | Nutrium, DietoPro, NutriAdmin (portal cliente, mensajería) | Copiar notas por día/plato. No construir un chat | Nota de Amanda por día (`meal_days.note`) y comentario del jugador en el «hecho» |
| Nutrición ligada a entrenamiento | **Garmin Connect+** (desde 2026: registro por código/foto/manual, calorías ligadas a carga y recuperación; de pago) · Whoop (no encontré registro nativo; importa de MyFitnessPal/Apple Health) | Copiar solo el vínculo plan de entreno ↔ tipo de día (ya lo tenemos con MD±n) | Nada nuevo: reutilizar el calendario de sesiones |

## 2. Vista del jugador «qué como hoy»: patrones que funcionan

Lo que se repite en las apps buenas (Nutrium, DietoPro, Eat This Much, Mealime) y adaptado a un futbolista joven en el móvil:

1. **Tarjeta del día arriba**: fecha, etiqueta MD (p. ej. «MD-1 · Día de carga») con color, y una frase de Amanda si la hay. Sin número de kcal.
2. **Franjas en orden temporal**, la siguiente comida destacada («Ahora: Comida»), las pasadas plegadas.
3. **Cada plato**: foto (ya existe), título, ingredientes en **medidas caseras** cuando existan (1 plato, 2 huevos, 1 puñado), si no, gramos redondeados; preparación plegable.
4. **Checklist de un toque** por franja: ✓ Hecho · ½ A medias · ✕ No. Opcional: foto del plato real. Sin escribir gramos.
5. **Sustituciones**: botón «Cambiar» que solo ofrece las equivalencias que Amanda aprobó (patrón DietoPro/Nutrium).
6. **Suplementos del día** dentro de la franja en la que tocan (hoy van aparte en `supplements`).
7. **Recordatorios**: dejar para «Más adelante» (push web en iOS exige PWA instalada; no merece el esfuerzo ahora).
8. **Registro rápido**: solo el check; nada de buscar alimentos ni escanear códigos.

## 3. Lista de la compra con nuestros datos (sin API de pago)

Cómo lo hacen: Nutrium suma los alimentos del plan para N semanas en gramos con casilla; Mealime agrupa por sección y fusiona duplicados; Recordatorios de iOS agrupa por secciones y deja «Otros» al final; Eat This Much imprime/email y envía a Instacart (eso no aplica en España).

**Propuesta de algoritmo (presentación + 3 columnas en `foods`):**

1. Entrada: deportista + rango de fechas (por defecto lunes–domingo de la semana visible; opción «próximos 3 días»).
2. `SELECT meal_items JOIN meal_slots` del rango, solo `confirmed = true` (o todos con aviso «pendiente de confirmar»).
3. Agrupar por `food_id`; sumar `grams`. Items sin `food_id` → agrupar por `raw_text` normalizado (sin tildes, minúsculas) en la sección «Otros / revisar».
4. Convertir a **unidad de compra** con columnas nuevas en `foods`:
   - `aisle text` (enum lógico: Fruta y verdura · Carne · Pescado · Huevos y lácteos · Panadería y cereales · Legumbres y despensa · Aceites y salsas · Congelados · Otros).
   - `unit_name text` y `unit_g numeric` (p. ej. «huevo» 60 g, «plátano» 120 g, «lata» 80 g escurrido): muestra «6 huevos» en vez de 360 g. **Los pesos por unidad los pone Amanda** en una pantalla de alimentos; no los invento aquí.
   - `pack_g numeric` opcional (bolsa de arroz 1000 g): muestra «≈ 0,4 bolsa → 1 bolsa».
   - Redondeo: unidades hacia arriba; gramos sueltos a 50 g (carnes/pescados a 100 g). Regla simple y visible.
5. Básicos que no se compran cada semana (aceite, sal, especias): `foods.staple boolean` → sección «Despensa: revisa que tengas» sin cantidad.
6. **«Ya lo tengo»**: casilla por línea, guardada en `shopping_checks (athlete_id, week_start, food_key, checked)`; nada de inventario.
7. **Compartir** (sin API): botón Web Share (`navigator.share`) con texto plano agrupado por secciones → WhatsApp, Notas o Recordatorios (si se pega en una lista tipo «Compra» de iOS 17, Recordatorios la reordena por secciones sola). Fallback: copiar al portapapeles. **PDF**: vista imprimible con `@media print`.
8. Si se usan gramos cocinados en algún plato (dudas §0), la conversión crudo/cocido va en `foods` (`cooked_factor`); hoy no hace falta.

Lo que no haría: integración con supermercados, precios, despensa con descuento automático.

## 4. Herramientas de la nutricionista: qué hay en el mercado y qué nos falta

| Herramienta | Referencia | ¿La tenemos? | Propuesta |
|---|---|---|---|
| Peso / medidas / composición con gráficas | Nutrium, DietoPro, Cronometer (biométricos) | Solo peso actual en `athletes.weight_kg` | `body_measurements(athlete_id, date, weight_kg, body_fat_pct, skinfold_sum_mm, waist_cm, notes)`; gráfica de línea en Seguimiento. El peso del perfil pasa a ser el último registro |
| Anamnesis y objetivos | NutriAdmin (cuestionarios en el portal), DietoPro | `diet_notes` libre | `athletes.allergies text[]`, `intolerances text[]`, `diet_goal text`, `dislikes text[]` |
| Alertas alergias/intolerancias | (no encontré una referencia concreta documentada) | No | Aviso en el cajón del plato si un ingrediente casa con una alergia (por `food_id` o alias). Presentación + columna de arriba |
| Plantillas de día y semana (MD-1, MD, MD+1) | NutriAdmin, DietoPro | Solo `portion_templates` (gramos por rol) | `menu_templates(id, nutritionist_id, name, kind day/week, day_type)` + `menu_template_slots` (mismo shape que `meal_slots`/`meal_items`). «Aplicar» copia filas a fechas |
| Biblioteca de platos | NutriAdmin, Nutrium (recetas en la app cliente) | Los platos viven solo como `meal_slots` fechados | `dishes(id, title, preparation, photo)` + `dish_items`; el cajón ofrece «buscar en mis platos». Reutiliza fotos ya subidas |
| Equivalencias / intercambios | Nutrium (listas de equivalentes, recalcular) | No | `food_swaps(food_id, swap_food_id, ratio)` o calcular por proteína/HC del rol; Amanda aprueba cada par |
| Notas y mensajes al jugador | Nutrium, DietoPro | `diet_notes` global | Nota por día; sin chat |
| Informes / PDF | NutriAdmin | No | PDF semanal (menú + objetivos + lista); más adelante informe mensual con peso y cumplimiento |
| Adherencia / plan vs real | Nutrium (registro o «completado»), Cronometer Pro (ve el diario del cliente) | No | `meal_checks` + % de franjas hechas por semana y por tipo de día; la foto real junto a la del plan |
| Objetivos editables | Cronometer Pro | Calculados, no editables | Sobrescritura por deportista (jsonb `athletes.target_overrides`) |

## 5. Datos y precisión

- **USDA FoodData Central** (lo que usamos): API gratis con clave de api.data.gov; según agregadores, 1000 peticiones/hora con clave y ~30/h con DEMO_KEY (no lo vi en página oficial). Tipos: Foundation, SR Legacy, FNDDS, Branded. Dominio público / CC0 según fuentes secundarias; nuestro seed ya lo trata como dominio público. Bueno para materia prima; malo para nombres en español y productos españoles.
- **BEDCA** (AESAN, red EuroFIR): referencia nacional, más de 3000 alimentos según una fuente, consulta web en bedca.net. **No encontré** si ofrece descarga masiva o API; pocos procesados industriales. Útil para alimentos típicos españoles (legumbres cocinadas, embutidos, pescados locales). Ya está previsto en `foods.source = 'bedca'`.
- **Open Food Facts**: API y volcados diarios (MongoDB/JSONL/CSV), licencia ODbL (base) + DbCL (contenidos) + CC-BY-SA (imágenes). ODbL obliga a compartir derivados de la base: usarlo solo para consulta puntual de productos envasados (pan de molde, bebida de avena, yogur concreto) copiando a `foods` con `source='manual'` y `source_ref` = código de barras, no para mezclar la base.

**Emparejar los ~23 ingredientes sin `food_id` (sin API de pago):**

1. Informe «sin alimento» en el panel: agrupa los `raw_text` huérfanos por texto normalizado y cuenta apariciones (presentación).
2. Por cada uno, **un clic de Amanda**: «es alias de X» (añade a `foods.aliases`) o «alimento nuevo» (fila `manual`). Al guardar, se re-emparejan todos los items con ese texto. Es lo que más precisión da y escala porque los menús se repiten.
3. Mejorar el casado automático antes de molestarla: quitar plurales (-s/-es), quitar adjetivos de preparación (a la plancha, cocido, asado, al horno, troceado) a una lista de «palabras de preparación», y probar coincidencia por la palabra principal. Si queda más de un candidato, sugerir, no asignar.
4. Opcional (Más adelante): búsqueda en FDC con traducción manual para crear la fila con nutrientes.

## 6. Qué NO copiar (deportistas jóvenes)

- **Calorías visibles para el jugador** y mensajes tipo «te quedan X kcal hoy» (es el patrón del que se quejan usuarios en recuperación en el foro de Cronometer). Evidencia: revisión sistemática que asocia el uso de apps de dieta/fitness con alimentación desordenada, preocupación por la imagen corporal y ejercicio compulsivo (asociación, no causalidad; pide más estudio en adolescentes); en una muestra de jóvenes, quienes usaban rastreadores tenían más alimentación desordenada; en deportistas de fuerza, el 64,6 % contaba calorías y los autores advierten del riesgo de fijación. **No encontré** un estudio específico de futbolistas adolescentes.
- **Peso como métrica del jugador** (gráfica de peso en su pantalla, «objetivo de peso»). El seguimiento corporal es de Amanda.
- **Gamificación con rachas y castigo** (perder una racha, rankings entre compañeros). Sí vale un resumen neutro «esta semana: 18 de 21 comidas hechas» solo para Amanda o, como mucho, para el jugador sin comparación.
- **Registro de gramos, escáner de código de barras, IA de fotos** (MyFitnessPal, Yazio, Garmin Connect+ los cobran): fricción alta y foco en números.
- **Despensa con inventario** (Eat This Much): mantenimiento que nadie hace.
- **Generador automático de dietas por IA** (NutriAdmin, DietoPro): Amanda es la que prescribe; el valor de la app es ahorrarle trabajo mecánico, no sustituirla.
- **Tests genéticos o «biomarcadores» comerciales**: el consenso UEFA dice que no hay evidencia para prescribir por genética; los análisis (hierro, vit. D) los pide el médico/nutricionista, no la app.

## 7. Propuesta de producto priorizada

Esfuerzo: S ≈ 1 tarde · M ≈ 1–3 días · L ≈ 1 semana+.

### Imprescindible

| # | Función | Jugador ve | Amanda ve | Datos nuevos | Esfuerzo |
|---|---|---|---|---|---|
| I1 | **«Hoy» del jugador** | Tarjeta del día (MD y nivel de combustible con color, nota), franjas en orden con la siguiente destacada, foto, ingredientes redondeados, preparación plegable, suplementos en su franja | Lo mismo en una previsualización «como lo ve el jugador» | Solo presentación (suplementos por franja: añadir `slot` opcional dentro del jsonb `supplements`) | M |
| I2 | **Semana del jugador** | Tira de 7 días con MD y miniatura por franja; tocar = abre «Hoy» de ese día | — | Presentación | S |
| I3 | **Lista de la compra** | Rango (semana / próximos 3 días), secciones por pasillo, cantidades sumadas en unidad de compra, «ya lo tengo», compartir (WhatsApp/copiar) e imprimir | Misma lista (para revisar antes) + aviso de alimentos sin sección/unidad | `foods.aisle`, `foods.unit_name`, `foods.unit_g`, `foods.pack_g`, `foods.staple`; `shopping_checks` | M |
| I4 | **Pantalla Alimentos** (Amanda) | — | Tabla de `foods` con sección, unidad, alias; bandeja «sin alimento» con un clic para asignar | Presentación + escribir en `foods` (RLS ya permite a nutricionista) | M |
| I5 | **Alergias e intolerancias** | Aviso visible en su ficha | Campo en el perfil; alerta en el cajón del plato si coincide | `athletes.allergies text[]`, `athletes.intolerances text[]` (+ ampliar la RPC de perfil) | S |
| I6 | **Sin kcal para el jugador por defecto** | Nada de kcal ni macros en gramos | Interruptor por deportista | `athletes.show_numbers boolean default false` | S |

### Muy valioso

| # | Función | Jugador ve | Amanda ve | Datos nuevos | Esfuerzo |
|---|---|---|---|---|---|
| V1 | **Check de comidas** (adherencia) | ✓ / ½ / ✕ por franja, foto opcional, comentario corto | % por semana y por tipo de día; foto real junto a la del plan | `meal_checks(meal_slot_id, status, photo_bytes, note, checked_at)` | M |
| V2 | **Seguimiento corporal** | Nada (o solo si Amanda lo activa) | Registro de peso, % graso/pliegues, cintura; gráfica de líneas; el peso del perfil = último | `body_measurements` | M |
| V3 | **Plantillas MD-1 / MD / MD+1 y de semana** | — | «Guardar día/semana como plantilla», «Aplicar a…» | `menu_templates` + hijos con forma de `meal_slots`/`meal_items` | L |
| V4 | **Biblioteca de platos** | — | Buscar plato existente al rellenar franja; reutiliza foto e ingredientes | `dishes` + `dish_items` (o vista sobre `meal_slots` deduplicados por título, que es S) | M |
| V5 | **Sustituciones aprobadas** | Botón «Cambiar» con alternativas | Define pares por rol con gramos | `food_swaps(food_id, swap_food_id, ratio, approved_by)` | M |
| V6 | **PDF semanal** | Descargar/imprimir su semana | Imprimir menú + lista + objetivos | Presentación (`@media print`) | S |
| V7 | **Nota del día** | En la tarjeta del día | Campo por fecha | `meal_day_notes(athlete_id, date, note)` | S |

### Más adelante

- Objetivos sobrescritos por Amanda (`athletes.target_overrides jsonb`) — S.
- Plan vs real con números (macros estimados de lo marcado «hecho») solo para Amanda — M.
- Informe mensual (peso + cumplimiento + notas) en PDF — M.
- Recordatorios push (requiere PWA instalada en iOS) — L.
- Carga de alimentos de BEDCA (si hay forma de exportar) o de Open Food Facts por código de barras, a mano — M.
- Hidratación y combustible intra-partido (consenso UEFA citado: 30–60 g HC/hora en juego, según artículo posterior) como recordatorio fijo en MD — S.
- Anamnesis completa (cuestionario inicial) — M.

## 8. Estructura de pestañas

### Panel de Amanda (`app/nutricion/[athleteId]`), conservando todo lo actual

1. **Menú** (lo que hay hoy, sin cambios de fondo): Día · Semana · Mes, cajón del plato, importar Word, anillos de resumen. Añade: nota del día (V7), «aplicar plantilla» (V3), alerta de alergias (I5), previsualización «como lo ve el jugador» (I1).
2. **Seguimiento**: cumplimiento por semana (V1), gráfica corporal (V2), fotos reales vs plan.
3. **Perfil**: lo actual (nacimiento, altura, peso, notas de dieta, suplementos) + alergias/intolerancias (I5), interruptor «mostrar números» (I6), objetivos sobrescritos (Más adelante).
4. **Compra**: la lista del jugador para revisarla (I3).
5. **Plantillas y platos**: plantillas de día/semana (V3), biblioteca (V4), sustituciones (V5).
6. **Alimentos** (global, no por deportista; mejor en `app/nutricion/alimentos`): tabla de `foods`, bandeja «sin alimento» (I4).
7. **Informes**: PDF semanal (V6) y, más adelante, mensual.

Orden de construcción sugerido: Menú (existe) → Perfil (+alergias) → Alimentos → Compra → Seguimiento → Plantillas → Informes.

### Vista nutrición del jugador (`app/a/[id]`, móvil primero)

- **Hoy** (por defecto): tarjeta del día + franjas + checks (cuando llegue V1).
- **Semana**: tira de 7 días con MD.
- **Compra**: lista con secciones, «ya lo tengo», compartir.
- Notas de dieta y suplementos dejan de ser bloque aparte: las notas generales van en un desplegable «Indicaciones de Amanda» dentro de Hoy; los suplementos, en su franja.

## 9. Fuentes

- Nutrium, lista de la compra: https://help.nutrium.com/en/articles/5195586-can-my-client-create-a-shopping-list · https://blog.nutrium.com/shopping-lists-now-available-on-nutrium/
- Nutrium, reseñas (bugs de la lista, solo semana actual): https://uk.trustpilot.com/review/nutrium.io
- Nutrium, app cliente: https://wp.nutrium.com/nutrium-mobile-app-for-nutrition-clients/?amp=1
- Nutrium, equivalentes y sustituciones: https://intercom.help/nutrium/en/articles/1592533-what-are-food-groups-and-equivalents · https://help.nutrium.com/en/articles/7068252-how-can-i-suggest-foods-with-equivalent-quantities · https://help.nutrium.com/en/articles/598164-how-can-i-add-food-swaps · https://wp.nutrium.com/now-you-can-print-your-lists-of-equivalents
- DietoPro: https://www.softwaredoit.es/dietopro/dietopro.html · https://fitgeneration.es/5-mejores-softwares-para-dietistas/ · https://apps.apple.com/bg/app/dietoprodn/id6448843508 · https://universidadeuropea.com/blog/software-nutricional/
- NutriAdmin: https://www.capterra.co.uk/reviews/151688/nutriadmin · https://www.toolmage.com/en/tool/nutriadmin/ · https://www.getapp.com/healthcare-pharmaceuticals-software/a/nutriadmin/
- Cronometer Pro: https://cronometer.com/pro · https://cronometer.com/blog/cronometer-pro/ · https://cronometer.com/blog/tracking-nutrition-without-focusing-on-calories/ · https://forums.cronometer.com/discussion/4654/is-there-a-way-to-hide-kcal-information · https://forums.cronometer.com/discussion/1350/new-cronometer-update-isnt-great-if-youre-recovering-from-an-eating-disorder
- Healthie, ajustes para TCA: https://www.gethealthie.com/plus/catalog/eating-disorder-settings
- Mealime: https://medium.com/mealime/improvements-to-recipe-search-and-the-grocery-list-11cf68b8a87d (oficial, sin detalle) · https://grate-six.vercel.app/blog/meal-planning-and-grocery-list-app (terceros)
- Eat This Much: https://www.eatthismuch.com/faq · https://www.plantoeat.com/blog/2023/10/eat-this-much-app-review-pros-and-cons/ · https://amp.cnn.com/cnn/cnn-underscored/reviews/best-meal-planning-apps
- Yazio / MyFitnessPal (terceros, contradictorias): https://apps.apple.com/us/app/yazio-calorie-counter-app/id946099227 · https://foodcraft.app/en/compare/myfitnesspal-vs-yazio · https://nutrola.app/en/blog/what-is-the-best-meal-planning-app-2026
- Recordatorios iOS 17: https://www.macrumors.com/2023/06/07/ios-17-reminders-grocery-sorting/ · https://iphonelife.com/content/how-to-automatically-sort-grocery-lists
- Garmin Connect+ nutrición: https://www.dcrainmaker.com/2026/01/garmin-connect-nutrition-logging-connect.html · https://www.tomsguide.com/wellness/smartwatches/garmin-launches-nutrition-tracking-but-youll-have-to-subscribe-to-connect-to-get-it
- Whoop (sin registro nativo; Advanced Labs): https://www.community.whoop.com/t/product-suggestion-native-ai-nutrition-tracking-inside-whoop/14901 · https://www.whoop.com/advanced-labs
- TrainingPeaks Fueling Insights: https://www.trainingpeaks.com/coach-blog/introducing-fueling-insights/ · https://www.trainingpeaks.com/blog/optimizing-nutrition-fuelin-trainingpeaks/
- Hexis: https://directory.enterprise-ireland.com/vendor/enterprise-software/hexis
- Consenso UEFA 2020: https://www.gssiweb.org/en/research/article/uefa-expert-group-statement-on-nutrition-in-elite-football.-current-evidence-to-inform-practical-recommendations-and-guide-future-research · https://www.mysportscience.com/post/uefa-sports-nutrition · https://www.open-access.bcu.ac.uk/16453/1/s11332-025-01424-8.pdf
- USDA FDC: https://fdc.nal.usda.gov/api-guide · https://catalog.data.gov/dataset/fooddata-central
- BEDCA / AESAN: https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subseccion/composicion_alimentos_BD.htm · https://www.renc.es/imagenes/auxiliar/files/RENC2015supl1BEDCA.pdf
- Open Food Facts, licencia y datos: https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side · https://wiki.openfoodfacts.org/ODBL_License · https://world.openfoodfacts.org/data
- Apps y alimentación desordenada: https://pubmed.ncbi.nlm.nih.gov/39671845/ · https://pmc.ncbi.nlm.nih.gov/articles/PMC11587730 · https://www.center4research.org/fitness-tracking-apps-eating-disorders/

**Sin fuente encontrada:** Mealfit y Apple Fitness/Salud (planificación de menús); descarga masiva de BEDCA; documentación oficial de Mealime sobre la lista; ajuste de Cronometer Pro controlado por el profesional para ocultar calorías.

Decidí no hacer commit de este .md porque los demás `workflow/briefs/*` del repo están sin versionar y el brief no toca código; se commitea con el resto cuando el orquestador lo cierre.
