Oleada 4 — panel admin y ajustes. Commit `6d0ea18` en `dev` (`style(look): panel admin y ajustes`).

- Hecho: parcial. El código está hecho y `npm run build` pasa. Falta la revisión visual a 375 que pide la regla 4: :3001 no estaba levantado.

- Qué cambió (rutas)
  - `app/globals.css` (solo bloque de zona):
    - `.create-overlay/.create-sheet`: sheet según design-system. Móvil anclado abajo y sube (`sheet-up`, `--dur-sheet var(--ease)`), esquinas superiores `--radius`, safe-area, `max-height 92svh`, scroll interno con `overscroll-behavior: contain` + `scroll-padding-block`, scrim `--scrim` sin blur nuevo, z-index 1050 (por encima del header 1000). ≥720 centrado con `sheet-pop` 0.96→1. Botón «Crear» a todo el ancho, 50px.
    - `.athlete-card`: fuera el press propio (0.98, 100ms a mano); usa el compartido `a.card:active` (`--press-scale-lg`, tokens). Hover solo con `(hover: hover)` y con `var(--glass-strong)` en vez de rgba suelto. Quitado `.athlete-card:active` del bloque reduced-motion: era huérfano de este mismo diff (los tokens ya anulan el press).
    - `.settings-account-item`: fila opaca (`--surface`, borde `--line`, sin blur) para no poner cristal sobre cristal. Va con `.card:where(.settings-account-item)` para que `prefers-contrast` / `reduced-transparency` sigan ganando.
    - `.settings-stack`: ritmo entre botón y siguiente bloque (20px) y botones contiguos con 8px.
  - `app/panel/create-form.tsx`, `app/components/username-form.tsx`, `app/panel/ajustes/admin-ajustes-client.tsx`: solo atributos de teclado (`autoCapitalize`, `autoCorrect`, `spellCheck`, `autoComplete`, `enterKeyHint`) en usuario, email y contraseñas temporales. No toqué lógica, props, fetch ni estado.
  - No cambiaron: `page.tsx` del panel, `deportistas-section.tsx` (cierre con ×, Escape, tocar el scrim y el bloqueo de scroll ya estaban), `app/ajustes/*`, `password-form.tsx`, `.form-grid`, `.photo-block`, `.recovery-*` (se usan en la casa del deportista, que es la oleada 5).
  - Amanda (`/nutricion`): `UsernameForm` solo gana atributos de input; el marcado sigue igual, así que el `gap` de `.nut-account-settings` no cambia.

- Duda: el CSS de la oleada ya estaba a medio hacer en el árbol sin commitear (de un intento anterior de esta misma oleada; todo dentro de los selectores de la zona). Lo revisé, lo ajusté y entra en este commit.

- Recomendación: hacer la revisión a 375 en :3001 en la siguiente pasada que tenga el servidor levantado: `/panel` → Añadir (cerrar, scroll y teclado), `/panel/ajustes`, `/ajustes` y la cuenta de Amanda en `/nutricion`. `.recovery-strip` no lo usa ningún TSX: es huérfano de antes, no lo he borrado.

- Bloquea a Adrián: no
