# from-rd-A3 · Jugador: diario de salud y dispositivos

- **Hecho:** sí (sin commit, como pide el brief: lo hace el master con `git add` de las 3 rutas SÍ).

## Qué cambió (rutas)
- `app/a/[id]/device-card.tsx`: la tarjeta pasa a ser una lista agrupada inset con el título «Pulsera». La fila Polar lleva un glifo de reloj (sin baldosa) y debajo el estado: *Pendiente de alta en el servidor* / *No conectado* / *● Conectado · actualizado dd/mm hh:mm* (verde) / el texto del error (rojo). Las acciones son filas: «Conectar Polar», «Actualizar datos de la noche» con la fecha a la derecha y spinner con `aria-busy` mientras carga, «Desconectar» en rojo y «Volver a conectar». Whoop y Amazfit son filas en gris con «Próximamente» y `aria-disabled` (antes eran botones deshabilitados). Los avisos de éxito o error de Polar son alertas inline dentro de una región `aria-live`. Si el error ya se ve en la fila, no se repite en la alerta. El pie de grupo cambia según el estado. `IntegrationAdminChip` es ahora un chip en cápsula con un punto verde (conectado) o con fondo `--danger-tint` (error). Si no cabe, el texto se corta con elipsis y el texto completo va en `title`.
- `app/a/[id]/home-client.tsx` (solo el formulario del diario; cabecera, tab bar y calendario de A1 sin tocar): tres grupos al estilo Salud.
  - **Sueño y recuperación** y **Sesión**: etiqueta a la izquierda, cifra a la derecha y una columna fija para la unidad (h, ms, lpm, km). Toda la fila mide 58 px y al tocarla se enfoca el campo. Los campos son `type=number` con `inputMode` `decimal` o `numeric`. Los `min`/`max` son los mismos que valida `/api/diaries`, así que el error se marca en la propia fila en rojo antes de enviar. La unidad se lee en voz alta mediante `sr-only`.
  - Con Polar conectado, los campos que vienen de la pulsera son de solo lectura y llevan debajo «De Polar» o «Llega de Polar».
  - **Molestias** y **Nota**: textareas sin borde que ocupan todo el grupo.
  - Botón «Guardar diario» grande y a todo el ancho. Mientras guarda muestra «Guardando…» con `aria-busy` y se deshabilita para no enviar dos veces. Justo encima sale el resultado: alerta verde «Guardado.», que desaparece al volver a editar, o alerta roja si falla el servidor o la red. Antes, un fallo de red no mostraba nada.
  - La carga del día ahora muestra un spinner.
  - La lógica del cuerpo del POST no cambia: solo se ha movido a `saveDiary` y se ha añadido el `try/catch`.
- `app/styles/player.css`:
  - Bloque «Diario y pulsera (A3)» nuevo, solo con tokens.
  - Borradas las reglas que quedaban sin uso tras este cambio: `.device-card-*`, `.device-readonly`, `.dash .form-grid` y el `.dash-head .device-admin-chip` que había metido A1, ahora integrado en `.device-admin-chip`.
  - Las reglas de `prefers-reduced-motion` y `prefers-contrast` van al final de la hoja.

## Verificación
- `npx tsc --noEmit`: limpio. Consola sin errores en jugador y admin.
- `scrollWidth` = 390 a 390 px (jugador con Diario, admin con chip) y 1280 a 1280 px (admin).
- Táctiles: filas de acción 44, filas de métrica 58, botón de guardar 50. Foco visible con teclado (anillo `--accent`, `:focus-visible`).
- Estados probados con `fetch` simulado en el navegador, **sin escribir en la BD**:
  - Polar conectado (`?device=ok`).
  - Polar con error (respuesta 409 al refrescar).
  - Error de vuelta de OAuth (`?device=error&deviceMsg=…`).
  - Guardado correcto, guardando, error de red.
  - Valor fuera de rango: RPE 14 se bloquea y no llega a enviarse.
- Cuerpo enviado: con Polar conectado se omiten los campos que trae la pulsera, igual que antes. Sin Polar se envían todos.
- Capturas en `.tmp-verify/rd-A3/` (más `shots.sh` y `states.sh` para repetirlas). El lock del navegador ya está borrado.

## Duda
- No se ha podido ver en pantalla el estado «Pendiente de alta en el servidor», porque aquí Polar sí está configurado, ni los campos de running (Distancia y Pulso medio), porque no hay ningún deportista de running en dev. El código es directo y `tsc` lo cubre.

## Recomendación
- El auditor puede revisar el estado de Polar con `?device=ok` y `?device=error&deviceMsg=x` en `/a/<id>` (pestaña Diario). Para running basta con mirarlo cuando exista un deportista de ese deporte; no bloquea.

- **Bloquea a Adrián:** no.

Decidí dejar las acciones de Polar como filas de lista (como en Ajustes de iOS) en vez de botones sueltos, porque con eso cumplen los 44 px y se agrupan con su estado sin añadir otro botón relleno. El único botón relleno de la vista es «Guardar diario».
