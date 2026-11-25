# from-sonnet-amanda-ux-premium

- Hecho: no
- Qué cambió (rutas): nada. No se tocó código ni CSS.
- Duda: el brief pide lanzar Opus (`despachar -Worker opus -Yolo -Think`, slug `amanda-ux-premium`) para auditar y mejorar la UX de toda la página de Amanda. Mis reglas de worker me prohíben despachar hijos, y el brief también me prohíbe pintar CSS. Así que no puedo cerrarlo desde aquí.
- Recomendación: que el orquestador (no un worker) lance `despachar -Worker opus -Yolo -Think` con slug `amanda-ux-premium`. Contenido del brief para Opus:
  - Leer `herramientas.md` (pack `apple-design`), `ui.md` y lo que cite el mapa (HIG, design-system).
  - Archivos SÍ: la página de nutrición de Amanda y los estilos `nut-*` de globals.css. No tocar otras apps.
  - Piezas a auditar: calendario rail, deportistas + buscador, barra (gear/logout), menú Día/Semana/Mes, grid de comidas, panel de anillos macros/micros, import Word.
  - Criterio: una página coherente y premium, con los tokens y el estilo de esta app (no una marca distinta). Referencia Apple HIG: densidad, tipografía, radios, blur, jerarquía, controles. tsc limpio.
  - Prohibido composer/grok.
- Bloquea a Adrián: no
