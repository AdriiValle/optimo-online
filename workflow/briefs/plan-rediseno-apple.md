# plan-rediseno-apple (macro plan, v2 revisado)
estado: hecho (2026-11-25)

Repo: `Optimo/Entrenamientos online/Ricardo Visus` (Next.js 15, rama `dev`). Slice difícil: rediseño gráfico de TODA la app. Revisado sobre el código de `5c76153` (ver `from-opus-revision-plan-rediseno.md`). Plantillas de brief: `plantillas-rediseno.md`.

## Intención (palabras de Adrián, 2026-11-13)
- El estilo «Óptimo» actual no le convence al 100 %. Quiere **partir de Apple de verdad** (HIG, materiales, tipografía SF, jerarquía, motion) y que la app parezca de Apple, muy premium. Todo lo que se adapte después sobre Apple pasa a ser «el sistema Óptimo»: primero Apple, luego las diferencias documentadas.
- Fuentes de estilo ya disponibles en la fábrica (`metodo/herramientas.md`): (1) catálogo **getdesign.md** → un `DESIGN.md` suelto de **Apple** (solo esa marca, por raw/`gh`, sin clonar el repo, sin dejarlo en la fábrica); (2) skill **apple-design** (Emil Kowalski, raw GitHub, solo leerla). No mezclar otras marcas.
- Alcance: login; app del jugador; panel de administrador; panel de nutrición de Amanda. Todo con la misma base.
- Dispositivo: **jugador = móvil primero**. **Administrador = ordenador primero**. **Amanda = ordenador** (workspace ≥1280), usable en tablet/móvil.
- Método: ejecutores + auditores. Una tarea = un ejecutor; al acabar pasa a un **auditor frío** que no ha visto el brief ni el diff; si falla, vuelve el mismo ejecutor; si pasa, sigue. A Adrián solo le llega la versión final.

## Hechos del código que condicionan el plan
- `/a/[id]` es **la misma pantalla para jugador y admin** (`home-client.tsx` con `isAdmin`: botón atrás, chip de integración, pestaña «Análisis» y diario solo-jugador). Quien toca `home-client` audita los dos roles.
- `home-client.tsx` contiene cabecera del deportista, pestañas (`dash-tabs`), calendario, cinta semanal, foco del día **y el formulario del diario**.
- Componentes compartidos entre superficies: `plan-calendar.tsx` (jugador + Amanda), `nutrition-pane.tsx` (jugador + ficha de Amanda), `password-form.tsx` / `username-form.tsx` (ajustes jugador, admin y cuenta de Amanda), `brand-header.tsx` (todas; variante `wide` para admin/Amanda), `.avatar`, `.settings-stack`, `.nut-details` / `.nut-supp-*` / `.nut-menu-*`.
- `nutricion-athlete-client.tsx` (1124 líneas) lleva vistas Día/Semana/Mes, anillos (`Ring`, `WeekPanel`), `NutModal` y formulario de comida → toda la pista C es secuencial.
- `app/page.tsx` solo redirige (sin UI). No hay `loading.tsx` ni `error.tsx`. `not-found.tsx` sí tiene UI.
- Arnés de capturas existente: `.tmp-verify/look/shots.sh` (gstack `browse`, login por formulario, mide `scrollWidth`).

