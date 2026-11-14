- Hecho: si
- Que cambio (rutas): solo capturas y script de auditoría en `.tmp-verify/audit-C2/` (a/*.png, shots.sh). Sin cambios de código. Fotos de prueba subidas y quitadas (BD sin fotos tras la prueba). `npx tsc --noEmit` limpio.
- Duda:
- Recomendacion:
- Bloquea a Adrian: no

- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. /nutricion/<id> - 390 - al cerrar la hoja de la ficha con Escape el foco cae en `body` (no vuelve al botón «Ficha del plato»); en 1440 sí vuelve a la celda. `.tmp-verify/audit-C2/a/sheet-390.png`
  2. Interruptores «Confirmado» miden 51x31 (<44 de alto) en drawer y sheet; no son la acción primaria (los botones sí miden 44). `.tmp-verify/audit-C2/a/drawer-1440-ing.png`
  3. La insignia «1 Issue» del overlay de desarrollo de Next tapa «Guardar nutrición» en la esquina inferior izquierda; solo en dev. `.tmp-verify/audit-C2/a/page2-1440.png`

Comprobado (1440, 1280, 390; Amanda sobre Ricardo Visus, localhost:3001):
- Ficha: drawer a 1440 y 1280 (sin scrim, X y Escape cierran, foco vuelve a la celda); sheet con scrim a 390 (X y Escape cierran). Foto, macros y ingredientes con buena jerarquía: `a/drawer-1440.png`, `a/drawer-1280.png`, `a/sheet-390.png`.
- Editor de ingredientes: alimento, gramos, rol y confirmado presentes, botones «Confirmar ingredientes» / «Guardar sin confirmar» (44 px): `a/drawer-1440-ing.png`, `a/drawer-1440-bottom.png`. No guardé cambios.
- Foto: subir (webp ≤300 KB) y «Quitar foto» funcionan; «platos iguales» aplicó la foto a Jue 12 y Vie 13 (BD lo confirmó) y se quitó después: `a/after-upload-1440.png`, `a/same-1440.png`.
- Nuevo plato (celda vacía «+»): `a/nuevo-1440.png`. Modales Perfil e Importar menú: scrim 30 %, X 44x44, Escape cierra: `a/modal-perfil-1440.png`, `a/modal-import-1440.png`.
- scrollWidth: 1440=1440, 1280=1280, 390=390 (sin scroll horizontal). Foco visible: outline sólido 2 px al tabular.
- Aviso de método: el login en 127.0.0.1 no persiste (NextAuth redirige a localhost), usé http://localhost:3001.
