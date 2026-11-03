# Plan — cadena-anterior (anclado al disco 2026-11-03)

## Objetivo

En Visus, **solo dos días** de cadena anterior cambian el bloque «Fuerza»: **2026-11-03** (MD-4) y **2026-11-16** (MD-5). Quitar la sentadilla española a 2 piernas; mantener española 1 pierna cajón 45 cm; añadir zancadas ida/vuelta desde caballero + mancuernas, salto al cajón desde sentado con carga (2×2,5 kg o disco 5 kg) y CEA / saltos en TRX. En Óptimo Knowledge: fichas que falten + nota del porqué (excéntrica a distintas velocidades).

## Hechos confirmados (paso 1)

- «Cadena anterior» = rol `"anterior"` de `buildStrengthDayMap` (`index.html:1495-1543`, espejo TS `lib/plan.ts:40-80`). Se calcula solo, desde `MATCHES` + `STRENGTH_FROM = "2026-10-19"` (`index.html:1493`).
- Corrido `buildDayPlans(parseIndexHtml())` en local (solo lectura, sin Neon). Días con rol anterior desde hoy: **2026-11-03 (MD-4) → 2026-11-16 (MD-5)** → 11-24 (MD-4) → 12-01 → 12-08 → 2027-01-25 … La hipótesis de Adrián (**16-nov**) se **confirma**: no hay otro anterior entre medias (parón de selecciones: partido 7-nov, siguiente 21-nov).
- Los posteriores pareados son 5-nov y 18-nov (no se tocan). Los días de campo (4-nov y 17-nov, «Reloj de arena») tampoco.
- **Sin gate por fecha hoy:** el bloque de fuerza anterior es el mismo para TODOS los días anterior. Editarlo sin más cambiaría también 24-nov, 1-dic… → hace falta una lista explícita de las dos fechas (ver paso 2).

## Dónde vive el bloque (HTML seed Y Neon; hay que tocar los dos)

| Capa | Ancla | Qué es |
|---|---|---|
| HTML seed | `index.html` **y** `plan-visus.html` (idénticos, 2442 líneas; el parser lee solo `index.html`, `lib/html-parse.ts:76-78`) | `PROTOCOLS` (`:1294-1387`; española `:1344-1353`, salto cajón `:1354-1358`); render estático del día anterior `:2332-2346` |
| Parser | `lib/html-parse.ts:86-93` (`parseHtml`), tipo `ParsedPlan` `:55-64` | Lee consts concretas del HTML; una const nueva requiere campo nuevo aquí |
| Constructor de bloques | `lib/plan.ts:220-234` (rama `strengthRole === "anterior"`), `pushProtocol` `:156-168` | Genera el JSON `blocks` que se guarda |
| Neon | tabla `day_plans.blocks` (JSON por fecha; `db/schema.sql:61`); la app lee de ahí (`lib/queries.ts:300 dayBlocks`, `:158`) | Lo que ve la app. **No se recalcula al editar el HTML**: hay que volver a escribir las filas |
| Siembra | `db/seed.ts:20-21,61-81` | Borra TODOS los `day_plans` del atleta y reinserta; además **resetea contraseñas** de admin/atleta con `SEED_*` (`:24-41`) → **no usar `db:seed`** para esto |

## Formato ficha Knowledge (leído de fichas reales)

