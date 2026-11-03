# Plan — cadena-posterior (anclado al disco 2026-11-03)

## Objetivo

En Visus, **solo dos días** de cadena posterior cambian el bloque «Fuerza»: **2026-11-05** (MD-2) y **2026-11-18** (MD-3).

Bloque nuevo, en este orden:
1. Hip thrust con mancuernas — 2 series × 8 reps.
2. Hip thrust con mancuernas unilateral — 2 series × 8 / pierna.
3. Hip thrust con barra — 2×8 a 50 kg (sin las 6–7 reps solo barra).
4. Salida a cajón desde caballero, plano sagital, + med ball — 1×6 / pierna.
5. Salida a cajón desde caballero, plano frontal lado abierto, + med ball — 6 / pierna.

Se quitan esos dos días: hip thrust sin peso, isométrico cuña (gemelo/sóleo) e «hip thrust cuña solo punta» (y la nota «2 series del bloque…»).

Knowledge: fichas que falten + apunte del porqué del recorte.

## Hechos confirmados (paso 1)

- «Cadena posterior» = rol `"posterior"` de `buildStrengthDayMap` (`index.html:~1515-1560`, espejo TS `lib/plan.ts:40-81`). Se calcula solo desde `MATCHES` + `STRENGTH_FROM = "2026-10-19"` (`index.html:1508`).
- Ejecutado `buildDayPlans(parseIndexHtml())` en local (solo lectura, sin Neon). Días con rol posterior (todos con `hip-thrust-barra`): 10-21 y 10-28 (pasados) → **2026-11-05 (MD-2)** → **2026-11-18 (MD-3)** → 11-26 → 12-03 → 12-10 → 2027-01-27 → 02-04 … 05-20.
- **Supuesto de Adrián confirmado:** los próximos dos posteriores desde hoy son **5-nov y 18-nov**. No hay otro posterior entre medias (parón de selecciones: partido 7-nov, siguiente 21-nov). Espejo de la cadena anterior (3 y 16-nov → posteriores a +2 días).
- 5-nov lleva además «Aceleración» (sled, por ser MD-2) y 4-nov/17-nov son los días de campo: **no se tocan**.
- **Sin gate por fecha hoy:** el bloque de fuerza posterior es el mismo para TODOS los posteriores (`lib/plan.ts:204-219`, `index.html:2336-2348`). Editarlo sin más cambiaría 26-nov en adelante → hace falta una lista explícita de las dos fechas.
- `index.html` y `plan-visus.html` son idénticos (verificado con `diff`). El parser lee solo `index.html` (`lib/html-parse.ts:75-78`); editar ambos.

## Estado actual del bloque en disco (IDs reales)

Render `index.html:2336-2348` / `lib/plan.ts:204-219`, en este orden:

| # | ID en `PROTOCOLS` (`index.html`) | Label / qty actual | Línea |
|---|---|---|---|
| 1 | `fuerza-isquios-bilateral` | Hip thrust sin peso (pies en cuña) · 8 + 8 + 8 por pierna · 2 series | `:1374` |
| 2 | `fuerza-isquios-isometrico-cuna` | Isométrico cuña (gemelo y sóleo) · 15 s/pierna · 2 series | `:1379` |
| — | nota «2 series del bloque: hip thrust sin peso + isométrico de cuña.» | | `:2345`, `plan.ts:213-216` |
| 3 | `fuerza-isquios-unilateral` | Hip thrust cuña, solo punta del pie · 8/pierna · 2 series | `:1384` |
| 4 | `fuerza-isquios-mancuernas-miniband` | Hip thrust con mancuernas y mini-band · 8 reps/pierna · 2 series (2×5 kg + mini-band) | `:1389` |
| 5 | `hip-thrust-barra` | Hip thrust con barra · «Barra 6–7 reps · 1 serie\n40 kg · 2×8 reps» | `:1394` |

Reutilizar los IDs existentes tal cual **no sirve**: los usan 26-nov y siguientes. Se crean IDs nuevos y los viejos quedan intactos.

## Dónde vive el bloque (HTML seed Y Neon; hay que tocar los dos)

