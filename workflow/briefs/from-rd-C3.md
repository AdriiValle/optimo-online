# from-rd-C3: anillos, WeekPanel y micros (Amanda)

Hecho: sí

## Qué cambió (rutas)
- `app/nutricion/[athleteId]/nutricion-athlete-client.tsx`
  - `Ring` rehecho como KPI al estilo Actividad/Salud. El anillo SVG es `aria-hidden`; la cifra va grande (`/ objetivo` o `tope`), con detalle y estado en texto ("Falta X", "Pasado +N %", "Sobre tope +N %", "Parcial", "Bajo tope").
    - Hay una marca a las 12 cuando se pasa del objetivo o hay tope.
    - El anillo hero de Energía muestra el %.
  - Nuevo `MicroMeter`: fila compacta con barra (scaleX), valor y estado.
  - Nuevo helper `kpiState`: protege contra NaN/no finitos y exige objetivo > 0.
  - `WeekPanel`, con las mismas props:
    - Cabecera: título, kcal totales (semana/mes) y cobertura "X/Y platos con datos" con un punto de estado.
    - Cuerpo: Energía (hero), Macronutrientes (Proteína y Hidratos en g/kg, Grasa en g/día, más "g/día · % kcal") y Micronutrientes.
    - Sin perfil: aviso con el botón "Completar perfil" (44 px), que abre el `AthleteProfileForm` en modal.
    - Los objetivos se siguen calculando con `dailyTargets`/`averageTargets` del perfil (sin tocar `lib/`).
  - Quité el import `MacroDonut`, que quedó huérfano en este diff (la ficha de C2 lo sigue usando desde su propio archivo).
- `app/styles/nutri.css`
  - Bloque nuevo "Resumen nutricional (rd-C3)". Usa tokens de estado F1 (`--ring-low/ok/over/cap-ok/cap-over/partial`, más `--ok/--warn/--danger` para el texto).
  - Layout por container query del propio resumen:
    - Panel lateral en Día (<560).
    - Franja media (≥560): energía y macros arriba, 5 micros debajo.
    - Franja ancha (≥1000): 3 columnas, con los micros en tabla subgrid.
  - Quité las reglas viejas de `.nut-dash`/`.nut-ring` y mantuve las de `.nut-macro*` (donut de la ficha C2).
  - Al final de la hoja: reduced-motion (sin animación en los anillos ni en las barras) y prefers-contrast:more.
- `nutrition-summary.ts`: sin tocar.

## Verificación
- `npx tsc --noEmit` limpio.
- Capturas en `.tmp-verify/rd-C3/`: 1440x900 y 1280x800 en semana/día/mes, sin perfil (día/semana), modal de perfil, 390x844 y 768x1024.
- `scrollWidth` = ancho del viewport en 1440, 1280, 768 y 390. No aparece "NaN" en ningún caso (tampoco con el perfil vacío simulado en cliente, sin tocar la BD).
- "Completar perfil" mide 163x44 y abre el modal "Perfil del deportista".
- La regla reduced-motion está cargada en el CSSOM (`animation: none; transition: none` en `.nut-ring-bar`, `.nut-micro-meter i`). No pude emularla en vivo porque browse bloquea `Emulation.setEmulatedMedia`.
- Consola: el único error es "unique key prop" en `HeaderMarkup` ← `NutricionAthletePage` (page.tsx). Ya existía antes y no viene de este diff.
- No creé datos de prueba. Borré `.tmp-verify/browse.lock`.
- No hice commit ni cambié de rama.

## Duda
- El resumen solo se ve a ≥1280 px (`.nut-week` tiene `display:none` por debajo, y en móvil hay un menú apilado sin resumen). Ya era así antes y queda fuera del alcance de C3.
- En 1280x800, vista Día, el panel lateral hace un poco de scroll vertical propio (632 de alto frente a 695 de contenido).

Recomendacion: aceptar el scroll del panel lateral, que es interno, con `overflow-y: auto`. Si se quiere el resumen en móvil o tablet, abrir un brief aparte (p. ej. una hoja o sección bajo el menú apilado), reutilizando `WeekPanel` tal cual, porque ya se adapta por container query.

Bloquea a Adrian: no
