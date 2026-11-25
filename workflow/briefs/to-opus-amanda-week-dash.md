# to-opus-amanda-week-dash

Adrián pidió **opus** para esto. Sonnet ya tocó el mismo slice (parcial, no era el brief visual):

- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx` — WeekPanel + Ring SVG
- `app/globals.css` — semana más compacta + estilos panel

**Objetivo:** menú semanal **un poco más pequeño**. **Abajo**, panel dashboard con gráficos **circulares modernos** (anillos/donuts de producto, no barras, no anillos de “cobertura de días” como KPI principal).

**Datos que importan a un nutricionista (elige set corto, no 40 vitaminas):**
kcal semanales; P/HC/G (g y % kcal); proteína g/kg si hay peso; fibra; Na; Fe; Ca; vit D. Piensa tú (Pro) si falta algo imprescindible en vista semanal.

**Problema de datos:** MealSlot hoy es título/preparación texto; Sonnet dijo que no hay kcal/macros/micros. No inventes números. Si no se pueden calcular, deja el panel con los KPIs correctos en vacío/pendiente y di qué hay que añadir al modelo. Si SÍ hay cantidades en algún sitio del repo (plan, recetas, tablas), úsalas.

Criterio: semana compacta; panel inferior con anillos modernos de macros + micros; tsc limpio; no romper rail/calendario/deportistas. Cwd: este repo.

Responde ## Para Adrián (qué métricas elegiste y si faltan datos).
