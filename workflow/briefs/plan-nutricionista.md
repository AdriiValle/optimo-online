# Plan: rol nutricionista + menú diario (v1 Amanda / Visus)

Cajón: app Óptimo Online (`AdriiValle/optimo-online`, rama `dev`). Difícil: auth + enum Neon + RLS + rutas nuevas + UI nutricionista + extensión pestaña Nutrición del deportista. Neon **noisy-meadow-03777185** (aws-eu-central-1). Local `:3001`. Anclado contra `db/schema.sql`, `lib/auth.ts`, `lib/access.ts`, `middleware.ts`, `app/a/[id]/home-client.tsx`, `nutrition-pane.tsx`, `app/api/athletes/[id]/photo/route.ts`, `app/api/athletes/[id]/nutrition/route.ts`.

Objetivo v1: **admin** da de alta cuentas **nutritionist**, asigna qué deportistas ve cada una. **Amanda** (`amanda` / `123456789`) entra a un dashboard propio (no panel admin ni ficha entrenamiento completa), ve solo atletas asignados, abre **Ricardo Visus**, ve el mismo calendario MD/partidos/intensidad que jugador/admin (solo lectura de carga), y crea/edita **platos por día y comida** (nombre, preparación, foto). **Visus** los lee en pestaña Nutrición. Gago/Valle no aparecen en Amanda hasta asignación. Suplementos + `diet_notes` se mantienen; Amanda puede usar el hueco de suplementación existente.

Rama `dev`. No merge a `main`. Un commit al cerrar el slice.

## Decidido

- **Rol nuevo:** `user_role` + valor `'nutritionist'`. JWT/session igual que hoy (`role`, `athleteId` null para nutricionista).
- **Asignación:** tabla `nutritionist_athletes (nutritionist_account_id → accounts, athlete_id → athletes, PK compuesta, ON DELETE CASCADE)`. Solo admin escribe; nutricionista lee sus filas vía RLS.
- **Platos:** tabla `meal_slots` (nombre claro en código: filas de menú):
  - `id uuid PK`, `athlete_id`, `date date`, `slot` enum o text check (`breakfast`, `lunch`, `dinner` — v1 tres slots; opcional `snack` si no complica UI).
  - `title text` (nombre plato), `preparation text`, `photo_bytes bytea`, `photo_mime text`, `updated_at`.
  - `UNIQUE (athlete_id, date, slot)`.
  - Fotos: **mismo patrón que foto de perfil** (bytea en fila, límite `PHOTO_MAX_BYTES` / `PHOTO_MIME`, GET/POST en ruta dedicada por `meal_id`).
- **RLS:** funciones SQL `app_is_nutritionist()` y `app_nutritionist_assigned(p_athlete_id uuid)` (exists en `nutritionist_athletes` con `app_account_id()`).
  - **SELECT athletes:** admin OR propio atleta OR nutricionista asignado (solo columnas necesarias; no ampliar write del atleta).
  - **SELECT day_plans:** admin OR propio OR nutricionista asignado (solo lectura nutricionista; sin editar entrenamientos).
  - **meal_slots:** SELECT admin OR atleta propio OR nutricionista asignado; INSERT/UPDATE/DELETE admin OR nutricionista asignado (atleta solo lectura).
  - **nutritionist_athletes:** SELECT admin OR nutricionista ve sus asignaciones; ALL admin only.
  - **accounts:** nutricionista sigue viendo solo su fila (policy actual + role en JWT).
  - **diaries, injuries, integrations:** nutricionista **no** accede (políticas actuales sin cambio salvo que una query falle — no exponer APIs).
