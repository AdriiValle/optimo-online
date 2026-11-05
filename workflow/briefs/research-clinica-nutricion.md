# Research: panel clínica nutrición (Amanda · v2 desktop)

**Contexto:** v1 en `/nutricion` (login `amanda` / `123456789`) funciona; Amanda trabaja casi siempre en **escritorio**. Objetivo: workspace tipo software de clínica, no la ficha móvil/glass del jugador. **Sin implementar aún** — solo referencias + propuesta.

---

## Referencias (producto → qué copiar)

| Producto | Qué copiar para Óptimo |
|----------|-------------------------|
| **Nutrium** | Plan semanal (hasta 7 variantes/día), comidas con hora editable; **columna lateral de contexto** (objetivos + diario reciente) mientras editas; calendario **mes/semana/día** de consultas; plantillas de menú con **fecha de publicación** programada. |
| **Practice Better** | **Ficha cliente = hub único**: pestañas dieta/estilo de vida, notas, protocolos compartibles; suplementos dentro del plan de tratamiento; densidad de **registro clínico**, no feed móvil. |
| **Healthie** | Portal nutrition-first: menú + seguimiento en un solo sitio; buen referente de **formularios compactos** en web ancha (aunque Óptimo no necesita facturación ni telehealth de suite completa). |
| **Kalix** | EMR dietista: **pestañas en la ficha** (chart, suplementos vía Fullscript, informes); adherencia y protocolos **anclados al expediente**, no sueltos en acordeones. |
| **Fullscript (+ Kalix/PB)** | Tab de suplementación con **protocolos reutilizables**, dosis/frecuencia/duración y mensaje al paciente — equivalente funcional a nuestra lista `supplements` + notas, pero presentado como **panel fijo**, no `<details>`. |
| **Foodzilla** (nicho menús) | **Grid semanal** como pantalla principal del trabajo (día × comida); la clínica “vive” en la matriz, no día a día en scroll. |
| **Cronometer Pro** (vía Kalix) | Informes día/semana con **carga + nutrición en paralelo** — analogía directa con nuestro calendario **MD/partidos** junto al menú (solo lectura de entreno, edición de comida). |
| **That Clean Life** (integrado en PB) | Biblioteca de recetas/planes como **bloques arrastrables** — en Óptimo el análogo son **platos guardados** (título + prep + foto) reutilizables entre días (fase posterior; v2 puede copiar solo el **patrón visual** de ficha de receta). |

---

## Panel actual v1 (código + captura localhost:3001 @ 1440px)

**Rutas:** `app/nutricion/page.tsx` (lista) · `app/nutricion/[athleteId]/` (`PlanCalendar` + `MealDayEditor` + `NutritionPane`).

**Qué hay bien (datos):** calendario MD/partidos/intensidad (solo lectura), menú **un día** × 3 slots (desayuno/comida/cena) con nombre, preparación y foto, suplementos + `diet_notes` editables.

**Qué peca (producto/UX):**

- **Móvil-first forzado:** `.page { max-width: 640px }` — en desktop queda una **columna estrecha** con ~70% de pantalla vacía.
- **Misma piel que el jugador:** cards glass (`--glass`, acordeones `.nut-details`), tipografía grande y poco contenido por viewport — sensación **app deportista**, no **consultorio**.
- **Flujo secuencial:** calendario arriba → scroll → menú del **día seleccionado** → scroll → nutrición; no hay **visión de semana** ni comparar MD-2 vs MD+1 de un vistazo.
- **Un plato a la vez:** editor por slot en acordeón; no hay **ficha de plato** persistente (foto + prep) mientras navegas el calendario.
- **Lista de pacientes mínima:** una tarjeta por deportista, sin estado (próximo partido, MD hoy, menú incompleto).
- **Sin “expediente”:** notas y suplementos compiten con el menú en la misma pila vertical; en clínica suelen ir en **columna lateral** siempre visible.

---

## Qué suele tener software de clínica de nutrición (módulos)

