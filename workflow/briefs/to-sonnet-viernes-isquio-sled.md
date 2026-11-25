# Brief: viernes 13 nov — activación isquio + sled (+1 serie)

Cwd: este repo. Rama `dev`. Fácil. Sin Think. **No commit** salvo que Adrián lo pida después.

## Contexto (Adrián)

- **Miércoles 11 nov**: sigue `kind: pendiente` — cadena posterior **solo** si entrenan tras el sábado 7; **no** programar posterior ahí ahora.
- **Jueves 12 nov**: `anterior-v2` / MD-4 — **intacto** (mismos protocol ids que `2026-11-03`). No tocar override ni bloques del 12.
- **Viernes 13 nov**: hoy `kind: club` («Sin trabajo Óptimo»). Debe pasar a **sesión Óptimo** con:
  - **Activación isquio** (básica + complementaria; mismos ids que en el MD-2 con sled del **5 nov**, no gym posterior).
  - **Aceleración — sled push**, con **una serie más** que la última sesión ya programada de ese mismo trabajo.
- **Referencia sled**: `2026-11-05` (MD-2) lleva `aceleracion-sled-push` con qty **`3×5 m · 1 serie · 45–50 kg`** (vía `protocols.json` + `buildBlocks`). El 13 debe quedar **`3×5 m · 2 series · 45–50 kg`** (misma distancia/carga; +1 en **series**, no en repeticiones por salida).
- **Sin gym de posterior**: no sección Fuerza, no `POSTERIOR_FUERZA_V2`, no base completa salvo que ya exista patrón mínimo — Adrián pidió explícitamente **solo activación isquio + empuje trineo** (100 % ese trabajo).
- **Sábado 14 / domingo 15**: no romper amistoso MD + escudo blanco ni MD+1 recovery (`from-sonnet-amistoso-md1`). No meter el 14 en `MATCHES`.

## Cómo implementar

1. **`lib/plan-data/calendar.ts`**: cambiar `2026-11-13` de `club` a un override que genere la sesión (nuevo `DayOverrideKind` o rama en `buildOverridePlan` — elige lo más limpio y localizado).
2. **`lib/plan.ts`**: en `buildOverridePlan` (o helper dedicado), para el 13 construir bloques:
   - Sección **Activación**: `activacion-basica-isquios-1` + complementaria coherente con el 5 nov (`activacion-complementaria-isquios-2` en posterior MD-2; confirma con `buildDayPlans` del 05).
   - Sección **Aceleración**: `aceleracion-sled-push` con qty **2 series** (override respecto a `protocols.json`); misma nota de 5 m / ≥45–50 kg que en MD-2.
   - Título/minutos razonables (sesión corta; `minutes` no null si el resto del plan lo calcula).
   - Nota opcional: puede entrenar con el club ese día, pero la ficha muestra el trabajo Óptimo.
3. **`pushProtocol`**: si hace falta, añade parámetro opcional `qtyOverride` (mínimo diff) en lugar de duplicar el id en JSON.
4. **Neon**: la ficha lee `day_plans`. Tras el generador, **ejecuta** upsert:
   - Preferible: ampliar `db/upsert-semana-paron.ts` solo si el assert `12 == 3` sigue pasando, **o** script mínimo que upsert **solo `2026-11-13`** (y no reescriba mal el 12).
   - `npm run db:upsert-semana-paron` vale si al incluir el 13 no rompe checks existentes.
5. **Prohibido**: `db:seed`, `db:sync-videos`, HTML seed, tocar `MATCHES`, cadena posterior del 11, jueves 12, lógica del 14–15 salvo regresión accidental.

## Archivos SÍ

- `lib/plan-data/calendar.ts`
- `lib/plan.ts` (+ `protocols.json` solo si el qty base debe documentarse; preferir override en plan)
- `db/upsert-semana-paron.ts` o script puntual 13 nov
- `package.json` solo si nuevo script npm

## Archivos NO

- `index.html` / `plan-visus.html`
- Otros atletas, `MATCHES`, fechas fuera de 8–15 salvo upsert acotado

## Verificación local

- `npx tsx` / `buildDayPlans`: listar protocol ids + qty sled del **05** y **13**; **12** ids == **03**.
- `npm run build` si tocaste tipos.
- Ejecutar upsert (exit 0).
- Abrir ficha Visus día **13** y **12** en dev (**3001**): 13 con Activación + Aceleración (2 series sled); 12 anterior V2; 11 pendiente.

## Criterio de hecho

- `2026-11-13` ya no es «club sin bloque»; tiene activación isquio + sled **2 series**.
- Sled anterior (05): **1 serie** documentada en `from`.
- Jueves 12 sin cambios vs antes.
- 11 pendiente; 14 amistoso; 15 MD+1 intactos en generador y tras upsert.
- Neon actualizado para el 13 (log insert/update).

## Out

Sobrescribe `workflow/briefs/from-sonnet-viernes-isquio-sled.md` con:

- Qué archivos tocaste.
- Series sled **05** vs **13** (qty literal).
- Lista de `protocolId` del 13.
- Resultado del upsert (fechas, insert/update).
- Si comprobaste localhost 12/13 (sí/no).
