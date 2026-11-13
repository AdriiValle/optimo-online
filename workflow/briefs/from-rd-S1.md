# from-rd-S1 - Login y not-found estilo Apple

- Hecho: si

## Qué cambió (rutas)
- `app/login/page.tsx`: pantalla de acceso centrada (logo, «Entrar en Óptimo», subtítulo). La server action ahora devuelve estado `{ error, email }` en vez de redirigir a `?error=1`; si las credenciales valen, `signIn` sigue redirigiendo a `/`, que reparte por rol (sin cambios). `?error=` por URL (flujo propio de Auth.js) se sigue mostrando.
- `app/login/login-form.tsx` (**nuevo**, componente cliente de la propia ruta): campos en lista agrupada con etiqueta flotante, validación de vacío («Escribe tu usuario/contraseña»), estado enviando (`aria-busy` → spinner del `.btn` v2, campos de solo lectura, `role=status` «Entrando…»), error de credenciales (alert danger, borde rojo, sacudida, foco en la contraseña, conserva el usuario).
- `app/styles/login.css`: hoja reescrita con tokens v2; anula el hueco de la cabecera fija (login y not-found no la llevan); preferencias (reduced-motion, contrast) al final de la hoja.
- `app/not-found.tsx`: mismo lenguaje (logo, «Página no encontrada», botón ancho «Ir al inicio»).
- Capturas: `.tmp-verify/rd-S1/v2-*.png` (login 390/1440, vacío, error, enviando, foco, not-found 390/1440).

## Verificación
- `npx tsc --noEmit` limpio.
- jugador (ricardovisus) → `/a/<id>`, admin (adriivalle) → `/panel`, Amanda → `/nutricion`. Con credenciales malas sale el mensaje y no hay redirección.
- scrollWidth = 390 a 390 en /login y /no-existe. Botón 50 px, campos 56 px; anillo de foco visible con Tab.
- Consola: sin errores nuevos. Solo salen errores de CORS al cerrar sesión por fetch entre 127.0.0.1 y localhost, que vienen del script de prueba y no de la app.

## Duda
- /no-existe sin sesión lo manda el middleware a /login (comportamiento previo, no tocado); el not-found solo se ve con sesión.
- Probando en `127.0.0.1:3001`, tras entrar la redirección va a `localhost:3001` (AUTH_URL) y allí no hay cookie. Ya pasaba antes y es solo del entorno dev. Probar siempre en `localhost:3001`.
- `login-form.tsx` es un archivo nuevo fuera de la lista SI literal, pero dentro de `app/login/`. Hace falta para `useActionState`.

## Recomendación
- Ninguna acción: dejar el middleware como está. En el `shots.sh` de los próximos briefs, usar `U=http://localhost:3001` en vez de 127.0.0.1.
- Commit (lo hace el master): `app/login/page.tsx`, `app/login/login-form.tsx`, `app/styles/login.css`, `app/not-found.tsx`.

## Bloquea a Adrián
No.