| Capa | Ancla | Qué es |
|---|---|---|
| HTML seed | `index.html` **y** `plan-visus.html` | `PROTOCOLS` (`:~1294-1402`); gate junto a `STRENGTH_FROM` (`:1508`) y `ANTERIOR_FUERZA_V2` (`:1510`); render posterior `:2336-2348` |
| Parser | `lib/html-parse.ts`: tipo `ParsedPlan` `:56-` (campo `anteriorFuerzaV2` `:64`), `parseHtml` `:87-110` (`extractBinding(html, "ANTERIOR_FUERZA_V2")` `:95`) | Una const nueva requiere campo nuevo |
| Constructor | `lib/plan.ts:204-219` (rama `strengthRole === "posterior"`), `pushProtocol` `:157-168`; patrón ya usado en la rama anterior `:232-241` | Genera el JSON `blocks` |
| Neon | `day_plans.blocks` (JSON por fecha); **no se recalcula al editar el HTML** | Lo que ve la app |
| Script modelo | `db/update-anterior-blocks.ts` (commit `3ed82af`; script npm `db:update-anterior` en `package.json:10`) | `update day_plans set blocks … where date in (…)`, sin `delete`, falla si no actualiza exactamente 1 fila por fecha |
| Siembra | `db/seed.ts` | Borra todos los `day_plans` y resetea contraseñas → **no usar `db:seed`** |

## Formato Knowledge (leído de fichas reales)

Ruta: `G:\Mi unidad\Óptimo Sport\ÓPTIMO_KNOWLEDGE_BASE\01_WIKI_OBSIDIAN\ejercicios\<slug-ascii-kebab>.md`. Plantilla: `plantillas/plantilla_ficha_ejercicio.md`. Secciones en orden: Estado (`borrador`) · Confidence (+ reason) · Alias · Descripción · Objetivo · Indicado para · No indicado si · Posición inicial · Material · Plano de movimiento · Dosis detectada en sesiones · Correcciones técnicas · Variantes/Progresiones/Regresiones · Sesiones donde aparece · Zonas · Patrones · `## Tags` (sin backticks). Lo no dictado = «no especificado». Tras crear: `index.md`, `diccionario/nomenclatura_ejercicios.md`, `log.md` (entrada **arriba**, tras `# Log`; la última es `[2026-11-03] ejercicio | cadena anterior Visus…`). Apunte de criterio: `profesionales/apuntes/adrian-*.md` (modelo reciente: `adrian-excentrica-velocidades-cadena-anterior.md`).

### Qué existe ya en Knowledge (no duplicar)

| Pedido | Estado |
|---|---|
| Hip thrust con mancuernas **unilateral** 2×8/pierna | **Existe** `hip-thrust-unilateral-mancuernas-mini-banda.md` (2×5 kg + mini-band, 8+8, 2 series, Conf. 3) → **solo añadir** «Sesiones/uso: Visus 2026-11-05/18»; sin renombrar |
| Hip thrust con mancuernas (bilateral) 2×8 | **No existe** → **crear** `hip-thrust-mancuernas-mini-banda.md` (misma carga que la unilateral; reps/serie 8 · 2) |
| Hip thrust con barra a 50 kg | **Existe** `hip-thrust-barra.md` (cargas 20/40/60 kg; sin «6–7 reps solo barra») → **actualizar**: línea de dosis Visus 2×8 a 50 kg; nada que borrar |
| Hip thrust sin peso / isométrico cuña / solo cuña | Existen `hip-thrust-plano-inclinado.md`, `hip-thrust-antepie-plano-inclinado.md`, `hip-thrust-isometrico-antepie-plano-inclinado.md` → **no tocar** (siguen en otros días); se citan en el apunte |
| Salida a cajón caballero **sagital** + med ball | Base más cercana: `zancada-cajon-triple-extension.md` (sagital, cajón delante) → **actualizar con variante con pelota medicinal**, dosis 1×6/pierna (ver Duda 2) |
| Salida a cajón caballero **frontal lado abierto** + med ball | Base: `caballero-lanzamiento-cadera-cajon-cambio-plano.md` (Variante 1 = lado abierto, cajón 45 cm) → **actualizar con variante con pelota medicinal**, 6/pierna (ver Duda 2) |
| Med ball (material) | `material/pelota-medicinal.md` (canónico; «balón medicinal» alias) → añadir las dos fichas en «Ejercicios relacionados»; no crear `med-ball` |
| Familia | `ejercicios/familia-caballero-cajon-triple-extension.md` (índice) → añadir nota de uso con pelota |
| Porqué del recorte | **Crear** `profesionales/apuntes/adrian-recorte-posterior-hip-thrust-cajon.md` (título provisional): por qué se sale de hip thrust sin peso + isométricos de cuña y se pasa a mancuernas → barra 50 kg → salidas a cajón con med ball |

