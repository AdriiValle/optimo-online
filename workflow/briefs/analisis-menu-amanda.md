# Análisis — EJEMPLO DE MENU.docx (Amanda)

Fuente convertida: `workflow/inbox/EJEMPLO DE MENU.md`

## Estructura

| Bloque | Columnas | Filas por comida | Fechas |
|--------|----------|------------------|--------|
| **1** | LUNES…DOMINGO | Categoría (CARNE/PESCADO…) + platos | **No** |
| **2** | Igual | **Copia exacta** del bloque 1 | No |
| **3** | Igual | Plantilla «Ensalada/Verdura · Proteína · Hidrato» | No |
| **4** | Igual | Igual que bloque 3 | No |

Interpretación probable: **4 semanas tipo** sin calendario; el nutricionista ancla la semana 1 manualmente.

## Comidas nombradas

Solo **ALMUERZO** y **CENA**. No aparecen desayuno, merienda, colación ni suplementos.

## Partido / entrenamiento

Ninguna nota en el documento.

## Medios

Solo texto en tablas Word. Sin carpeta `word/media` en el .docx → **sin fotos embebidas**.

## Parser vs modelo

| Capa | Reglas (docx→tabla) | Modelo |
|------|---------------------|--------|
| Día + lunch/dinner + texto celda | ✅ | — |
| Detectar bloques 3–4 como plantilla | ✅ heurística | — |
| Trocear plato en 3 componentes | Heurística frágil (`  `, « con ») | Opcional |
| Resolver «A o B», «Lubina/Merluza» | Parcial | Ayuda |

**Conclusión:** importar a **2 de 5 slots** (`lunch`, `dinner`); reglas bastan para este ejemplo; LLM solo si queréis desglose estructurado o menús libres.

## Ejemplo — Bloque 1, LUNES → slots Óptimo

| Slot | Contenido |
|------|-----------|
| breakfast | *(vacío — no en doc)* |
| morning_snack | *(vacío)* |
| lunch | `[CARNE]` Ensalada espinacas, remolacha, aguacate, nueces · Muslos pollo airfryer · Arroz |
| afternoon_snack | *(vacío)* |
| dinner | `[PESCADO]` Crema calabacín y puerro · Atún **o** Lubina plancha · Boniato micro |

## Riesgos

1. Solo 2 comidas → 3 casillas siempre vacías si no se pide otro formato.
2. Bloques 3–4 no son menú real (no importar como platos).
3. Bloques 1=2 duplicados.
4. Sin fechas: hay que elegir semana de inicio al publicar.
5. Dos filas por comida (etiqueta + detalle) — parser debe fusionar.
6. Opciones «o», «/», sábado «HUEVOS/PESCADO».
7. Celdas mezclan varios platos sin separador uniforme (espacios dobles en Word, no siempre).
