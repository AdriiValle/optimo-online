# Brief

- Destino: opus
- Slug: plan-ok
- Trabajo: app
- Objetivo: revisar y reescribir `workflow/briefs/plan-plataforma.md`. Cero código.
- Archivos que SÍ tocar: `workflow/briefs/plan-plataforma.md`, `workflow/briefs/from-opus-plan-ok.md`.
- NO: `index.html`, `app/`, `lib/`, `db/`, Neon, Vercel, `main`, secretos, cualquier otro repo.
- Criterio de hecho: el plan cabe de un vistazo, parte el trabajo en oleadas que no se pisan (si se pisan, en serie), y cada paso tiene criterio de hecho. Si algo no cierra, lo decides tú y lo dejas escrito.
- Rama: no hace falta commit (solo el plan). Si commiteas, uno solo, en `dev`, y no incluyas secretos.

## Qué revisar

Lee `workflow/briefs/plan-plataforma.md` y `workflow/handshake.md`. Nada más, salvo que el plan nombre un archivo y necesites anclar un supuesto contra el disco.

Adrián ha pedido construir ya, en este repo, la base de la app de varios deportistas (él admin, ellos solo lo suyo), con Neon, login, dashboard de recuperación, calendario pequeño, foto, dieta, sueño, lesiones, RPE y, si corren, km / sensación / pulso. Look Óptimo + glass. Visus es el piloto y su plan no se tira. Whoop sin claves no se inventa.

Comprueba sobre todo:
- Que el Neon sea un proyecto nuevo de esta app y no el de Óptimo Sport.
- Que un deportista no pueda leer a otro (RLS + servidor).
- Que el seed porte el calendario de Visus antes de retirar el HTML.
- Que las dos oleadas (datos, luego look) no corran a la vez si comparten archivos.
- Que no haya OAuth de Whoop ni merge a `main` en este corte.

Reescribe el plan si sobra, falta o está mal partido. No lo alargues. No escribas código.

Escribe `workflow/briefs/from-opus-plan-ok.md` (hecho / qué cambió / duda / recomendación / bloquea). Bloquea a Adrián: no, salvo que el plan pida borrar datos, dinero o `main`.
