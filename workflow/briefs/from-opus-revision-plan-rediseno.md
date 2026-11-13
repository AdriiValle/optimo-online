# from-opus · revisión del plan de rediseño

- **Hecho:** sí
- **Qué cambió (rutas):**
  - `workflow/briefs/plan-rediseno-apple.md` reescrito (v2, mismas secciones + «Hechos del código» y «Mapa de hojas y dueños»).
  - `workflow/briefs/plantillas-rediseno.md` nuevo: brief de ejecutor, brief de auditor, tabla de viewports/rutas, recorrido de funciones y el corte exacto de F2.
  - Código: nada.

## Correcciones al plan
1. **Colisiones reales que el v1 no veía:** `/a/[id]` es la misma pantalla para jugador y admin (`home-client` con `isAdmin`), así que B2 «vista admin» pisaba la pista A. Además `brand-header.tsx`/`shell.css` estaban en S2 y S3 a la vez (paralelo). `plan-calendar`, `nutrition-pane` y `password/username-form` se comparten entre superficies. Se resuelve con **un dueño por archivo y por hoja** y overrides acotados en la hoja propia.
2. **Oleada 1:** S3 desaparece. S2 = cabecera en todas sus variantes; el shell de escritorio pasa a B1 (admin) y C1 (Amanda), que ya son dueños de esos archivos. La tab bar del jugador va en A1 (vive en `home-client`).
3. **Pista A:** A4 Análisis era solo de admin → pasa a B2. A3 incluye el formulario del diario (está en `home-client`, de ahí que A1 → A3 vayan en serie). Perfil editable para admin sale de B2 como **B4 funcional**, que depende de A1+A3 (mismo archivo) y usa la API existente (ya admite admin).
4. **Pista C:** las 4 tareas van en serie (todo pasa por `nutricion-athlete-client.tsx`, de 1124 líneas, y `nutri.css`). He repartido qué funciones del archivo toca cada una.
5. **Oleada 3:** T1/T2/T3 por tema tocaban todas las hojas a la vez. Ahora se reparte **por superficie** (común / jugador / admin+Amanda), y el modo oscuro va aparte, en serie y después del OK visual.
6. **F1 ‖ F2 en paralelo** (docs frente a CSS, sin archivos comunes). F3 añade `/dev/ui` con `notFound()` en producción.
7. **F2 es viable sin cambio visual:** el corte va por rangos de líneas a 10 hojas en `app/styles/`, importadas con `@import` desde `globals.css`. Lo he comprobado con un script: cubre todas las líneas no vacías, sin duplicados y con llaves equilibradas en cada rango. Para dar por buena la igualdad hay dos pruebas: el `sort` de líneas antes y después debe ser igual, y cada par de capturas debe tener el mismo `sha256`. Dejo listados los bloques que cambian de posición, porque son el primer sospechoso si algo difiere.
8. **Pantallas y estados que faltaban:** `not-found` → S1. Los estados vacíos quedan asignados: sin deportistas (B1), sin asignados (C1), día sin sesión (A1), sin dispositivo (A3), `an-empty` (B2) e import con error (C4). `app/page.tsx` solo redirige: entra en el recorrido de funciones, no en ninguna tarea.

## Reglas: 2 aclaraciones por fallo claro (no cambio de reglas)
- **Commit:** con varios ejecutores en el mismo árbol, un `git add -A` mezclaría tareas. Lo hace el master, tras el PASA y por rutas.
- **Navegador:** gstack `browse` es una sola instancia con una sola sesión de login. Por eso las auditorías van en serie y las capturas del ejecutor usan `.tmp-verify/browse.lock`.
- Lo demás se mantiene igual: mismo directorio, sin worktrees, auditor ligero, máximo 2 vueltas.

## Decisiones que Adrián debe conocer
1. **Acento de marca:** hoy es negro (`#1D1D1F`). Apple usa azul de sistema para lo interactivo. F1 propone una de las dos; cambiarlo luego es un solo token.
2. **Tipografía:** la licencia de SF Pro no permite servirla como webfont. En Mac/iPhone se verá SF; en Windows/Android saldrá la fuente del sistema (Segoe/Roboto), salvo que F1 añada un respaldo (p. ej. Inter con `next/font`). Tu PC Windows no verá «SF» tal cual.
3. **Tab bar del jugador:** las pestañas actuales (Entreno/Nutrición/Diario) pasan a tab bar inferior o segmentado, según fije F1. Es un cambio de navegación visible.
4. **Admin sin barra lateral:** solo tiene 2 secciones, así que lleva toolbar + título grande. Amanda conserva su columna de deportistas, que hace de barra lateral.
5. **Se conserva la paleta de categorías de proteína** (carne/pescado/huevos/legumbres): es función, no estilo.
6. **Modo oscuro:** propuesto como tarea aparte después de tu OK visual. Los tokens nacen preparados para que no cueste rehacer.
7. **Única pieza funcional:** B4, perfil editable por el admin. El resto es solo visual.
8. **App «a medias» en localhost:** F3 cambia el aspecto de toda la app de golpe y cada pantalla se termina en su tarea. `dev` y `main` no se tocan hasta tu OK.
9. **CSS muerto:** `.recovery-strip` no se usa en ningún sitio. No se borra en F2 (que debe quedar idéntico); lo quita A1.

- **Duda:** ninguna.
- **Recomendación:** —
- **Bloquea a Adrián:** no. Los puntos 1–3 y 6 los resuelve F1 con una propuesta; Adrián los ve en la versión final.
