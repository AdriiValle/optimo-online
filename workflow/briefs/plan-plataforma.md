# Plan: plataforma de deportistas

Cajón: app. Difícil (arquitectura, auth, Neon, UI).

Objetivo: esta repo pasa a ser la app. Adrián ve a todos. Cada deportista solo lo suyo. Al abrir: recuperación, el calendario MD de Visus y su foto. El plan de Visus no se tira.

Supuestos:
- Whoop no se conecta: no hay claves. El hueco sí (recuperación, sueño, HRV, pulso en reposo) con proveedor `whoop` y estado `disconnected`. Cero OAuth, cero llamadas.
- Auth.js credentials (email + contraseña que pone el admin). No Neon Auth. No registro público. Neon = solo Postgres de esta app.
- Neon **nuevo**: org `org-purple-bar-45638376`, región `aws-eu-central-1`, nombre `entrenamiento-online`. Prohibido `fancy-breeze-92594196` y el Supabase de la clínica.
- Admin de prueba: `adrianvs97@hotmail.com`. Deportista: Ricardo Visus, deporte `football`, calendario portado de `index.html`. Contraseñas solo en `.env.local` (`SEED_ADMIN_PASSWORD`, `SEED_ATHLETE_PASSWORD`). Ni el `from` ni git las copian.
- Next.js App Router en la **raíz** de este repo. `index.html` se lee para el seed y **no se borra** en este corte. No va a `public/` (pisaría Next).
- Estáticos: copiar `escudos/` y `logo-optimo.png` a `public/` (mismos archivos). No redibujar. No borrar los originales.
- Calendario a portar = grid mensual + cinta de semana + sesión MD del HTML (partidos, etiquetas MD, bloques). No un month-picker vacío. Mes = mes del partido, como ahora.
- Look: transcribir el `:root` entero de `index.html` a `workflow/context/design-system.md` (`--bg`, `--surface`, `--text`, `--secondary`, `--line`, `--fill-secondary`, `--accent`, `--accent-hover`, sombras, `--radius` 12, SF). Glass encima. No `ui-ux-pro-max`. No paleta nueva.
- Móvil primero (max-width ~640 como el HTML).
- Oleada 1 lee `neon.md` de la skill workflow y `personal.md` solo si `READY: yes`; y el `SKILL.md` de Addy `api-and-interface-design` (raw). No el pack entero.
- Oleada 2 lee `apple-design` (https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md) y el design-system.md. No clona el pack. No reescribe tokens.
- Rama `dev`. Un commit por oleada. No `main`. No `vercel --prod`.
- Las dos oleadas van **en serie**: las dos escriben páginas en `app/`. No lanzarlas a la vez.

## Archivos

SÍ oleada 1 (sonnet, datos): `package.json`, `app/` (páginas + `app/api/` + `middleware.ts`), `lib/`, `db/`, `next.config.*`, `public/escudos/`, `public/logo-optimo.png`, `.env.local`, `.env.example` (sin secretos), `.gitignore` (`.env.local`, `node_modules`, `.next`), `vercel.json`, `workflow/context/design-system.md` (solo tokens, corto), seed que parsea `index.html`.

SÍ oleada 2 (opus, después): solo lo visible — `app/**/*.tsx` de páginas y componentes, `app/globals.css` (o equiv.). Lee `workflow/context/design-system.md`. No lo reescribe.

NO oleada 2: `app/api/`, `middleware.ts`, `lib/`, `db/`, esquema, auth, consultas, `.env*`, seed.
NO ambas: borrar `index.html`, borrar `escudos/` original, `main`, Neon ajeno, Whoop en red, otros repos.

## Datos

Cuentas: email, hash, rol `admin` | `athlete`.

Deportista: cuenta, nombre, deporte `football` | `running` | `other`, foto (bytes en Postgres, tope 400 KB; el servidor rechaza de más), equipo, dorsal, nacimiento, altura, peso.

Plan del día: fecha, etiqueta MD, título, minutos, bloques. Partido si ese día hay (rival, casa/fuera, hora, competición). Sale del HTML de Visus (arrays de partidos + plantillas MD), no se inventa.

Diario (una fila por deportista y fecha): horas de sueño, calidad, recuperación 0–100, HRV, pulso en reposo, RPE 1–10, sensación 1–5, km (null si no corre), pulso medio, nota de dieta, nota libre.

Dieta vigente y rutina de sueño: un texto por deportista. Lo escribe el admin, lo lee el deportista.

Lesión: zona, estado abierta/cerrada, nota, inicio, cierre.

Integración: proveedor `whoop`, estado `disconnected`. Sin llamadas.

Regla de acceso: el deportista solo lee y escribe sus filas. El admin lee y escribe todas. Forzado en Postgres (RLS) y en el servidor. Un deportista que pida el id de otro recibe 404, no 403.

## Pantallas

Login.

Admin `/panel`: fichas (foto, nombre, deporte, recuperación de hoy, lesión abierta). Alta de deportista (nombre, deporte, email, contraseña temporal).

Casa `/a/[id]`: foto (la cambia el deportista), franja de recuperación, calendario MD (grid + cinta, no otro), sesión de hoy, formulario del día. Dieta, sueño y lesiones en esa misma casa. Si `running`: km, sensación y pulso medio van delante. Si `football`: día MD y sesión van delante; el diario sigue. Visus es `football`.

El admin abre cualquier `/a/[id]`. El deportista solo el suyo. `/` redirige según rol.

## Pasos

1. Sonnet, en `dev`: proyecto Neon nuevo (no el de Óptimo), esquema, RLS, Auth.js, seed de Visus + admin leyendo `index.html` **antes** de cualquier retiro del HTML (este corte no lo retira), copia de escudos/logo a `public/`, pantallas de arriba con los tokens del design note (útiles, no el pass de cristal), `npm run dev` arranca y los dos logins funcionan. Criterio: admin ve a Ricardo; Ricardo no ve el panel ni a otro id (404); el grid MD, la cinta y la sesión de Visus siguen; se guarda un diario; la foto se sube y se ve; `.env.local` fuera de git. Un commit.
2. Opus, **después** del paso 1 (no en paralelo): pass de glass / Apple sobre lo visible, leyendo `apple-design` y el design-system. Criterio: se reconoce Óptimo, hay cristal, móvil primero, no cambia el esquema ni quién ve qué ni las consultas. Un commit.
3. El master (no el worker): push de `dev`, preview, y le dice a Adrián las dos contraseñas leyendo `.env.local`.

Whoop en vivo, app nativa, borrar `index.html`, merge a `main` no son pasos de este plan.
