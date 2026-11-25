# from-sonnet-cal-mas-chico

- Hecho: sí
- Qué cambió: `app/globals.css` (solo bajo `.cal-compact .cal-nav`): título del mes 0.95rem → 0.8rem; botones ‹ › 36px → 26px (font 0.85rem). Días/MD sin tocar. Commit en dev.
- Duda:
- Recomendación:
- Bloquea a Adrián: no

## Para Adrián
Calendario del rail con flechas y nombre del mes más pequeños. No lo he visto en pantalla (solo CSS).

## Lanzar
Ver en `npm run dev` la sección Nutrición; si aún se ve grande, bajar 26px/0.8rem en `app/globals.css` líneas ~779-780.
