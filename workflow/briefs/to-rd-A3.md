# rd-A3 - Jugador: diario de salud y dispositivos

Rama `feat/rediseno-apple` (ya activa). cwd = repo. localhost:3001 ya esta levantado: no lo pares ni lo reinicies.
IMPORTANTE (manda sobre el prompt generico): NO hagas commit, NO cambies de rama, NO toques `main` ni `dev`; el commit lo hace el master. No ejecutes migraciones de BD. No despaches hijos.
Lee solo: este brief, `workflow/context/design-system.md` y `workflow/context/apple-DESIGN.md` (si ya existen), `workflow/briefs/plan-rediseno-apple.md` (secciones que te toquen) y los archivos SI. Rol fuerte, trabaja con calma y calidad premium.

## Objetivo
Rediseñar el formulario del diario (dentro de home-client.tsx) y device-card.tsx (incluido el chip admin y los botones 'Próximamente') con el lenguaje de Salud/Ajustes de iOS: listas agrupadas inset, controles estándar, guardado con feedback. Estados: sin dispositivo, Polar conectado/error, guardado OK/error.

## Archivos
- SI (solo estos): `app/a/[id]/home-client.tsx`, `app/a/[id]/device-card.tsx`, `app/styles/player.css`
- NO: las partes de home-client ya rediseñadas por A1 (cabecera, tab bar, calendario) salvo para encajar; analisis, nutrition-pane, session-list. Un componente u hoja de otro duenyo se sobrescribe con selector acotado en tu hoja. API, lib/ y BD: nunca, salvo que el objetivo lo diga.
- Reglas de preferencia (reduced-motion/contrast/transparency) al final de tu hoja, no en a11y.css.

## Criterio de hecho
- Meter y guardar datos de salud a 390 es cómodo (táctiles >=44, teclado correcto por campo) y guarda igual que antes.
- device-card muestra los estados sin dispositivo / conectado / error con diseño.
- Funciones intactas: guardar diario, conectar/desconectar Polar o ver su estado.
- Sin scroll horizontal a 390 (document.documentElement.scrollWidth <= 390) en tus rutas.
- Tactiles >=44 en acciones primarias; foco visible con teclado.
- `npx tsc --noEmit` limpio; consola sin errores nuevos.

## Como comprobar
Capturas con `.tmp-verify/look/shots.sh` (copia el script a `.tmp-verify/rd-A3/` y cambia U a http://127.0.0.1:3001). Antes crea `.tmp-verify/browse.lock` con `rd-A3`; si existe, haz otra cosa y reintenta (max 20 min); borralo al acabar. Cuentas de desarrollo: `npx tsx .tmp-verify/ids.ts` lista emails; todas con la contrasena de desarrollo de `db/reset-dev-passwords.ts`; Amanda en `.tmp-verify/amanda-account.ts`. Datos de prueba que crees, los borras en la misma tarea. Guarda capturas en `.tmp-verify/rd-A3/`.

## Al terminar
Escribe `workflow/briefs/from-rd-A3.md`: Hecho si/no/parcial; archivos tocados; duda y recomendacion (si hay).