Ruta: `G:\Mi unidad\Óptimo Sport\ÓPTIMO_KNOWLEDGE_BASE\01_WIKI_OBSIDIAN\ejercicios\<slug-ascii-kebab>.md`. Plantilla: `plantillas/plantilla_ficha_ejercicio.md`. Ejemplos: `salto-cajon-desde-sentado.md`, `sentadilla-espanola-unilateral-cajon-45.md`, `hop-jump-trx.md`.
Secciones en orden: `# Nombre` · Estado (`borrador`) · Confidence (+ Confidence reason) · Alias · Descripción · Por qué (dicho) · Objetivo · Indicado para · No indicado si · Posición inicial `[[caballero]]` · Material (`[[pesa-libre]]`, `[[cajon]]`, `[[trx]]`) · Plano de movimiento · Dosis detectada en sesiones · Correcciones técnicas · Variantes · Progresiones · Regresiones · Sesiones donde aparece · Criterio profesional relacionado · Relacionados · Zonas · Patrones · `## Tags` (`#ejercicio #borrador #confianza_N …`, sin backticks). Lo no dicho = «no especificado», nunca inventado. Slugs sin tildes/ñ. Tras crear: `index.md` (lista ejercicios ~`:196-293`, apuntes ~`:357`), `diccionario/nomenclatura_ejercicios.md` y `log.md` (entrada nueva **arriba**, tras `# Log`).
Apuntes de criterio: `profesionales/apuntes/adrian-*.md` (modelo: `adrian-sentadilla-espanola-elastico-tenso-cajon.md`; secciones Confidence, Criterio / reflexión, Estilo de comunicación, Cuándo aplica, Cuándo NO aplica, Evidencia, Relacionado con).

### Qué existe ya en Knowledge (no duplicar)

| Pedido | Estado |
|---|---|
| Española 1 pierna cajón 45 | **Existe** `sentadilla-espanola-unilateral-cajon-45.md` → sin cambios de contenido |
| Española 2 piernas cajón 30 | **Existe** `sentadilla-espanola-cajon-30.md` → solo se menciona en la nota (sigue en el resto de días anterior) |
| Salto cajón desde sentado | **Existe** `salto-cajon-desde-sentado.md` (sin carga) → **actualizar** (variante con carga), no crear |
| Saltos en TRX | **Existe** `hop-jump-trx.md` (2×10; reactividad tobillo) → reutilizar; añadir alias «CEA» |
| Zancadas ida/vuelta caballero + mancuernas | **No existe** (hay `zancada-*` de otros gestos; ninguna de caballero+mancuernas) → **crear** `zancada-ida-vuelta-caballero-mancuernas.md` |
| CEA como concepto | No hay ficha ni entrada en diccionario → se resuelve en la nota (no ficha propia) |
| Nota del porqué | **Crear** `profesionales/apuntes/adrian-excentrica-velocidades-cadena-anterior.md` |
| Mancuernas (material) | Solo `material/pesa-libre.md`; hay un brief aparte `from-grok-mancuernas.md` → mirarlo antes de crear material |

## Supuestos cerrados

- «Hoy» = 2026-11-03; el otro día = **2026-11-16** (confirmado en disco).
- Dosis: Adrián no ha dado series/reps de lo nuevo. Se usa lo ya documentado: salto cajón **6 saltos · 2 series**, hop jump TRX **10 reps · 2 series**; zancadas **8 reps / pierna · 2 series** (misma dosis unilateral que el bloque de posterior, `index.html:1371`). Es el único dato no dictado; ver Duda en `from-sonnet-plan-ok.md`.
- IDs nuevos (no se reescriben los existentes porque los usan los demás días anterior): `fuerza-cuadriceps-zancada-caballero-mancuernas`, `fuerza-cuadriceps-salto-cajon-carga`, `fuerza-cuadriceps-hop-jump-trx`.

## Fuera

Vercel, `main`, partidos/MD ajenos, cualquier día anterior que no sea 11-03 y 11-16, look UI, Biblioteca de vídeos del Desktop, `Desktop\Optimo`, otros deportistas, auth, `db:seed`.

## Paralelo

**Sí, cerrado:** pasos 2 y 3 son independientes (app en git/`dev`; Knowledge en Drive fuera de git). Única dependencia suave: los nombres de ejercicio (tabla de IDs/labels de abajo) son la fuente común. Dentro del paso 2 los sub-pasos son secuenciales.

## Pasos listos para oleada

1. **[hecho] sonnet — anclar plan.** Criterio: este documento. ✔

