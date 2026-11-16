# Informe final del rediseño Apple

Rama `feat/rediseno-apple`, 16-11-2026. Cierre de la auditoría integral (rd-Z) con sus 3 arreglos (rd-Z2). Sin commit hecho por el worker: lo hace el master.

## Cambios por pista

- **Fundación (F1-F3).** Sistema de diseño v2 basado en Apple, `globals.css` partido en hojas sin cambio visual, primitivos Apple (tokens, base, componentes, a11y) y `/dev/ui`.
- **Estructura (S1-S2).** Login y not-found; cabecera y navegación superior en todas sus variantes.
- **Jugador (A1-A6).**
  - Inicio y plan (tab bar, calendario, cinta, foco del día).
  - Sesiones y vídeo.
  - Diario de salud y dispositivos.
  - Nutrición (base visual).
  - Ajustes y formularios de cuenta.
- **Nutrición del jugador (N1-N4).** Hoy, Semana, Compra y check de comidas (Hecho / A medias / No). N0: migraciones aditivas de nutrición.
- **Admin (B1-B4).** Panel de deportistas con shell de escritorio, análisis, ajustes (cuentas, nutricionistas, contraseñas) y perfil físico editable en `/a/[id]`.
- **Amanda (C1-C4, N5-N9).**
  - Shell y menú Día / Semana / Mes.
  - Ficha del plato, ingredientes y modales.
  - Anillos del resumen.
  - Perfil ampliado, importar Word y cuenta.
  - Pestañas, Alimentos y emparejado.
  - Seguimiento.
  - Plantillas, platos, sustituciones y nota del día.
  - Compra e Informes (PDF/impresión).
- **Transversales (TA, TJ, TC).** Responsive y consistencia de admin y Amanda; tactilidad, transiciones y escritorio presentable del jugador; motion, accesibilidad y consistencia de las hojas base.
- **Auditoría (Z).** Recorrido completo por rol sin tocar código; salió la lista `arreglos-finales.md`.

## Arreglos finales (rd-Z2)

| # | Arreglo | Estado |
|---|---|---|
| 1 | Iconos duplicados (HTTP 500 en `/favicon.ico`, `/icon.png`, `/apple-icon.png`) | **Hecho.** `git rm` de `app/favicon.ico`, `app/icon.png` y `app/apple-icon.png`, iguales byte a byte a los de `public/` (comprobado con `cmp`). Los 3 dan 200. Sin reiniciar el dev. |
| 2 | ⚙ Ajustes («Tu cuenta») de Amanda solo en Menú | **Hecho.** Enlace nuevo `account-settings-link.tsx` en las 6 vistas de pestaña; Menú abre el modal con `?ajustes=1` y limpia la URL al cerrar. |
| 3 | Aviso de React por falta de `key` en `/nutricion/[id]` | **Hecho.** `key` en `headerLeading` y `headerLogout`. |

No hay arreglos sin hacer.

### Archivos tocados en rd-Z2
- Borrados: `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`.
- Nuevo: `app/nutricion/[athleteId]/account-settings-link.tsx`.
- Editados: `app/nutricion/[athleteId]/page.tsx`, `nutricion-athlete-client.tsx`, `compra/page.tsx`, `perfil/page.tsx`, `plantillas/page.tsx`, `seguimiento/page.tsx`, `seguimiento/section-shell.tsx`, `informes/page.tsx`.

## Qué se verificó (rd-Z2, Amanda en :3001)

- `npx tsc --noEmit`: limpio.
- Iconos: `curl` da 200 en los tres.
- ⚙ presente en Menú, Seguimiento, Perfil, Compra, Plantillas e Informes a 1440 y a 390.
- Desde Compra, el ⚙ lleva a `/nutricion/<id>?ajustes=1` con «Tu cuenta» abierto. Al pulsar Cerrar, la URL queda en `/nutricion/<id>` y el modal se cierra.
- Foco con teclado: el ⚙ recibe `:focus-visible` con outline sólido de 2 px; tamaño 44×44.
- `scrollWidth` = 390 a 390 de ancho y 1440 a 1440 en las 6 vistas.
- Consola de Menú: sin aviso de `key`. Los únicos errores de recurso (404) vistos fueron de mi propia prueba con un deportista no asignado a Amanda, no de la app.
- Capturas en `.tmp-verify/rd-Z2/` (`gear-open.png`, `informes-390.png`, `menu-390.png`).

Del recorrido previo (rd-Z), aún válido: roles y redirecciones correctos, sin scroll horizontal en ningún rol, acciones primarias ≥44 px.

## Problemas conocidos (no son del rediseño o no se tocan aquí)

- **Latencia en dev:** `/api/nutrition/totals` tarda unos 6 s; algunas vistas salen con esqueleto unos segundos (Perfil de Amanda, ajustes de admin).
- **Datos de Compra:** hay entradas «Otros / revisar» que son pasos de receta y una categoría «Salmon». Viene del menú importado; se resuelve en Alimentos (emparejar/alias).
- **Segmentados de 32 px y pestañas de Amanda de 28 px en escritorio:** siguen la norma Apple para puntero; no son bloqueo.
- **Admin en `/a/id`:** dos segmentados seguidos a todo el ancho (jerarquía de dos niveles). Decisión de diseño.
- `/nutricion` (lista) y `/nutricion/alimentos` no llevan ⚙ porque no hay deportista; fuera de alcance, como pedía la lista.
- Los arreglos 1 y 3 no se verificaron con el globo «Issues» de Next en pantalla (no se pudo leer su estado desde el script); se comprobó que la consola no registra el aviso de `key`.
- La verificación visual se hizo con la cuenta de Amanda sobre su único deportista asignado (Ricardo Visus).