- **App access (`canSeeAthlete`):** admin OR atleta propio OR (nutritionist AND assigned). Todas las rutas `/api/athletes/[id]/*` y páginas ficha deben pasar por esto.
- **Redirects:**
  - `/` y post-login: admin → `/panel`; athlete → `/a/[id]`; nutritionist → `/nutricion`.
  - `middleware`: rutas `/nutricion/**` solo `nutritionist` (admin puede opcionalmente no entrar — admin usa panel para asignar). Bloquear nutritionist en `/panel` y `/api/admin` (ya cubierto si role !== admin).
  - Nutritionist en `/a/[id]`: **no** — usar rutas `/nutricion/[athleteId]` con vista reducida (calendario + menú), no reutilizar `HomeClient` con pestaña entrenamiento.
- **Admin asignación:** sección en `/panel/ajustes` (o subsección): listar nutricionistas, crear cuenta (`POST` con role), checkboxes deportistas por nutricionista, guardar asignaciones. Seed inicial: Amanda + asignar solo Visus.
- **Nutricionista edita suplementos:** extender `PATCH /api/athletes/[id]/nutrition` para `nutritionist` asignado (además de admin). Atleta sigue solo lectura en UI.
- **Pestaña Nutrición deportista:** añadir bloque **Menú del día** (lista slots del `center` del calendario o del día visible): título, prep, img vía GET foto. Estado vacío claro. Mantener suplementos + diet_notes.
- **Calendario nutricionista:** reutilizar lógica/markup de `home-client` (clases `cal-*`, `loadClassForMdTag`, partidos) en componente compartido o copia mínima en cliente nutricionista; datos `day_plans` vía query `plansForAthleteRange` con RLS.
- **Cuenta Amanda:** email login `amanda` (minúsculas, como resto cuentas). Password `123456789`. Script idempotente `db/seed-nutritionist.ts` o bloque al final de migrate helper ejecutable una vez (preferido script + doc en plan).

## Lo que hay (verificado)

- Roles: solo `admin` | `athlete` en enum y TypeScript.
- Nutrición actual: `athletes.diet_notes`, `supplements jsonb`; UI en `nutrition-pane.tsx`; PATCH solo admin.
- Calendario + MD en `home-client.tsx` desde `day_plans`.
- Fotos perfil: `photo_bytes` en `athletes`, API POST/GET con `canSeeAthlete`.
- `lookup_account_by_email` acepta lower(trim).
- Middleware no conoce nutritionist (redirige mal en login).
- Otros deportistas existen en Neon (Adrián Valle, Francisco Gago) — no en seed local único.

## Oleada 1 — sonnet, schema + auth + APIs (sin UI nutricionista)

Archivos SÍ: `db/schema.sql`, `db/seed-nutritionist.ts` (nuevo), `package.json` script opcional, `lib/types.ts`, `types/next-auth.d.ts`, `lib/access.ts`, `lib/rls.ts` (sin cambio si role string), `lib/queries.ts`, `middleware.ts`, `lib/auth.ts` (solo si hace falta), `app/page.tsx`, `app/api/admin/nutritionists/**` (nuevo), `app/api/nutrition/**` o `app/api/meals/**`, `app/api/athletes/[id]/nutrition/route.ts`, `app/api/meals/[id]/photo/route.ts`.

1. **Schema (additive):**
   - `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'nutritionist';` (no usar el valor en la misma transacción en inserts del mismo archivo — inserts en seed script aparte).
   - Tablas `nutritionist_athletes`, `meal_slots` + enum `meal_slot_kind` si se prefiere enum.
   - Funciones RLS + policies listadas arriba; ampliar `athletes_select`, `day_plans_select`; policies nuevas en tablas nuevas.
   - Criterio: `npm run db:migrate` ×2 sin error en noisy-meadow.
