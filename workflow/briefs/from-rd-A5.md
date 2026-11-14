# from-rd-A5-fix · Corrección del NO PASA (audit-A5)

- **Hecho:** sí
- **Qué cambió (rutas):**
  - `app/styles/nutri-shared.css`: solo se añadió un bloque `@media (min-width: 1280px)` al final, antes de las preferencias. Va acotado a `.nut-desktop-athlete > .nut-ws-mobile-menu`.
    - **Bloqueante 1:** a ≥1280, Amanda vuelve a tener «Suplementos y dieta» en `/nutricion/<id>`. `nutri.css` ocultaba toda la pila móvil, editor incluido. Ahora la rejilla del workspace tiene una segunda fila (`"list main" / "edit main"`) y el editor queda al pie de la barra lateral: fondo `--surface-sidebar`, alto máximo 50dvh con scroll propio. El menú apilado (`.nut-day-stack`) sigue oculto, porque en escritorio el menú ya lo muestra la semana.
    - Los rellenos son compactos para la columna de 300 px, así «Suplementación» no se parte. No se tocó TSX ni ningún archivo de otro dueño.
  - El origen no es A5: el editor ya estaba solo dentro de `.nut-ws-mobile-menu` y oculto a escritorio desde antes del rediseño (`b52191e`).
- **Comprobado** (Chromium propio, script `.tmp-verify/rd-A5/fix.mjs`, capturas `fix-amanda{1280,1440,390}[-supp].png`):
  - 1280×800: `.nut-edit` se ve (12,568 · 275×220). Los resúmenes miden 46 px, «Añadir suplemento» 44 y «Guardar nutrición» 249×44. El foco con teclado se ve (outline sólido). `scrollWidth` = 1280. La semana y el resumen no cambian.
  - 1440×900: igual, con `scrollWidth` = 1440.
  - 390: igual que antes (editor bajo el menú del día) y `scrollWidth` = 390.
  - `npx tsc --noEmit`: exit 0.
  - No creé datos de prueba (solo abrí y cerré plegables, sin guardar).
- **Duda:**
  1. El aviso de React por `key` en `HeaderMarkup` (lo pasa `NutricionAthletePage`) sigue en consola. Viene de antes, no lo causa A5 y el audit lo marca como no bloqueante. En dev, el globo «1 Issue» tapa a medias «Guardar nutrición» abajo a la izquierda, pero en producción no sale.
  2. A 1280×800, la lista de deportistas de la sidebar se queda con poco alto visible (hace scroll dentro de la sidebar).
  3. `browse.lock` es de `rd-C2`: no lo toqué y usé un Chromium aislado.
- **Recomendación:**
  1. El dueño de `nutricion/[athleteId]/page.tsx` (C1) debe arreglar la `key`.
  2. Si en la sidebar se quiere más sitio para la lista, C1 puede mover el editor a un sheet «Nutrición» junto a «Perfil». No bloquea.
  - El commit lo hace el master, como pide el brief: `git add app/styles/nutri-shared.css "app/a/[id]/nutrition-pane.tsx"`.
- **Bloquea a Adrián:** no
