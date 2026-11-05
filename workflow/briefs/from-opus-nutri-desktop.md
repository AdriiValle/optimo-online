# from opus — nutri desktop

- Hecho: sí
- Qué cambió:
  - `app/nutricion/athlete-nav.tsx` — sidebar deportistas asignados
  - `app/nutricion/page.tsx`, `app/nutricion/[athleteId]/page.tsx` — shell `nut-page` / `nut-desktop`
  - `app/nutricion/[athleteId]/nutricion-athlete-client.tsx` — grid semanal Lun–Dom, navegación semanas, panel plato + `NutritionPane`
  - `app/globals.css` — workspace clínico ≥1280px (surface sólida, sin glass fuerte)
  - `lib/dates.ts` — `startOfWeekMonday`
- Verificación: localhost:3001 · `amanda`/`123456789` · 1440px — lista izquierda, calendario MD, grid semana, panel desayuno/comida/cena + suplementos. `npm run build` OK.
- Riesgos: panel derecho solo muestra slot activo en desktop (`.meal-slot.on`); móvil sigue acordeones. Jugador `/a/**` sin tocar.
