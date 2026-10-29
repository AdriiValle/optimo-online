# from-opus-plan-ok

- **Hecho:** sí
- **Qué cambió (rutas):**
  - `workflow/briefs/plan-analisis-admin.md` — reescrito y anclado al código (sin tocar código).
  - `workflow/briefs/from-opus-plan-ok.md` — este archivo.

## Visto bueno

Plan **OK** con estos ajustes:
- `canEdit` no distingue rol (el jugador también es `canEdit`) → prop nueva `isAdmin`.
- Gráficas: **SVG inline propio, sin dependencias** (no hay lib de charts en el repo).
- Rango fijo **60 días hasta hoy**; carga en servidor **solo para admin** (sin API nueva).
- Se reutiliza el tipo `Diary` → `lib/types.ts` queda fuera.
- RPE solo serie diaria, sin acumulado (eso es carga → fuera).
- Contrato de funciones/props fijado en el plan para poder paralelizar.

## Trozos / oleadas

- **Oleada 1 (en paralelo, no se pisan):**
  - **A** `lib/queries.ts` → `diaryHistory(tx, athleteId, from, to): Promise<Diary[]>`.
  - **B** `app/a/[id]/analisis.tsx` (nuevo) + bloque `.an-*` en `app/globals.css`.
- **Oleada 2:**
  - **C** `app/a/[id]/page.tsx` + `app/a/[id]/home-client.tsx` (tab según rol) + `next build`.
  - Smoke manual: admin → Análisis; Ricardo → Registro guarda.

## Riesgos

1. **Diff sin commitear de otro trabajo** (molestias / calidad 1–100 / header fijo) en `home-client.tsx`, `globals.css`, `queries.ts`, `types.ts`, `api/diaries`, `panel/*`. Hay que commitearlo antes de la oleada 1, si no C pisa ese trabajo.
2. Calidad de sueño con escala mezclada 1–5 / 1–100 en datos viejos: saldrán bajos en el eje 0–100. No se convierte nada (sería tocar datos).
3. `todayKey()` usa la hora del servidor (UTC en Vercel): el rango puede moverse un día cerca de medianoche. Es el mismo criterio que la carga actual.
4. El admin pierde el form desde la UI (la API lo sigue permitiendo). Coherente con «Fuera».

- **Duda:** ninguna que bloquee.
- **Recomendación:** el orquestador commitea (o hace que su dueño commitee) el diff en vuelo de molestias/header **antes** de despachar la oleada 1; luego A ∥ B, después C.
- **Bloquea a Adrián:** no.
