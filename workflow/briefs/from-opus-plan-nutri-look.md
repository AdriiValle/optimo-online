# from-opus-plan-nutri-look

- Hecho: sí
- Qué cambió (rutas):
  - `workflow/briefs/plan-nutri-look.md` (nuevo; commit `0a7be12` en `dev`). Sin código de producto.
- Duda:
- Recomendación:
- Bloquea a Adrián: no.

## Para Adrián

Las 4, en una línea cada una:
1. **Semana:** se queda en columnas, días arriba con MD-x; las filas que están vacías toda la semana (desayuno, snacks) se encogen a una línea fina y comida/cena se quedan el alto.
2. **Color:** cuatro tonos tierra (terracota carne, pizarra pescado, ocre huevos, oliva legumbres) como tokens nuevos de Óptimo; el `[CARNE]` desaparece y el plato muestra la proteína como titular.
3. **Fotos:** ya mismo un placeholder por categoría (color liso + nombre); en O3 Amanda sube desde la ficha, el navegador reduce la foto del móvil y se puede aplicar a los platos iguales de las 4 semanas.
4. **Ficha:** al clic se abre un panel a la derecha (el rail no se mueve) con foto grande, macros de esa comida e ingredientes de O4; en móvil, sheet desde abajo.

Plan (oleadas, todas UI → opus, en `dev`):
- **O1** Tokens + celda tarjeta por categoría + filas vacías colapsadas + puntos de mes teñidos. Sin tocar DB ni APIs.
- **O2** Ficha (drawer) con foto o placeholder, macros por comida (campo nuevo en `nutritionTotals`), ingredientes O4 y «Editar plato» que no rompe el hash.
- **O3** Subida de fotos: arrastrar/elegir, resize a ≤300 KB, quitar foto, «usar en los N platos iguales» sin pisar fotos existentes. Sigue en Neon (bytea), sin servicio de pago.

Pack de tacto: `apple-design` (Emil Kowalski). De Nutrigo solo la idea, no su lima.