## Supuestos cerrados

- Días: **2026-11-05** y **2026-11-18** (confirmado en disco).
- Dosis dictadas por Adrián tal cual; «6 / pierna» de la segunda salida se lee como **1 serie × 6** (igual que la primera). Carga de las mancuernas (5 kg + mini-band) **no dictada** → se mantiene la que ya consta en disco; peso de la med ball: no especificado.
- «Hip thrust con mancuernas» (dejar) se lee como la **versión bilateral** del ejercicio que hoy está en disco, ya que el unilateral se pide aparte (ver Duda 1).
- IDs nuevos (los viejos no se tocan): `fuerza-isquios-mancuernas-bilateral`, `fuerza-isquios-mancuernas-unilateral`, `hip-thrust-barra-50`, `fuerza-isquios-salida-cajon-sagital-medball`, `fuerza-isquios-salida-cajon-frontal-abierto-medball`.
- Gate: const `POSTERIOR_FUERZA_V2 = ["2026-11-05", "2026-11-18"]`, campo parser `posteriorFuerzaV2`, script `db:update-posterior`.

## Fuera

Vercel, `main`, cadena anterior, `db:seed`, look UI, otros deportistas, Biblioteca de vídeos del Desktop, `Desktop\Optimo`, auth, posteriores que no sean 11-05 y 11-18, activación/específica/aceleración/campo de esos días.

## Paralelo

**Sí, cerrado:** paso 2 (app, git/`dev`) y paso 3 (Knowledge, Drive fuera de git) son independientes. Única dependencia suave: nombres de ejercicio de la tabla de abajo (fuente común). Dentro del paso 2 los sub-pasos son secuenciales. Paso 1 ya hecho.

## Pasos listos para oleada

1. **[hecho] sonnet — anclar plan.** Criterio: este documento. ✔