## Reglas de ejecución (mandan sobre el plan)
1. **Mismo directorio, sin worktrees** (regla «localhost primero»): todos los workers con cwd = el repo principal, Adrián lo ve en `http://localhost:3001`. Rama local `feat/rediseno-apple` creada desde `dev` en ese mismo directorio; **commit local por tarea aprobada** como punto de restauración. Nada de push, `dev` ni `main` hasta el OK de Adrián a la versión final. *Aclaración v2:* con varios ejecutores en el mismo árbol, **el commit lo hace el master** tras el PASA, con `git add <lista SÍ de la tarea>`; nunca `git add -A`.
2. **Paralelo solo si no se pisan archivos.** Cada tarea declara su lista de archivos SÍ; dos tareas de la misma oleada no comparten ninguno. *Aclaración v2:* cada hoja CSS y cada componente compartido tiene **un dueño** (columna «dueño» abajo); quien no es dueño no lo edita: sobrescribe con selector acotado en su propia hoja (p. ej. `.nut-ws-main .cal-grid` en `nutri.css`).
3. **Ejecutor** = rol fuerte (Opus, `-Yolo -Think`), un brief por tarea (`workflow/briefs/rd-<id>.md`, plantilla en `plantillas-rediseno.md`) con objetivo, archivos SÍ/NO, referencia Apple a mirar y **Criterio de hecho** verificable.
4. **Auditor** = rol normal (Sonnet), proceso nuevo, sin contexto: recibe solo (a) el Criterio de hecho, (b) `design-system.md` v2 y el DESIGN.md de Apple, (c) rutas y viewports. Veredicto `PASA / NO PASA` + **máx. 5 bloqueantes**. Nada de píxel a píxel salvo F2. Salida: `workflow/briefs/audit-<id>.md`. *Aclaración v2:* el navegador `browse` es **uno solo y comparte sesión de login** → las auditorías van **en serie** (son cortas) y el ejecutor que haga capturas toma antes `.tmp-verify/browse.lock` (lo crea con su id, lo borra al acabar; si existe, sigue con otra cosa y reintenta).
5. **Bucle:** NO PASA → el mismo ejecutor corrige solo los bloqueantes → una segunda auditoría corta. Si sigue fallando, el master hace los retoques pequeños o deja una línea en `session.md`; nunca más de 2 vueltas.
6. `npx tsc --noEmit` limpio y sin errores nuevos de consola es condición del ejecutor, no del auditor.
7. No se tocan: esquema de BD, API, lógica de negocio, datos. Solo capa visual y estructura de presentación (JSX/CSS/componentes). Funciones existentes (importar menú, perfil, anillos, diario de salud, vídeos, integraciones) siguen funcionando. Única excepción funcional declarada: **B4**.

## Mapa de hojas (sale de F2) y dueños
| Hoja (`app/styles/`) | Contenido | Dueño en oleadas 1–2 |
|---|---|---|
| `tokens.css` | `:root`, `.nut-cat--*` | F1/F3 (luego nadie; cambios vía master) |
| `base.css` | reset, html/body, foco global, `.page`, `.brand-row`, `.muted`, `.sr-only` | F3 |
| `components.css` | `.card`, tipo h1–h3, campos, `.btn*`, `.icon-btn`, `.error/.ok`, `.stack`, `.section-head-*`, `.settings-*`, keyframes, `.avatar`, `.form-grid`, `.photo-block`, `.btn-ghost` | F3 |
| `shell.css` | `.doc-header*`, `.header-*`, `.top-actions`, `.logout-inline` | S2 |
| `admin.css` | `.create-*`, `.athlete-list/card`, `.nut-assign*`, `.an-*` (análisis) | B1 → B2 → B3 |
| `player.css` | `.recovery-*`, `.cal-*`, `.tape-*`, `.venue-icon`, `.day-focus*`, `.video-embed-*`, `.dash*`, `.device-*`, `.session-*` | A1 → A3 → A2 → A6 (A5 no lo toca) |
| `nutri-shared.css` | `.nut-details`, `.nut-supp-*`, `.nut-diet-*`, `.nut-actions`, `.nut-menu*`, `.meal-form` | A5 (dentro de pista A) |
| `nutri.css` | workspace Amanda `.nut-ws-*`, modal, ficha, ítems, anillos, `@media ≥1280` | C1 → C2 → C3 → C4 |
| `login.css` | `.login-*` | S1 |
| `a11y.css` | `prefers-reduced-transparency/contrast/motion` compartido | F3 y T-común. Las demás tareas ponen sus reglas de preferencia **al final de su propia hoja**, nunca aquí |

