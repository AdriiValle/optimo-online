# plan-anillos-objetivos

Repo: `Optimo/Entrenamientos online/Ricardo Visus` (Next.js, rama `dev`). Lee antes `workflow/context/design-system.md` (look Óptimo + apple-design, paleta intacta, reduced-motion).

## Problema
En `WeekPanel` (`app/nutricion/[athleteId]/nutricion-athlete-client.tsx`, ~l.750) todos los `<Ring>` reciben `pct={null}`: el anillo nunca se rellena, solo muestra el número. No existe ningún objetivo contra el que medir (kcal, proteína, hidratos, fibra, sodio, hierro, calcio, vit D). Además el peso/altura/edad del deportista (botón «Perfil», `app/api/athletes/[id]/profile`, columnas `athletes.birth_date/height_cm/weight_kg`) solo llega al panel como `weightKg` en `NutritionTotals` (`lib/queries.ts` `nutritionTotals`, ~l.1124-1192). Adrián: la experiencia visual no convence; quiere anillos que se rellenen y se entiendan.

## Objetivo
Que cada anillo del resumen (día/semana/mes) se rellene contra un objetivo diario calculado del perfil del deportista y que el panel se lea de un vistazo (¿voy bien o me falta?).

## Pasos
1. **Objetivos** — módulo nuevo `lib/nutrition/targets.ts`, funciones puras y sin dependencias:
   - Energía: Mifflin-St Jeor (hombre) con peso, altura, edad × factor de actividad por tipo de día (`lib/nutrition/day-type.ts`: MD / MD±n; descanso bajo, partido alto). Constantes documentadas en comentario.
   - Proteína 1,6–2,0 g/kg; hidratos por tipo de día (p. ej. 3–7 g/kg); grasa ~1 g/kg o 25–30 % kcal. Fibra 25–38 g, sodio tope 2300 mg, hierro, calcio, vit D: referencias RDA/EFSA de adulto deportista. Cada objetivo = `{ target, kind: "min" | "range" | "max" }` para colorear distinto (sodio es tope, no meta).
   - Sin peso/altura/nacimiento → `null` (nunca inventar); el panel muestra «Completa el perfil» con enlace que abre el modal Perfil.
2. **Datos** — extender `NutritionTotals` con `profile: { weightKg, heightCm, ageYears }` desde `nutritionTotals` (query ya lee `athletes`). Cambio mínimo, sin romper `summarizeNutrition`.
3. **Anillos** — `Ring`/`WeekPanel`: pasar `pct = media_por_día / objetivo` (energía: media diaria vs objetivo diario, no el total semanal). Rellenar con animación corta que respete `prefers-reduced-motion`; estados: bajo (<85 %), en rango (85–110 %), pasado (>110 %, tope visual con marca), tope (sodio). Color con tokens existentes, sin paleta nueva. Mostrar `valor / objetivo` y un texto corto de estado, no solo la cifra. Mejorar jerarquía: energía y macros grandes, micros en fila compacta, textos legibles en móvil y en el panel lateral (`nut-dash--side`).
4. **Cobertura** — si el periodo no tiene todos los platos cuantificados, el anillo lo indica («X/Y platos») y no pinta «pasado» con datos incompletos (usa la marca `approx` ya existente).
5. Verificar en `http://localhost:3001/nutricion/9d27d850-d328-4633-bc33-56198a0e4181` (ya hay sesión de Amanda abierta en el navegador del chat; no escribas contraseñas). Vistas día/semana/mes, ancho 1280 y móvil. `npx tsc --noEmit` limpio.

## Archivos
SÍ: `lib/nutrition/targets.ts` (nuevo), `lib/queries.ts` (solo `nutritionTotals`/tipo), `app/nutricion/[athleteId]/nutricion-athlete-client.tsx` (WeekPanel, Ring, PerKgRing), `app/nutricion/[athleteId]/nutrition-summary.ts`, `app/globals.css` (bloque `.nut-ring*`/`.nut-dash*`).
NO: esquema de BD, `db/`, importación de menú, generación de ingredientes, rutas API salvo lo del paso 2, cualquier otro repo. No migraciones. No subir a `main`.

## Criterio de hecho
- Con perfil completo, cada anillo se rellena proporcional a su objetivo y el color indica bajo/ok/pasado; sodio se trata como tope.
- Sin perfil: anillos vacíos con aviso claro y botón para abrir Perfil; ningún NaN ni 0 inventado.
- Cambiar peso en Perfil recalcula objetivos sin recargar.
- `tsc` limpio, sin errores de consola, reduced-motion respetado, un commit en `dev` con mensaje `feat(nutricion): anillos con objetivos del perfil`.
- Escribe `workflow/briefs/from-opus-anillos-objetivos.md`: qué cambió (rutas), fórmulas y supuestos elegidos, dudas.
