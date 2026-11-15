# from-rd-B4: Admin, perfil editable del deportista en /a/[id]

- Hecho: sí

## Qué cambió (rutas)
- `app/a/[id]/page.tsx`: si el usuario es admin, lee `athleteProfile(tx, id)` (consulta que ya existía, solo lectura) y pasa a `HomeClient` la prop `adminProfile` con nacimiento, altura, peso, alergias e intolerancias. Al jugador no se le carga ni se le envía nada.
- `app/a/[id]/home-client.tsx`: nuevo `AdminProfileCard` dentro de la tarjeta de cabecera `dash-head`, bajo el nombre y separado por un filete:
  - título «Perfil físico» y botón «Editar» (o «Añadir» si la ficha está vacía), `btn--tinted` de 44 px;
  - baldosas Edad (calculada con `ageFrom`), Altura, Peso (con coma decimal) y Nacimiento («21 jun 2001»); sin dato muestran «—», que el lector de pantalla lee como «Sin dato»;
  - alergias e intolerancias en cápsulas (rojo y naranja), solo si existen;
  - si la ficha está vacía, una línea de ayuda;
  - «Editar» abre `NutSheet` con `AthleteProfileForm` en modo básico, que solo envía el PATCH de nacimiento, altura y peso y no toca alergias ni objetivos. Al guardar, cierra el sheet y hace `router.refresh()`.
  - Se pinta solo con `isAdmin && adminProfile`.
- `app/styles/admin.css`: bloque `.adm-fis*` (2 columnas en móvil, 4 a partir de 560 px). Al final de la hoja, las preferencias B4 (`prefers-contrast: more`). No hay animaciones propias, así que no hace falta regla de reduced-motion.

## Verificación
- A 1440 como admin (adriivalle) en `/a/<Ricardo>` se ve la ficha. Edité el peso de 85 a 86,5 desde el sheet: el sheet se cierra, la ficha se actualiza y al recargar sigue en 86,5. Probé las cápsulas metiendo alergias e intolerancias de prueba por PATCH. **Después restauré todo al estado original**: 2001-06-21, 191 cm, 85 kg, sin alergias ni intolerancias (comprobado en la respuesta del API).
- El jugador (ricardovisus) en su `/a/<id>` no tiene `.adm-fis` ni botón de perfil.
- A 390: `scrollWidth` = 390 tanto para el admin (con cápsulas) como para el jugador.
- «Editar» mide 44 px de alto. Con Tab, el foco pasa de la foto a «Editar» con anillo de 2 px #0071E3. Al abrir el sheet, el foco va al botón de cerrar.
- `npx tsc --noEmit` limpio. En consola no hay errores nuevos: el único `ERR_FAILED` es del primer intento por 127.0.0.1, ver la nota.
- Capturas en `.tmp-verify/rd-B4/`: admin_1440, admin_1440_sheet, admin_1440_chips, admin_1440_focus, admin_390_chips y player_390.
- Sin commit, como pide el brief. No cambié de rama.

## Duda
- (ninguna que bloquee). Nota de entorno: la sesión de auth redirige a `localhost:3001`. Con `U=http://127.0.0.1:3001`, `shots.sh` no consigue iniciar sesión, porque la cookie queda en otro host. Para verificar usé `localhost:3001`. El `shots.sh` copiado en `.tmp-verify/rd-B4/` mantiene 127.0.0.1, tal como pedía el brief.

## Recomendación
- En los briefs futuros de verificación, usar `U=http://localhost:3001`.

- Bloquea a Adrián: no
