# Brief: escudo en blanco el amistoso del 14

Cwd: este repo. Rama `dev`. Fácil. Sin Think.

El 14 ya es casilla MD gris + icono casa. El 15 ya es MD+1 verde como el 1/8/22. **Falta el escudo.**

En `home-client.tsx` el crest solo se pinta si `crests[matchOpponent]` existe. El rival del 14 es `"Amistoso"` y no hay entrada → no hay hueco de escudo.

## Qué hacer

1. Un escudo **en blanco** (SVG o PNG) en `public/escudos/`, forma de escudo, relleno blanco, borde suave para que se vea sobre el gris de MD. **Sin** club, texto ni logo inventado.
2. `CRESTS["Amistoso"]` → ese archivo.
3. No toques `MATCHES`. No Neon salvo que haga falta (el crest sale de `planData.crests`, no de `day_plans`).
4. No commit.

## Archivos SÍ

- `public/escudos/` (el blanco)
- `lib/plan-data/calendar.ts` (`CRESTS`)

## Criterio de hecho

- En la ficha, el 14 muestra un escudo blanco vacío en el mismo sitio que el 7/21/28, más el icono de casa.
- 15 sigue MD+1 verde. 16 no se mueve.

## Out

`workflow/briefs/from-sonnet-escudo-blanco.md`
