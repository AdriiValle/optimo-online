- Veredicto: PASA
- Bloqueantes (maximo 5): ninguno.
- Notas no bloqueantes (maximo 3):
  1. Consola de dev en `/nutricion/<id>`: aviso React «Each child in a list should have a unique "key" prop» en `HeaderMarkup` (hijo pasado desde `NutricionAthletePage`). Es lo que provoca el «1 Issue» del overlay de Next. No afecta a producción ni a la función; conviene dar `key` al listado de la cabecera.
  2. Tactiles <44px en acciones secundarias (no primarias): chips de alergias/intolerancias en Perfil (32px), segmentado Descanso/Entreno/Partido (36px), «Semana / Próximos 3 días» en Compra (40px) y segmentado Entrenamiento/Nutrición/Análisis de `/a/<id>` (32px). Las acciones primarias (Guardar, Añadir, Salir, Atrás, pestañas de Amanda) cumplen.
  3. `/nutricion/alimentos` es muy largo (~47.000px a 390, ~44.000px a 768) por catálogo + tarjetas «Sin alimento»; sin solapes ni scroll horizontal, solo usabilidad (paginar/colapsar sería una mejora).

## Evidencia
- `npx tsc --noEmit`: limpio.
- scrollWidth == innerWidth en las 11 rutas (admin: `/panel`, `/panel/ajustes`, `/a/<id>`; Amanda: `/nutricion`, `/nutricion/alimentos`, `/nutricion/<id>` y sus pestañas plantillas, seguimiento, compra, informes, perfil) a 1440, 768 y 390. Sin elementos fuera del viewport ni solapes detectados por sonda de geometría.
- Foco visible (outline sólido 2px #0071e3) con Tab en panel, ajustes, ficha admin y pestañas de Amanda.
- Pestañas de Amanda: mismo segmentado, cabecera y títulos de sección en las 6; a 390 el segmentado se desplaza horizontalmente dentro de su contenedor (sin scroll de página).
- Funciones: login de ambos roles, navegación entre pestañas, cambio de pestañas en `/a/<id>` (Análisis carga) y carga de datos de Perfil (tras hidratar) correctas. No se guardó nada para no dejar datos de prueba.
- Capturas: `.tmp-verify/audit-TA/` (`adm*`, `ama*`, `ama390_perfil_wait.png`, `adm390_tabs.png`). Amanda solo tiene asignado a Ricardo Visus (id 9d27d850…), por eso se auditó con ese deportista.
- Lock `.tmp-verify/browse.lock` liberado.
