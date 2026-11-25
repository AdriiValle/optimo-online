# from-rd-C2-fix: corrección del NO PASA de la auditoría C2

- Hecho: sí

## Qué cambió (rutas)

- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`
  - **Bloqueante 1.** El botón «Perfil» del toolbar ahora es `ProfileSheetButton`. Abre el mismo `NutModal` (`.sheet*`) que el resto de modales: scrim, X, Escape, foco atrapado y vuelta del foco al botón. Ya no importa `AthleteProfileButton`.
  - **Bloqueante 2.** `MealSlotForm` recibe una prop nueva, `onOpenFicha`. En el «Menú del día» (<1280), cada franja con plato muestra el botón «Ficha del plato · macros e ingredientes». Abre la ficha en sheet (`openCell`) con foto, macros, ingredientes editables y «platos iguales».
- `app/styles/nutri.css`: añadí `.meal-slot-ficha` (`min-height` de 44 px y texto que puede ocupar dos líneas).
- También reescribí `workflow/briefs/from-rd-C2.md`, con una sección «Corrección».

## Verificación

- `npx tsc --noEmit` sale limpio.
- Navegador en 127.0.0.1:3001 como `amanda`. Usé el lock `rd-C2` y lo borré al terminar.
- **«Perfil», a 1440 y 1280:** al abrir, el foco va a «Cerrar». Escape lo cierra (0 diálogos) y el foco vuelve a «Perfil».
- **Ficha, a 390, 768 y 1100:**
  - Hay 2 botones de ficha visibles. Miden 44 px, y 58 px a 390 porque el texto ocupa dos líneas.
  - El sheet abre con kcal, donut y 6 selects de ingredientes.
  - `scrollWidth` es igual al ancho de la ventana.
  - Escape cierra el sheet y el foco vuelve al botón.
- Capturas en `.tmp-verify/rd-C2/fix-*.png`.
- Consola: nada nuevo. Siguen el warning de key en `HeaderMarkup` (ya existía) y un CORS del propio script de logout.
- No creé datos de prueba.
- Sin commit: este brief manda que lo haga el master.

Duda: `AthleteProfileButton`, en `athlete-profile-form.tsx` (de C4), quedó sin uso. No lo borré porque ese archivo no está en la lista de archivos del brief.
Recomendación: que C4 o el master borren ese export en su próximo commit. Son unas 30 líneas y no afecta a nada.
Bloquea a Adrián: no
