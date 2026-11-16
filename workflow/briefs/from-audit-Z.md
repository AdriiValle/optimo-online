- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno
- Notas no bloqueantes (maximo 3, opcional):
  1. `/favicon.ico`, `/icon.png` y `/apple-icon.png` devuelven HTTP 500 en dev (confirmado con curl a :3001): archivos duplicados entre `app/` y `public/`. Ya está como arreglo 1 en `workflow/briefs/arreglos-finales.md`. Captura: `.tmp-verify/audit-Z/ama_1440x900_nutricion_9d27d850-d328-4633-bc33-56198a0e4181.png` (globo «1 Issue» de Next).
  2. Amanda a 1440: el ⚙ Ajustes solo sale en la pestaña Menú; en Seguimiento, Perfil, Compra, Plantillas e Informes la barra solo trae Salir. Ya está como arreglo 2. Captura: `.tmp-verify/audit-Z/ama_1440x900_nutricion_9d27d850-d328-4633-bc33-56198a0e4181_informes.png`.
  3. A 390 los segmentados de `/a/[id]` del admin (Entrenamiento / Nutrición / Análisis) miden 32 px de alto y los de Compra del jugador/Amanda 40 px. Son navegación secundaria y el admin trabaja en escritorio, así que no bloquea. Captura: `.tmp-verify/audit-Z/adm_390x844_tab_Análisis.png`.

## Resumen del recorrido

- Hecho: si
- Que cambio (rutas): solo `workflow/briefs/from-audit-Z.md` y capturas/scripts en `.tmp-verify/audit-Z/` (carpeta de pruebas sin versionar). No se ha tocado código. No se ha hecho commit: no hay código que versionar.
- Duda: (vacio)
- Recomendacion: ejecutar los arreglos 1 a 3 de `arreglos-finales.md` cuando convenga; ninguno frena el cierre.
- Bloquea a Adrian: no

### Qué se comprobó

- `npx tsc --noEmit`: exit 0.
- Scroll horizontal (`scrollWidth` = ancho de ventana): sin desbordes.
  - Anónimo: 390 y 1440.
  - Jugador: 390 y 1440.
  - Admin: 390 y 1440.
  - Amanda: 390 y 1440.
- Tres roles, rutas y redirecciones:
  - Jugador: `/` lleva a `/a/<id>`. En `/panel` y `/nutricion` recibe «Página no encontrada».
  - Admin: `/` lleva a `/panel`. `/ajustes` lleva a `/panel/ajustes`. `/nutricion` da «no encontrada».
  - Amanda: `/` lleva a `/nutricion`. `/panel` y `/a/<id>` dan «no encontrada».
- Pantallas vistas:
  - Jugador: Entreno, Nutrición (Hoy, Semana, Compra), Diario y Ajustes.
  - Admin: Panel, Ajustes y `/a/<id>` con sus tres pestañas (Entrenamiento, Nutrición, Análisis). El rango de Análisis (3 d a 60 d) cambia coherentemente. Los campos de fecha muestran el rango de datos disponible, no el preset.
  - Amanda: lista, menú Día / Semana / Mes con el resumen semanal, Seguimiento, Perfil, Compra, Plantillas, Informes y Alimentos.
- Foco con Tab: anillo azul de 2 px visible en las paradas de jugador y Amanda.
- Táctiles a 390: las acciones primarias miden 44 o más. Las excepciones están en la nota 3.
- `arreglos-finales.md`: existe, está priorizada (3 arreglos con causa, cambio exacto y verificación) y es ejecutable sin ambigüedad. Recoge el recorrido con los tres roles.

### Observaciones de la auditoría

- Las capturas con celdas vacías o «Cargando…» (semana de Amanda, ajustes del admin) eran carrera de captura con el dev (compilación en frío y `/api/nutrition/totals` lento). Se repitió 3 veces con espera y las 21 celdas con platos salen siempre. No es un fallo.
- Hubo timeouts de navegación al abrir rutas por primera vez (compilación del dev). El script usa `localhost:3001`, porque con `127.0.0.1` NextAuth redirige a `localhost` y se pierde la sesión.
