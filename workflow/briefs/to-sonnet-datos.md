# Brief

- Destino: sonnet
- Slug: datos
- Trabajo: app
- Objetivo: dejar la app usable en `dev` (Neon, cuentas, pantallas, calendario de Visus). Sin el pass de cristal.
- Archivos que SÍ tocar: los de la oleada 1 en `workflow/briefs/plan-plataforma.md`. También `workflow/briefs/from-sonnet-datos.md`.
- NO: borrar `index.html`, borrar `escudos/` original, `main`, `vercel --prod`, push, Neon ajeno, Whoop en red, reescribir el plan, secretos en el `from` o en git.
- Criterio de hecho: el del paso 1 del plan. Un commit en `dev`.
- Rama: `dev`

## Notas (solo estas)

1. `workflow/briefs/plan-plataforma.md` — el spec. Síguelo. No lo reescribas.
2. `workflow/handshake.md`
3. `C:\Users\SISTELIN\.cursor\skills\workflow\neon.md`

Además, solo el `SKILL.md` de Addy `api-and-interface-design` (raw de `addyosmani/agent-skills`, ruta que nombra el plan). No el pack.

No abras `personal.md`. La org de Neon ya está en el plan. `READY` ya está comprobado.

## Cómo

Trabaja en `dev`. No `git add -A`: en el repo hay briefs viejos sin seguimiento; el commit es solo esta oleada.

Neon: si `entrenamiento-online` ya existe en esa org, úsalo. No crees otro. No borres ninguno. Pooled → `DATABASE_URL`. Directa → `DATABASE_URL_UNPOOLED` para migrar. Solo `.env.local` y Vercel no (el master sube luego). `.env.example` sin valores secretos.

RLS de verdad: `FORCE ROW LEVEL SECURITY` (el owner de Neon si no, se salta las policies). En cada transacción, el servidor fija el rol y el id de sesión. El deportista que pide otro id recibe 404.

Contraseñas de seed: genera dos, largas, y escríbelas solo en `.env.local`. El `from` dice que están ahí, sin copiarlas.

Calendario: porta grid MD, cinta y sesión desde `index.html` (partidos y plantillas que ya existen). No inventes un mes vacío. Visus = `football`.

Pantallas útiles con los tokens del design note (el `:root` entero). El cristal lo hace la oleada siguiente: no lo adelantes.

Prueba antes de cerrar: `npm run dev` arranca; el admin ve a Ricardo; la cuenta de Ricardo no abre `/panel` ni el id de otro (404); un diario se guarda; una foto de menos de 400 KB se ve; una de más la rechaza el servidor. En el `from`, qué comando corriste y qué pasó.

Escribe `workflow/briefs/from-sonnet-datos.md` (hecho / qué cambió / duda / recomendación / bloquea: no).
