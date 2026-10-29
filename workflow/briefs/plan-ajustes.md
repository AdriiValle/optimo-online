# Plan: Ajustes + sesión persistente (anclado por Opus, 2026-10-29)

## Objetivo

Slice **Ajustes**: el jugador cambia nombre, foto y contraseña; el admin, desde `/panel`, ve las cuentas, resetea contraseñas y edita nombre/foto de cada deportista. La PWA no pide login cada día. Login solo con cuentas que crea el admin (sin registro público). No se rompen Registro, Molestias, Análisis ni Nutrición.

## Estado del árbol (no partir de cero)

El working tree **ya tiene** casi todo el slice. Las oleadas cierran huecos. **Prohibido recrear** rutas, páginas o queries que ya existen. Si un archivo ya cumple el criterio de hecho, no se toca.

**Ya está**
- `lib/auth.ts`: `SESSION_MAX_AGE = 90 * 24 * 60 * 60`, `session.maxAge` + `jwt.maxAge`. `updateAge` si está, se deja (no-op en JWT; ver Decisiones).
- `db/schema.sql`: `set_own_password_hash` SECURITY DEFINER (mismo patrón que `lookup_account_by_email`).
- Queries: `updateAthleteName`, `setOwnPasswordHash`, `setAccountPasswordHash`, `accountById`, `adminAthleteAccounts`.
- APIs: `POST /api/me/password`, `PATCH /api/athletes/[id]` (nombre), `GET /api/admin/accounts`, `PATCH /api/admin/accounts/[accountId]/password`. Foto: `POST /api/athletes/[id]/photo` (no se toca). Sobran `PATCH /api/me/profile` y `PATCH /api/admin/athletes/[id]/profile`: no cablear, no borrar.
- Middleware: puerta `/api/admin`; redirect `/ajustes` → `/panel/ajustes` si admin.
- UI: `/ajustes` + `ajustes-client.tsx`; `/panel/ajustes` + `admin-ajustes-client.tsx`; `HeaderActions` en la ficha del atleta; Link «Ajustes» junto a «Añadir» en el panel; CSS `.settings-stack`, `.photo-block`, `.section-head-actions`.

**No crear**
- `POST /api/admin/accounts/.../password` (ya es `PATCH` con `{ password }`)
- código `INVALID_PASSWORD` (el repo usa `VALIDATION_ERROR`)
- `listAccountsForAdmin` (ya está `adminAthleteAccounts`: inner join atletas; el admin va en `json.admin`)
- otra ruta de nombre: la canónica es `PATCH /api/athletes/[id]`

## Decisiones (ya tomadas, no reabrir)

| Tema | Decisión |
|---|---|
| Duración sesión | 90 días JWT. En Auth.js v5 JWT, el middleware `auth()` re-firma la cookie **en cada request** (`now + maxAge`). Eso **es** el rolling. `updateAge` solo aplica a strategy `database`; no hace falta y no se insiste. `jwt.maxAge` se deja igual a `session.maxAge` si ya está. **No** cookies a mano. |
| Por qué 90 y no 365 | Uso diario → 90 rolling = no caduca si se usa; móvil perdido y sin uso muere solo. |
| Contraseña propia | `set_own_password_hash(p_hash text) RETURNS boolean`, SECURITY DEFINER, `SET search_path = public`, `SET row_security = off`, `UPDATE accounts SET password_hash = p_hash WHERE id = app_account_id()`. **Prohibido** `withRls({ ...user, role: "admin" })`. Leer el hash con `accountById` bajo RLS propia (`accounts_select` ya deja `id = app_account_id()`), no hace falta `lookup_account_by_email` aquí. Vale para atleta y admin. |
| Reset por admin | Sin función nueva: `setAccountPasswordHash` con contexto admin (`accounts_write`). Body `{ password }` (no `{ newPassword }`). |
| Sesiones tras cambio/reset | **No se invalidan** (JWT sin estado). La nueva vale en el próximo login. Revocar = fuera. |
| Foto en la ficha (`dash-photo`) | **Se queda**. Ajustes reutiliza `POST /api/athletes/[id]/photo`. **No se toca** `home-client.tsx`. |
| Nombre | Un solo endpoint: `PATCH /api/athletes/[id]` `{ name }` (1–120, trim). Atleta (su id) y admin (cualquiera). Lo cubren middleware + `canSeeAthlete` + RLS `athletes_update`. La UI de oleadas 2/3 llama **aquí**, no a `/api/me/profile` ni a `/api/admin/athletes/.../profile`. |
| Ruta jugador | `/ajustes`. Admin que entre → `redirect("/panel/ajustes")` (página + middleware). |
| Ruta admin | `/panel/ajustes` (la cubre el prefijo `/panel`). |
| Botón Ajustes | Jugador: header de `/a/[id]`, izquierda de «Salir», **solo atleta** (`HeaderActions`). Admin en ficha: solo «Salir». Panel: `Link` «Ajustes» en `section-head-row` junto a «Añadir» (ya está). En las páginas de Ajustes **no** se pone otro botón «Ajustes» que apunte a sí mismo: `HeaderBackButton` + `LogoutButton`. |
| Usuario/email | Solo lectura. No se edita. |
| Borrar o desactivar cuentas | Fuera (borrar datos = decide Adrián). |
| Confirmación de contraseña | Formulario propio (atleta y admin): actual + nueva + repetir. Reset admin: un solo campo, `type="text"` (Adrián tiene que leer/copiar la que pone), mín. 8. |
| Código de error | Contraseña actual mal = `422 VALIDATION_ERROR` con mensaje «Contraseña actual incorrecta». No se añade `INVALID_PASSWORD`. |

