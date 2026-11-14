# from-rd-A6: ajustes del jugador y formularios de cuenta

- **Hecho:** sí
- **Commit:** ninguno (lo hace el master, como pide el brief). Rama `feat/rediseno-apple` sin tocar. No hay migraciones.

## Qué cambió (rutas)
- `app/ajustes/ajustes-client.tsx`: /ajustes pasa a listas agrupadas inset al estilo Ajustes de iOS. Large Title «Ajustes». Grupo de perfil: avatar 72 (iniciales si no hay foto), nombre y usuario de acceso, y una fila «Cambiar foto / Añadir foto». Esa fila es ahora un `<button>` que abre el input de archivo; antes era un `label` con el input oculto y no se podía usar con teclado. Después, los grupos Nombre, Usuario de acceso y Contraseña: cada uno con una fila de campo (etiqueta a la izquierda y campo sin borde), un pie Footnote, una alerta inline (`.alert--ok/--danger` dentro de `aria-live`) y un botón tintado a todo el ancho. Los estados pendientes usan `disabled` + `aria-busy` (spinner de F3) y la fila de foto pasa a «Subiendo foto…». Los errores 422 de la foto se traducen: la API los devuelve en inglés.
- `app/components/password-form.tsx`: nueva prop `variant: "card" | "grouped"` (por defecto `"card"`) y se exportan `FormAlert` y `FormMsg`. La variante `card` mantiene el mismo DOM (h2, `.ok/.error`, `form > label/input/.btn`), así que admin.css y nutri.css siguen funcionando sin cambios. Mejoras en las dos variantes:
  - estado pendiente;
  - `role=status/alert`;
  - `aria-invalid` en «Repetir» cuando las contraseñas no coinciden;
  - mensaje en español si la API responde «Invalid password»;
  - **bug corregido:** `e.currentTarget.reset()` se llamaba después del `await` (currentTarget ya es null). Al cambiar la contraseña con éxito saltaba un TypeError y no aparecía «Contraseña actualizada». Ahora se guarda el form antes del `await`.
- `app/components/username-form.tsx`: la misma prop `variant`, estado pendiente, `aria-invalid` y `aria-describedby` en los errores (se limpian al escribir). La variante `card` mantiene su DOM.
- `app/styles/player.css`:
  - bloque «Ajustes del jugador (A6)» con los estilos `.pset*`, solo dentro de `.pset`;
  - override acotado `.nut-account-settings > .muted / > .ok,.error`: en el modal de Amanda la ayuda salía a tamaño de cuerpo con 20 px de aire, y ahora es Footnote pegada al título, como en admin;
  - preferencias A6 (reduced-motion y contrast) al final de la hoja.
- `app/ajustes/page.tsx`: sin cambios (no hacía falta).

## Comprobado (capturas en `.tmp-verify/rd-A6/`)
- **/ajustes a 390** (ricardovisus): `scrollWidth` = 390. Probados:
  - contraseñas que no coinciden: alerta y `aria-invalid`;
  - contraseña actual incorrecta: «Contraseña actual incorrecta»;
  - usuario ya en uso («amanda»): «Ese nombre de usuario ya está en uso.» y la fila en rojo;
  - nombre guardado con el mismo valor: «Nombre guardado.».

  No se cambió ninguna credencial ni dato real.
- **Tamaños y foco:** botones y fila de foto de 44 px. Foco visible con Tab (anillo azul en filas, campos y botones).
- **/panel/ajustes** (adriivalle) a 390 y 1280: se ve igual que en B3 y sin scroll horizontal. Los errores de no coincidencia y de contraseña incorrecta funcionan.
- **Modal «Tu cuenta» de Amanda** a 1280 y 390: `scrollWidth` correcto y se ve bien tras el override.
- `npx tsc --noEmit` limpio.
- **Consola:** ningún error nuevo de este diff. Lo que aparece son los 422 y 404 provocados en las pruebas, el CORS del signout del propio `shots.sh` y un warning de `key` en `HeaderMarkup` desde `NutricionAthletePage` (no es de A6).
- Lock `browse.lock` tomado y liberado.

## Duda
- Amanda **no puede cambiar ni su usuario ni su contraseña** desde «Tu cuenta». `app/api/me/password/route.ts` y `app/api/me/username/route.ts` devuelven 404 si el rol no es `athlete` ni `admin`, y en el modal sale «No se pudo cambiar.» / «No se pudo guardar.». Es un fallo previo de la API, no de este diff. No lo toqué porque la API queda fuera del brief.

## Recomendación
- Una tarea corta aparte: añadir `nutritionist` al control de rol de las dos rutas `/api/me/*`. Antes hay que comprobar que `accountById`, `setOwnPasswordHash` y la actualización del usuario funcionan con el RLS de nutricionista. Mientras tanto, si se quiere, se puede ocultar el formulario en el modal.

## Bloquea a Adrián
- No.
