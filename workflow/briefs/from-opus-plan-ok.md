# From Opus: plan-ok (Ajustes)

- Hecho: sí
- Qué cambió (rutas):
  - `workflow/briefs/plan-ajustes.md`: reescrito. El árbol ya tenía APIs/UI. Nombre canónico = `PATCH /api/athletes/[id]`. Oleadas = huecos (build roto, leer hash bajo RLS, headers, UI a la ruta canónica, repetir contraseña).
  - `workflow/briefs/from-opus-plan-ok.md`: este archivo.
  - No se ha tocado código.
- Duda:
- Recomendación:
- Bloquea a Adrián: no

## Visto bueno

OK con estos cambios al ancla anterior:

1. **No partir de cero.** `/ajustes`, `/panel/ajustes`, `/api/me/password`, `/api/admin/accounts`, `set_own_password_hash`, `SESSION_MAX_AGE`, `PATCH /api/athletes/[id]` y el botón del panel ya están. No recrear. `/api/me/profile` y `/api/admin/athletes/[id]/profile` sobran: no cablear, no borrar.
2. **Sesión:** 90 días JWT. El middleware `auth()` re-firma la cookie en cada request (`now + maxAge`). Eso es el rolling. `updateAge` solo vale con strategy `database`; no es el mecanismo. Si ya está en `lib/auth.ts`, se deja. `decisions.md` ya tiene las entradas: no duplicar.
3. **Contraseña propia:** la función SQL y `setOwnPasswordHash` ya existen. El hueco es `POST /api/me/password`: `const ok` duplicado (no compila) y hay que leer el hash con `accountById` bajo RLS propia, sin escalate a admin y sin `lookup_account_by_email`.
4. **Nombre:** canónico `PATCH /api/athletes/[id]` (atleta y admin). La UI de oleadas 2/3 apunta ahí.
5. **Reset admin:** `PATCH` `{ password }`, no `POST` `{ newPassword }`. Código de error: `VALIDATION_ERROR`, no `INVALID_PASSWORD`.
6. **UI:** extraer `PasswordForm` (actual + nueva + repetir). En las páginas de Ajustes, `HeaderBackButton` + `LogoutButton` (hoy `HeaderActions` apunta a sí mismo). Reset admin: un campo `type="text"` para que Adrián lea/copie. `dash-photo` y `home-client.tsx` no se tocan.
7. **Paralelo:** no. Mismo checkout.

## Oleadas

| Oleada | Worker | Archivos | Commits |
|---|---|---|---|
| 1 | 1 | `app/api/me/password/route.ts`, `workflow/context/decisions.md` (+ migrate; `lib/auth.ts` / `db/schema.sql` / `lib/queries.ts` solo si faltara lo ya listado) | 1 |
| 2 | 1 | `app/components/password-form.tsx`, `app/ajustes/**`, `app/a/[id]/page.tsx` (no deshacer trailing), `app/globals.css` (solo añadir) | 1 |
| 3 | 1 | `app/panel/ajustes/**`, `app/panel/deportistas-section.tsx` (Link ya está), `app/globals.css` (solo añadir) | 1 |
| Cierre | orquestador | `workflow/session.md` + smoke + push `origin/dev` | 1 |

## Riesgos (resumen)

- Reset no echa sesiones abiertas (JWT sin revocación).
- iOS PWA y previews de Vercel piden login otra vez; no es bug del slice.
- Sin `npm run db:migrate` el cambio de contraseña propia da 500.
- Hoy `next build` falla por `const ok` duplicado en `app/api/me/password/route.ts`.
- Header a 375 px: plan B ⚙.

## Orden de commits

1. `Ajustes API: sesión JWT 90 días y contraseña propia sin escalate.`
2. `Ajustes jugador: página /ajustes y botón en la ficha.`
3. `Ajustes admin: cuentas y reset en /panel/ajustes.`
4. `Session: slice Ajustes cerrado.`

Si el working tree ya mezcla 1–3, el worker parte en esos commits; no un wip único. Serie: 1 → 2 → 3 → cierre. No merge a `main`.
