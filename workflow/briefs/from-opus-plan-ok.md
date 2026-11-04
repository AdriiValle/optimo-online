# From Opus — plan-react-datos-look

- Hecho: sí
- Qué cambió (rutas):
  - `workflow/briefs/plan-react-datos-look.md` (reescrito y anclado al código)
  - `workflow/briefs/from-opus-plan-ok.md`
- Duda:
- Recomendación:
- Bloquea a Adrián: no

## Visto bueno

Sí, con ajustes. El plan iba bien encaminado; lo he anclado a lo que hay de verdad:

- **Única dependencia del HTML en runtime:** `app/a/[id]/page.tsx:31` parsea `index.html` en cada request **solo para los escudos**. La oleada 1 la quita; eso es "sacar el HTML del camino crítico".
- Paridad medida hoy: 235 días, 40 protocolos, 35 partidos, 18 escudos.
- Protocolos en `lib/plan-data/protocols.json` (no TS) porque `db:set-videos` tiene que reescribirlos de forma mecánica. El resto del calendario va en `calendar.ts` tipado.
- `db:set-videos` deja de escribir en los HTML → el HTML se congela como backup. `db/protocol-html-field.ts` se borra en ese mismo diff.
- Neon es la base de prod: en este corte **no se escribe en Neon**. `sync-videos` gana `--dry-run`, y el criterio es que dé 0 cambios.
- La "tabla HTML" de la ficha es `SessionTable` (`<table>` en `home-client.tsx`). El único `dangerouslySetInnerHTML` es un icono SVG, no contenido del plan. La oleada 2 cambia la tabla por `session-list.tsx`.

## Trozos / oleadas (en serie, nada en paralelo)

1. **Datos** (sonnet): `lib/plan-data/{protocols.json,calendar.ts,index.ts}`, import en `lib/plan.ts`, `page.tsx` (escudos), 5 scripts `db/`, borrar `db/protocol-html-field.ts`, `scripts/plan-parity.ts` + `npm run plan:parity`.
2. **UI estructura** (sonnet): `app/a/[id]/session-list.tsx` nuevo, `home-client.tsx` (usar la lista + SVG en JSX), CSS mínimo para la lista.
3. **Look** (opus): `globals.css` + className/marcado de login, panel, ficha, modal y cabecera. Nada de `lib/`, `db/`, api ni auth.
4. **Master**: push `dev` y preview. Sin merge.

2 y 3 tocan `home-client.tsx` y `globals.css` → no van en paralelo. 2 necesita el `page.tsx` limpio de 1.

## Riesgos

- `seed` borra y vuelve a insertar `day_plans` en la base de prod → prohibido en este corte; solo `--dry-run`.
- Desde la oleada 1 el HTML ya no se actualiza; `plan:parity` solo sirve el día del commit.
- Escudos: hay que conservar la `/` inicial en `CRESTS`.
- Editar `protocols.json` no se ve en la ficha hasta un `db:sync-videos` real. Ese sync escribe en prod, así que necesita el visto bueno de Adrián (fuera de este corte).

## Orden de commits

1. `feat(plan): datos del plan en lib/plan-data (TS/JSON), HTML queda de backup`
2. `feat(ficha): sesión del día como lista React, sin tabla`
3. `feat(look): Óptimo + glass móvil en login, panel y ficha`
4. (master) push `dev` → preview Vercel
