# from-sonnet-nutri-o1-o4

- Hecho: no
- Qué cambió (rutas): ninguna (solo este archivo)
- Duda: El brief me pide actuar de master: lanzar workers opus para O1/O2 (y luego O3, O4) y no implementar código yo. Mis reglas de worker prohíben despachar hijos. Las dos instrucciones se contradicen y no puedo cumplir ninguna sin romper la otra.
- Recomendación: lanzar la oleada 1 desde la sesión master/orquestador, no desde un worker:
  - O1: opus, `-Yolo -Think`, slug `nutri-o1`, cwd = este repo. Alcance: `db/**` + seed.
  - O2: opus, `-Yolo -Think`, slug `nutri-o2`, cwd = este repo. Alcance: `lib/nutrition/**` + scripts.
  - Después O3, y luego O4 (WeekPanel + editor de ingredientes), según `workflow/briefs/plan-nutri-macros.md`.
  Alternativa: si prefieres que un worker lo implemente directamente, reemite el brief como "implementa O1 (u O2)" con su alcance y lo hago sin despachar.
- Bloquea a Adrián: no
