# Brief: Amanda entra y peta `/a/null` en prod

Cwd: este repo. Rama `dev`. Sonnet. Sin Think. Bug de producción. Adrián no puede dejar a Amanda fuera.

## Qué pasa

Login `amanda` / `123456789` en https://optimo-online.vercel.app **sí autentica** (POST /login 200 → GET /). Luego va a **`/a/null`** y Neon explota: `invalid input syntax for type uuid: "null"` (digest 1459737032). `/nutricion` con esa sesión es 404 (middleware: role !== nutritionist).

`app/page.tsx` ya redirige nutritionist → `/nutricion`. Eso **no se está ejecutando**, así que el JWT/sesión **no trae** `role === "nutritionist"`. El `athleteId` acaba como **string `"null"`** (truthy) y cae en `redirect(\`/a/${user.athleteId}\`)`.

## Qué hacer

1. Confirma en Neon (noisy-meadow, `db/env.ts` + unpooled) que `accounts.email = 'amanda'` tiene `role = nutritionist`. Si no, `npm run db:seed-nutritionist` (idempotente, pass 123456789, Visus asignado).
2. En `lib/auth.ts` jwt/session: `athleteId` solo si es UUID real; si viene `null`, `"null"` o vacío → `null`. Copia `role` siempre. Tras login de nutricionista, session.role debe ser `"nutritionist"`.
3. `app/page.tsx` + `middleware.ts` `homeFor`: **nunca** `/a/null`. Nutritionist → `/nutricion`. Sin athleteId válido → `/login` o home de su rol. `app/a/[id]/page.tsx`: si `id` no es UUID, notFound (no query Neon).
4. Login `redirectTo` puede ir a `/` (ok si home rutea bien).
5. No quites el import Word. No HTML seed.

## Criterio de hecho

- Login amanda en local (y la lógica) termina en `/nutricion`, no `/a/null`.
- `/a/null` no 500.
- `from-sonnet-amanda-login.md` dice el role real en Neon.

## Out

`workflow/briefs/from-sonnet-amanda-login.md`