1. **Cartera de pacientes** (lista, búsqueda, alertas).  
2. **Agenda** (opcional en Óptimo deportivo: citas → sustituido por **calendario de carga/partido**).  
3. **Expediente / notas clínicas** (historial, pauta general).  
4. **Planificación alimentaria** (día, **semana**, plantillas).  
5. **Recetas/platos** (ingredientes, preparación, foto).  
6. **Suplementación / protocolos**.  
7. **Seguimiento** (adherencia, medidas, diario — muchos lo posponen).  
8. **Comunicación y portal del paciente** (en Óptimo: pestaña Nutrición del deportista, móvil).

Para Amanda en Óptimo **no hace falta EMR completo**; sí hace falta **densidad y layout de clínica** sobre lo que ya tenemos.

---

## Propuesta v2 desktop (recomendación Óptimo)

**Breakpoint:** layout nuevo desde **≥1280px** solo en `/nutricion/**`. El jugador sigue en móvil (`/a/[id]`).

**Workspace de 4 zonas** (recomponer componentes existentes, sin motores nuevos):

```
┌──────────────┬─────────────────────┬──────────────────────────────┐
│ Pacientes    │ Calendario MD       │ Grid semanal de comidas      │
│ (asignados)  │ (mes + partidos)    │ Filas: D/C/Ce · Cols: Lun–Dom│
│ + estado     │ + día seleccionado  │ Celda: título + mini foto    │
├──────────────┴─────────────────────┴──────────────┬───────────────┤
│ (opcional franja: resumen carga semana / partido) │ Ficha plato   │
│                                                   │ Foto + prep   │
│                                                   │ Suplementos   │
│                                                   │ Notas dieta   │
└───────────────────────────────────────────────────┴───────────────┘
```

**Prioridad de entrega (orden):**

1. **Quitar cap 640px** y grid CSS en rutas nutricionista (sin tocar ficha jugador).  
2. **Lista pacientes** persistente a la izquierda (misma query `assignedAthletesForNutritionist`).  
3. **Calendario MD** en columna central (reutilizar `PlanCalendar` + `day_plans`).  
4. **Grid semanal** leyendo `/api/meals?from&to` (7 días alrededor del `center` o semana ISO); clic en celda abre edición.  
5. **Panel derecho:** detalle del slot activo (formulario actual de `MealSlotForm`) + bloque fijo suplementos/`diet_notes` (`NutritionPane` sin acordeones en desktop).

**Analogía de trabajo:** Amanda planifica **semana según MD** (ver rojo/verde del calendario) y rellena comidas en la matriz; el deportista sigue viendo **día a día** en el móvil.

---

## Qué NO hacer en v2 (explícito)

- Contadores de **macros/micros**, bases de alimentos, equivalencias.  
- **Lista de la compra** automática.  
- **IA** (notas clínicas, transcripción, resúmenes).  
- Agenda de consultas, facturación, portal white-label tipo Nutrium/Kalix.  
- Duplicar ficha de **entrenamiento** (sesiones, diario, lesiones) — solo calendario MD ya expuesto.

---

## Look (premium clínico, tokens Óptimo)

- **Paleta:** `--bg`, `--surface`, `--text`, `--secondary`, `--line`, `--accent` (`workflow/context/design-system.md` / `globals.css`). Sin azules/morados de analytics ni paletas de Nutrium/Kalix.  
- **Superficies:** en desktop nutricionista preferir **surface sólida + borde `--line`** y sombra `--shadow-sm`; reservar glass fuerte al jugador.  
- **Densidad:** filas ~32–40px, tablas/grids con tipografía **0.8125–0.875rem**, menos padding vertical en `.card` dentro del workspace.  
- **Jerarquía:** sidebar oscuro o `--fill-secondary` solo en lista pacientes; área central clara tipo “hoja de trabajo”.  
- **Fotos de plato:** miniatura en grid, **preview grande** en panel derecho (ya tenemos API foto por `meal_id`).

---

## Evidencia local

- Dev server `:3001` activo; capturas revisadas: `/nutricion` (lista centrada) y `/nutricion/[athleteId]` (calendario + bloques apilados).  
- Implementación v1 descrita en `workflow/briefs/plan-nutricionista.md`.

**Siguiente paso sugerido:** brief de implementación (oleada UI solo `/nutricion/**`, CSS scoped `.nut-desktop` o similar) cuando Adrián dé OK a este layout.