2. **sonnet — app (rama `dev`, un commit).**
   a. `index.html` **y** `plan-visus.html` (idénticos): añadir 5 entradas a `PROTOCOLS` (tras `hip-thrust-barra`, `:1398`):
      - `fuerza-isquios-mancuernas-bilateral` — «Hip thrust con mancuernas y mini-band» · «8 reps · 2 series» · info: 2 mancuernas de 5 kg (10 kg en total) unidas por mini-band; 8 reps, 2 series.
      - `fuerza-isquios-mancuernas-unilateral` — «Hip thrust unilateral con mancuernas y mini-band» · «8 reps / pierna · 2 series» · info = la de `:1392`.
      - `hip-thrust-barra-50` — «Hip thrust con barra» · «50 kg · 2×8 reps» · info: «Hip thrust con 50 kg: 2 series de 8 repeticiones.» (sin calentamiento solo barra).
      - `fuerza-isquios-salida-cajon-sagital-medball` — «Salida a cajón desde caballero (plano sagital) con pelota medicinal» · «6 reps / pierna · 1 serie».
      - `fuerza-isquios-salida-cajon-frontal-abierto-medball` — «Salida a cajón desde caballero (plano frontal, lado abierto) con pelota medicinal» · «6 reps / pierna · 1 serie». Info de ambas: solo lo dictado/ya en fichas (lado abierto = lado de la rodilla apoyada); sin inventar peso de pelota.
   b. Mismos archivos: const `POSTERIOR_FUERZA_V2 = ["2026-11-05", "2026-11-18"]` junto a `ANTERIOR_FUERZA_V2` (`:1510`). En el render `:2336-2348`: `if (POSTERIOR_FUERZA_V2.includes(key))` → Fuerza = mancuernas-bilateral → mancuernas-unilateral → `hip-thrust-barra-50` → salida sagital → salida frontal abierta (sin la nota de «2 series del bloque»); `else` = bloque actual intacto (incluida la nota).
   c. `lib/html-parse.ts`: campo `posteriorFuerzaV2: string[]` en `ParsedPlan` (junto a `:64`) y `extractBinding(html, "POSTERIOR_FUERZA_V2")` en `parseHtml` (junto a `:95`) y en el objeto devuelto (junto a `:110`).
   d. `lib/plan.ts:204-219`: misma bifurcación por `parsed.posteriorFuerzaV2.includes(iso)` (patrón de `:232-241`); específica/activación sin cambios.
   e. Neon: `db/update-posterior-blocks.ts` copiando `db/update-anterior-blocks.ts` con `parsed.posteriorFuerzaV2`; script `db:update-posterior` en `package.json` (junto a `:10`). **No ejecutar contra Neon hasta que la verificación local pase.**
   f. Commit en `dev` (castellano, trailer del repo).
   **Criterio de hecho:** `npx tsx` leyendo `buildDayPlans` muestra 11-05 y 11-18 con los 5 IDs nuevos en ese orden y **sin** `fuerza-isquios-bilateral`/`-isometrico-cuna`/`-unilateral`/`hip-thrust-barra`; **26-nov y demás posteriores idénticos a antes** (diff JSON vacío vs `git stash`/HEAD) y 11-03/11-16 intactos; `npm run build` pasa; los dos días en `npm run dev` (puerto 3001) muestran el bloque nuevo; `git status` limpio salvo el diff. Tras el OK local, ejecutar `npm run db:update-posterior` → imprime las 2 fechas.
   **Aviso:** Neon es una única base (dev y producción comparten datos); el update lo ve Visus en producción al instante, sin merge a `main`. Es el cambio pedido; no borra datos.

3. **sonnet|grok — Knowledge (en paralelo con 2, fuera de git).**
   a. Crear `ejercicios/hip-thrust-mancuernas-mini-banda.md` (`borrador`, Conf. 3; bilateral, [[hip-thrust]], [[pesa-libre]] + [[elastico]], 8 · 2 series; hermana de la unilateral).
   b. Actualizar `ejercicios/hip-thrust-unilateral-mancuernas-mini-banda.md` (uso Visus 5/18-nov, relacionado con la bilateral) y `ejercicios/hip-thrust-barra.md` (dosis Visus 2×8 a 50 kg; Confidence reason con fecha).
   c. Actualizar `zancada-cajon-triple-extension.md` y `caballero-lanzamiento-cadera-cajon-cambio-plano.md` con variante «con pelota medicinal» y su dosis; `familia-caballero-cajon-triple-extension.md` (nota) y `material/pelota-medicinal.md` (relacionados).
   d. Crear el apunte `adrian-recorte-posterior-hip-thrust-cajon.md`; enlazar `[[hip-thrust-plano-inclinado]]`, `[[hip-thrust-antepie-plano-inclinado]]`, `[[hip-thrust-isometrico-antepie-plano-inclinado]]`, `[[hip-thrust-barra]]`, `[[hip-thrust-unilateral-mancuernas-mini-banda]]`, `[[hip-thrust-mancuernas-mini-banda]]`, las dos fichas de cajón y `[[pelota-medicinal]]`. Solo el porqué que diga Adrián; lo demás «no especificado».
   e. Propagar: `index.md` (ejercicios + apuntes), `diccionario/nomenclatura_ejercicios.md`, `log.md` (entrada arriba).
   **Criterio de hecho:** 2 notas nuevas (1 ficha + 1 apunte) + 6 actualizadas; `grep` de los slugs nuevos sin duplicados; ningún `[[enlace]]` roto de lo creado; el apunte enlazado desde las fichas nuevas/actualizadas.
