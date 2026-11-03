# From composer — Salto + TRX (Knowledge + Visus + YouTube)

- Hecho: sí (YouTube título: **no** — ver abajo)
- Contexto: el vídeo `g1jEO-z8vRU` no era hop jump; el nombre oral correcto es **Salto + TRX** (2026-11-03). «Master X» fue error de transcripción. `protocolId` en app se mantiene `fuerza-cuadriceps-hop-jump-trx` para no rehacer gates.

## Knowledge (`OPTIMO_KNOWLEDGE_BASE`)

- **Nueva** `01_WIKI_OBSIDIAN/ejercicios/salto-trx.md` (Conf. 3): triple ext./flex., velocidades supramáximas TRX, pico excéntrico; alias «salto + TRX», «salto trx»; ~~master x~~ = error de transcripción; `## Vídeo` → `https://youtu.be/g1jEO-z8vRU`.
- **`hop-jump-trx.md`**: quitado `## Vídeo`; retirados alias CEA; aclarado error etiquetado Visus → [[salto-trx]]; ejercicio tobillo intacto (dosis s02 2×10).
- **`adrian-excentrica-velocidades-cadena-anterior`**: paso 4 = [[salto-trx]] (no hop jump / CEA).
- **`index.md`**, **`diccionario/nomenclatura_ejercicios.md`**, **`log.md`**, **`salto-cajon-desde-sentado`** relacionados.
- Ficha errónea `salto-master-x.md` eliminada.

## YouTube

- **`subidos/subidos.csv`**: `archivo=salto-trx.mp4`, `slug=salto-trx`, mismo `protocolId` y `videoId`.
- **Renombrado** a `salto-trx.mp4`.
- **Título en YouTube (`videos.update`)**: **falló** — token `personal` con scopes `youtube.upload` + `youtube.readonly` devolvió `403 insufficientPermissions`.
  - **Manual:** YouTube Studio → vídeo → título **«Salto + TRX»** (alinear con H1 ficha).
  - **Script (futuro):** ampliar OAuth a `https://www.googleapis.com/auth/youtube` (o `youtube.force-ssl`), borrar `%USERPROFILE%\.config\youtube-upload\personal\token.json`, reautorizar; luego `videos().update(part='snippet', …)`.

## App Visus

- `index.html` + `plan-visus.html`: `fuerza-cuadriceps-hop-jump-trx` → **label** «Salto + TRX», `info` + `blurb` desde ficha; `video` sin cambio.
- `npm run db:sync-videos` → Neon.
- Git: commit / push según rama.

## Entrega

| Campo | Valor |
|-------|--------|
| Slug ficha | `salto-trx` |
| URL | https://youtu.be/g1jEO-z8vRU |
| Label app | Salto + TRX |
| YouTube title API | No (403 scope) |

- Duda: ninguna.
