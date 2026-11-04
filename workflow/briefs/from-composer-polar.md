# from composer — Polar AccessLink en Registro

- Hecho: sí
- Rama: `dev`
- Proveedor vivo: **Polar** (OAuth AccessLink v3). Amazfit/Whoop: enum + UI «Próximamente», sin HTTP.

## Entregado

1. **Schema (Neon noisy-meadow, migrate ×2 OK):** enums `polar`, `amazfit`, `connected`, `error`; columnas `integrations.last_sync_at`, `last_error`, `updated_at`; `integration_tokens` (AES-GCM); RLS deportista; `diaries.device_source`, `device_synced_at`; tabla `device_workouts`.
2. **`POST /api/diaries` parcial:** clave ausente = no tocar columna.
3. **`lib/integrations/`:** `capabilities`, `config`, `crypto`, `polar`, `store`, `sync-diary`.
4. **Rutas:** `/api/integrations/polar/{connect,callback,refresh,disconnect}` — cookie state, 503 sin env, 409 otro wearable conectado, refresh vuelca sueño/nightly recharge + ejercicios del día sin pisar RPE/notas.
5. **UI:** `device-card.tsx`, form condicional Registro, chip admin solo lectura; estilos mínimos tokens Óptimo.
6. **`.env.example`:** `POLAR_*`, `INTEGRATIONS_ENC_KEY` (vacíos).

## Criterios

- `npm run build` OK.
- Sin `POLAR_*` / `INTEGRATIONS_ENC_KEY` → connect 503.
- Con env local, flujo OAuth + register user + refresh implementado.
- No commit de `.env.local` ni secretos en briefs.

## Pendiente / prod

- Redirect URI de preview/local debe estar registrado en Polar si se prueba fuera de `app.optimosport.com`.
- Consentimiento RGPD antes de uso con deportistas reales.
