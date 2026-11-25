# Análisis: planificación Pablo Iturria (PDF 30.10.2026)

**Fuente:** `workflow/inbox/Pablo Iturria Moral planificación 1. Inicial 30.10.2026.md` (ingesta desde PDF, sin leer binario).

**Comparación:** `workflow/inbox/EJEMPLO DE MENU.md` (Word → markdown, mismo tipo de menú Amanda).

**App Óptimo:** slots `breakfast`, `morning_snack`, `lunch`, `afternoon_snack`, `dinner`.

---

## 1. Estructura del documento

| Bloque | Contenido |
|--------|-----------|
| Cabecera | Paciente, fecha, objetivo (rendimiento), puntos de trabajo, particularidades (pivote, pubalgia), calendario de actividad física |
| Rutinas fijas | Ayuno 12h, reglas desayuno/digestión, pre-entrenos rápidos (<1h), fruta entre horas |
| **DES-AYUNOS** | Matriz **DESCANSO vs DÍA DE ENTRENAMIENTO** (no L–D): nutrición + hidratación + suplementación |
| **SNACK media tarde** | Misma matriz descanso/entreno; ramas por horario (15–16h pos-entreno vs 20h pre-entreno); “DÍA DE PARTIDO → abajo” |
| Marco pedagógico | “Plato del deportista”, semáforo ROJO/AMARILLO/VERDE (descanso / entreno moderado / partido intenso) |
| Complementos | Bebidas, postre, variantes D/D-1/D+1 |
| **D-1 / PARTIDO / D+1** | Tabla 5 columnas: Desayuno, Almuerzo, Cena, Snack, Hidratación — **muy fragmentada** en markdown |
| **IDEA MENÚ SEMANAL** | Rotación L–D: filas tipo **ALMUERZO** y **CENA** con cabecera de “proteína del día” (CARNE, PESCADO, LEGUMBRES…); **sin desayuno en la rejilla**; nota de mover D-1/D+1 según calendario |
| Cantidades | Por **tipo de día** (descanso / entreno / partido), gramos y % plato — **no kcal/macros P/C/F** |
| Checklist diario | Hábitos cualitativos |
| Suplementación | Tabla temporal (antes desayuno… antes dormir) + bloques entreno/partido |

**Horizonte temporal:** una semana tipo de recetas + protocolos de partido desacoplados del calendario (Amanda los “mueve” manualmente). No es quincena numérica; es plantilla semanal + overlays MD.

---

## 2. ¿Mapeo a casillas del panel?

| Slot app | ¿Encaja? | Dónde está en el PDF |
|----------|----------|----------------------|
| `breakfast` | Parcial | Plantillas descanso/entreno (global), D-1/D/D+1, no celda L–D del menú semanal |
| `morning_snack` | Parcial | “Entre horas” + pre-entrenos rápidos (condicionales, no grid) |
| `lunch` | **Sí** | Fila ALMUERZO del menú semanal (+ semáforo/cantidades al editar) |
| `afternoon_snack` | Parcial | Bloque SNACK media tarde (lógica entreno tarde, no 7 días fijos) |
| `dinner` | **Sí** | Fila CENA del menú semanal |

**Fuera del grid pero relevantes en app:** `diet_notes` (objetivo, pubalgia, horarios entreno), suplementos (columna derecha ya prevista), notas partido (D-1/D/D+1 como plantillas o días etiquetados en calendario MD).

**Conclusión:** import automático “celda = día × slot” solo es directo para **comida y cena**. Desayuno y snacks requieren reglas (tipo de día / MD) o entrada manual de Amanda en el panel.

---

## 3. PDF vs Word para importar

| Criterio | Word (`EJEMPLO DE MENU.md`) | PDF Pablo (misma línea Amanda) |
|----------|----------------------------|--------------------------------|
| Tabla semanal | 2 filas × 7 cols legibles; semanas 1–4 repetibles | Texto extraíble pero **tabla rota**: celdas partidas, filas `| --- |`, rótulos corruptos (`OZREUMLA`, `ANEC`) |
| Filas comida | ALMUERZO / CENA explícitas | Misma intención, parsing frágil |
| Bloques extra | Solo menú (en el ejemplo) | Todo el dossier mezclado (suplementos, checklist, semáforo) |
| Imágenes | N/A en ejemplo | PDF puede ser vector+texto; aquí el problema es **layout multicolumna**, no escaneo |
| Macros | No en ninguno | No; cantidades cualitativas por semáforo |

**Más limpio para parsear:** **Word (.docx)** con tablas nativas (o export markdown/table CSV). El PDF sirve para **entregar al jugador**, no como fuente de import.

---

## 4. Recomendación para pedir a Amanda

1. **Para rellenar Óptimo / futuro import:** pedir **Word** (o plantilla fija) con tabla **Lunes–Domingo × filas Desayuno, Media mañana, Comida, Merienda, Cena** — aunque ella hoy solo ponga detalle en comida/cena, filas vacías ayudan al mapeo 1:1.
2. **PDF:** mantenerlo como documento clínico completo para el deportista; no como input de import.
3. **Partidos:** acordar si D-1/D/D+1 se cargan como **3 días especiales** en calendario o como **notas/plantillas** reutilizables.

**No da igual:** Word >> PDF para automatizar; PDF obliga a heurísticas o copia manual en comida/cena y reglas aparte para desayuno/snacks.

---

*Análisis 2026-11-05 — sin implementación de código.*
