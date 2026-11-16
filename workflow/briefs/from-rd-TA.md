# from-rd-TA — Transversal admin y Amanda: responsive y consistencia

**Hecho:** sí

## Qué cambió
- `app/styles/nutri.css`
  - Rejilla semanal de Amanda: el texto de los platos se salía de la celda y se solapaba con las filas vecinas. Causa: la regla `.nut-dish-head` del selector de platos (Plantillas, línea ~1860) pisaba el recorte por líneas de la rejilla. Ahora las reglas de la rejilla van acotadas a `.nut-week-cell …` y el recorte por líneas depende del alto real de la celda (`@container`), con `overflow: hidden`.
  - Alto bajo (1280×640): la rejilla tiene alto mínimo (`.nut-week-grid`, `.nut-month`, `.nut-day-layout`) y `.nut-week` hace scroll vertical, así «Resumen semanal» ya no se monta sobre la rejilla.
- `app/panel/error.tsx` y `app/nutricion/error.tsx` (nuevos): estado de error homogéneo (`.state.state--error` + «Reintentar»), el mismo patrón que ya usa la app. No existía ningún `error.tsx`.

## Comprobado (capturas en `.tmp-verify/rd-TA/`)
- Admin (panel, ajustes, análisis), login y todas las rutas de Amanda (Menú día/semana/mes, Seguimiento, Perfil, Compra, Plantillas, Informes, Alimentos): sin scroll horizontal a 390, 768 y 1440 (`scrollWidth` = ancho del viewport).
- Semana a 1440×900, 1280×720 y 1280×640 sin solapes; Día y Mes correctos.
- El resto del lenguaje visual (pestañas, vacíos, carga) ya era coherente tras B1–B3, C1–C4 y N5–N9: no he tocado nada más.
- `npx tsc --noEmit` limpio. Ruta de prueba para el error creada y borrada. Sin commit, sin cambio de rama, sin migraciones.

## Duda
Ninguna.

## Recomendación
Nada pendiente. Dos notas para el master:
- Aviso de React en consola «Each child in a list should have a unique "key"» desde `HeaderMarkup` (`app/components/brand-header.tsx`, fuera de mi alcance): ya existía.
- El navegador de pruebas emula `pointer: fine`, por eso la sonda marca objetivos de 32 px; en táctil real son 44 (`@media (pointer: coarse)` ya lo cubre).
- El servidor en :3001 estaba parado; lo levanté con `npm run dev` y lo dejo corriendo.

## Bloquea a Adrián
no

Decidí acotar el selector `.nut-dish-head` a la celda de la rejilla y añadir `error.tsx` porque es el cambio mínimo que cierra el solape y el estado de error sin tocar archivos de otros dueños.
