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
