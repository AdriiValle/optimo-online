# From: opus / plan-ok

- Hecho: sí
- Qué cambió: `workflow/briefs/plan-plataforma.md`, `workflow/briefs/from-opus-plan-ok.md`
- Duda:
- Recomendación:
- Bloquea a Adrián: no

Visto bueno con recorte. Cero código.

Qué estaba bien y se mantiene: Neon nuevo (`entrenamiento-online`, no `fancy-breeze`); RLS + servidor y 404 si un deportista pide otro id; seed desde `index.html` antes de retirar el HTML; oleadas en serie porque las dos escriben `app/`; sin OAuth Whoop ni merge a `main`.

Qué cambió en el plan:
- El calendario a portar es el del HTML (grid MD + cinta + sesión), no un mes genérico.
- Este corte no borra `index.html`. Next en la raíz. Escudos y logo se copian a `public/`, originales intactos.
- Tokens = el `:root` entero, no un recorte. Oleada 2 no reescribe el design note ni toca `app/api/`, `lib/`, `db/`, auth.
- Visus = `football`. Foto = bytes en Postgres, tope 400 KB.
- Paso de revisión fuera; quedan 3 pasos (sonnet datos → opus look → master push).

(nota despachar: corte Pro detectado, relanzado con grok)
