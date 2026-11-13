- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. /nutricion/<id> (Amanda, ambos viewports): la consola de desarrollo da `Each child in a list should have a unique "key" prop` en `HeaderMarkup` (hijo pasado desde NutricionAthletePage, `trailing`/`headerLogout`); sale el aviso "1 Issue" de Next. Solo dev, sin efecto visible. Captura: .tmp-verify/audit-S2/amaR_1440x900_nutricion_9d27d850-d328-4633-bc33-56198a0e4181.png
  2. /panel 1440x900 (admin): el toolbar ocupa 1080 px (logo a x=180, acciones hasta x=1260) pero la columna de contenido mide ~576 px (x=432-1008), así que logo y acciones quedan lejos del borde del contenido. Captura: .tmp-verify/audit-S2/adm_1440x900_panel.png
  3. El navegador headless emula `prefers-reduced-transparency: reduce`, por lo que solo se vio la barra opaca (fallback correcto: fondo blanco, sin blur). El material translúcido no se pudo ver renderizado; el CSS (`--material-regular` + `--blur-regular` en `shell.css`/`tokens.css`) es correcto al leerlo.

Comprobado: `npx tsc --noEmit` limpio (exit 0). scrollWidth = 390 (y 1440) en /a/<id>, /ajustes, /panel, /panel/ajustes, /nutricion, /nutricion/<id>. Atrás, Ajustes y Salir funcionan en jugador, admin y Amanda (Salir lleva a /login; en Amanda Ajustes abre el diálogo). Acciones de la barra de 44x44 mínimo; foco visible con anillo azul de 2 px en Atrás/Ajustes/Salir. Al hacer scroll la barra pasa a `data-scrolled=true` y no tapa el contenido; las hojas incluyen reduced-motion, reduced-transparency y contrast. Sin salto de layout en la cabecera (los desplazamientos medidos son del contenido de la ficha de Amanda al cargar el menú, no de la barra).

- Hecho: si
- Que cambio (rutas): solo este informe y capturas en .tmp-verify/audit-S2/ (scratch sin versionar). `browse.lock` creado y borrado.
- Duda:
- Recomendacion:
- Bloquea a Adrian: no