2. **Queries:** `nutritionistsList`, `assignedAthletesForNutritionist`, `setNutritionistAssignments`, `mealsForAthleteRange`, `upsertMealSlot`, `mealPhotoFor`, `isNutritionistAssigned`.
3. **API admin:** `GET/POST /api/admin/nutritionists`, `PUT /api/admin/nutritionists/[accountId]/athletes` body `{ athleteIds: string[] }`.
4. **API nutricionista:** `GET /api/nutrition/athletes` (dashboard), `GET /api/nutrition/athletes/[id]/plans?from&to`, `GET/PATCH /api/nutrition/meals?athleteId&date` o REST por slot.
5. **Middleware + redirects** para role nutritionist.
6. **Seed:** Amanda + asignación Visus; ejecutar script contra Neon local.
7. **`canSeeAthlete` + nutrition PATCH** para nutricionista asignado.

Criterio oleada 1: `npx tsc --noEmit` limpio; migrate ok; curl/Postman mental: nutritionist no lista atletas no asignados (RLS devuelve vacío).

## Oleada 2 — sonnet, UI estructura (sin pulir look)

Archivos SÍ: `app/nutricion/page.tsx`, `app/nutricion/[athleteId]/page.tsx`, `app/nutricion/**-client.tsx`, `app/panel/ajustes/admin-ajustes-client.tsx` (+ sección nutricionistas), componente calendario compartido si encaja, `app/a/[id]/nutrition-pane.tsx` (menú lectura), `app/a/[id]/page.tsx` (pasar meals iniciales si SSR).

- Dashboard Amanda: cards deportistas asignados (foto, nombre, equipo).
- Ficha nutricionista: calendario 1 mes navegable, día seleccionado, tres slots editables, textarea prep, input título, upload foto, guardar.
- Admin: alta nutricionista (email/password), UI asignar/quitar atletas.
- Deportista: ver menú en Nutrición.

Criterio: flujo manual posible feo pero funcional.

## Oleada 3 — opus, look

Solo CSS/className en rutas `/nutricion/**`, bloque menú en `nutrition-pane`, sección admin asignación. Tokens Óptimo + glass. Móvil 375 primero. Sin paleta nueva.

## Paso final — verificación + commit

- Browser: login amanda → dashboard solo Visus; admin asigna/quita; Amanda edita plato con foto; ricardovisus ve Nutrición; Gago/Valle ausentes.
- `tsc` limpio.
- Actualizar `workflow/session.md` y 3 líneas `workflow/context/decisions.md`.
- Un commit en `dev`, push opcional preview.

## NO (v1)

Macros/kcal automáticos · lista compras · recetas IA · chat · editar entrenamientos como nutricionista · panel global deportistas · merge main · Supabase fancy-breeze · registro público.

## Supuestos

- Login Amanda es username `amanda` (no email corporativo).
- Password Amanda `123456789` aunque otras cuentas dev tengan otras (reset script incluye `amanda`).
- Nutricionista no necesita `/ajustes` propios en v1 (solo logout en header).
- Partidos/MD vienen de `day_plans` ya cargados para Visus.

## Riesgos

- **Enum `user_role`:** additive pero irreversible fácil; migrar una vez.
- **RLS olvidada en alguna query** → fuga de nombres de atletas: revisar todo `canSeeAthlete` + policies.
- **Fotos en bytea** inflan DB; v1 aceptable con límite 400KB como perfil.
- **Reutilizar `/a/[id]` para nutricionista** tentaría mostrar entrenamientos — evitar con ruta dedicada.
- **Middleware login redirect** debe actualizarse antes de probar Amanda.

## Criterio de hecho v1 (Adrián)

- Login amanda / 123456789 → dashboard nutrición.
- Admin asigna/quita atletas a Amanda.
- Amanda → Visus: calendario MD/partidos, platos multi-día con prep + foto.
- ricardovisus ve platos en Nutrición.
- Gago/Valle no en dashboard Amanda.
- `tsc` limpio; migración noisy-meadow aplicada.

## Huecos v2 (documentar al cierre)

- Vista jugador Nutrición pulida (navegación por semana, fotos grandes).
- Notificaciones / recordatorios.
- Macros, compras, IA.
- Ajustes cuenta nutricionista.
- Copiar menú entre días.
