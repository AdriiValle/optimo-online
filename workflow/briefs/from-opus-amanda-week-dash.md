# from-opus-amanda-week-dash

- Hecho: sí (la parte visual está terminada; los números saldrán como pendientes hasta que el modelo guarde cantidades)
- Qué cambió (commit `f764373` en dev):
  - `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`: los anillos de cobertura de Sonnet se han sustituido por `WeekPanel` con `Ring` (anillo KPI con estado vacío) y `MacroDonut` (donut P/HC/G segmentado con su leyenda). El contador de platos se queda como texto secundario en la cabecera, no como KPI.
  - `app/globals.css` (solo escritorio, a partir de 1280 px): estilos `.nut-dash*`, `.nut-ring*` y `.nut-macro*`; semana un poco más compacta (columna de franjas 84→76 px, gap 4→3, celdas 44→40 px, snacks 36→32 px, letra 0.8125→0.78rem).
  - No se ha tocado el rail, el calendario, los deportistas ni el móvil. `tsc --noEmit` está limpio.
- Duda: no he revisado la vista en el navegador (para entrar hace falta sesión de nutricionista). Solo he comprobado tsc.
- Recomendación: que Adrián u otro worker eche un vistazo rápido a `/nutricion/<id>` a 1280 px o más. Si los micros quedan apretados, se baja `grid-template-columns` de `.nut-dash-micros` o el `size` de los anillos.
- Bloquea a Adrián: no

## Para Adrián

**Métricas elegidas (vista semanal):**
- **Energía:** kcal de la semana (anillo grande).
- **Macros:** donut P/HC/G con g y % de las kcal.
- **Proteína en g/kg/día** e **hidratos en g/kg/día.** He añadido los hidratos en g/kg porque en un deportista ese es el dato clave del combustible para los días MD-1 y MD, más que el % de kcal.
- **Micros:** fibra, sodio, hierro, calcio y vitamina D (por día de media).

**Faltan datos:** ningún número está inventado. `MealSlot` solo guarda el título y la preparación en texto, y el importador de Word solo saca proteína y plato como texto. No hay gramos ni tablas de nutrientes en ninguna parte del repo. El peso existe en la base de datos (`athletes.weight_kg`), pero no se pasa a esta pantalla.

Lo que habría que añadir al modelo para rellenar los anillos:
1. Ingredientes por plato con gramos (`meal_items`: meal_slot_id, alimento, gramos), o como mínimo kcal/P/HC/G/fibra/Na/Fe/Ca/vitD por plato puestos a mano.
2. Una tabla de composición de alimentos (por ejemplo BEDCA o USDA) para calcular desde los gramos.
3. Pasar `weightKg` del deportista al cliente para calcular g/kg.
4. Opcional: objetivos por deportista (kcal, g/kg) para que el anillo muestre el % frente al objetivo y no solo el valor.

Los componentes ya aceptan valores reales (`value`/`pct`, y `kcal` en el donut): cuando exista el dato, conectarlo es cambiar los `null` de `WeekPanel`.
