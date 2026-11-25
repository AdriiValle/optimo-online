# from-sonnet-amanda-dash-layout

- Hecho: sí (tsc limpio; sin verificación visual en navegador)
- Qué cambió (rutas):
  - app/nutricion/[athleteId]/nutricion-athlete-client.tsx — calendario + día en el rail izquierdo (encima de Deportistas); cabecera con engranaje (abre "Tu cuenta") + Salir, ahora renderizada desde el cliente.
  - app/nutricion/[athleteId]/page.tsx — pasa nombre/volver/logout al cliente.
  - app/nutricion/athlete-nav.tsx — prop `above` (calendario); quitados pie del rail, Ajustes y Salir.
  - app/nutricion/page.tsx — índice: Salir en la barra superior (visible también en desktop).
  - app/nutricion/nut-rail-logout.tsx — eliminado (huérfano por este diff).
  - app/globals.css — barra superior visible en desktop; rail 300px; main solo con la semana; CSS del pie/rail-btn eliminado.
  - Calendario sigue en el main en móvil (<1280px); en desktop se oculta ahí y se muestra en el rail.
- Duda: en el índice /nutricion (sin deportista elegido) no hay engranaje: la modal de cuenta solo existe en la página de deportista.
- Recomendación: dejarlo así; si Adrián quiere el engranaje también en el índice, extraer la modal "Tu cuenta" a un componente aparte (slice pequeño).
- Bloquea a Adrián: no
