# Session

Escrito: 2026-11-05 11:42

Objetivo: app deportistas online (Óptimo). Visus piloto.

Rama: `dev` (hay cambios sin commit: semana parón)

Local: http://localhost:3001 · Prod: https://optimo-online.vercel.app

## Acceso

- Admin: `adriivalle` / `admin` (jefe, pass `123456`) → `/panel`
- Ricardo: `ricardovisus` → `/a/...`

## Hecho (hoy)

- Semana parón liga (7–15 nov) en calendario de Visus. Trabajo Óptimo solo jueves 12: cadena anterior V2 = 3 nov.
- Fuente: `DAY_OVERRIDES` en `calendar.ts` + `buildDayPlans`. Ficha = Neon `day_plans` (`npm run db:upsert-semana-paron`).
- Amistoso 14: casilla MD gris, casa, escudo blanco. No está en `MATCHES` (el 16 sigue MD-5).
- Domingo 15: MD+1 verde, igual que 1/8/22. Sin trabajo Óptimo.

## Abierto / Siguiente ocasión

- Miércoles 11: según ganen o pierdan. Domingo 15: Ricardo avisa.
- Viernes 13: club, sin trabajo Óptimo aún.
- Commit/push de esta semana cuando Adrián lo pida.
- No borrar `index.html` / `plan-visus.html`.
- `db:sync-videos` real solo con visto bueno.

## No hacer aún

- No borrar el HTML seed. No `db:seed` / update-* / sync sin dry-run (y sin OK si escribe Neon).
