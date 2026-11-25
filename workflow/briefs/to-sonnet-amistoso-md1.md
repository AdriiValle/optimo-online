# Brief: amistoso 14 como partido + domingo 15 como MD+1

Cwd: este repo. Rama `dev`. Fácil. Sin Think.

## Objetivo

En el calendario de Visus (ficha):

1. **Sábado 14 nov 2026**: se ve **como los demás partidos** (casilla gris de MD). **En casa**. Escudo **en blanco** (vacío / placeholder, no un rival inventado). Texto/título: amistoso en casa.
2. **Domingo 15 nov 2026**: se ve **igual que el 1, el 8 y el 22** (color MD+1, gris/verde el que ya usa esos días). Es un **MD+1** del amistoso. Sin trabajo Óptimo.

**No** metas el 14 en `MATCHES`. Eso recalcularía el microciclo y rompería el 16 (MD-5 / anterior V2). El 16 no se mueve.

## Cómo

El pintado sale de `day_plans` (Neon) + lo que pinta `app/a/[id]/home-client.tsx` (`mdTag`, rival, venue, crest).

- Amplía `DAY_OVERRIDES` / `buildOverridePlan` para que el 14 tenga `mdTag: "MD"`, `matchVenue: home`, rival vacío o “Amistoso”, y un crest en blanco (mismo hueco que un partido, sin logo de club).
- El 15: `mdTag: "MD+1"`, mismos bloques/notas de recovery que el 8 si encaja, **sin gym**.
- Reusa clases/escudos existentes. No paleta nueva. No HTML seed.
- Corre el upsert a Neon de esas fechas (el script `db:upsert-semana-paron` o el mínimo para 14 y 15). La ficha no lee `calendar.ts` en caliente.

## Archivos SÍ

- `lib/plan-data/calendar.ts`
- `lib/plan.ts` si el override del 14 necesita campos de partido
- crest/datos de plan-data **solo** si hace falta un escudo blanco
- `home-client.tsx` **solo** si hoy un partido sin rival no pinta gris + hueco de escudo
- script db de upsert + ejecutarlo

## Archivos NO

- HTML seed, `db:seed` entero, `db:sync-videos`, otros deportistas

## Criterio de hecho

- En localhost, casilla 14 = gris de partido + escudo blanco + casa + amistoso.
- Casilla 15 = mismo look que 1 / 8 / 22 (MD+1).
- 16 sigue MD-5 con anterior V2.
- `from-sonnet-amistoso-md1.md`

## Out

`workflow/briefs/from-sonnet-amistoso-md1.md`
