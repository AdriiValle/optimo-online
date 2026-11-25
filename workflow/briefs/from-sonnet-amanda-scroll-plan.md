# from-sonnet-amanda-scroll-plan

- Hecho: no
- Qué cambió (rutas): nada
- Duda: El brief es un despacho para el master: pide lanzar dos workers opus (`amanda-no-scroll` para CSS/tsx, `plan-nutri-macros` para el plan) y dice que el código de UI va a opus. Como worker tengo prohibido despachar hijos, y el brief excluye sonnet de la UI y del plan.
- Recomendación: El master lanza dos workers opus en paralelo, sin solapamiento de archivos.
  1. `amanda-no-scroll` (`-Yolo -Think`): quitar el scroll interno del workspace de Amanda (rail + main semana/día/mes + dashboard) para que quepa en el viewport. Archivos: `app/nutricion/**` y los `nut-*` de `app/globals.css`. Debe pasar tsc limpio.
  2. `plan-nutri-macros` (`-Think`): escribir `workflow/briefs/plan-nutri-macros.md`. Debe cubrir fuentes (LLM que parsea el Word o el plato, ingredientes, tabla BEDCA/USDA), qué guardar en DB, pasos, riesgos y criterio de hecho. No debe tocar CSS, no debe implementar el cálculo y no debe inventar números en la UI.
- Bloquea a Adrián: no
