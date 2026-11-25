# to-sonnet-amanda-week-dash

Adrián: el **menú semanal** (bloque de la semana en el dashboard de Amanda) tiene que quedar **un poco más pequeño**. **Abajo**, un **panel/dashboard** con gráficos **circulares modernos** (tipo anillos/donuts, no barras feas) de:

- cantidad de **macros** que consume **en la semana**
- **micronutrientes** de la semana

Pide que **pienses / busques** (Claude Pro) qué datos importan de verdad a un **nutricionista** en vista semanal: ¿kcal semanales totales? ¿macros por día vs suma semanal? ¿proteína/kg? ¿fibra, Na, Fe, vit D, Ca…? Elige un set **corto y útil**, no un laboratorio de 40 vitaminas. Deja esos KPIs en el panel de abajo.

**Worker de implementación: opus** (Adrián lo pidió). Tú clasificas y **lanzas opus** (UI gráfica). Cwd: este repo (Óptimo / Ricardo Visus, nutrición Amanda).

Criterio:
- semana un poco más compacta
- panel inferior con anillos de macros + micros relevantes, datos reales del plan/comidas de esa semana si ya existen en el código; si falta un dato, di qué no se puede calcular
- tsc limpio
- ## Para Adrián y ## Lanzar (opus)

No uses composer/grok.
