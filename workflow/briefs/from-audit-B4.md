# from-audit-B4

- Hecho: si
- Que cambio (rutas): solo capturas y script en `.tmp-verify/audit-B4/`. Sin cambios de código. Datos de Ricardo Visus tocados en la prueba (altura 191→192, peso 85→86) y restaurados a 191 cm / 85 kg; nacimiento intacto. `.tmp-verify/browse.lock` creado y borrado.
- Duda:
- Recomendacion:
- Bloquea a Adrian: no

## Salida de la auditoría

- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. En el modal de edición, los `<input>` miden 36 px de alto (fila completa ~52 px). Si la fila entera es táctil no hay problema; el botón principal «Guardar perfil» mide 50 px y «Editar» 44 px. `.tmp-verify/audit-B4/adm390_edit.png`
  2. Comprobado con Tab: foco visible (outline 2 px azul #0071E3) en Salir, Editar y resto de botones. Escape cierra el modal.
  3. Un valor inválido (altura 50) muestra «Datos inválidos» sin detalle de qué campo falla; el texto de ayuda de rangos queda justo encima. `.tmp-verify/audit-B4/adm1440_invalid.png`

## Evidencia del criterio de hecho
- Admin (`adriivalle`) en `/a/9d27d850-…` a 1440: se ve «Perfil físico» (Edad 25, Altura 191, Peso 85, Nacimiento 21 jun 2001) con botón Editar. Edité altura/peso → «Guardar perfil» → recargué la página y los valores se mantuvieron (192/86). Restaurado a 191/85 y verificado tras recarga. `.tmp-verify/audit-B4/adm1440_a_*.png`, `adm1440_edit.png`, `adm1440_saved.png`
- Jugador (`ricardovisus`) en 1440 y 390: no hay ficha física ni botón Editar (0 botones `.adm-fis-edit`, ningún botón/enlace con «editar» o «perfil»). `.tmp-verify/audit-B4/ply1440_a_*.png`, `ply390_a_*.png`
- 390: `scrollWidth` = 390 en admin y jugador (sin scroll horizontal); el modal sale como sheet inferior.
- `npx tsc --noEmit`: limpio (sin salida).
- No auditado (fuera de la tarea, solo UI): si el servidor rechaza la acción de guardar perfil para un jugador llamándola directamente.