## Contrato (rutas exactas — congelado al árbol)

**API**
- `PATCH /api/athletes/[id]` → `{ name }` → `{ data: { ok: true, name } }` · 401 / 404 / 422. Canónico para nombre.
- `POST /api/me/password` → `{ currentPassword, newPassword (8–200) }` → `{ data: { ok: true } }` · actual mal = 422 `VALIDATION_ERROR`.
- `GET /api/me` y `PATCH /api/me/profile`: ya existen; la UI no los usa. **No borrar.**
- `GET /api/admin/accounts` → `{ data: AdminAthleteAccount[], admin: { accountId, email } }` · no admin = 404.
- `PATCH /api/admin/accounts/[accountId]/password` → `{ password (8–200) }` → `{ data: { ok: true } }` · no admin = 404.
- `PATCH /api/admin/athletes/[id]/profile`: extra, no cablear, no borrar.
- Foto: `POST /api/athletes/[id]/photo` existente, sin cambios.

bcrypt: `hash(…, 12)` como en `app/api/athletes/route.ts`.

**Middleware:** no añadir reglas. Las de `/api/admin` y `/ajustes` ya están. No recortar las redundantes en este slice. `PATCH /api/athletes/[id]` ya lo cubre la regla `/api/athletes/:id` (atleta solo su id).

## Archivos NO

`index.html`, `app/a/[id]/home-client.tsx`, `analisis.tsx`, `nutrition-pane.tsx`, `app/api/diaries/**`, `app/api/athletes/[id]/nutrition/**`, `app/api/athletes/[id]/photo/**`, `app/api/athletes/route.ts`, `app/login/**`, Whoop, otros repos/Neon, `main`, Vercel production. PWA manifest / service worker: fuera. No reescribir `app/api/athletes/[id]/route.ts` si ya cumple el contrato.

## Oleadas

Todo en serie (mismo checkout). Un worker. Si el archivo ya cumple, skip.

### Oleada 1 — huecos backend

Archivos: `app/api/me/password/route.ts`, `workflow/context/decisions.md`. Schema y `lib/auth.ts` solo si faltara lo de Decisiones (hoy ya está). `lib/queries.ts` solo si faltara `setOwnPasswordHash`.

- Arreglar `POST /api/me/password`: hoy hay `const ok` duplicado (no compila). Un `ok` para bcrypt, otro nombre para el `boolean` de `setOwnPasswordHash`. Leer hash con `accountById` + `withRls(rlsFrom(user))`. Escribir con `setOwnPasswordHash`. Quitar `lookupAccountByEmail` y el import de `sql` si quedan huérfanos.
- `npm run db:migrate` (función idempotente).
- `decisions.md`: si ya hay entradas de sesión 90 días y `set_own_password_hash`, no duplicar. No reabrir el contrato de nombre: canónico = `PATCH /api/athletes/[id]`.
- **Hecho:** `next build` ok; tras login, cookie `authjs.session-token` (o `__Secure-authjs.session-token` en https) con `Expires` ≈ +90 días; «Salir» la borra. RicardoVisus cambia su contraseña (200; actual mal → 422); `POST /api/admin/...` como Ricardo → 404. AdriiValle resetea la de Ricardo (`PATCH` `{ password }`, 200) y Ricardo entra con la nueva.