## Oleada 0 — Fundación
F1 ‖ F2 en paralelo (F1 solo escribe docs; F2 solo mueve CSS). F3 después de ambas.
- **F1 Referencia y sistema.** Traer el DESIGN.md de Apple (getdesign.md) y leer apple-design. Regenerar `workflow/context/design-system.md` v2 (con `ui-ux-pro-max`, solo para esto): «Apple como base» + tabla **Apple → Óptimo**. Tokens nuevos: escala tipográfica (Large Title…Caption), radios, materiales (thin/regular/thick), elevación, color semántico (incl. `--danger/--ok/--warn` y estados de anillo), espaciado 4/8, movimiento y springs, objetivos táctiles. Decisiones a fijar por escrito: acento de marca, tipografía fuera de Apple (SF no se puede servir como webfont), tab bar del jugador, shell de escritorio, si los tokens nacen preparados para oscuro. El sistema nuevo sustituye la regla «paleta intacta»; se conservan logo, acento elegido y la paleta de categoría de proteína (es función, no estilo). SÍ: `workflow/context/design-system.md`, `workflow/context/apple-DESIGN.md`.
- **F2 Partir el CSS sin cambiar nada visible.** Corte concreto en `plantillas-rediseno.md` §F2 (líneas de `5c76153`). `app/globals.css` queda solo con `@import "./styles/…";` en el orden de la tabla. Sin cambiar ni una regla, ni borrar CSS muerto (`.recovery-strip` no se usa: lo quita A1). Criterio: (1) multiconjunto de líneas idéntico (`sort` antes/después, sin líneas vacías ni `@import`); (2) capturas antes/después con hash igual en las rutas de la lista F2; si un par difiere, se miran los dos y se justifica (fecha/animación) o se corrige. SÍ: `app/globals.css`, `app/styles/*`.
- **F3 Primitivos.** Reestilo de `tokens.css`, `base.css`, `components.css`, `a11y.css` con los tokens v2: botones (primario/secundario/ghost/destructivo, estados pending/disabled), campos y etiquetas, selector segmentado, sheet/modal (clases comunes `.sheet*` que luego adoptan C2, A2, B1), alerta/error inline, toggle, lista agrupada inset, chips, estados vacío/carga/error, foco, press, avatar. Página `app/dev/ui/page.tsx` con todos los estados; devuelve `notFound()` si `NODE_ENV === "production"`. Ojo: cambia el aspecto de toda la app de golpe; se acepta que las pantallas queden «a medias» hasta su tarea. SÍ: esas 4 hojas + `app/dev/ui/*`.

## Oleada 1 — Login y cabecera (paralelo, 2 ejecutores)
- **S1 Login y páginas sueltas** (`app/login/page.tsx`, `login.css`, `app/not-found.tsx`): entrada premium móvil y escritorio, error de credenciales, estado enviando. `not-found` con el mismo lenguaje.
- **S2 Cabecera y navegación superior, todas las variantes** (`app/components/brand-header.tsx`, `header-actions.tsx`, `header-back-button.tsx`, `app/logout-button.tsx`, `shell.css`): barra jugador (large title / compacta al hacer scroll si F1 lo fija) y variante `wide` de admin/Amanda. La tab bar del jugador **no** es de S2 (vive en `home-client` → A1).
- (S3 desaparece: su shell de escritorio pasa a B1 y C1, que son dueños de esos archivos.)

## Oleada 2 — Pantallas (3 pistas en paralelo; dentro de cada pista, en serie)
**Pista A · Jugador (móvil 390)** — orden A1 → A3 → A2 → A5 → A6 (A2 y A6 son cortas) — dueña de `app/a/[id]/*` salvo `analisis.tsx`, de `plan-calendar.tsx`, `password-form.tsx`, `username-form.tsx`, `player.css`, `nutri-shared.css`.
- A1 Inicio y plan: `home-client.tsx` (cabecera del deportista, `dash-tabs` → tab bar/segmentado según F1, calendario, cinta, foco del día), `plan-calendar.tsx`, `page.tsx`. Estados: día sin sesión, semana sin plan. Audita jugador y admin.
- A3 Diario y dispositivos: `home-client.tsx` (formulario del diario), `device-card.tsx` (incl. chip admin y botones «Próximamente»). Estados: sin dispositivo, Polar conectado/error, guardado OK/error.
- A2 Sesiones y vídeo: `session-list.tsx`, `video-embed-modal.tsx` (adopta `.sheet*` de F3).
- A5 Nutrición del jugador: `nutrition-pane.tsx`, `nutri-shared.css`. Comprobar también que la ficha de Amanda (que lo reutiliza) no se rompe a 1280.
- A6 Ajustes del jugador: `app/ajustes/*`, `password-form.tsx`, `username-form.tsx`. Comprobar `/panel/ajustes` y la cuenta de Amanda, que usan los mismos formularios.

