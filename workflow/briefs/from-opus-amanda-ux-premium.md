# from-opus-amanda-ux-premium

- Hecho: sí
- Commit: `02dd3e6` en `dev` (style(nutricion): UX premium del workspace de Amanda (HIG)). main sin tocar.
- Pack usado: **apple-design** (SKILL.md público de emilkowalski/skills, solo leído, nada instalado) + `workflow/context/design-system.md` de esta app. `ui-ux-pro-max` no se usó (solo sirve para regenerar el design-system).

## Qué cambió (rutas)

- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`: toolbar nueva `.nut-toolbar` (título | segmentado | flechas + import, sustituye al `.cal-nav` compartido); número de día envuelto en `.nut-dnum` para la cápsula de "hoy"; clase `empty` en las celdas sin plato, con el `+` como `.nut-week-add`; clase `nut-top-actions` en la cabecera.
- `app/nutricion/[athleteId]/menu-word-import.tsx`: el import pasa de ser una card en línea a un sheet con portal y las mismas clases `nut-modal-*` que el editor de comidas (scrim, Escape, bloqueo de scroll). Elegir un PDF o un archivo que no sea .docx abre el sheet con el error y el botón "Elegir otro archivo". Antes el error no se veía porque el diálogo no llegaba a abrirse. El botón ahora dice "Importar menú Word".
- `app/nutricion/page.tsx`: clase `nut-top-actions` en la cabecera.
- `app/globals.css` (solo `nut-*`):
  - toolbar y segmentado HIG: pulgar `--surface` + `--shadow-sm`, radios concéntricos 10/8, press y foco;
  - grid: celda con plato en superficie con filete, hueco en gris sin borde, columna del día seleccionado marcada, objetivo táctil de 44px;
  - "hoy" se marca con el número en una cápsula oscura (`--text`), en lugar del subrayado;
  - filas de Mes con hover, press y foco;
  - rail: el calendario ya no lleva doble marco y el buscador tiene lupa y mide 36px;
  - cabecera: Salir es una cápsula de 36px, la misma altura que el engranaje;
  - estilos `.nut-import`.
  - He borrado los huérfanos que dejó este mismo diff (`.nut-import-dialog`, `.nut-week .cal-nav*`, `.nut-week-cell span.muted`).
- Fix: la vista **Mes** desbordaba en horizontal (scrollWidth 2020 a 1440px) porque la columna implícita de `.nut-ws-main` era `auto`. Ahora es `grid-template-columns: minmax(0, 1fr)`.

## Verificación

- `npx tsc --noEmit`: limpio.
- Navegador headless con la cuenta `amanda`, vistas Día, Semana y Mes: scrollWidth = viewport a 1440, 1280 y 375.
- Sheet de import probado con un PDF: muestra el error y se cierra con Escape.
- Capturas en `.tmp-verify/ux/` (sin trackear).

## Duda

Ninguna que bloquee.

## Para Adrián

**Qué cambió:** la página de Amanda se lee ahora como una sola app de Apple.
- Barra del menú como el Calendario: título a la izquierda, Día/Semana/Mes en el centro, flechas e import a la derecha.
- En la semana, las comidas con plato destacan y los huecos quedan en gris, con un "+" al pasar el ratón.
- "Hoy" se ve como un número en círculo oscuro.
- El calendario y el buscador del rail están más limpios.
- Engranaje y Salir tienen la misma altura.
- Importar el Word abre una hoja como la de editar comida, y si sube un PDF ve el aviso.
- La vista Mes ya no se sale de la pantalla.

**Qué dejé a propósito:**
- Los anillos de macros y micros siguen en "—" y "pendiente". Los platos no guardan gramos, así que no invento cifras.
- El calendario compartido (`PlanCalendar`) y sus `cal-*` no los he tocado. Los usa también la ficha del deportista, y su cabecera L/M/X en mayúsculas es de esa pieza.
- El flujo móvil (<1280) sigue igual: se ve bien a 375 y el trabajo de Amanda es en escritorio.
- Hay un aviso de React en la consola ("unique key" en `HeaderMarkup`) que viene de `brand-header`, fuera de este brief. No lo he tocado.

## Bloquea a Adrián

No.
