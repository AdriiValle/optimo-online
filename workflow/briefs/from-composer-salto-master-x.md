# From composer — Salto Master X (Knowledge + Visus + YouTube)

- Hecho: sí (YouTube título: **no** — ver abajo)
- Contexto: el vídeo `g1jEO-z8vRU` (`salto-master-x.mp4`) no era hop jump; es **Salto Master X** (dictado Adrián 2026-11-03). `protocolId` en app se mantiene `fuerza-cuadriceps-hop-jump-trx` para no rehacer gates.

## Knowledge (`OPTIMO_KNOWLEDGE_BASE`)

- **Nueva** `01_WIKI_OBSIDIAN/ejercicios/salto-master-x.md` (Conf. 3): triple ext./flex., velocidades supramáximas TRX, pico excéntrico; alias «salto master x», «master x»; `## Vídeo` → `https://youtu.be/g1jEO-z8vRU`.
- **`hop-jump-trx.md`**: quitado `## Vídeo`; retirados alias CEA; aclarado error etiquetado Visus → [[salto-master-x]]; ejercicio tobillo intacto (dosis s02 2×10).
- **`adrian-excentrica-velocidades-cadena-anterior`**: paso 4 = [[salto-master-x]] (no hop jump / CEA).
- **`index.md`**, **`diccionario/nomenclatura_ejercicios.md`**, **`log.md`**, **`salto-cajon-desde-sentado`** relacionados.

## YouTube

- **`subidos/subidos.csv`**: `archivo=salto-master-x.mp4`, `slug=salto-master-x`, mismo `protocolId` y `videoId`.
- **Renombrado** `subidos/hop-jump-trx.mp4` → `salto-master-x.mp4`.
- **Título en YouTube (`videos.update`)**: **falló** — token `personal` con scopes `youtube.upload` + `youtube.readonly` devolvió `403 insufficientPermissions` al listar/actualizar `g1jEO-z8vRU`.
  - **Manual:** YouTube Studio → vídeo → título **«Salto Master X»** (alinear con H1 ficha).
  - **Script (futuro):** ampliar OAuth a `https://www.googleapis.com/auth/youtube` (o `youtube.force-ssl`), borrar `%USERPROFILE%\.config\youtube-upload\personal\token.json`, reautorizar; luego `videos().update(part='snippet', …)`.

## App Visus

- `index.html` + `plan-visus.html`: `fuerza-cuadriceps-hop-jump-trx` → **label** «Salto Master X», `info` + `blurb` desde ficha Master X; `video` sin cambio.
- `npm run db:sync-videos` → **2** filas cambiadas (Neon).
- Git: commit en `dev`, push, merge `main`, push.

## Entrega

| Campo | Valor |
|-------|--------|
| Slug ficha | `salto-master-x` |
| URL | https://youtu.be/g1jEO-z8vRU |
| Label app | Salto Master X |
| YouTube title API | No (403 scope) |

- Duda: ninguna.