**Pista B · Administrador (escritorio 1440)** — dueña de `app/panel/*`, `analisis.tsx`, `admin.css`.
- B1 Panel y shell de escritorio: `app/panel/page.tsx`, `deportistas-section.tsx`, `create-form.tsx` (alta en sheet). Lista/tabla densa, vacío «sin deportistas». Shell: toolbar + large title (sin sidebar salvo que F1 diga lo contrario: solo hay 2 secciones).
- B2 Análisis: `app/a/[id]/analisis.tsx` + `.an-*` (rango, chips, gráficos, día, molestias, `an-empty`). Se ve en `/a/[id]` como admin, pestaña Análisis.
- B3 Ajustes de administrador: `app/panel/ajustes/*` (cuentas, nutricionistas, asignación `.nut-assign`, contraseñas). Los formularios compartidos se estilan con selector acotado en `admin.css`.
- B4 **(funcional)** Perfil editable para admin (altura, peso, nacimiento) en `/a/[id]`: reutiliza `AthleteProfileForm`/`AthleteProfileButton` y la API existente `PATCH /api/athletes/[id]/profile` (ya admite admin). SÍ: `home-client.tsx`, `app/a/[id]/page.tsx` si hace falta el dato. **Depende de A1 y A3 aprobadas** (mismo archivo); si la pista A va retrasada, B4 pasa a Oleada 3.

**Pista C · Amanda (escritorio 1440/1280, usable 768/390)** — dueña de `app/nutricion/*`, `nutri.css`.
- C1 Shell y menú: `app/nutricion/page.tsx` (lista de deportistas, vacío «sin asignados»), `athlete-nav.tsx`, en `nutricion-athlete-client.tsx` la toolbar, el segmentado Día/Semana/Mes, `WeekGrid`, `DishCell`, `MonthCalendar`, y el apilado <1280. Calendario compartido vía override en `nutri.css`.
- C2 Ficha, ingredientes y modales: `meal-drawer.tsx`, `meal-items-editor.tsx`, `NutModal` y `MealSlotForm` en `nutricion-athlete-client.tsx` (adoptan `.sheet*`), subida de foto, «platos iguales».
- C3 Resumen nutricional: `Ring`, `WeekPanel`, micros en `nutricion-athlete-client.tsx`, `nutrition-summary.ts` solo si es formato; estados falta/parcial/en rango (lenguaje Apple Fitness/Health).
- C4 Perfil, importar Word y cuenta: `athlete-profile-form.tsx`, `menu-word-import.tsx`, ajustes de cuenta (`.nut-account-settings`). Flujo de import entero (elegir archivo, confirmar, resultado, error).

## Oleada 3 — Transversal (paralelo por superficie, no por tema)
Motion, accesibilidad y responsive juntos por dueño de hoja, para no pisarse:
- T-común: `tokens.css`, `base.css`, `components.css`, `shell.css`, `a11y.css` (revisa que las reglas de preferencia de cada hoja no se contradigan), reduced-motion/transparency/contrast, Dynamic Type razonable (`rem`), foco.
- T-jugador: `player.css`, `nutri-shared.css`, archivos de pista A: táctiles ≥44, transiciones de tab/sheet, jugador en escritorio centrado y presentable.
- T-admin+Amanda: `admin.css`, `nutri.css`, `login.css` y archivos de pistas B/C: admin y Amanda a 768 y 390 sin romperse.
- T4 (Adrián decide, después del OK visual) **Modo oscuro**: tarea sola y en serie, toca `tokens.css` + cualquier color suelto que quede.

## Oleada 4 — Cierre
- Auditoría integral fría (un recorrido por rol con el Criterio global, en serie) + pasada de consistencia entre pistas (el master retoca lo pequeño).
- Lista final de cambios y capturas; Adrián prueba en localhost. Con su OK: commit/merge a `dev`, luego `main`.

## Criterio global de hecho
- Las tres vistas (jugador móvil, admin escritorio, Amanda escritorio), el login y `not-found` se ven como una app de Apple: jerarquía tipográfica clara, materiales con criterio, espaciado generoso, componentes estándar (listas agrupadas, segmentados, sheets, tab bar), movimiento fluido; nada heredado que choque.
- Cero funciones perdidas (recorrido de funciones en `plantillas-rediseno.md`); `tsc` limpio; sin scroll horizontal a 390 en ninguna ruta; colores, radios, sombras y duraciones salen de `tokens.css`.
- `design-system.md` v2 documenta base Apple + adaptaciones Óptimo.

## Riesgos que el plan ya cubre
- Quemar la ventana de 5 h: tope de 3 ejecutores en paralelo, auditores ligeros y en serie; el master avisa de pausa si el uso pasa de la mitad. Pistas de 4 tareas cada una, equilibradas.
- Colisiones de CSS y componentes: F2 antes de todo; tabla de dueños; overrides acotados en la hoja propia.
- Colisión en git con árbol compartido: commit solo del master, por rutas.
- Navegador compartido: lock de capturas y auditorías en serie.
- Pérdida de trabajo: commit local por tarea en `feat/rediseno-apple`.

