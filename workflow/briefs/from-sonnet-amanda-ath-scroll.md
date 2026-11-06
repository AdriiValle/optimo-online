# from-sonnet-amanda-ath-scroll

- Hecho: sí (tsc revisado; sin verificación visual en navegador)
- Qué cambió (rutas):
  - app/nutricion/athlete-nav.tsx — buscador por nombre (filtro de texto, "Sin resultados") sobre la lista del rail Deportistas.
  - app/globals.css — el scroll pasa de todo el bloque a solo la lista (título y buscador fijos); estilo `.nut-ws-search`.
- Duda: el rail solo existe en desktop ≥1280px; en móvil/índice no hay buscador (el brief habla del bloque Deportistas del dashboard).
- Recomendación: dejarlo así; si hace falta en móvil, slice aparte.
- Bloquea a Adrián: no
