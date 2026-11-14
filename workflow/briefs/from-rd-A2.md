# from-rd-A2 · Jugador: sesiones y vídeo

- Hecho: sí
- Qué cambió (rutas):
  - `app/a/[id]/session-list.tsx`: la lista va agrupada dentro de la tarjeta del panel, con títulos de sección en Title 3, ejercicio en Headline, cantidad en Subhead (cifras tabulares), info en Footnote secundario y separadores entre filas. Botón «Vídeo» tintado en cápsula de 44 px con glifo play SVG, `aria-label="Ver vídeo: {ejercicio}"` y `aria-haspopup="dialog"`. Pasa el nombre del ejercicio al modal y `onClose` es estable (`useCallback`).
  - `app/a/[id]/video-embed-modal.tsx`: ahora usa `.sheet-scrim` / `.sheet` / `.sheet-grabber` / `.sheet-header` / `.sheet-title` / `.sheet-close` (`icon-btn` de 44, X en SVG) / `.sheet-body` de F3. El título es el ejercicio. Se cierra con X, scrim y Escape, y la salida se anima con `.is-closing` + `animationend` (con un respaldo de 600 ms, el mismo patrón que B1). El foco va a «Cerrar» al abrir y vuelve al disparador al cerrar, Tab queda atrapado dentro, y se mantiene el bloqueo de scroll iOS-safe. Nueva prop opcional `title`; las demás no cambian (solo la usa session-list).
  - `app/styles/player.css`: borradas las reglas `.video-embed-*`. Nuevas `.video-sheet-scrim` (z-index 1100, por encima de la cabecera y la tab bar), `.video-sheet-frame` (16:9 con `--radius-md`), `.video-sheet-blurb` y `.video-sheet` a 640 px desde 720 de ancho. Reescrito el bloque `.session-*` solo con tokens. Al final de la hoja, preferencias A2 (reduced-motion y contrast). La reduced-transparency del sheet ya la cubre `a11y.css` sobre `.sheet`.
- Verificación (localhost:3001, ricardovisus, viernes 13/11 con 12 ejercicios y 4 vídeos):
  - A 390, `scrollWidth` da 390 en la lista y con el sheet abierto. Los botones de vídeo miden 90×44 y «Cerrar» 44×44.
  - Abrir y cerrar funciona por las 3 vías (Escape, X y scrim): se desmonta el sheet, `body` vuelve a su posición y el foco al botón.
  - A 1280 el sheet sale centrado a 640 px y el vídeo de YouTube carga.
  - `npx tsc --noEmit` limpio. Consola sin errores nuevos: solo avisos del iframe de YouTube y el CORS del signout del propio script de capturas.
  - Capturas en `.tmp-verify/rd-A2/` (`list-390.png`, `video-sheet-390.png`, `video-sheet-1280.png`). Lock tomado y liberado. No he creado datos de prueba.
- Sin commit, como pide el brief: lo hace el master.
- Duda: quedan dos restos en hojas que no son mías. En `a11y.css`, `.video-embed-shell` y `.video-embed-close` ya no apuntan a nada; `.session-item` (borde por fila en contrast) y `.session-section` los neutralizo con selector acotado en `player.css`. En `components.css`, `button.session-video:hover` (`--accent-hi`, transición de F3) queda anulado en mi hoja porque ahora el botón es tintado.
- Recomendación: que T-común/F3 quite esos selectores muertos y de transición en su pasada de limpieza. No rompen nada.
- Bloquea a Adrián: no
