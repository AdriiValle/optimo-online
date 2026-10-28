# From: sonnet · datos

- Hecho: sí
- Qué cambió:
  - `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `middleware.ts`
  - `app/` (login, panel, `/a/[id]`, `app/api/auth`, `app/api/diaries`, `app/api/athletes`)
  - `lib/`, `db/schema.sql`, `db/migrate.ts`, `db/seed.ts`, `db/env.ts`, `types/next-auth.d.ts`
  - `.env.example`, `.gitignore`, `vercel.json`
  - `public/escudos/`, `public/logo-optimo.png` (copia; originales intactos)
  - `workflow/context/design-system.md`
  - `workflow/briefs/from-sonnet-datos.md`
  - Neon `entrenamiento-online` (`little-forest-63986411`). Contraseñas de seed y `AUTH_SECRET` solo en `.env.local` (fuera de git). Emails: admin `adrianvs97@hotmail.com`, Visus `ricardo.visus@optimo.local`.
- Duda: el proyecto Neon quedó en `aws-us-west-2` aunque el plan pedía `aws-eu-central-1` (`neonctl projects create --region` no aplicó esa región).
- Recomendación: usar este proyecto. No borrar ni crear otro. Si hace falta Frankfurt, que lo decida Adrián (borrar Neon sí bloquea).
- Bloquea a Adrián: no

Prueba (comando y qué pasó):
- `npx tsx db/migrate.ts` → migrate ok
- `npx tsx db/seed.ts` → seed ok · 235 day plans desde `index.html`
- `npx next dev --port 3047` → Ready (3000 y 3001 ocupados por otro Next)
- GET `/login` 200; login admin 302; GET `/panel` 200 con Ricardo Visus; GET `/a/{id}` 200 con calendario MD
- login Visus 302; GET `/panel` 404; GET `/a/00000000-0000-4000-8000-000000000099` 404
- POST `/api/diaries` 200 (recovery 72)
- POST foto 68 bytes 200 y GET la sirve; POST foto >400 KB 422 `PAYLOAD_TOO_LARGE`
