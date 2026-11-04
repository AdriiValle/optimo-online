# Plan: wearable en Registro (Amazfit ahora, Whoop después)

Cajón: app. Difícil (OAuth, Neon, salud). Anclado por opus 2026-11-04 contra `db/schema.sql`, `app/api/diaries/route.ts`, `app/a/[id]/home-client.tsx`, seed y alta de atleta.

Objetivo: en Registro, el deportista conecta su pulsera. Si está conectada, los campos que el proveedor trae (sueño, calidad, HRV, pulso reposo, recovery si existe) salen de la pulsera; a mano RPE, molestias, nota (y km / pulso medio si running). Botón «Actualizar datos de esa noche». Whoop: visible, deshabilitado («Próximamente»), sin red.

Rama `dev`. No `main`. No prod sin OK.

## Decidido

- **Proveedor vivo:** Amazfit vía API web Huami/Zepp (OAuth 2.0, code flow). Whoop: solo enum + botón deshabilitado. Sin rutas Whoop.
- **Un wearable por deportista.** Conectar con otro `connected` → 409.
- **Quién conecta:** el deportista desde su Registro. Admin ve el estado (solo lectura) en la ficha; no conecta ni desconecta.
- **Regla de campos (capacidades):** `lib/integrations/capabilities.ts` declara por proveedor qué campos del diario trae. Campo que trae → de la pulsera, solo lectura cuando conectado. Campo que no trae → sigue a mano como hoy. Sin datos perdidos ni números inventados.
  - Amazfit confirmado por docs públicas: `sleepHours` (sleep_daily: deep + shallow [+ REM si viene]).
  - Amazfit pendiente de docs de partner: `sleepQuality` (score), `hrv`, `restingHr`. Hasta confirmar: `false` (a mano). Se pasan a `true` cuando el contrato/doc de partner lo dé.
  - `recovery`: Amazfit no la trae. Se queda a mano. **No** copiar sleep score ni inventar fórmula.
- **Noche del día D:** el registro de sueño cuya fecha Zepp es D (la noche que termina la mañana de D). Verificar con cuenta real en cuanto haya claves; si Zepp lo fecha a la tarde, usar D-1 en el mapper (un solo sitio).
- **Pull v1** con el botón. Webhooks fuera (Zepp los da solo a partners invitados).
- **Sin claves Zepp** en env: rutas → 503 `INTEGRATION_NOT_CONFIGURED`; la UI muestra «Conexión con Amazfit pendiente de alta» y nunca «conectado».
- **Tokens:** solo servidor, cifrados AES-256-GCM (`node:crypto`) con `INTEGRATIONS_ENC_KEY`. Tabla aparte que ninguna query de ficha lee. Nunca al cliente ni al git ni a logs.
- **Auth.js no se toca.** El OAuth de Zepp es aparte.
- **Desconectar** borra tokens y deja status `disconnected`. Lo ya volcado al diario se queda.

## Lo que hay (verificado)

- `integrations (athlete_id, provider, status)`; enums `integration_provider = whoop`, `integration_status = disconnected`. RLS: select admin o propio; **write solo admin**.
- Seed y `POST /api/athletes` insertan `whoop/disconnected`. Se quedan igual.
- `diaries` ya tiene sleep_hours, sleep_quality, recovery, hrv, resting_hr, rpe, km, avg_hr, diet_note (= molestias), free_note.
- **`POST /api/diaries` hace upsert de TODOS los campos con `excluded.*`**: un form corto que no mande sueño/HRV los pondría a null. Hay que arreglarlo antes del form corto (oleada 1).
- Pestaña `log` solo se pinta para deportista (`pane === "log" && !isAdmin`).
- `db:migrate` ejecuta `db/schema.sql` entero (idempotente) en el Neon `noisy-meadow`, el mismo que usa prod.
- No hay zona horaria en `lib/`; fechas = string `YYYY-MM-DD` del calendario.

## Oleada 1 — sonnet, datos + API (sin UI)

Archivos SÍ: `db/schema.sql`, `lib/integrations/` (nuevo), `lib/queries.ts` (solo añadir), `app/api/diaries/route.ts`, `app/api/integrations/amazfit/**` (nuevo), `.env.example`.