2. **sonnet — app (rama `dev`, un commit).**
   a. `index.html` **y** `plan-visus.html` (mantener idénticos): añadir 3 entradas a `PROTOCOLS` (tras `:1358`) con `label`/`qty`/`info`:
      - `fuerza-cuadriceps-zancada-caballero-mancuernas` — «Zancadas ida y vuelta desde caballero con mancuernas» · «8 reps / pierna · 2 series»
      - `fuerza-cuadriceps-salto-cajon-carga` — «Salto al cajón desde sentado con carga (2×2,5 kg o disco 5 kg)» · «6 saltos · 2 series» (misma info que `:1357` + carga 5 kg en total)
      - `fuerza-cuadriceps-hop-jump-trx` — «CEA: saltos en TRX (hop jump)» · «10 reps · 2 series» (info de `hop-jump-trx.md`)
   b. Mismos archivos: const `ANTERIOR_FUERZA_V2 = ["2026-11-03", "2026-11-16"]` junto a `STRENGTH_FROM` (`:1493`); en el render `:2332-2346` rama `if (ANTERIOR_FUERZA_V2.includes(key))` → Fuerza = `fuerza-cuadriceps-unilateral` → zancada → salto carga → hop jump TRX; `else` = bloque actual intacto.
   c. `lib/html-parse.ts`: campo `anteriorFuerzaV2: string[]` en `ParsedPlan` (`:55-64`) y `extractBinding(html, "ANTERIOR_FUERZA_V2")` en `parseHtml` (`:86-93`).
   d. `lib/plan.ts:220-234`: misma bifurcación por `parsed.anteriorFuerzaV2.includes(iso)`; activación/específica sin cambios.
   e. Neon: script nuevo y mínimo `db/update-anterior-blocks.ts` (patrón de `db/seed.ts`: `loadLocalEnv`, `unpooledSql`, `set_config('app.current_role','admin')`) que haga `update day_plans set blocks = … where athlete_id = Visus and date in ('2026-11-03','2026-11-16')` con `buildDayPlans`. Sin `delete`, sin tocar `accounts`. Añadir script `db:update-anterior` en `package.json`.
   f. Commit en `dev` (mensaje en castellano, trailer del repo).
   **Criterio de hecho:** `npx tsx` leyendo `buildDayPlans` muestra 11-03 y 11-16 con el bloque nuevo y **24-nov, 1-dic… idénticos a antes** (diff vacío); `npm run build` pasa; en `npm run dev` (puerto 3001) los dos días muestran el bloque nuevo sin «Sentadilla española (2 piernas…)»; `git status` limpio salvo lo del diff.

3. **sonnet|grok — Knowledge (en paralelo con 2, fuera de git).**
   a. Crear `ejercicios/zancada-ida-vuelta-caballero-mancuernas.md` (`borrador`, Confidence 3; gesto/«ida y vuelta»/ángulos = «no especificado» salvo dictado; Posición `[[caballero]]`, Material `[[pesa-libre]]`).
   b. Actualizar `ejercicios/salto-cajon-desde-sentado.md`: variante con carga 2×2,5 kg o disco 5 kg (total 5 kg), fecha de uso 2026-11-03/16, relación con la nota. Sin renombrar.
   c. Actualizar `ejercicios/hop-jump-trx.md`: alias «CEA» y relación con el bloque de cadena anterior; sin cambiar su dosis histórica.
   d. Crear `profesionales/apuntes/adrian-excentrica-velocidades-cadena-anterior.md`: por qué se deja de usar la española a 2 piernas y se construye excéntrica a distintas velocidades (española uni 45 cm lenta/controlada → zancada con carga → salto sin excéntrica con carga → CEA/TRX rápido-reactivo); enlazar `[[sentadilla-espanola-cajon-30]]`, `[[sentadilla-espanola-unilateral-cajon-45]]`, `[[salto-cajon-desde-sentado]]`, `[[hop-jump-trx]]`, `[[adrian-salto-cajon-desde-sentado-hacia-plyo]]`.
   e. Propagar: `index.md` (ejercicios + apuntes), `diccionario/nomenclatura_ejercicios.md` (entrada zancada + alias CEA), `log.md` (entrada arriba).
   **Criterio de hecho:** 1 ficha nueva + 1 apunte nuevo + 2 fichas actualizadas; `grep` de los slugs no devuelve duplicados; ningún `[[enlace]]` roto de lo creado; el porqué (excéntrica a distintas velocidades) legible en el apunte y enlazado desde las 3 fichas de ejercicio.
