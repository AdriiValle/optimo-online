# Investigación: apps de nutrición para adaptar a la app de Amanda y los jugadores

Rol fuerte (Opus). **Solo investigar y escribir un informe**; no toques código ni `plan-rediseno-apple.md` (otro agente lo está editando).

## Contexto
App Next.js «Óptimo Online» para futbolistas (pilotos: Ricardo Visus). Ya existe y debe conservarse:
- Panel de la nutricionista (Amanda) en `app/nutricion/*`: menú semanal/día/mes por franjas (desayuno, media mañana, comida, merienda, cena), tarjetas por proteína, ficha del plato con foto e ingredientes, importación del menú desde Word, generación automática de ingredientes ya confirmados, resumen semanal con anillos y objetivos calculados del perfil (peso, altura, edad), perfil del deportista, suplementos y notas de dieta (`app/a/[id]/nutrition-pane.tsx` lado jugador), tipo de día MD±n (partido).
- Lado jugador: `app/a/[id]/*`, móvil primero, ve su plan.
Lee lo mínimo del repo para entender (`lib/nutrition/*`, `lib/queries.ts` tipos, `db/schema.sql` tablas de nutrición, `app/nutricion/[athleteId]/`).

## Qué quiero saber (con fuentes en la web)
1. **Apps y plataformas de referencia** para nutricionistas con clientes deportistas y para el cliente: Nutrium, Dietopro/Dietistas, Mealfit, NutriAdmin, Cronometer, MyFitnessPal, Yazio, Mealime, Whoop/Garmin/TrainingPeaks (nutrición de rendimiento: periodización por día de partido), Eat This Much, Apple Fitness/Health. Para cada una: qué hace bien, funciones clave, qué merece copiarse y qué no.
2. **Vista del jugador «qué como hoy»**: cómo lo resuelven las mejores (tarjeta del día, franjas, checklist, foto, porciones, sustituciones, recordatorios, registro rápido).
3. **Lista de la compra** generada del menú semanal: cómo agrupan por pasillo/categoría, suman cantidades entre platos, redondean a unidades de compra, marcan lo que ya hay en casa, exportan/comparten (WhatsApp/PDF/Reminders). Propón cómo hacerlo con **nuestros datos** (`meal_items`: alimento + gramos; `foods`) sin API de pago.
4. **Herramientas de la nutricionista**: seguimiento de peso/medidas/composición corporal con gráficas, anamnesis y objetivos, plantillas de menú y de día (MD-1, MD, MD+1), biblioteca de platos y recetas, sustituciones/equivalencias, intercambios, alertas (alergias/intolerancias), notas y mensajes al jugador, informes/PDF, adherencia (qué cumplió el jugador), comparativa plan vs real.
5. **Datos y precisión**: bases de alimentos abiertas útiles (BEDCA, USDA FDC, OpenFoodFacts) y cómo mejorar el emparejado de ingredientes sin alimento (hoy ~23 sin `food_id`).
6. **Qué NO copiar** (peso, calorías obsesivas, gamificación tóxica) — contexto de deportistas jóvenes.

## Entregable
`workflow/briefs/from-opus-investigacion-nutricion.md` (máx. ~250 líneas, en español):
- Tabla comparativa corta de herramientas (función → quién la hace bien → adaptación propuesta a nuestra app).
- **Propuesta de producto** priorizada en 3 niveles: *Imprescindible* (jugador: «hoy» + lista de la compra; Amanda: pestañas necesarias), *Muy valioso*, *Más adelante*. Para cada función: qué ve cada rol, qué datos nuevos hacen falta (tablas/columnas) o si solo es presentación, esfuerzo S/M/L.
- Propuesta de **estructura de pestañas/ventanas del panel de Amanda** conservando lo actual (p. ej. Menú · Seguimiento · Plantillas · Lista/Compra · Informes) y de la **vista nutrición del jugador** (Hoy · Semana · Compra).
- Lista de fuentes (URLs) usadas.
No inventes cifras; si no encuentras algo, dilo.