1. **Schema (additive, al final de las secciones que toca):**
   - `ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'amazfit';`
   - `ALTER TYPE integration_status ADD VALUE IF NOT EXISTS 'connected';` y `'error'`.
   - Ojo: el script corre en una transacción implícita; **no usar los valores nuevos en `schema.sql`** (ni defaults ni checks ni inserts).
   - `integrations` + columnas: `last_sync_at timestamptz`, `last_error text`, `updated_at timestamptz not null default now()`.
   - Tabla nueva `integration_tokens (athlete_id, provider, access_token_enc text not null, refresh_token_enc text not null, token_expires_at timestamptz, external_user_id text, PK (athlete_id, provider), FK a integrations on delete cascade)`. RLS enable + force; policy all: `app_is_admin() OR athlete_id = app_athlete_id()`.
   - `integrations`: policy nueva `integrations_write_own` (insert/update) para `athlete_id = app_athlete_id()`. La de admin se queda.
   - `diaries` + `device_source integration_provider`, `device_synced_at timestamptz`.
   - Criterio: `npm run db:migrate` dos veces seguidas sin error en `noisy-meadow`; prod actual (`main`) sigue funcionando (nada que use lo viejo cambia).
2. **Diario parcial:** `POST /api/diaries` → clave ausente en el body = no tocar la columna en el update (`case when … then excluded.x else diaries.x end` o update construido). Clave presente con `null` = borrar como hoy. El form actual manda todas → comportamiento igual. Criterio: POST con solo `{athleteId,date,rpe}` sobre un día con sueño no lo pone a null.
3. **`lib/integrations/`:** `capabilities.ts` (tabla de arriba), `crypto.ts` (encrypt/decrypt), `zepp.ts` (authorize URL, exchange, refresh, fetch sueño de una fecha, `mapZeppToDiary` puro), `config.ts` (lee `ZEPP_CLIENT_ID`, `ZEPP_CLIENT_SECRET`, `ZEPP_REDIRECT_URI`, `INTEGRATIONS_ENC_KEY`; `null` si falta alguna).
   - Endpoints de partida (wiki `zepp-health/rest-api`; confirmar con doc de partner): authorize `https://user.huami.com/oauth/index.html#/?client_id&redirect_uri&response_type=code&state` (hay variantes regionales), token `POST https://auth.huami.com/oauth2/access_token`, refresh `POST https://auth.huami.com/oauth2/refresh_token`, datos `https://api-open.huami.com/users/-/…`, scopes `profile sleep heartrate`.
   - URLs como constantes en un solo archivo; nada de esto se usa en tiempo de build.
4. **Rutas `app/api/integrations/amazfit/`:**
   - `GET connect` — sesión deportista (su propio athleteId). Sin config → 503. Si otro proveedor `connected` → 409. Genera `state` aleatorio, cookie httpOnly/Secure/SameSite=Lax 10 min con `state+athleteId`, 302 a authorize.
   - `GET callback?code&state` — valida cookie y sesión (mismo athleteId); canjea code; upsert `integrations(amazfit, connected, last_error null)` + `integration_tokens` cifrados; borra cookie; 302 a `/a/[id]?pane=log&device=ok` (o `device=error` con `last_error` corto, sin tokens).
   - `POST refresh {athleteId, date}` — sesión deportista o admin. Refresca token si caduca. Pide sueño de esa fecha. Upsert en `diaries` **solo** de los campos con capacidad `true` + `device_source`, `device_synced_at`; nunca rpe, diet_note, free_note, km, avg_hr, ni campos sin capacidad. Sin registro esa noche → 200 `{synced:false, reason:"NO_DATA"}`, no escribe nulls. 401 de Zepp tras refresh → status `error`, `last_error`, 409 al cliente. Actualiza `last_sync_at`.
   - `POST disconnect {athleteId}` — deportista propio. Borra `integration_tokens`, status `disconnected`.
   - Todas con `withRls(rlsFrom(user))` y `canSeeAthlete`; errores con `apiError`.
5. **Query ficha:** `integrationFor(tx, athleteId)` → `{provider, status, lastSyncAt, lastError}` del proveedor no-`disconnected` (o null). Solo de `integrations`, nunca de tokens. Pasarlo en `athleteHome` (añadir campo, no romper los demás).
6. `.env.example`: `ZEPP_CLIENT_ID=`, `ZEPP_CLIENT_SECRET=`, `ZEPP_REDIRECT_URI=http://localhost:3001/api/integrations/amazfit/callback`, `INTEGRATIONS_ENC_KEY=` (32 bytes base64).

