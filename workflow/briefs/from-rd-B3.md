# from-rd-B3 · Admin: ajustes (cuentas, nutricionistas, contraseñas)

- **Hecho:** sí. La última comprobación visual (un retoque de 1 línea de CSS) no se pudo hacer porque el servidor de desarrollo tiene el login roto; ver la duda.

## Qué cambió (rutas)
- `app/panel/ajustes/page.tsx`: `<main className="page adm-page">` (misma columna de 1080 px que el panel).
- `app/panel/ajustes/admin-ajustes-client.tsx`: rediseño completo de la vista, sin tocar la API ni lib/.
  - Large Title «Ajustes» y tres secciones con Title 3 + pie Footnote: **Tu cuenta**, **Deportistas**, **Nutricionistas**.
  - Tu cuenta: `UsernameForm` y `PasswordForm` en dos tarjetas (2 columnas a partir de 960 px).
  - Deportistas: lista agrupada inset, que en ≥720 pasa a tabla con cabecera (Deportista · Usuario de acceso · Editar). Cada fila se despliega (`aria-expanded`/`aria-controls`) y muestra la foto y los formularios en línea (usuario, nombre, reset de contraseña). Una sola línea de estado por fila (`role="status"`).
  - Nutricionistas: un grupo por cuenta («Ve N de M deportistas»), `.nut-assign` con interruptores `role="switch"` por deportista, pie con «Cambios sin guardar» y botón para guardar, y alta de nutricionista en una tarjeta lateral (22.5rem).
  - Estados de carga (esqueleto), de lista vacía y de error (`alert--danger`).
- `app/styles/admin.css`: bloque `.adm-set-*` y nuevo `.nut-assign*` (sustituye las 4 reglas viejas). Los formularios compartidos solo se estilan dentro de `.adm-set-card`; ahí el envío de PasswordForm pasa a tintado, porque en ajustes no hay acción principal. Las preferencias de reduced-motion y contrast van al final de la hoja. Último retoque: `.adm-set-inline-row > .btn { flex-basis: 14rem; white-space: nowrap }` para que «Aplicar contraseña» no se parta en dos líneas mientras sale el spinner.

## Verificación
- `npx tsc --noEmit` limpio.
- Capturas en `.tmp-verify/rd-B3/`:
  - antes: `before-1440_panel_ajustes.png`
  - después: `after-{1440x900,768x1024,390x844}-_panel_ajustes.png`, `after-*-open.png`, `func-*.png`
  - `scrollWidth` = 390 a 390 px; las acciones primarias y las filas miden ≥44 px.
- Funcional (`.tmp-verify/rd-B3/func.sh`):
  - **Contraseña:** se cambió la de ricardovisus a una de prueba, se entró con ella y se restauró.
  - **Asignación:** se activó «Adrián Valle» para amanda, se guardó y se recargó; después se restauró.
  - **Restauración comprobada en la BD** (consulta de solo lectura): todas las cuentas de desarrollo aceptan la contraseña de desarrollo, y amanda solo ve a Ricardo Visus, igual que en la captura de antes. No queda ninguna cuenta de prueba (todas son anteriores al 2026-11-05).
- `browse.lock` liberado.

## Duda
El servidor de desarrollo en 3001 tiene `/api/auth/*` devolviendo 500 («Jest worker encountered 2 child process exceptions, exceeding retry limit»): no se puede iniciar sesión. El resto de rutas responde. Por eso el último retoque de CSS (`flex-basis` 14rem + `nowrap` en los botones en línea, a ≥720) no tiene captura. El resto del diseño sí se verificó con el código actual.

## Recomendación
Reiniciar el servidor de desarrollo de 3001 antes de la siguiente verificación con navegador. No lo hice porque el brief lo prohíbe. Después, repasar a 768 y 1440 la fila desplegada de un deportista con `.tmp-verify/rd-B3/shots.sh`: el cambio es de una línea y de bajo riesgo.

- **Bloquea a Adrián:** no.
