- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. Chip de integración del admin (`.device-admin-chip`) no verificado visualmente: ningún deportista de desarrollo tiene Polar conectado (el componente solo pinta con estado connected/error), así que no apareció en Adrián, Paco, Prueba RD B1 ni Ricardo. El resto del admin (Atrás, Salir, pestañas Entrenamiento/Nutrición/Análisis) funciona a 1440 y 390.
  2. En la vista de un día con sesión (Ricardo, miércoles 11, 390), las tarjetas de ejercicio se ven con sombra suave; el sistema pide tarjetas planas. Parece pertenecer a la lista de sesiones, no a esta tarea.
  3. El tab bar sale con fondo blanco sólido y `backdrop-filter: none` en el headless de gstack; no he podido confirmar el material con blur en un navegador real.

## Evidencia (UTF-8)
- Jugador 390 (Adrián, Ricardo, Paco): tab bar fija abajo (Entreno/Nutrición/Diario, 125x49, `aria-current`, activo en azul), calendario y cinta semanal con estilo Apple, foco del día ("Hoy" + chips MD/rival) claro. scrollWidth = 390 en inicio, Nutrición y Diario.
- Estados vacíos con diseño: "Semana sin plan" y "Día sin sesión" (Adrián y Paco).
- Jugador 1280x800: tab bar a todo ancho con ítems centrados, contenido en columna 640; scrollWidth = 1280. El último contenido queda por encima del tab bar (padding-bottom 73px).
- Admin 1440 y 390: sin tab bar, segmentado superior con Análisis operativo (filtros 3d–60d, tarjetas y Molestias). scrollWidth = 1440 / 390.
- Táctiles: tab bar 125x49; calendario 46x60; flechas de semana 44x44; Ajustes 44x44; Salir 50x44. Todos ≥44.
- Foco visible con Tab: outline 2px rgb(0,113,227) en botones de cabecera, ítems del tab bar y días del calendario.
- `npx tsc --noEmit`: exit 0, sin errores.

## Capturas (.tmp-verify/audit-A1/)
p390_home.png, rv390_home.png, paco390_home.png, rv390_day11.png, rv390_nutricion.png, rv390_diario.png, rv390_bottom.png, rv1280_home.png, rv1280_bottom.png, admin_1440x900.png, admin_390x844.png, admin_analisis_1440.png, admin_nut_1440.png

## Formato del worker
- Hecho: si
- Que cambio (rutas): solo este fichero y `.tmp-verify/audit-A1/` (capturas y lib.sh). No se tocó código.
- Duda:
- Recomendacion:
- Bloquea a Adrian: no
