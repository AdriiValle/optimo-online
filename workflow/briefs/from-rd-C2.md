# from-rd-C2: ficha del plato, sheets, foto y platos iguales

Hecho: si

## Que cambio (rutas)

- `app/nutricion/[athleteId]/meal-drawer.tsx`
  - **Ficha estilo Salud.** Fondo agrupado con tarjetas blancas.
    - Héroe 16:10. Encima lleva las acciones de foto («Elegir/Cambiar foto», «Quitar foto»), en cápsulas de material de 44 px. Mientras sube, el héroe muestra un spinner.
    - «Platos iguales» es ahora un `toggle-row` con switch y una nota al pie.
    - Debajo va el titular: categoría con un punto, plato en Title 2 y el resto del texto en subhead.
    - Tarjeta «Macros de esta comida»: badge de estado (ok/warn/none), kcal en Title 1 y donut.
  - La cabecera del drawer usa `.sheet-header`, `.sheet-title` e `.icon-btn.sheet-close`.
  - Exporta `CloseGlyph`.
  - El markup de `MacroDonut` no cambia, porque C3 lo usa. Su estilo en la ficha va acotado bajo `.nut-ficha`.
- `app/nutricion/[athleteId]/meal-items-editor.tsx` (solo JSX; la lógica no cambia)
  - La tarjeta «Ingredientes» lleva contador y una línea de estado (verde o naranja).
  - Lista con separadores. En cada fila:
    - Alimento y gramos, con sufijo «g».
    - Rol, el badge «Falta…» y el switch «Confirmado» en una etiqueta de 44 px.
    - Selects e inputs llevan `aria-label` con el nombre del ingrediente.
  - Mientras carga se ven skeletons.
  - Los ingredientes obsoletos aparecen en `alert--warn`.
  - Acciones:
    - «Confirmar ingredientes» es el único botón relleno.
    - «Guardar sin confirmar» va en plain.
    - «Generar borradores» va en tinted.
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`
  - **`NutModal`** usa ahora `.sheet-scrim` + `.sheet.sheet--opaque` (grabber, header, `sheet-body`), en un portal con z 1100 para quedar por encima de la cabecera del shell.
    - Tiene `role=dialog`, `aria-modal` y `aria-labelledby`. Al abrir, el foco va a la X; al cerrar, vuelve al botón que lo abrió. El Tab queda atrapado dentro.
    - Se cierra con la X, con Escape o con un clic en el scrim, y tiene animación de salida (con un timer de respaldo).
    - Nueva prop `ficha`: fondo agrupado para la ficha del plato.
    - Escape: el sheet lo captura en `document` y corta la propagación. El listener de `window` queda solo para el drawer en ancho ≥1280. Así, si se abre un sheet encima del drawer, Escape cierra solo el sheet.
  - **`MealSlotForm`**
    - Selector de foto propio: input oculto, botón tinted «Elegir/Cambiar foto» y nombre del archivo.
    - «Guardar plato» en relleno, «Quitar plato» en plain rojo, y el mensaje con `role=status`.
    - En el «Menú del día» (<1280), el summary muestra el titular del plato en una segunda línea con elipsis.
  - No toqué la toolbar ni las vistas (C1), ni Ring, WeekPanel o micros (C3).
- `app/styles/nutri.css`
  - Reescribí los bloques de la ficha, los ingredientes y el drawer:
    - Solo tokens v2. Quité los hex locales de macros: ya están en tokens.
    - Drawer en ≥1280: `--bg`, `radius-lg`, `elev-3`, `ease-out`.
  - Mantengo `.nut-modal*`, porque C4 (`athlete-profile-form`, `menu-word-import`) todavía lo usa.
  - Quité `.nut-drawer-root`, que ya no se usaba.
  - Al final del archivo añadí las reglas de preferencias de la ficha (reduced-motion, reduced-transparency, contrast).

## Verificación

- `npx tsc --noEmit`: limpio.
- Navegador en 127.0.0.1:3001 como `amanda`, con lock `rd-C2` (tomado y borrado). Capturas en `.tmp-verify/rd-C2/`.
- **1440 y 1280.**
  - El drawer abre la ficha con foto, macros e ingredientes.
  - «Guardar sin confirmar» devuelve «Sin cambios.».
  - Escape lo cierra.
  - `scrollWidth` es igual al ancho de la ventana.
- **Foto.** Subí un PNG de prueba: el héroe muestra la foto y los botones «Quitar foto» y «Cambiar foto». Después la quité y el plato volvió a quedar sin foto. No queda ningún dato de prueba.
- **Platos iguales.** El toggle aparece en un plato repetido (viernes 13).
- **390.**
  - La ficha pasa a sheet y el foco va a «Cerrar».
  - `scrollWidth` = 390.
  - Escape cierra y devuelve `html` a `overflow:visible`.
- **768.** El sheet «Tu cuenta» sale centrado con el scrim por encima de la cabecera. La X lo cierra.
- **Tamaños táctiles.** Todo control primario mide ≥44 px. Los switches miden 31 px, pero están dentro de una etiqueta de 44 px.
- **Foco.** Visible con `focus-ring`.
- **Consola.** Nada nuevo. Siguen el warning de key en `HeaderMarkup` (ya existía) y un CORS del propio script de logout de verificación.

## Corrección (NO PASA de from-audit-C2.md)

Arreglé los dos bloqueantes. No toqué nada más.

1. **«Perfil» no se cerraba con Escape.**
   - El botón «Perfil» del toolbar ahora es `ProfileSheetButton`, en `nutricion-athlete-client.tsx`. Abre el mismo `NutModal` (`.sheet*`) que el resto de modales: scrim, X, Escape, foco atrapado y vuelta del foco al botón.
   - Ya no se usa `AthleteProfileButton` de `athlete-profile-form.tsx`.
   - Comprobado a 1440 y 1280: al abrir, el foco va a «Cerrar»; Escape cierra y el foco vuelve a «Perfil».
2. **La ficha no se podía abrir por debajo de 1280.**
   - En el «Menú del día», cada franja con plato muestra un botón tinted de ancho completo: «Ficha del plato · macros e ingredientes». Mide 44 px o más (58 px a 390, porque el texto ocupa dos líneas). Abre la ficha en sheet con `openCell`.
   - La ficha incluye foto, macros, ingredientes editables y «platos iguales».
   - Escape cierra la ficha y el foco vuelve al botón.
   - Archivos: `nutricion-athlete-client.tsx` (nueva prop `onOpenFicha` en `MealSlotForm`) y `nutri.css` (`.meal-slot-ficha`).
   - Comprobado a 390, 768 y 1100: dos botones visibles (comida y cena del sábado 14). El sheet abre con kcal, donut y 6 selects de ingredientes. `scrollWidth` es igual al ancho de la ventana, y al cerrar `html` vuelve a `overflow:visible`.
   - Capturas: `.tmp-verify/rd-C2/fix-*.png`.
3. `npx tsc --noEmit` sale limpio. En la consola no hay nada nuevo: sigue el warning de key en `HeaderMarkup` (ya existía) y el CORS del script de logout.
4. Usé el lock `rd-C2` y lo borré al terminar. No creé datos de prueba.

## Notas

- En el árbol hay cambios sin commitear en `app/a/[id]/nutrition-pane.tsx` y `app/styles/nutri-shared.css` que no son de C2: no los toqué.
- `AthleteProfileButton` (en `athlete-profile-form.tsx`, de C4) quedó sin uso. No lo borré porque ese archivo no está en la lista del brief. Lo puede quitar C4 o el master.
- El «Menú del día» (<1280) sigue mostrando un «Guardar plato» relleno en cada franja. Es la estructura previa de una tarjeta por franja y no la cambié.

Duda:
Recomendacion:
Bloquea a Adrian: no
