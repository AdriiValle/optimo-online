Hecho: si

Que cambio (rutas)
- `app/styles/player.css`
  - Tab bar del jugador: press con tokens (`--press-scale`, `--dur-press`) en icono y texto; icono activo con animacion corta `tab-select`; icono 24px; color activo `--accent`.
  - Cambio de pestana (`.dash-panes`): entrada suave `pane-in` (opacidad + 6px, `--dur`/`--ease-out`).
  - Segmentado de admin en `/a/[id]` (`.dash-seg`): zona de toque ampliada a 44 (`::after`), foco visible.
  - Escritorio >=720: la cabecera (shell.css, de otro duenyo) se alinea con la columna de contenido de 640 mediante selector acotado (antes "Salir" y el engranaje quedaban 32px fuera). Medido a 1280: cabecera 352..928 = contenido.
  - Al final de la hoja: reglas reduced-motion de lo anadido (tab-select, spans del tab bar, nut-ingr-*).
- `app/styles/nutri-shared.css`
  - Dia seleccionado en Semana: fondo `--accent` / `--on-accent` (antes gris), coherente con el calendario del jugador.
  - `.nut-ingr-change` usa `--accent-text` (contraste) y press con tokens; `.nut-ingr-option` igual.
- `app/a/[id]/home-client.tsx`
  - El segmentado de admin pasa `--seg-count`/`--seg-index` inline para activar el pulgar deslizante del sistema (`import type CSSProperties`).

Verificado (localhost:3001, ricardovisus y adriivalle)
- 390: `scrollWidth` = 390 en Entreno, Nutricion (Hoy/Semana/Compra), Diario, Ajustes y admin `/a/[id]`.
- 1280: columna de 640 centrada, cabecera alineada.
- Tactiles: tab bar y botones primarios >=44. Los segmentados (Hoy/Semana/Compra, tipo de compra) miden 32 visibles pero tienen zona de toque de 44 por `::after` (patron del sistema). Los inputs de Diario/Ajustes miden 36 dentro de filas de >=44 que enfocan el campo al tocar.
- Foco visible con teclado en tab bar y segmentados.
- `npx tsc --noEmit` limpio. Sin errores de consola nuevos (los que salen son de `NutricionAthletePage` y de una prueba previa en 127.0.0.1, no son de estas rutas).
- Capturas en `.tmp-verify/rd-TJ/`. No cree datos de prueba. Lock liberado.

No hecho / fuera de mi alcance
- La transicion de las hojas (`.sheet*` en components.css y `NutSheet`) es de otro duenyo: no la toque.
- Sin commit, sin cambio de rama (lo hace el master).

Duda:

Recomendacion:

Bloquea a Adrian: no
