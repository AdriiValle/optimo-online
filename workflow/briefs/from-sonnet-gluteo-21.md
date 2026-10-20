# Resultado — gluteo-21

- Hecho: sí
- Qué cambió (rutas):
  - `index.html` y `plan-visus.html` (idénticos): rellenados los protocolos `fuerza-isquios-bilateral` y `fuerza-isquios-unilateral` (estaban vacíos) y añadidos dos nuevos: `fuerza-isquios-isometrico-cuna` y `fuerza-isquios-discos-miniband`. Se actualizó la rama `strengthRole === "posterior"` del render (sección "Fuerza") para pintar las 4 filas en orden + una nota de superset ("2 series del bloque: hip thrust sin peso + isométrico de cuña"). Contenido: hip thrust sin peso (8+8+8), isométrico 15 s/pierna, hip thrust solo punta de pie (8/pierna, 2 series), hip thrust con discos 5+5 kg y mini-band (8/pierna, 2 series). Sin inventar ejercicios ni calentamiento.
  - `workflow/context/decisions.md`: 3 líneas con la decisión (main+dev).
- Verificado con Node (evaluando el bloque de fechas del propio script): 2026-10-21 → `MD-2`, rol `posterior` (se pinta la sesión nueva). 2026-10-20 → `MD-3`, sin rol (no cambia). 2026-10-19 → `MD-4`, rol `anterior` (cuádriceps, no tocado).
- Duda: el sistema de fuerza por rol ("posterior"/"anterior") es global para toda la temporada, no por fecha concreta. Esta misma sesión de glúteo 1 aparecerá también en los próximos días "posterior" (28 oct, 5 nov, 18 nov...), igual que ya pasa con cuádriceps en los días "anterior". Hasta que Adrián dicte progresiones distintas para esos días futuros, mostrarán el mismo contenido inicial.
- Recomendación: si quieres que el 21 oct sea un one-off y los próximos "posterior" tengan otra cosa, dímelo en el próximo brief cuando toque progresar esos días (igual que se ha ido progresando cuádriceps). Por ahora lo dejo igual que el patrón ya existente en el código (consistente con el commit previo "hip thrust como fuerza posterior inicial").
- Bloquea a Adrián: no
