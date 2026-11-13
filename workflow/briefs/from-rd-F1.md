# from-rd-F1

- **Hecho:** sí
- **Qué cambió:**
  - `workflow/context/apple-DESIGN.md` (nuevo): el DESIGN.md de Apple del catálogo getdesign.md, en bruto desde `VoltAgent/awesome-design-md/main/design-md/apple/DESIGN.md`. Sin clonar nada ni dejar catálogo. La skill apple-design (Emil Kowalski) solo se leyó, desde el scratchpad.
  - `workflow/context/design-system.md` (reescrito a v2). Contiene: las 8 decisiones fijadas (acento azul solo interactivo, SF + Inter con next/font, tab bar del jugador, admin con toolbar + large title, Amanda con sidebar, categorías de proteína, oscuro diferido con tokens por rol, logo); la tabla Apple → Óptimo con 21 filas; el bloque `:root` copiable con 107 tokens (superficies, label, fills, separadores, acento, semántica, estados de anillo, escala tipográfica de Large Title a Caption 2, radios, materiales thin/regular/thick, elevación, espaciado 4/8, movimiento y springs, táctil, foco, barras); alias de transición desde v1; la gramática de componentes para F3; categorías; tacto; layout por dispositivo; accesibilidad; y la lista de prohibidos.
- **Verificación:** el bloque CSS se parseó sin declaraciones rotas ni duplicadas. La única `var()` sin definir es `--font-inter`, que es la que inyecta next/font. Los contrastes están calculados (por ejemplo `--label-secondary` 5.1:1, `--accent-text` 5.6:1, `--danger`/`--ok`/`--warn` ≥5:1 en blanco). `npx tsc --noEmit` sale limpio. No hice capturas porque la tarea no toca ninguna ruta, así que tampoco tomé el `browse.lock`. No hice commit (lo hace el master).
- **Duda:**
  1. Inter con `next/font` exige tocar `app/layout.tsx`, y ese archivo no está en la lista SÍ de F3.
  2. Decisiones de diseño que tomé yo y que cambian el aspecto actual: «Pasado» del objetivo pasa de rojo a `--warn` (naranja accesible) y el rojo queda solo para «Sobre tope»; las tarjetas pasan a ser planas, sin sombra; `--secondary` sube de #86868B a #6E6E73 para cumplir AA.
- **Recomendación:**
  1. El master añade `app/layout.tsx` a la lista SÍ de F3, que es quien cablea la fuente.
  2. Si Adrián prefiere el rojo en «Pasado», se cambia una sola línea (`--ring-over: var(--danger)`).
  3. F3 debe revisar los 7 usos de `var(--accent)` (en v1 era negro), como indica la sección de alias.
- **Bloquea a Adrián:** no
