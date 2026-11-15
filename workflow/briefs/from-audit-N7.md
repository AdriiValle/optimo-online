- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  - Al borrar el único registro con peso, el peso del perfil se queda en el último valor (83,4 en la prueba) en vez de volver al anterior; es la regla documentada («sin registros con peso, el perfil no se toca»). Restaurado a 85 por SQL tras la prueba. No he abierto la vista de anillos del jugador: solo verifiqué que `athletes.weight_kg` (de donde leen) pasó de 85 a 83,4 y que el panel lo muestra.
  - A 390 la tira de pestañas (AthleteTabs, compartida, fuera de esta tarea) queda recortada a la izquierda («enú») y hace scroll interno; sin scroll horizontal de página (scrollWidth 390 = viewport).
  - Los botones del selector de medida (Peso/% graso/…) miden 28 px en puntero fino; suben a 44 con `pointer: coarse` (`.nut-trk-metrics`), que mi navegador headless no activa, así que lo táctil no se pudo medir en vivo.

Comprobado (Amanda, Ricardo Visus; 1440x900 y 390x844):
- `npx tsc --noEmit`: limpio.
- Medida: registrar 83,4 kg + 88 cm por la UI → aparece en la gráfica, en «Último» y en Registros; el peso del perfil pasa de 85 a 83,4 en BD y en el texto del panel. Borrar por la UI funciona y vuelve al estado vacío.
- Cumplimiento: con 6 checks temporales (3 hecho, 2 a medias, 1 no; uno con foto y nota) la app muestra 67 % semana 2–8 nov y 67 % en Entreno con «6 de 24 marcadas», igual que mi cálculo en SQL. La foto real se carga junto al hueco «Plan» («Sin foto», porque el plato no tiene foto) y sale el comentario del jugador.
- Estados vacíos sin datos: «Aún no hay comidas marcadas» (indica 28 comidas en el menú), «Aún no hay fotos ni comentarios», «Aún no hay medidas».
- Sin scroll horizontal a 390 (ningún elemento pasa de 391 px). Inputs y botón de guardar a 44 px; foco visible (outline 2 px azul) en todos los campos y botones al tabular.
- Limpieza: checks y medidas temporales borrados (0 filas), peso de Ricardo restaurado a 85. Adrián Valle y Francisco Gago dan 404 en esta ruta (no están asignados a Amanda), es lo esperado.

Capturas: .tmp-verify/audit-N7/d-6de91513-0211-4e0d-b80a-d0d3fe830a49.png (404 de otro deportista), d-9d27d850-d328-4633-bc33-56198a0e4181.png (vacío 1440), d-after-save.png, d-compliance.png (1440), m-390.png (390).
