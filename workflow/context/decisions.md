# Decisiones

Tras cada slice, 3 líneas. El worker no hereda el chat.

```
- YYYY-MM-DD: qué
  por qué / qué no
```

- 2026-10-18: nacer con `main` + `dev`
  Vercel estable = `main`. Trabajo y preview local = `dev`. No merge a `main` hasta OK.
- 2026-10-18: OK → `main`
  Plan compartible al jugador; Vercel production sirve `main`. Trabajo sigue en `dev`.
- 2026-10-20: fuerza posterior (MD-2) = sesión hip thrust glúteo 1 (1.5)
  Se rellenaron `fuerza-isquios-bilateral/unilateral` + 2 ids nuevos (isométrico cuña, discos+miniband). Afecta a todos los días "posterior" futuros, igual que cuádriceps en "anterior"; no solo al 21 oct.
- 2026-10-20: MD-2 genérico = sled + activación isquios (básica + complementaria 1)
  El 29 oct es MD-2 sin rol de fuerza. Complementaria 1 porque el 28 (posterior) ya usa la 2. Hip thrust 10 kg = mancuernas, no discos.
- 2026-10-20: OK → `main`
  Plan del 21 y del 29 al jugador. Vercel production sirve `main`.
- 2026-10-28: la app de varios deportistas vive en este repo, en `dev`. Visus es el piloto.
  Cuentas que da el admin. Neon propio `entrenamiento-online` (us-west-2; el alta no dejó Frankfurt). Whoop solo como hueco, a mano.
  `main` sigue sirviendo el HTML hasta que Adrián diga OK.
- 2026-10-29: pestaña Análisis solo para admin en `/a/[id]`
  Historial 60 días en servidor (`diaryHistory`); gráficas SVG inline sin deps. El jugador sigue en Registro; admin no ve el form.
  Sin API nueva, sin tocar schema; RPE diario sin acumulados (carga queda fuera).
- 2026-10-29: Nutrición = Suplementación + Dieta en `<details>`; dieta en `athletes.diet_notes`, suplementos en `supplements` jsonb.
  PATCH `/api/athletes/[id]/nutrition` solo admin (404 athlete). Molestias siguen en `diaries.diet_note`; no mezclar con plan.
- 2026-10-29: Sesión JWT **90 días rolling** (`maxAge` + `updateAge` 1 día) en Auth.js; sin revocación al cambiar contraseña (JWT sin estado).
  Uso diario PWA: no login cada mañana; iOS standalone y previews Vercel con dominio nuevo son excepciones conocidas.
- 2026-10-29: Contraseña propia vía `set_own_password_hash` (SECURITY DEFINER, solo `app_account_id()`).
  Nombre en `PATCH /api/athletes/[id]`; reset admin en `/api/admin/accounts/[id]/password`; UI `/ajustes` y `/panel/ajustes`.

- 2026-10-29: Adri�n OK ? merge dev a main (c45b041) y push. Producci�n = app Next.

- 2026-10-29: Producto y URL = **�ptimo Online** (optimo-online). Repo GH + proyecto Vercel renombrados; Visus es piloto, no el nombre del producto.

- 2026-11-03: Cadena anterior Visus 3 y 16 nov: bloque Fuerza v2 (española uni 45 → zancadas caballero+mancuernas → salto cajón con carga → CEA/TRX); sin española 2 piernas.
  Gate por fecha (ANTERIOR_FUERZA_V2); resto de anteriores intactos. Knowledge: ficha zancada + apunte excéntrica a velocidades.

- 2026-11-05: Amanda workspace — 5 slots (`morning_snack` / `afternoon_snack`), modal centrado, suplementos en columna derecha, Ajustes solo login/contraseña.
  Enum ampliado en Neon; jugador reutiliza `MEAL_SLOTS` sin cambios de UI. Middleware: prefijo `/api/me` no debe bloquear `/api/meals`.
  Gate `POSTERIOR_FUERZA_V2`; 26-nov+ intactos. Knowledge: ficha HT mancuernas bi + apunte recorte.
- 2026-11-04: fuente del plan = `lib/plan-data/` (JSON protocolos + TS calendario); HTML seed backup, no runtime.
  Ficha sin tabla (`SessionList`). Look glass encima de tokens Óptimo. Neon no se escribió.
- 2026-11-04: OK → merge `dev` a `main` (`314ac1b`) y push. Producción = Next con plan-data.
- 2026-11-05: semana parón Visus 7–15 nov; trabajo Óptimo solo el 12 (anterior V2 = 3 nov).
  Amistoso 14 como nota, no en `MATCHES`. Ficha via Neon `day_plans` (`DAY_OVERRIDES`).
- 2026-11-05: rol `nutritionist` + menú en `meal_slots` (desayuno/comida/cena, prep, foto bytea).
  Amanda solo ve atletas en `nutritionist_athletes`; rutas `/nutricion/**`, no ficha entrenamiento. Chequeo app por BYPASSRLS.
- 2026-11-05: seed `amanda`/`123456789` asignada a Ricardo Visus; admin gestiona más nutricionistas en ajustes.
  Suplementos y `diet_notes` siguen; PATCH nutrition también nutricionista asignada vía `nutritionist_set_athlete_nutrition`.
- 2026-11-05: workspace desktop nutricionista solo en `/nutricion/**` desde 1280px (sidebar, calendario MD, grid semanal, panel plato).
  Look clínico con tokens Óptimo y surface sólida; ficha jugador `/a/**` Nutrición no rediseñada. APIs meal_slots sin cambios.
- 2026-11-05: layout2 nutricionista — grid 2 columnas, drawer al clicar celda; suplementos/dieta en Ajustes (rail), no columna fija.
  Header `wide` alineado al workspace; Salir en rail desktop. Sin tocar `/a/**` ni admin `/panel`.
