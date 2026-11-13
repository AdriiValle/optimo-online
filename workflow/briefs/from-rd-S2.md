# from-rd-S2: cabecera y navegación superior

- **Hecho:** sí (sin commit, como pedía el brief; el commit lo hace el master)

## Qué cambió (rutas)

- `app/components/brand-header.tsx`
  - Dos variantes. **navbar**: jugador, y todo por debajo de 720. Mide 44 px, título centrado y usa borde de scroll: es transparente sobre el lienzo arriba del todo y pasa a material regular con filete cuando hay contenido debajo. **toolbar**: admin (`/panel*`, detectado por la ruta) y Amanda (`wide`). A partir de 720 mide 52 px, lleva el título a la izquierda y el material fijo.
  - El HTML del servidor ya trae la barra en línea, así que no hay salto al cargar. Al hidratar, la barra pasa a `#app-bar`, que es el primer hijo de `body`; así el orden de tabulación coincide con el visual (la barra va primero).
  - En la navegación de cliente se porta en un layout effect. Así el router de Next sigue subiendo el scroll al navegar, sin el aviso «Skipping auto-scroll».
- `app/components/header-actions.tsx`: Ajustes pasa a ser un icono de engranaje de 44×44 (`aria-label`) en color de acento.
- `app/components/header-back-button.tsx`: botón atrás al estilo iOS (chevron y «Atrás»).
- `app/logout-button.tsx`: «Salir» pasa a botón de barra (`.header-btn`).
- `app/styles/shell.css`: hoja reescrita.
  - Material en `::before`: el cambio por scroll solo anima la opacidad, con `--dur-fast`.
  - Botones de barra plain en acento, de 44 px mínimo. El hover solo aplica con `hover:hover`. El press es `--press-scale` más un atenuado. Tienen foco visible.
  - Título con elipsis. En móvil muestra el deportista o la sección; el logo ya identifica Óptimo.
  - `.icon-btn` de Amanda dentro de la barra, ajustado con selector acotado.
  - Reglas de reduced-motion, reduced-transparency y contrast al final de la hoja.
  - `--header-block` se redefine aquí: 44, o 52 en las páginas con toolbar a partir de 720.

## Verificado (capturas en `.tmp-verify/rd-S2/`)

- Jugador `/a/<id>` y `/ajustes`; admin `/panel`, `/panel/ajustes` y `/a/<id>`; Amanda `/nutricion` y `/nutricion/<id>`. Anchos 390, 720, 1280 y 1440.
- `scrollWidth` es igual al ancho en todos los casos (390 a 390).
- El contenido empieza 12 px bajo la barra: no se solapan.
- Todas las acciones miden ≥44×44.
- El tabulador llega primero a «Atrás» y después a Ajustes, con outline visible.
- Atrás, Ajustes y Salir funcionan en los tres roles (Salir lleva a `/login`).
- El scroll alterna `data-scrolled` y el material.
- Navegar por cliente deja `scrollY` a 0 y una sola barra.
- `npx tsc --noEmit` sale limpio.
- Consola sin errores nuevos.
- No he creado datos de prueba.

## Duda

1. `tokens.css` sigue con `--header-block: 58px`, que `shell.css` sobrescribe. `a11y.css` mantiene reglas `.doc-header-viewport` que ya cubre `shell.css`: no estorban, pero sobran. Además, `nutri.css` tiene `.top-actions.nut-top-actions .btn`, que ya no se aplica porque Salir no es `.btn`.
2. La toolbar de admin tiene un interior máximo de 1080, como dice el sistema. El contenido de `/panel` sigue a 640 hasta la pista A, así que a 1440 el logo no se alinea con la columna.
3. Hay un error de consola que ya existía (comprobado con la versión anterior del componente): «Each child in a list should have a unique key… passed a child from NutricionAthletePage», en `/nutricion/<id>`. Viene de cómo `page.tsx` o el cliente de Amanda pasan `headerLeading`/`headerLogout`.

## Recomendación

- Que F3 o T-común pongan `--header-block: var(--navbar-h)` en `tokens.css` y borren de `a11y.css` los bloques `.doc-header-viewport`. Que C1 borre la regla muerta de `nutri.css` y revise la key de la página de Amanda.
- Que la pista A ensanche `/panel` a 1080 para que la columna se alinee con la toolbar.

## Bloquea a Adrián

No.
