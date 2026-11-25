# to-sonnet-amanda-scroll-plan

Adrián, dos cosas. Tú master. Código de UI → **opus** (`-Yolo -Think`). No haiku. Plan del modelo → **opus** revisa/escribe; **no implementar** el cálculo de nutrientes todavía.

## 1) Primero (hacer ya)
El **bloque de contenidos** donde trabaja Amanda **no debe tener scroll**. El workspace (rail + main: semana/día/mes + dashboard) cabe en el viewport. Nada de scroll interno en esa zona de trabajo. Ajustar layout/altura/overflow. Archivos: `app/nutricion/**`, `app/globals.css` nut-*. tsc limpio.

## 2) Plan (no código de datos)
El resumen (anillos macros/micros/kcal) está vacío: no hay gramos. Adrián pregunta si hay que **unir a un modelo**, igual que el **import Word** que parte el menú en días según la estructura del doc.

Objetivo del plan: en función de las **comidas de cada día**, calcular **macros, micros y kcal totales**. Cómo ejecutarlo: fuentes (texto de platos vs ingredientes vs tabla BEDCA/USDA vs un LLM que parsea el Word/plato), qué guardar en DB, qué pasos, riesgos, Criterio de hecho. Escribir `workflow/briefs/plan-nutri-macros.md`. No inventar números en la UI.

## Lanzar
Oleada 1: opus slug `amanda-no-scroll` (punto 1).
Oleada plan: opus slug `plan-nutri-macros` (punto 2, `-Think`, no pinta CSS). Pueden ir en paralelo (archivos distintos: CSS/tsx vs plan md).

Cwd: este repo. ## Para Adrián + ## Lanzar (worker, slug, think, cwd).