Criterio oleada 1: `npm run build` ok; migrate ok ×2; sin env Zepp, `GET connect` → 503 JSON; POST diario parcial no pisa; `mapZeppToDiary` probado a mano (`tsx`) con un JSON de ejemplo con los campos de la wiki (`date, start, stop, deepSleepTime, shallowSleepTime, wakeTime`). Commit único.

## Oleada 2 — sonnet, UI estructura (sin look)

Archivos SÍ: `app/a/[id]/home-client.tsx`, componente nuevo `app/a/[id]/device-card.tsx`, `app/a/[id]/page.tsx` si hace falta pasar `integration`.

- **DeviceCard** encima del form de Registro (deportista):
  - Sin config (la API dice 503 o prop `configured=false`): «Amazfit: pendiente de alta». Botón deshabilitado.
  - `disconnected`: «Conectar Amazfit» (link a `/api/integrations/amazfit/connect?athleteId=…`) + «Whoop · Próximamente» deshabilitado.
  - `connected`: «Amazfit conectado · última actualización HH:MM dd/mm», botón «Actualizar datos de esa noche» (fecha = día seleccionado `center`), «Desconectar» (confirm).
  - `error`: mensaje corto + «Volver a conectar».
  - Lee `?device=ok|error` al volver del callback y muestra aviso una vez.
- **Form condicional:** si `connected`, los campos con capacidad `true` se pintan como valores de solo lectura (con «de Amazfit» si `device_source`), y **no se mandan** en el POST. El resto, inputs como hoy. Desconectado = form actual idéntico.
- Tras «Actualizar»: recargar el diario del día (`GET /api/diaries`) y pintar.
- **Admin:** chip solo lectura «Amazfit conectado · última sync» en la cabecera de la ficha. Sin botones.
- Criterio: desconectado se ve y guarda igual que hoy; con fila `connected` puesta a mano en dev, el form oculta/bloquea `sleepHours` y guardar RPE no borra el sueño; nada dice «conectado» si no lo está. Commit único.

## Oleada 3 — opus, look

Solo className/CSS de DeviceCard, chip admin y estado solo lectura del form. Tokens Óptimo + glass. Móvil 375. Sin paleta nueva.

## Paso final — master

Push `dev`, preview. Sin merge a `main`.

## NO

Whoop HTTP · webhooks Zepp · tocar Auth.js · borrar HTML · `main` · paleta nueva · otras apps · scrapers · tokens en cliente/logs · fórmula de recovery.

## Riesgos

- **Docs de Zepp no confirmadas.** Lo público (wiki GitHub de Huami) solo nombra `sleep_daily` (deep/shallow/wake) y `heartrate`; no HRV, ni pulso en reposo, ni score. La doc de endpoints enlazada da 404. Por eso las capacidades arrancan solo con `sleepHours`.
- **Alta de partner:** Zepp revisa en 3–7 días y la «data cooperation» es solo para empresas. Puede tardar o decir que no.
- **Región OAuth** (user / user-us / user-cn): elegir mal da login fallido. Confirmar con partner.
- **Vida del token** contradictoria en la wiki (90 días vs `expires_in` 12 h): el código refresca siempre que `token_expires_at` haya pasado o la API dé 401.
- **Migración en el Neon compartido con prod:** additive y sin tocar filas, pero `ADD VALUE` de enum no se deshace fácil. Hacerla una vez, revisada.
- **Datos de salud (RGPD, categoría especial):** el consentimiento OAuth de Zepp no basta como aviso de privacidad de Óptimo. Hace falta una línea de consentimiento/aviso antes de usarlo con deportistas reales.
- **Fecha de la noche** (D vs D-1): verificar el primer día con cuenta real.

## Bloqueado sin Client ID (decisión de Adrián: alta empresa + legal)

- Conectar de verdad, canjear tokens, el pull real.
- Confirmar endpoints, región, scopes, vida del token.
- Saber qué trae Amazfit además del sueño (score, HRV, pulso reposo) → pasar capacidades a `true`.
- Verificar fecha de la noche.
- Probar en preview: hace falta `ZEPP_REDIRECT_URI` del dominio de preview/prod registrado en Zepp.

Todo lo demás (schema, diario parcial, rutas con 503, mapper, UI con estados) se cierra sin claves.