### Oleada 2 — UI jugador (tras la 1)

Archivos: `app/components/password-form.tsx` (nuevo), `app/ajustes/page.tsx`, `app/ajustes/ajustes-client.tsx`, `app/a/[id]/page.tsx` (trailing ya está; no deshacerlo), `app/globals.css` (solo añadir si hace falta; no tocar reglas existentes). `header-actions.tsx` no se reescribe salvo bug.

- Página `/ajustes`: `leading={<HeaderBackButton href={/a/${athleteId}} />}` + `trailing={<LogoutButton />}`. Quitar `HeaderActions` de esta página.
- Nombre: `PATCH /api/athletes/${athleteId}` `{ name }` (no `/api/me/profile`).
- Extraer `PasswordForm` (client): actual + nueva + repetir; `POST /api/me/password`; si nueva ≠ repetir, no llama a la API y muestra error. Lo usarán las dos páginas.
- Tras guardar nombre o foto: `router.refresh()`.
- **Hecho:** RicardoVisus → «Ajustes» en la ficha → cambia el nombre → «←» → la ficha muestra el nombre nuevo; sube una foto → se ve en la ficha; cambia la contraseña (con repetir) → Salir → entra con la nueva. El admin no ve «Ajustes» en la ficha. A 375 px el header de la ficha no se desborda; si no cabe, «Ajustes» pasa a `icon-btn` ⚙ con `aria-label="Ajustes"`.

### Oleada 3 — UI admin (tras la 2: reutiliza `password-form.tsx`)

Archivos: `app/panel/ajustes/page.tsx`, `app/panel/ajustes/admin-ajustes-client.tsx` (este nombre, no `accounts-client.tsx`), `app/panel/deportistas-section.tsx` (Link ya está; no deshacerlo), `app/globals.css` (solo añadir).

- Header de `/panel/ajustes`: `HeaderBackButton href="/panel"` + `LogoutButton` (quitar `HeaderActions` que vuelve a «Ajustes»).
- Nombre de deportista: `PATCH /api/athletes/${athleteId}` `{ name }` (no `/api/admin/athletes/.../profile`).
- Sección «Tu cuenta»: `PasswordForm`. Sección «Deportistas»: usuario solo lectura, nombre, foto, reset (`type="text"`, mín. 8).
- **Hecho:** AdriiValle → /panel → «Ajustes» → ve RicardoVisus con su usuario → resetea su contraseña → Ricardo entra con ella; edita nombre/foto y se ve en /panel; cambia su propia contraseña y vuelve a entrar. RicardoVisus en `/panel/ajustes` ve 404.

### Cierre (orquestador)

- `next build` limpio; smoke: Registro guarda el día, Molestias, Análisis (admin), Nutrición (admin edita / jugador lee).
- `workflow/session.md`: «Último slice» = Ajustes; «Siguiente» = smoke / lo que pida Adrián.
- Push `origin/dev`. **No** merge a `main`.

## Commits (uno por unidad, en `dev`)

1. `Ajustes API: sesión JWT 90 días y contraseña propia sin escalate.` (1)
2. `Ajustes jugador: página /ajustes y botón en la ficha.` (2)
3. `Ajustes admin: cuentas y reset en /panel/ajustes.` (3)
4. `Session: slice Ajustes cerrado.` (cierre)

Si el working tree ya mezcla 1–3 sin commitear, el worker **parte** en esos commits (no un wip único). Todo en serie: 1 → 2 → 3 → cierre.

## Riesgos

- **Sin revocación:** un reset no echa a quien ya tiene la sesión (hasta 90 días de idle; con uso, el middleware la alarga). Revocar de verdad = `accounts.session_version` + check en callback `jwt` → siguiente slice si Adrián lo pide.
- **iOS PWA:** standalone tiene cookies aparte de Safari: login una vez **dentro** de la PWA. Previews de Vercel cambian de dominio → login otra vez. Ninguna es bug de este slice.
- **`AUTH_SECRET`:** rotarlo mata todas las sesiones. No tocarlo.
- **Migración:** sin `npm run db:migrate` (local y Neon de preview) `set_own_password_hash` no existe → 500 al cambiar la propia.
- **Build hoy:** `app/api/me/password/route.ts` declara `const ok` dos veces. Oleada 1 lo cierra; sin eso no hay `next build`.
- **Header estrecho:** logo + «Ajustes» + «Salir» a 375 px; plan B ⚙ (oleada 2).
