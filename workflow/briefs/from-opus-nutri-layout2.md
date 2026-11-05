# from opus — nutri layout2

- Hecho: sí (ejecutado en subagent según brief `to-opus-nutri-layout2.md`)
- Qué cambió:
  - `BrandHeader` prop `wide` — barra full-bleed alineada al workspace (max 1680px), fondo sólido
  - Grid 2 columnas: rail + centro (calendario + grid semana); eliminada columna derecha fija
  - `NutAthleteNav` — rail flex altura útil, pie Ajustes + Salir (`nut-rail-logout.tsx`)
  - Drawer lateral (≥1280) / sheet (móvil): clic celda → editor plato; Ajustes → `NutritionPane`
  - `athlete-nav-shared.ts` — helpers server-safe
- Verificación: localhost:3001 · amanda · 1440px · build OK
- Riesgos: móvil sigue menú apilado bajo el grid oculto; `/a/**` sin tocar