## Pista N — Nutrición: funciones nuevas + diseño (añadida 2026-11-13)
Base: `from-opus-investigacion-nutricion.md` (informe con fuentes). **Excepción a la regla 7:** esta pista sí toca datos, con migraciones **solo aditivas** (tablas/columnas nuevas, nada se borra ni cambia), escritas en `db/schema.sql` y aplicadas por el master tras el PASA de N0. Lo existente se conserva (menú día/semana/mes, ficha, importar Word, ingredientes automáticos, anillos, perfil).
Orden: va **después** de A5/C1–C4 (mismos archivos: `nutricion-athlete-client.tsx`, `nutrition-pane.tsx`, `nutri.css`, `player.css`) y en serie salvo donde se indica. A5 y C-track dejan el diseño base; N lo completa sin rehacerlo.

Criterios de diseño (de la investigación): el jugador **no ve kcal ni gramos de macros por defecto** (interruptor por deportista para Amanda); sin peso como protagonista, sin rachas ni gamificación, sin registro por gramos/escáner/IA, sin chat, sin generador de dietas por IA, sin despensa con inventario.

**Jugador (móvil)** — pestañas *Hoy · Semana · Compra*
- **N1 Hoy:** tarjeta del día con MD y «nivel de combustible» (carga / normal / suave) con color, nota de Amanda, franjas en orden con la siguiente destacada, foto, ingredientes redondeados, preparación plegable, suplementos en su franja, «Indicaciones de Amanda» plegable. (Presentación + `supplements` con franja opcional.)
- **N2 Semana:** tira de 7 días con MD y miniaturas; tocar abre «Hoy» de ese día.
- **N3 Lista de la compra:** semana o próximos 3 días, suma de `meal_items` por alimento, secciones por pasillo, cantidades en unidad de compra («6 huevos»), «ya lo tengo», compartir (Web Share/WhatsApp/copiar) e imprimir. Datos: `foods.aisle/unit_name/unit_g/pack_g/staple`, `shopping_checks`.
- **N4 Check de comidas:** ✓ / ½ / ✕ por franja con foto opcional y comentario corto. Datos: `meal_checks`.

**Amanda (escritorio)** — pestañas *Menú · Seguimiento · Perfil · Compra · Plantillas y platos · Informes* (+ *Alimentos* global)
- **N5 Alimentos:** tabla de `foods` (sección, unidad, alias) y bandeja «sin alimento» (≈23 hoy) con un clic «es alias de X / alimento nuevo»; mejora del emparejado (plurales, palabras de preparación) en `lib/nutrition`.
- **N6 Perfil ampliado:** alergias e intolerancias (alerta en la ficha del plato), «mostrar números al jugador», objetivos editables por Amanda sobre los calculados. Datos: `athletes.allergies/intolerances/show_numbers/target_overrides`.
- **N7 Seguimiento:** cumplimiento por semana y por tipo de día, foto real junto a la del plan, gráfica de peso/medidas (solo panel de Amanda, el peso del perfil = último registro). Datos: `body_measurements`.
- **N8 Plantillas y platos:** guardar día/semana como plantilla (MD-1, MD, MD+1) y aplicarla; biblioteca de platos («buscar en mis platos»); sustituciones aprobadas con gramos recalculados; nota por día. Datos: `menu_templates*`, `dishes*`, `food_swaps`, `meal_day_notes`.
- **N9 Informes e impresión:** PDF/`@media print` del menú semanal + lista de la compra + objetivos.

**Más adelante (no entra ahora):** informe mensual, plan vs real con números solo para Amanda, recordatorios push (exigen PWA instalada), carga BEDCA/Open Food Facts, hidratación intra-partido, anamnesis completa.

**Supuestos a confirmar con Amanda (no bloquean):** (a) los gramos de los platos son en **crudo** (así lo asume el código); (b) el jugador compra y comparte la lista por WhatsApp. Ambos se cambian después sin rehacer nada.

Estimación: N1–N4 jugador ≈ 4 tareas, N5–N9 Amanda ≈ 5 tareas, más 1 de migraciones (N0). Cada una con su ejecutor y auditor.

**N0 Migraciones aditivas (previa a N1–N9):** un ejecutor escribe las tablas/columnas en `db/schema.sql` (idempotentes) y las RPC de nutricionista que haga falta; el auditor las revisa; el master ejecuta `npm run db:migrate` contra la base compartida solo tras el PASA.
