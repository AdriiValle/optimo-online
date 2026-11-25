# to-opus-plan-nutri-macros

Adrián quiere un **plan de ejecución** (no código de producto) para llenar el resumen de macros/micros/kcal.

Contexto: el import Word ya parte el menú en días según la estructura del doc. Las comidas son título/preparación. El dashboard muestra pendiente.

El plan debe decidir **cómo** calcular, a partir de las comidas de cada día: macros, micros, kcal totales (día/semana/mes). Cubrir:

- Fuentes: parseo LLM del Word/plato vs ingredientes+gramos vs tabla BEDCA/USDA vs mix
- Qué guardar en DB (campos, tablas)
- Pasos de oleada, riesgos, Criterio de hecho de cada paso
- Relación con el import Word existente
- No inventar números en UI hasta que haya datos

Escribe `workflow/briefs/plan-nutri-macros.md`. No toques `app/nutricion/**` ni `app/globals.css`. `-Think`. Cwd: este repo.

## Para Adrián: resume el plan (qué haríamos primero y por qué).
