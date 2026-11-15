- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. Falso positivo de gluten: con la intolerancia «Gluten», el ingrediente «Pasta sin gluten» dispara el aviso en la ficha del plato (Ricardo, mar 10). Es conservador y no pierde ningún aviso, pero a un jugador celíaco le saltaría en cada producto «sin gluten». Captura: .tmp-verify/audit-N6/e_1440_alert.png
  2. Un admin en `/nutricion/<id>/perfil` ve «Página no encontrada» (la pantalla es de Amanda). Los endpoints `GET/PATCH /api/athletes/<id>/profile` sí funcionan con admin (200, guarda y devuelve el perfil). Captura: .tmp-verify/audit-N6/g_1440_admin_perfil.png
  3. A 390, los chips de sugerencias y las casillas de objetivos miden 32-36 px de alto (el diseño admite chip 32 y la fila táctil lleva la etiqueta). El resto cumple: «Guardar perfil» 358x50, «Añadir» ≥44, quitar término 28 px con área táctil ampliada a 44 por `::after`. Captura: .tmp-verify/audit-N6/h_390_perfil.png

Comprobado (1440x900 y 390x844, Amanda y admin, datos de desarrollo de Ricardo Visus):
- Guardar nacimiento/altura/peso, meta, alergias, intolerancias, show_numbers y objetivos sobrescritos (entreno: kcal 3000, P 200, HC 400, G 90) → «Perfil guardado.» y, al recargar, todo se mantiene.
- Con alergia «Pescado» e intolerancia «Gluten», la ficha del plato muestra el aviso con los ingredientes que casan; con «Lácteos» también sale el aviso.
- Anillos: la vista Día en un día de entreno marca «804 / 3.000 kcal/día», es decir, usa el objetivo sobrescrito. Captura: .tmp-verify/audit-N6/f_1440_dia.png
- Admin: GET y PATCH de `/api/athletes/<id>/profile` responden 200 y guardan.
- Sin scroll horizontal: scrollWidth 1440 a 1440 y 390 a 390. Foco visible: contorno sólido 2 px azul de sistema en pestañas y botones al pulsar Tab.
- `npx tsc --noEmit` sin errores.
- Restaurado: el perfil de Ricardo vuelve a los valores originales (comparado con la copia previa), sin datos de prueba. Lock `browse.lock` liberado.
