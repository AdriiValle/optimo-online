# Revisión del plan de rediseño (rol fuerte)

Lee `workflow/briefs/plan-rediseno-apple.md`, `workflow/context/design-system.md` y mira la estructura real de `app/` y `app/globals.css` (solo leer; no tocar código).

Haz una revisión corta y práctica, una sola vuelta:
1. ¿El orden de oleadas es correcto y las tareas paralelas de verdad no se pisan archivos? Corrige la lista de archivos SÍ por tarea si hace falta (reconoce los componentes reales que faltan, p. ej. formularios del diario, modales, `lib/`).
2. ¿F2 (partir `globals.css` en hojas) es viable sin cambio visual? Propón el corte concreto por líneas/secciones y cómo se verifica «idéntico».
3. ¿Falta alguna pantalla o flujo (login, redirecciones, `not-found`, `app/page.tsx`, estados vacíos)? Añádela a la tarea que toque.
4. Divide o fusiona tareas para que cada una quepa en un ejecutor sin quemar la ventana (ni demasiado grandes ni triviales).
5. Plantilla del brief de ejecutor y del brief de auditor (corta, reutilizable) con el Criterio de hecho y la lista de viewports y rutas a mirar.

Reescribe `workflow/briefs/plan-rediseno-apple.md` con tus correcciones (mismas secciones, sin inflar) y añade `workflow/briefs/plantillas-rediseno.md` con las dos plantillas. No cambies las reglas de ejecución (mismo directorio, sin worktrees, auditor ligero, máx. 2 vueltas) salvo que haya un fallo claro y dilo.

Escribe `workflow/briefs/from-opus-revision-plan-rediseno.md`: qué cambiaste (rutas), dudas, y una lista de 5–10 líneas con las decisiones que Adrián debe conocer (p. ej. acento de marca, modo oscuro).
